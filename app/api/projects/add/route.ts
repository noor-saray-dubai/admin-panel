import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Project from "@/models/project";
import { withCollectionPermission } from "@/lib/auth/server";
import { Collection, Action } from "@/types/user";
import { updateProjectSlugs } from "@/lib/slug-utils";
import { rateLimit } from "@/lib/rate-limiter";

// Force Node.js runtime
export const runtime = "nodejs";

interface NearbyPlace {
  name: string;
  distance: string;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface LocationDetails {
  description: string;
  nearby: NearbyPlace[];
  coordinates: Coordinates;
}

interface PaymentMilestone {
  milestone: string;
  percentage: string;
}

interface PaymentPlan {
  booking: string;
  construction: PaymentMilestone[];
  handover: string;
}

interface AmenityCategory {
  category: string;
  items: string[];
}

interface UnitType {
  type: string;
  size: string;
  price: string;
}

interface Flags {
  elite: boolean;
  exclusive: boolean;
  featured: boolean;
  highValue: boolean;
}

interface ProjectData {
  name: string;
  location: string;
  type: string;
  status: string;
  developer: string;
  price: string;
  priceNumeric: number;
  image: string; // Cover image URL
  gallery: string[]; // Gallery image URLs
  description: string;
  completionDate: string;
  totalUnits: number;
  registrationOpen: boolean;
  launchDate: string;
  featured: boolean;
  overview: string;
  flags: Flags;
  locationDetails: LocationDetails;
  paymentPlan: PaymentPlan;
  amenities: AmenityCategory[];
  unitTypes: UnitType[];
  categories: string[];
  tags?: string[];
}

/**
 * Validate image URL format
 */
function validateImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    return validExtensions.some(ext => pathname.includes(ext));
  } catch {
    return false;
  }
}

/**
 * Comprehensive validation function with detailed error reporting
 */
