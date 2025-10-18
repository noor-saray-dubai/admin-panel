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

// Ensure unique slug in DB (excluding current property)
async function ensureUniqueSlug(baseSlug: string, currentId: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const existingProperty = await Property.findOne({ slug, _id: { $ne: currentId } });
    if (!existingProperty) return slug;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
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

  // Area validation - all areas are now numbers
  // Built-up area (now optional)
  if (data.builtUpArea !== undefined && data.builtUpArea !== null) {
    if (typeof data.builtUpArea !== 'number' || data.builtUpArea <= 0) {
      addError('builtUpArea', 'Built-up area must be a positive number');
    } else if (data.builtUpArea > 100000) {
      addError('builtUpArea', 'Built-up area cannot exceed 100,000');
    }
  }

  // Total area (required)
  if (data.totalArea === undefined || data.totalArea === null) {
    addError('totalArea', 'Total area is required');
  } else if (typeof data.totalArea !== 'number' || data.totalArea <= 0) {
    addError('totalArea', 'Total area must be a positive number');
  } else if (data.totalArea > 100000) {
    addError('totalArea', 'Total area cannot exceed 100,000');
  }

  // Area unit validation (required)
  if (!data.areaUnit || !data.areaUnit.trim()) {
    addError('areaUnit', 'Area unit is required');
  } else if (!['sq ft', 'sq m'].includes(data.areaUnit)) {
    addError('areaUnit', 'Area unit must be "sq ft" or "sq m"');
  }

  // Optional area fields validation

  if (data.suiteArea !== undefined && data.suiteArea !== null) {
    if (typeof data.suiteArea !== 'number' || data.suiteArea <= 0) {
      addError('suiteArea', 'Suite area must be a positive number');
    } else if (data.suiteArea > 100000) {
      addError('suiteArea', 'Suite area cannot exceed 100,000');
    }
  }

  if (data.balconyArea !== undefined && data.balconyArea !== null) {
    if (typeof data.balconyArea !== 'number' || data.balconyArea <= 0) {
      addError('balconyArea', 'Balcony area must be a positive number');
    } else if (data.balconyArea > 100000) {
      addError('balconyArea', 'Balcony area cannot exceed 100,000');
    }
  }

  if (data.terracePoolArea !== undefined && data.terracePoolArea !== null) {
    if (typeof data.terracePoolArea !== 'number' || data.terracePoolArea <= 0) {
      addError('terracePoolArea', 'Terrace & Pool area must be a positive number');
    } else if (data.terracePoolArea > 100000) {
      addError('terracePoolArea', 'Terrace & Pool area cannot exceed 100,000');
    }
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

  // Floor level validation (required JSON structure)
  if (!data.floorLevel || typeof data.floorLevel !== 'object') {
    addError('floorLevel', 'Floor level is required');
  } else {
    if (data.floorLevel.type === 'single') {
      if (typeof data.floorLevel.value !== 'number') {
        addError('floorLevel', 'Single floor level value must be a number');
      } else if (data.floorLevel.value < -5 || data.floorLevel.value > 2200) {
        addError('floorLevel', 'Single floor level value must be between -5 and 2200');
      }
    } else if (data.floorLevel.type === 'complex') {
      if (typeof data.floorLevel.basements !== 'number' || data.floorLevel.basements < 0 || data.floorLevel.basements > 10) {
        addError('floorLevel', 'Basements must be between 0 and 10');
      }
      if (typeof data.floorLevel.hasGroundFloor !== 'boolean') {
        addError('floorLevel', 'Ground floor flag must be a boolean');
      }
      if (typeof data.floorLevel.floors !== 'number' || data.floorLevel.floors < 0 || data.floorLevel.floors > 200) {
        addError('floorLevel', 'Number of floors must be between 0 and 200');
      }
      if (typeof data.floorLevel.mezzanines !== 'number' || data.floorLevel.mezzanines < 0 || data.floorLevel.mezzanines > 10) {
        addError('floorLevel', 'Number of mezzanines must be between 0 and 10');
      }
      if (typeof data.floorLevel.hasRooftop !== 'boolean') {
        addError('floorLevel', 'Rooftop flag must be a boolean');
      }
    } else {
      addError('floorLevel', 'Floor level type must be either "single" or "complex"');
    }
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

// PUT - Update property
async function handler(request: NextRequest, { params }: { params: { slug: string } }) {
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

    const { slug } = params;

    // Find existing property
    const existingProperty = await Property.findOne({ slug, isActive: true });
    if (!existingProperty) {
      return NextResponse.json(
        { 
          success: false, 
          error: "NOT_FOUND", 
          message: "Property not found" 
        },
        { status: 404 }
      );
    }

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

    // Generate new slug if name changed
    let newSlug = existingProperty.slug;
    if (body.name.trim() !== existingProperty.name) {
      const baseSlug = generateSlug(body.name);
      newSlug = await ensureUniqueSlug(baseSlug, existingProperty._id.toString());
    }

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

    // Store original data for audit log
    const originalData = {
      name: existingProperty.name,
      propertyType: existingProperty.propertyType,
      price: existingProperty.price,
      availabilityStatus: existingProperty.availabilityStatus,
      location: existingProperty.location.area
    };

    // Update property with new data
    const updatedProperty = await Property.findByIdAndUpdate(
      existingProperty._id,
      {
        slug: newSlug,
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
        builtUpArea: body.builtUpArea || undefined,
        suiteArea: body.suiteArea || undefined,
        balconyArea: body.balconyArea || undefined,
        terracePoolArea: body.terracePoolArea || undefined,
        totalArea: body.totalArea,
        areaUnit: body.areaUnit || 'sq ft',
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
        isActive: body.isActive !== undefined ? body.isActive : true,
        tags: body.tags || [],
        
        // Update audit info
        updatedBy: auditInfo
      },
      { new: true, runValidators: true }
    );

    if (!updatedProperty) {
      return NextResponse.json(
        { 
          success: false, 
          error: "UPDATE_FAILED", 
          message: "Failed to update property" 
        },
        { status: 500 }
      );
    }

    // Log to audit log
    await AuditLog.create({
      action: AuditAction.CONTENT_UPDATED,
      level: AuditLevel.INFO,
      userId: user.firebaseUid,
      userEmail: user.email,
      ip: ipAddress,
      userAgent: userAgent,
      resource: "properties",
      resourceId: updatedProperty._id.toString(),
      details: {
        propertyId: updatedProperty.id,
        changes: {
          before: originalData,
          after: {
            name: updatedProperty.name,
            propertyType: updatedProperty.propertyType,
            price: updatedProperty.price,
            availabilityStatus: updatedProperty.availabilityStatus,
            location: updatedProperty.location.area
          }
        }
      },
      success: true,
      timestamp: new Date()
    });

    // Log successful update
    console.log(`Property updated successfully by ${user.email}:`, {
      id: updatedProperty.id,
      name: updatedProperty.name,
      slug: updatedProperty.slug
    });

    return NextResponse.json({
      success: true,
      message: "Property updated successfully",
      property: {
        id: updatedProperty._id.toString(),
        propertyId: updatedProperty.id,
        name: updatedProperty.name,
        slug: updatedProperty.slug,
        propertyType: updatedProperty.propertyType,
        bedrooms: updatedProperty.bedrooms,
        bathrooms: updatedProperty.bathrooms,
        price: updatedProperty.price,
        priceNumeric: updatedProperty.priceNumeric,
        location: updatedProperty.location,
        coverImage: updatedProperty.coverImage,
        availabilityStatus: updatedProperty.availabilityStatus,
        updatedAt: updatedProperty.updatedAt,
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error updating property:", error);

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
export const PUT = withCollectionPermission(Collection.PROPERTIES, Action.EDIT)(handler);
