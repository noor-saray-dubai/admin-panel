import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Project from "@/models/project";
import { withCollectionPermission } from "@/lib/auth/server";
import { Collection, Action } from "@/types/user";
import { updateProjectSlugs } from "@/lib/slug-utils";
import { rateLimit } from "@/lib/rate-limiter";

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

interface ProjectUpdateData {
  name?: string;
  location?: string;
  type?: string;
  status?: string;
  developer?: string;
  price?: string;
  priceNumeric?: number;
  image?: string; // Cover image URL
  gallery?: string[]; // Gallery image URLs
  description?: string;
  overview?: string;
  completionDate?: string;
  totalUnits?: number;
  registrationOpen?: boolean;
  launchDate?: string;
  featured?: boolean;
  flags?: Flags;
  locationDetails?: LocationDetails;
  paymentPlan?: PaymentPlan;
  amenities?: AmenityCategory[];
  unitTypes?: UnitType[];
  categories?: string[];
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
 * Validate partial update data
 */
function validateUpdateData(data: ProjectUpdateData, existingProject: any): { 
  isValid: boolean; 
  errors: string[]; 
  warnings: string[] 
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Helper function for string validation
  const validateString = (value: any, fieldName: string, minLength = 1, maxLength = Infinity): boolean => {
    if (value === undefined) return true; // Optional field for updates
    
    if (typeof value !== "string") {
      errors.push(`${fieldName} must be a string.`);
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

  // Validate provided fields
  if (data.name !== undefined) {
    validateString(data.name, "name", 2, 200);
    
    // Check for name conflicts (excluding current project)
    if (data.name.trim().toLowerCase() !== existingProject.name.toLowerCase()) {
      warnings.push("Changing project name will update the slug and may affect SEO.");
    }
  }

  validateString(data.location, "location", 2, 100);
  validateString(data.developer, "developer", 2, 150);
  validateString(data.description, "description", 10, 2000);
  validateString(data.overview, "overview", 20, 5000);
  validateString(data.price, "price", 1, 50);

  // Validate enums if provided
  if (data.type !== undefined) {
    const validTypes = ['Residential', 'Commercial', 'Mixed Use', 'Industrial', 'Hospitality', 'Retail'];
    if (!validTypes.includes(data.type)) {
      errors.push(`type must be one of: ${validTypes.join(', ')}`);
    }
  }

  if (data.status !== undefined) {
    const validStatuses = ['Pre-Launch', 'Launched', 'Under Construction', 'Ready to Move', 'Completed', 'Sold Out'];
    if (!validStatuses.includes(data.status)) {
      errors.push(`status must be one of: ${validStatuses.join(', ')}`);
    }
    
    if (data.status !== existingProject.status) {
      warnings.push("Status change may affect project visibility and filtering.");
    }
  }

  // Numeric validations
  if (data.priceNumeric !== undefined) {
    if (typeof data.priceNumeric !== "number" || data.priceNumeric <= 0) {
      errors.push("priceNumeric must be a positive number.");
    }
  }
  
  if (data.totalUnits !== undefined) {
    if (typeof data.totalUnits !== "number" || data.totalUnits < 1 || data.totalUnits > 10000) {
      errors.push("totalUnits must be between 1 and 10,000.");
    }
  }

  // Boolean validations
  if (data.registrationOpen !== undefined && typeof data.registrationOpen !== "boolean") {
    errors.push("registrationOpen must be a boolean.");
  }
  
  if (data.featured !== undefined && typeof data.featured !== "boolean") {
    errors.push("featured must be a boolean.");
  }

  // Date validations
  if (data.completionDate !== undefined) {
    const completionDate = new Date(data.completionDate);
    if (isNaN(completionDate.getTime())) {
      errors.push("completionDate must be a valid date.");
    } else if (completionDate < new Date('2020-01-01')) {
      errors.push("completionDate must be after 2020.");
    }
  }
  
  if (data.launchDate !== undefined) {
    const launchDate = new Date(data.launchDate);
    if (isNaN(launchDate.getTime())) {
      errors.push("launchDate must be a valid date.");
    }
    
    // Cross-validate dates if both are provided
    if (data.completionDate !== undefined) {
      const completionDate = new Date(data.completionDate);
      if (launchDate > completionDate) {
        errors.push("launchDate cannot be after completionDate.");
      }
    } else if (existingProject.completionDate) {
      // Compare with existing completion date if not updating it
      if (launchDate > existingProject.completionDate) {
        errors.push("launchDate cannot be after existing completionDate.");
      }
    }
  }

  // Image URL validations (optional for updates)
  if (data.image !== undefined) {
    if (!data.image || !validateImageUrl(data.image)) {
      errors.push("image must be a valid image URL.");
    }
  }
  
  if (data.gallery !== undefined) {
    if (!Array.isArray(data.gallery)) {
      errors.push("gallery must be an array of image URLs.");
    } else {
      data.gallery.forEach((url, idx) => {
        if (!url || !validateImageUrl(url)) {
          errors.push(`gallery[${idx}] must be a valid image URL.`);
        }
      });
    }
  }

  // Flags validation
  if (data.flags !== undefined) {
    if (!data.flags || typeof data.flags !== "object") {
      errors.push("flags must be an object.");
    } else {
      const flagKeys: (keyof Flags)[] = ["elite", "exclusive", "featured", "highValue"];
      flagKeys.forEach(key => {
        if (data.flags![key] !== undefined && typeof data.flags![key] !== "boolean") {
          errors.push(`flags.${key} must be a boolean.`);
        }
      });
    }
  }

  // Complex object validations
  if (data.locationDetails !== undefined) {
    if (!data.locationDetails || typeof data.locationDetails !== "object") {
      errors.push("locationDetails must be an object.");
    } else {
      validateString(data.locationDetails.description, "locationDetails.description", 10, 1000);
      
      if (data.locationDetails.nearby !== undefined) {
        if (!Array.isArray(data.locationDetails.nearby)) {
          errors.push("locationDetails.nearby must be an array.");
        } else {
          data.locationDetails.nearby.forEach((place: any, idx: number) => {
            validateString(place.name, `locationDetails.nearby[${idx}].name`, 1, 100);
            validateString(place.distance, `locationDetails.nearby[${idx}].distance`, 1, 50);
          });
        }
      }
      
      if (data.locationDetails.coordinates !== undefined) {
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
    }
  }

  // Payment plan validation
  if (data.paymentPlan !== undefined) {
    if (!data.paymentPlan || typeof data.paymentPlan !== "object") {
      errors.push("paymentPlan must be an object.");
    } else {
      validateString(data.paymentPlan.booking, "paymentPlan.booking", 1, 100);
      validateString(data.paymentPlan.handover, "paymentPlan.handover", 1, 100);
      
      if (data.paymentPlan.construction !== undefined) {
        if (!Array.isArray(data.paymentPlan.construction)) {
          errors.push("paymentPlan.construction must be an array.");
        } else {
          let totalPercentage = 0;
          data.paymentPlan.construction.forEach((milestone: any, idx: number) => {
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
    }
  }

  // Amenities validation
  if (data.amenities !== undefined) {
    if (!Array.isArray(data.amenities)) {
      errors.push("amenities must be an array.");
    } else {
      data.amenities.forEach((amenity, idx) => {
        validateString(amenity.category, `amenities[${idx}].category`, 1, 100);
        
        if (!Array.isArray(amenity.items)) {
          errors.push(`amenities[${idx}].items must be an array.`);
        } else {
          amenity.items.forEach((item, itemIdx) => {
            validateString(item, `amenities[${idx}].items[${itemIdx}]`, 1, 200);
          });
        }
      });
    }
  }

  // Unit types validation
  if (data.unitTypes !== undefined) {
    if (!Array.isArray(data.unitTypes)) {
      errors.push("unitTypes must be an array.");
    } else {
      data.unitTypes.forEach((unit, idx) => {
        validateString(unit.type, `unitTypes[${idx}].type`, 1, 100);
        validateString(unit.size, `unitTypes[${idx}].size`, 1, 50);
        validateString(unit.price, `unitTypes[${idx}].price`, 1, 100);
      });
    }
  }

  // Categories validation
  if (data.categories !== undefined) {
    if (!Array.isArray(data.categories)) {
      errors.push("categories must be an array.");
    } else {
      data.categories.forEach((cat, idx) => {
        validateString(cat, `categories[${idx}]`, 1, 100);
      });
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Sanitize update data
 */
function sanitizeUpdateData(data: ProjectUpdateData): ProjectUpdateData {
  const sanitized: ProjectUpdateData = {};
  
  const sanitizeString = (str: string): string => str.trim().replace(/\s+/g, ' ');
  
  // Sanitize string fields
  if (data.name !== undefined) sanitized.name = sanitizeString(data.name);
  if (data.location !== undefined) sanitized.location = sanitizeString(data.location);
  if (data.developer !== undefined) sanitized.developer = sanitizeString(data.developer);
  if (data.description !== undefined) sanitized.description = sanitizeString(data.description);
  if (data.overview !== undefined) sanitized.overview = sanitizeString(data.overview);
  if (data.price !== undefined) sanitized.price = sanitizeString(data.price);
  
  // Handle image URLs
  if (data.image !== undefined) sanitized.image = data.image.trim();
  if (data.gallery !== undefined) {
    sanitized.gallery = data.gallery.map(url => url.trim()).filter(url => url.length > 0);
  }
  
  // Copy non-string fields as-is
  ['type', 'status', 'priceNumeric', 'completionDate', 'totalUnits', 'registrationOpen', 'launchDate', 'featured', 'flags'].forEach(field => {
    if ((data as any)[field] !== undefined) {
      (sanitized as any)[field] = (data as any)[field];
    }
  });

  // Sanitize complex objects
  if (data.locationDetails) {
    sanitized.locationDetails = {
      ...data.locationDetails,
      description: data.locationDetails.description ? sanitizeString(data.locationDetails.description) : data.locationDetails.description,
      nearby: data.locationDetails.nearby?.map((place: any) => ({
        name: sanitizeString(place.name),
        distance: sanitizeString(place.distance)
      }))
    };
  }

  if (data.paymentPlan) {
    sanitized.paymentPlan = {
      ...data.paymentPlan,
      booking: data.paymentPlan.booking ? sanitizeString(data.paymentPlan.booking) : data.paymentPlan.booking,
      handover: data.paymentPlan.handover ? sanitizeString(data.paymentPlan.handover) : data.paymentPlan.handover,
      construction: data.paymentPlan.construction?.map((milestone: any) => ({
        milestone: sanitizeString(milestone.milestone),
        percentage: sanitizeString(milestone.percentage)
      }))
    };
  }

  if (data.amenities) {
    sanitized.amenities = data.amenities.map(amenity => ({
      category: sanitizeString(amenity.category),
      items: amenity.items.map(item => sanitizeString(item)).filter(item => item.length > 0)
    })).filter(amenity => amenity.category.length > 0 && amenity.items.length > 0);
  }

  if (data.unitTypes) {
    sanitized.unitTypes = data.unitTypes.map(unit => ({
      type: sanitizeString(unit.type),
      size: sanitizeString(unit.size),
      price: sanitizeString(unit.price)
    })).filter(unit => unit.type.length > 0 && unit.size.length > 0 && unit.price.length > 0);
  }

  if (data.categories) {
    sanitized.categories = data.categories.map(cat => sanitizeString(cat)).filter(cat => cat.length > 0);
  }

  if (data.tags) {
    sanitized.tags = data.tags.map(tag => sanitizeString(tag)).filter(tag => tag.length > 0);
  }

  return sanitized;
}

/**
 * Check if user has permission to update project
 */
function canUpdateProject(user: any, project: any): { canUpdate: boolean; reason?: string } {
  // Admin can update any project
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
  if (adminEmails.includes(user.email)) {
    return { canUpdate: true };
  }

  // Project creator can update their own project
  if (project.createdBy?.email === user.email) {
    return { canUpdate: true };
  }

  // Check if user is in allowed updaters list (if implemented)
  const allowedUpdaters = project.allowedUpdaters || [];
  if (allowedUpdaters.includes(user.email)) {
    return { canUpdate: true };
  }

  return { 
    canUpdate: false, 
    reason: "You don't have permission to update this project" 
  };
}

/**
 * Main PUT handler with ZeroTrust authentication
 */
async function handler(
  request: NextRequest, 
  { params }: { params: { slug: string } }
) {
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

    const { slug } = params;
    
    // Find existing project
    const existingProject = await Project.findOne({ slug, isActive: true });
    if (!existingProject) {
      return NextResponse.json(
        { success: false, message: "Project not found", error: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Permission check handled by ZeroTrust withCollectionPermission

    // Parse JSON data directly
    let updateData: ProjectUpdateData;
    try {
      updateData = await request.json();
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return NextResponse.json(
        { success: false, message: "Invalid JSON payload", error: "INVALID_JSON" },
        { status: 400 }
      );
    }

    if (!updateData || typeof updateData !== 'object') {
      return NextResponse.json(
        { success: false, message: "Project data is required", error: "MISSING_PROJECT_DATA" },
        { status: 400 }
      );
    }

    // Sanitize data
    updateData = sanitizeUpdateData(updateData);

    // Validate update data
    const validation = validateUpdateData(updateData, existingProject);
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

    // Check for name conflicts if name is being changed
    if (updateData.name && updateData.name.trim().toLowerCase() !== existingProject.name.toLowerCase()) {
      const nameConflict = await Project.findOne({
        name: { $regex: new RegExp(`^${updateData.name}$`, "i") },
        _id: { $ne: existingProject._id },
        isActive: true
      });

      if (nameConflict) {
        return NextResponse.json(
          { 
            success: false, 
            message: "Project with this name already exists", 
            error: "DUPLICATE_NAME" 
          },
          { status: 409 }
        );
      }
    }

    // Prepare merged data for slug generation
    const mergedData = { ...existingProject.toObject(), ...updateData };
    
    // Generate updated slugs
    const slugs = await updateProjectSlugs(mergedData, existingProject);

    // Handle cover image update if provided in updateData
    let coverImageUrl = existingProject.image;
    if (updateData.image !== undefined) {
      coverImageUrl = updateData.image;
    }

    // Handle gallery images update if provided in updateData
    let galleryUrls = existingProject.gallery;
    if (updateData.gallery !== undefined) {
      galleryUrls = updateData.gallery;
    }

    // Prepare update object
    const updateObject = {
      ...updateData,
      ...slugs,
      image: coverImageUrl,
      gallery: galleryUrls,
      // Simple audit data (current requirement)
      updatedBy: user.firebaseUid,
      // Rich audit data foundation (for future enhancement)
      // updatedByEmail: user.email,
      // updatedByRole: user.fullRole,
      updatedAt: new Date(),
    };

    // Convert date strings to Date objects
    if (updateData.completionDate) {
      updateObject.completionDate = new Date(updateData.completionDate).toISOString();
    }
    if (updateData.launchDate) {
      updateObject.launchDate = new Date(updateData.launchDate).toISOString();
    }

    // Update project with optimistic locking
    const updatedProject = await Project.findOneAndUpdate(
      { 
        _id: existingProject._id,
        version: existingProject.version // Optimistic locking
      },
      { 
        $set: updateObject,
        $inc: { version: 1 }
      },
      { 
        new: true,
        runValidators: true
      }
    );

    if (!updatedProject) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Project was modified by another user. Please refresh and try again.", 
          error: "CONFLICT" 
        },
        { status: 409 }
      );
    }

    // Project updated successfully - audit data stored in database

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Project updated successfully",
        warnings: validation.warnings,
        project: {
          id: updatedProject._id,
          name: updatedProject.name,
          slug: updatedProject.slug,
          location: updatedProject.location,
          developer: updatedProject.developer,
          image: updatedProject.image,
          gallery: updatedProject.gallery,
          updatedAt: updatedProject.updatedAt,
          updatedBy: updatedProject.updatedBy,
          version: updatedProject.version
        },
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Error updating project:", error);

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
// Requires EDIT_CONTENT capability for PROJECTS collection
export const PUT = withCollectionPermission(Collection.PROJECTS, Action.EDIT)(handler);