function validateProjectData(data: ProjectData): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Helper function for string validation
  const validateString = (value: any, fieldName: string, minLength = 1, maxLength = Infinity): boolean => {
    if (!value || typeof value !== "string") {
      errors.push(`${fieldName} is required and must be a string.`);
      return false;
    }
    
    const trimmed = value.trim();
    if (trimmed.length < minLength) {
      errors.push(`${fieldName} must be at least ${minLength} characters long.`);
      return false;
    }
    
    if (trimmed.length > maxLength) {
      errors.push(`${fieldName} must not exceed ${maxLength} characters.`);
      return false;
    }
    
    return true;
  };

  // Required string fields with length limits
  validateString(data.name, "name", 2, 200);
  validateString(data.location, "location", 2, 100);
  validateString(data.developer, "developer", 2, 150);
  validateString(data.description, "description", 10, 2000);
  validateString(data.overview, "overview", 20, 5000);
  validateString(data.price, "price", 1, 50);

  // Image URL validations
  if (!data.image || !validateImageUrl(data.image)) {
    errors.push("image must be a valid image URL.");
  }
  
  if (!Array.isArray(data.gallery) || data.gallery.length === 0) {
    errors.push("gallery must be a non-empty array of image URLs.");
  } else {
    data.gallery.forEach((url, idx) => {
      if (!url || !validateImageUrl(url)) {
        errors.push(`gallery[${idx}] must be a valid image URL.`);
      }
    });
  }

  // Validate enums
  const validTypes = ['Residential', 'Commercial', 'Mixed Use', 'Industrial', 'Hospitality', 'Retail'];
  if (!validTypes.includes(data.type)) {
    errors.push(`type must be one of: ${validTypes.join(', ')}`);
  }

  const validStatuses = ['Pre-Launch', 'Launched', 'Under Construction', 'Ready to Move', 'Completed', 'Sold Out'];
  if (!validStatuses.includes(data.status)) {
    errors.push(`status must be one of: ${validStatuses.join(', ')}`);
  }

  // Numeric validations
  if (typeof data.priceNumeric !== "number" || data.priceNumeric <= 0) {
    errors.push("priceNumeric must be a positive number.");
  }
  
  if (typeof data.totalUnits !== "number" || data.totalUnits < 1 || data.totalUnits > 10000) {
    errors.push("totalUnits must be between 1 and 10,000.");
  }

  // Boolean validations
  if (typeof data.registrationOpen !== "boolean") {
    errors.push("registrationOpen must be a boolean.");
  }
  
  if (typeof data.featured !== "boolean") {
    errors.push("featured must be a boolean.");
  }

  // Date validations
  const completionDate = new Date(data.completionDate);
  const launchDate = new Date(data.launchDate);
  
  if (isNaN(completionDate.getTime())) {
    errors.push("completionDate must be a valid date.");
  } else if (completionDate < new Date('2020-01-01')) {
    errors.push("completionDate must be after 2020.");
  }
  
  if (isNaN(launchDate.getTime())) {
    errors.push("launchDate must be a valid date.");
  } else if (launchDate > completionDate) {
    errors.push("launchDate cannot be after completionDate.");
  }

  // Flags validation
  if (!data.flags || typeof data.flags !== "object") {
    errors.push("flags must be an object.");
  } else {
    const flagKeys: (keyof Flags)[] = ["elite", "exclusive", "featured", "highValue"];
    flagKeys.forEach(key => {
      if (typeof data.flags[key] !== "boolean") {
        errors.push(`flags.${key} must be a boolean.`);
      }
    });
  }

  // Location details validation
  if (!data.locationDetails) {
    errors.push("locationDetails is required.");
  } else {
    validateString(data.locationDetails.description, "locationDetails.description", 10, 1000);
    
    if (!Array.isArray(data.locationDetails.nearby) || data.locationDetails.nearby.length === 0) {
      errors.push("locationDetails.nearby must be a non-empty array.");
    } else {
      data.locationDetails.nearby.forEach((place, idx) => {
        validateString(place.name, `locationDetails.nearby[${idx}].name`, 1, 100);
        validateString(place.distance, `locationDetails.nearby[${idx}].distance`, 1, 50);
      });
    }
    
    const coords = data.locationDetails.coordinates;
    if (!coords || typeof coords.latitude !== "number" || typeof coords.longitude !== "number") {
      errors.push("locationDetails.coordinates must have valid latitude and longitude numbers.");
    } else {
      if (coords.latitude < -90 || coords.latitude > 90) {
        errors.push("latitude must be between -90 and 90.");
      }
      if (coords.longitude < -180 || coords.longitude > 180) {
        errors.push("longitude must be between -180 and 180.");
      }
    }
  }

  // Payment plan validation
  if (!data.paymentPlan) {
    errors.push("paymentPlan is required.");
  } else {
    validateString(data.paymentPlan.booking, "paymentPlan.booking", 1, 100);
    validateString(data.paymentPlan.handover, "paymentPlan.handover", 1, 100);
    
    if (!Array.isArray(data.paymentPlan.construction) || data.paymentPlan.construction.length === 0) {
      errors.push("paymentPlan.construction must be a non-empty array.");
    } else {
      let totalPercentage = 0;
      data.paymentPlan.construction.forEach((milestone, idx) => {
        validateString(milestone.milestone, `paymentPlan.construction[${idx}].milestone`, 1, 200);
        
        if (validateString(milestone.percentage, `paymentPlan.construction[${idx}].percentage`, 1, 10)) {
          const percent = parseFloat(milestone.percentage.replace('%', ''));
          if (!isNaN(percent)) {
            totalPercentage += percent;
          }
        }
      });
      
      if (totalPercentage > 100) {
        warnings.push("Total construction milestone percentages exceed 100%.");
      }
    }
  }

  // Amenities validation
  if (!Array.isArray(data.amenities) || data.amenities.length === 0) {
    errors.push("amenities must be a non-empty array.");
  } else {
    data.amenities.forEach((amenity, idx) => {
      validateString(amenity.category, `amenities[${idx}].category`, 1, 100);
      
      if (!Array.isArray(amenity.items) || amenity.items.length === 0) {
        errors.push(`amenities[${idx}].items must be a non-empty array.`);
      } else {
        amenity.items.forEach((item, itemIdx) => {
          validateString(item, `amenities[${idx}].items[${itemIdx}]`, 1, 200);
        });
      }
    });
  }

  // Unit types validation
  if (!Array.isArray(data.unitTypes) || data.unitTypes.length === 0) {
    errors.push("unitTypes must be a non-empty array.");
  } else {
    data.unitTypes.forEach((unit, idx) => {
      validateString(unit.type, `unitTypes[${idx}].type`, 1, 100);
      validateString(unit.size, `unitTypes[${idx}].size`, 1, 50);
      validateString(unit.price, `unitTypes[${idx}].price`, 1, 100);
    });
  }

  // Categories validation
  if (!Array.isArray(data.categories)) {
    errors.push("categories must be an array.");
  } else if (data.categories.length === 0) {
    errors.push("At least one category is required.");
  } else {
    data.categories.forEach((cat, idx) => {
      validateString(cat, `categories[${idx}]`, 1, 100);
    });
  }

  return { 
    isValid: errors.length === 0, 
    errors, 
    warnings 
  };
}

/**
 * Clean and sanitize project data
 */
