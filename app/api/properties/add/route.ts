import { NextRequest, NextResponse } from "next/server";
import Property from "@/models/properties";
import Project from "@/models/project";
import Developer from "@/models/developers";
import { connectToDatabase } from "@/lib/db";
import { withCollectionPermission } from "@/lib/auth/server";
import { Collection, Action } from "@/types/user";
import { rateLimit } from "@/lib/rate-limiter";
import { AuditLog, AuditAction, AuditLevel } from "@/models/auditLog";

export const runtime = "nodejs";

// Helper to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Ensure unique slug in DB
async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const existingProperty = await Property.findOne({ slug });
    if (!existingProperty) return slug;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// Generate unique property ID
async function generatePropertyId(): Promise<string> {
  const count = await Property.countDocuments();
  const id = `PROP_${String(count + 1).padStart(4, '0')}`;
  
  // Ensure uniqueness
  const existing = await Property.findOne({ id });
  if (existing) {
    return `PROP_${String(count + Date.now()).padStart(6, '0')}`;
  }
  return id;
}

// Comprehensive validation function matching the Mongoose schema exactly
function validatePropertyData(data: any): { isValid: boolean; errors: Record<string, string[]> } {
  const errors: Record<string, string[]> = {};
  
  const addError = (field: string, message: string) => {
    if (!errors[field]) errors[field] = [];
    errors[field].push(message);
  };

  // Validation constants matching the schema
  const VALID_PROPERTY_TYPES = ['Apartment', 'Villa', 'Penthouse', 'Condo', 'Townhouse', 'Studio', 'Duplex', 'Loft'];
  const VALID_FURNISHING_STATUS = ['Unfurnished', 'Semi-Furnished', 'Fully Furnished'];
  const VALID_FACING_DIRECTIONS = ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'];
  const VALID_OWNERSHIP_TYPES = ['Primary', 'Secondary'];
  const VALID_PROPERTY_STATUS = ['Ready', 'Offplan'];
  const VALID_AVAILABILITY_STATUS = ['Ready', 'Offplan'];

  // Helper functions
  const isValidEmail = (email: string): boolean => {
    if (!email) return true; // Optional field
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidPhoneNumber = (phone: string): boolean => {
    if (!phone) return false;
    return /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/i.test(phone);
  };

  const isValidUrl = (url: string): boolean => {
    if (!url) return false;
    return /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(url);
  };

  // Required string fields with length constraints
  if (!data.name || !data.name.trim()) {
    addError('name', 'Property name is required');
  } else if (data.name.trim().length > 200) {
    addError('name', 'Property name must be less than 200 characters');
  }

  // Property type validation
  if (!data.propertyType) {
    addError('propertyType', 'Property type is required');
  } else if (!VALID_PROPERTY_TYPES.includes(data.propertyType)) {
    addError('propertyType', `Property type must be one of: ${VALID_PROPERTY_TYPES.join(', ')}`);
  }

  // Numeric fields with range validation
  if (typeof data.bedrooms !== 'number' || !Number.isInteger(data.bedrooms) || data.bedrooms < 0 || data.bedrooms > 20) {
    addError('bedrooms', 'Bedrooms must be between 0 and 20');
  }

  if (typeof data.bathrooms !== 'number' || !Number.isInteger(data.bathrooms) || data.bathrooms < 0 || data.bathrooms > 20) {
    addError('bathrooms', 'Bathrooms must be between 0 and 20');
  }

  // Built-up area (required)
  if (!data.builtUpArea || !data.builtUpArea.trim()) {
    addError('builtUpArea', 'Built-up area is required');
  }

  // Carpet area (optional, but must be valid if provided)
  if (data.carpetArea && data.carpetArea.trim && !data.carpetArea.trim()) {
    addError('carpetArea', 'Carpet area cannot be empty if provided');
  }

  // Furnishing status validation
  if (!data.furnishingStatus) {
    addError('furnishingStatus', 'Furnishing status is required');
  } else if (!VALID_FURNISHING_STATUS.includes(data.furnishingStatus)) {
    addError('furnishingStatus', `Furnishing status must be one of: ${VALID_FURNISHING_STATUS.join(', ')}`);
  }

  // Facing direction validation
  if (!data.facingDirection) {
    addError('facingDirection', 'Facing direction is required');
  } else if (!VALID_FACING_DIRECTIONS.includes(data.facingDirection)) {
    addError('facingDirection', `Facing direction must be one of: ${VALID_FACING_DIRECTIONS.join(', ')}`);
  }

  // Floor level validation
  if (typeof data.floorLevel !== 'number' || !Number.isInteger(data.floorLevel) || data.floorLevel < -5 || data.floorLevel > 200) {
    addError('floorLevel', 'Floor level must be between -5 and 200');
  }

  // Ownership type validation
  if (!data.ownershipType) {
    addError('ownershipType', 'Ownership type is required');
  } else if (!VALID_OWNERSHIP_TYPES.includes(data.ownershipType)) {
    addError('ownershipType', `Ownership type must be one of: ${VALID_OWNERSHIP_TYPES.join(', ')}`);
  }

  // Property status validation
  if (!data.propertyStatus) {
    addError('propertyStatus', 'Construction status is required');
  } else if (!VALID_PROPERTY_STATUS.includes(data.propertyStatus)) {
    addError('propertyStatus', `Construction status must be one of: ${VALID_PROPERTY_STATUS.join(', ')}`);
  }

  // Availability status validation (with default)
  if (data.availabilityStatus && !VALID_AVAILABILITY_STATUS.includes(data.availabilityStatus)) {
    addError('availabilityStatus', `Availability status must be one of: ${VALID_AVAILABILITY_STATUS.join(', ')}`);
  }

  // Location validation (required)
  if (!data.location) {
    addError('location', 'Location is required');
  } else {
    if (!data.location.address || !data.location.address.trim()) {
      addError('location.address', 'Address is required');
    }
    if (!data.location.area || !data.location.area.trim()) {
      addError('location.area', 'Area is required');
    }
    if (!data.location.city || !data.location.city.trim()) {
      addError('location.city', 'City is required');
    }
    if (!data.location.country || !data.location.country.trim()) {
      addError('location.country', 'Country is required');
    }
    if (!data.location.coordinates) {
      addError('location.coordinates', 'Coordinates are required');
    } else {
      if (typeof data.location.coordinates.latitude !== 'number' || 
          data.location.coordinates.latitude < -90 || 
          data.location.coordinates.latitude > 90) {
        addError('location.coordinates.latitude', 'Latitude must be between -90 and 90');
      }
      if (typeof data.location.coordinates.longitude !== 'number' || 
          data.location.coordinates.longitude < -180 || 
          data.location.coordinates.longitude > 180) {
        addError('location.coordinates.longitude', 'Longitude must be between -180 and 180');
      }
    }
  }

  // Pricing validation
  if (!data.price || !data.price.trim()) {
    addError('price', 'Price is required');
  }

  if (typeof data.priceNumeric !== 'number' || data.priceNumeric <= 0) {
    addError('priceNumeric', 'Price must be greater than 0');
  }

  if (data.pricePerSqFt !== undefined && data.pricePerSqFt !== null && (typeof data.pricePerSqFt !== 'number' || data.pricePerSqFt < 0)) {
    addError('pricePerSqFt', 'Price per sq ft must be a positive number');
  }

  // Description validation
  if (!data.description || !data.description.trim()) {
    addError('description', 'Description is required');
  } else if (data.description.trim().length > 2000) {
    addError('description', 'Description must be less than 2000 characters');
  }

  if (!data.overview || !data.overview.trim()) {
    addError('overview', 'Overview is required');
  } else if (data.overview.trim().length > 5000) {
    addError('overview', 'Overview must be less than 5000 characters');
  }

  // Media validation
  if (!data.coverImage || !data.coverImage.trim()) {
    addError('coverImage', 'Cover image is required');
  } else if (!isValidUrl(data.coverImage)) {
    addError('coverImage', 'Cover image must be a valid URL ending with an image extension');
  }

  if (!data.gallery || !Array.isArray(data.gallery) || data.gallery.length === 0) {
    addError('gallery', 'At least one gallery image is required');
  } else {
    data.gallery.forEach((url: string, index: number) => {
      if (!isValidUrl(url)) {
        addError(`gallery.${index}`, `Gallery image ${index + 1} must be a valid URL ending with an image extension`);
      }
    });
  }

  // Amenities validation
  if (!data.amenities || !Array.isArray(data.amenities) || data.amenities.length === 0) {
    addError('amenities', 'At least one amenity category is required');
  } else {
    data.amenities.forEach((amenity: any, index: number) => {
      if (!amenity.category || !amenity.category.trim()) {
        addError(`amenities.${index}.category`, 'Amenity category name is required');
      }
      if (!amenity.items || !Array.isArray(amenity.items) || amenity.items.length === 0) {
        addError(`amenities.${index}.items`, 'Amenity category must have at least one item');
      } else {
        amenity.items.forEach((item: string, itemIndex: number) => {
          if (!item || !item.trim()) {
            addError(`amenities.${index}.items.${itemIndex}`, 'All amenity items must be non-empty');
          }
        });
      }
    });
  }

  // Agent validation (optional)
  if (data.agent) {
    if (data.agent.agentId && !data.agent.agentId.trim()) {
      addError('agent.agentId', 'Agent ID cannot be empty if provided');
    }
    if (data.agent.agentName && !data.agent.agentName.trim()) {
      addError('agent.agentName', 'Agent name cannot be empty if provided');
    }
    if (data.agent.phoneNumber) {
      if (!isValidPhoneNumber(data.agent.phoneNumber)) {
        addError('agent.phoneNumber', 'Please provide a valid phone number');
      }
    }
    if (data.agent.email && !isValidEmail(data.agent.email)) {
      addError('agent.email', 'Please provide a valid email address');
    }
  }

  // Payment plan validation (optional)
  if (data.paymentPlan) {
    if (!data.paymentPlan.booking || !data.paymentPlan.booking.trim()) {
      addError('paymentPlan.booking', 'Booking percentage is required for payment plan');
    }
    if (!data.paymentPlan.handover || !data.paymentPlan.handover.trim()) {
      addError('paymentPlan.handover', 'Handover percentage is required for payment plan');
    }
    if (!data.paymentPlan.construction || !Array.isArray(data.paymentPlan.construction) || data.paymentPlan.construction.length === 0) {
      addError('paymentPlan.construction', 'At least one construction milestone is required for payment plan');
    } else {
      data.paymentPlan.construction.forEach((milestone: any, index: number) => {
        if (!milestone.milestone || !milestone.milestone.trim()) {
          addError(`paymentPlan.construction.${index}.milestone`, `Construction milestone ${index + 1} name is required`);
        }
        if (!milestone.percentage || !milestone.percentage.trim()) {
          addError(`paymentPlan.construction.${index}.percentage`, `Construction milestone ${index + 1} percentage is required`);
        }
      });
    }
  }

  // Tags validation (optional array)
  if (data.tags && !Array.isArray(data.tags)) {
    addError('tags', 'Tags must be an array');
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

// Verify linked entities exist
async function verifyLinkedEntities(data: any): Promise<{ isValid: boolean; errors: Record<string, string[]> }> {
  const errors: Record<string, string[]> = {};

  // Verify project exists if linked
  if (data.project && data.project.projectSlug) {
    const project = await Project.findOne({ slug: data.project.projectSlug, isActive: true });
    if (!project) {
      errors.project = ['Linked project not found'];
    } else if (project.name !== data.project.projectName) {
      // Auto-correct the name if slug is valid but name is outdated
      data.project.projectName = project.name;
    }
  }

  // Verify developer exists if linked
  if (data.developer && data.developer.developerSlug) {
    const developer = await Developer.findOne({ slug: data.developer.developerSlug });
    if (!developer) {
      errors.developer = ['Linked developer not found'];
    } else if (developer.name !== data.developer.developerName) {
      // Auto-correct the name if slug is valid but name is outdated
      data.developer.developerName = developer.name;
    }
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

// POST - Create new property
async function handler(request: NextRequest) {
  const user = (request as any).user;
  
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimit(request, user);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "RATE_LIMITED", 
          message: "Too many requests. Please try again later.",
          retryAfter: rateLimitResult.retryAfter 
        },
        { status: 429 }
      );
    }

    await connectToDatabase();

    // Parse JSON body
    const body = await request.json();

    // Validate property data
    const validation = validatePropertyData(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Validation failed", 
          error: "VALIDATION_ERROR",
          errors: validation.errors
        },
        { status: 400 }
      );
    }

    // Skip linked entities verification - save as provided in JSON body

    // Generate unique ID and slug
    const propertyId = await generatePropertyId();
    const baseSlug = generateSlug(body.name);
    const slug = await ensureUniqueSlug(baseSlug);

    // Extract IP address and user agent for audit
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create audit info
    const auditInfo = {
      email: user.email,
      timestamp: new Date(),
      ipAddress: ipAddress,
      userAgent: userAgent
    };

    // Create property with audit info
    const newProperty = await Property.create({
      id: propertyId,
      slug,
      name: body.name.trim(),
      
      // Optional relationships
      project: body.project || undefined,
      developer: body.developer || undefined,
      community: body.community || undefined,
      agent: body.agent || undefined,
      
      // Property details
      propertyType: body.propertyType,
      bedrooms: body.bedrooms,
      bathrooms: body.bathrooms,
      builtUpArea: body.builtUpArea.trim(),
      carpetArea: body.carpetArea?.trim() || undefined,
      furnishingStatus: body.furnishingStatus,
      facingDirection: body.facingDirection,
      floorLevel: body.floorLevel,
      
        // Ownership & Availability
        ownershipType: body.ownershipType,
        propertyStatus: body.propertyStatus,
        availabilityStatus: body.availabilityStatus || 'Ready',
      
      // Location
      location: body.location,
      
      // Pricing
      price: body.price.trim(),
      priceNumeric: body.priceNumeric,
      pricePerSqFt: body.pricePerSqFt || undefined,
      
      // Description
      description: body.description.trim(),
      overview: body.overview.trim(),
      
      // Media
      coverImage: body.coverImage.trim(),
      gallery: body.gallery,
      
      // Amenities & Payment Plan
      amenities: body.amenities,
      paymentPlan: body.paymentPlan || undefined,
      
      // Flags
      flags: {
        elite: body.flags?.elite || false,
        exclusive: body.flags?.exclusive || false,
        featured: body.flags?.featured || false,
        highValue: body.flags?.highValue || false
      },
      
      // Metadata
      isActive: true,
      tags: body.tags || [],
      
      // Audit
      createdBy: auditInfo,
      updatedBy: auditInfo
    });

    // Log to audit log
    await AuditLog.create({
      action: AuditAction.CONTENT_CREATED,
      level: AuditLevel.INFO,
      userId: user.firebaseUid,
      userEmail: user.email,
      ip: ipAddress,
      userAgent: userAgent,
      resource: "properties",
      resourceId: newProperty._id.toString(),
      details: {
        propertyId: newProperty.id,
        name: newProperty.name,
        propertyType: newProperty.propertyType,
        price: newProperty.price,
        location: newProperty.location.area
      },
      success: true,
      timestamp: new Date()
    });

    // Log successful creation
    console.log(`Property created successfully by ${user.email}:`, {
      id: newProperty.id,
      name: newProperty.name,
      slug: newProperty.slug
    });

    return NextResponse.json({
      success: true,
      message: "Property created successfully",
      property: {
        id: newProperty._id.toString(),
        propertyId: newProperty.id,
        name: newProperty.name,
        slug: newProperty.slug,
        propertyType: newProperty.propertyType,
        bedrooms: newProperty.bedrooms,
        bathrooms: newProperty.bathrooms,
        price: newProperty.price,
        priceNumeric: newProperty.priceNumeric,
        location: newProperty.location,
        coverImage: newProperty.coverImage,
        availabilityStatus: newProperty.availabilityStatus,
        createdAt: newProperty.createdAt,
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error creating property:", error);

    // Handle specific error types
    if (error.name === "ValidationError") {
      const mongooseErrors: Record<string, string[]> = {};
      
      Object.keys(error.errors).forEach(key => {
        mongooseErrors[key] = [error.errors[key].message];
      });

      return NextResponse.json(
        {
          success: false,
          message: "Database validation error",
          error: "DB_VALIDATION_ERROR",
          errors: mongooseErrors,
        },
        { status: 400 }
      );
    }

    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyPattern || {})[0] || 'unknown';
      return NextResponse.json(
        {
          success: false,
          message: `Duplicate ${duplicatedField} error`,
          error: "DUPLICATE_ENTRY",
          errors: { [duplicatedField]: [`This ${duplicatedField} already exists`] }
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        message: "An unexpected error occurred", 
        error: "INTERNAL_ERROR",
        errors: { general: ["An unexpected error occurred. Please try again."] }
      },
      { status: 500 }
    );
  }
}

// Export with ZeroTrust collection permission validation
export const POST = withCollectionPermission(Collection.PROPERTIES, Action.ADD)(handler);