function sanitizeProjectData(data: ProjectData): ProjectData {
  const sanitizeString = (str: string): string => str.trim().replace(/\s+/g, ' ');
  
  return {
    ...data,
    name: sanitizeString(data.name),
    location: sanitizeString(data.location),
    developer: sanitizeString(data.developer),
    description: sanitizeString(data.description),
    overview: sanitizeString(data.overview),
    price: sanitizeString(data.price),
    image: data.image.trim(),
    gallery: data.gallery.map(url => url.trim()).filter(url => url.length > 0),
    locationDetails: {
      ...data.locationDetails,
      description: sanitizeString(data.locationDetails.description),
      nearby: data.locationDetails.nearby.map(place => ({
        name: sanitizeString(place.name),
        distance: sanitizeString(place.distance)
      }))
    },
    paymentPlan: {
      ...data.paymentPlan,
      booking: sanitizeString(data.paymentPlan.booking),
      handover: sanitizeString(data.paymentPlan.handover),
      construction: data.paymentPlan.construction.map(milestone => ({
        milestone: sanitizeString(milestone.milestone),
        percentage: sanitizeString(milestone.percentage)
      }))
    },
    amenities: data.amenities && data.amenities.length > 0 ? data.amenities.map(amenity => ({
      category: sanitizeString(amenity.category),
      items: amenity.items.map(item => sanitizeString(item)).filter(item => item.length > 0)
    })).filter(amenity => amenity.category.length > 0 && amenity.items.length > 0) : [],
    unitTypes: data.unitTypes && data.unitTypes.length > 0 ? data.unitTypes.map(unit => ({
      type: sanitizeString(unit.type),
      size: sanitizeString(unit.size),
      price: sanitizeString(unit.price)
    })).filter(unit => unit.type.length > 0 && unit.size.length > 0 && unit.price.length > 0) : [],
    categories: data.categories && data.categories.length > 0 ? data.categories.map(cat => sanitizeString(cat)).filter(cat => cat.length > 0) : [],
    tags: data.tags?.map(tag => sanitizeString(tag)).filter(tag => tag.length > 0) || []
  };
}


/**
 * Main POST handler with ZeroTrust authentication
 */
async function handler(request: NextRequest) {
  // User is available on request.user (added by withCollectionPermission)
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

    // Connect to database
    await connectToDatabase();

    // Parse JSON request body
    let projectData: ProjectData;
    try {
      projectData = await request.json();
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return NextResponse.json(
        { success: false, message: "Invalid project data JSON", error: "INVALID_JSON" },
        { status: 400 }
      );
    }

    // Sanitize data
    projectData = sanitizeProjectData(projectData);

    // Validate project data
    const validation = validateProjectData(projectData);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Validation failed", 
          errors: validation.errors,
          warnings: validation.warnings,
          error: "VALIDATION_ERROR" 
        },
        { status: 400 }
      );
    }

    // Generate slugs
    const slugs = await updateProjectSlugs(projectData);

    // Check for existing project by name or slug
    const existingProject = await Project.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${projectData.name}$`, "i") } },
        { slug: slugs.slug }
      ],
      isActive: true
    });

    if (existingProject) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Project with this name already exists", 
          error: "DUPLICATE_NAME" 
        },
        { status: 409 }
      );
    }

    // Image URLs are already validated in validateProjectData
    // Images are already uploaded via InstantImageUpload component

    // Prepare project data for database
    const projectToSave = {
      ...projectData,
      ...slugs,
      image: projectData.image, // Use URL from form data
      gallery: projectData.gallery, // Use URLs from form data
      completionDate: new Date(projectData.completionDate),
      launchDate: new Date(projectData.launchDate),
      // Audit data matching schema requirements
      createdBy: {
        email: user.email,
        timestamp: new Date(),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      },
      updatedBy: {
        email: user.email,
        timestamp: new Date(),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      },
      version: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Create project
    const createdProject = await Project.create(projectToSave);

    // Project created successfully - audit data stored in database

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Project created successfully",
        warnings: validation.warnings,
        project: {
          id: createdProject._id,
          name: createdProject.name,
          slug: createdProject.slug,
          location: createdProject.location,
          developer: createdProject.developer,
          image: createdProject.image,
          gallery: createdProject.gallery,
          createdAt: createdProject.createdAt,
          createdBy: createdProject.createdBy
        },
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Error creating project:", error);

    // Handle specific error types
    if (error.name === "ValidationError") {
      return NextResponse.json(
        {
          success: false,
          message: "Database validation error",
          errors: Object.values(error.errors).map((err: any) => err.message),
          error: "DB_VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "Duplicate entry error",
          error: "DUPLICATE_ENTRY",
        },
        { status: 409 }
      );
    }

    if (error.message && error.message.includes('Cloudinary')) {
      return NextResponse.json(
        {
          success: false,
          message: "Image upload failed",
          error: "IMAGE_UPLOAD_ERROR",
        },
        { status: 500 }
      );
    }

    // Generic server error
    return NextResponse.json(
      { 
        success: false, 
        message: "An unexpected error occurred", 
        error: "INTERNAL_ERROR" 
      },
      { status: 500 }
    );
  }
}

// Export with ZeroTrust collection permission validation
// Requires CREATE_CONTENT capability for PROJECTS collection
export const POST = withCollectionPermission(Collection.PROJECTS, Action.ADD)(handler);
