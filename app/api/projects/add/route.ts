import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Project from "@/models/project";
import { v2 as cloudinary } from 'cloudinary';
import { withAuth } from "@/lib/auth-utils";
import { updateProjectSlugs } from "@/lib/slug-utils";
import { rateLimit } from "@/lib/rate-limiter";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
 * Enhanced image upload with retry logic and optimization
 */
async function uploadImageToCloudinary(
  fileBuffer: Buffer,
  fileName: string,
  folderName: string,
  isGallery: boolean = false,
  retryCount: number = 3
): Promise<string> {
  const uploadConfig = {
    folder: folderName,
    public_id: fileName,
    format: 'webp',
    quality: 'auto:good',
    fetch_format: 'auto',
    width: isGallery ? 1200 : 1920,
    height: isGallery ? 800 : 1080,
    crop: 'limit',
    resource_type: 'image' as const,
    secure: true,
    invalidate: true, // Invalidate CDN cache
    overwrite: false, // Prevent accidental overwrites
  };

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadConfig,
          (error, result) => {
            if (error) {
              console.error(`Cloudinary upload attempt ${attempt} failed:`, error);
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        
        uploadStream.end(fileBuffer);
      });

      // Validate the result
      if (!result?.secure_url) {
        throw new Error('Upload succeeded but no secure URL returned');
      }

      return result.secure_url;
    } catch (error: any) {
      console.error(`Upload attempt ${attempt}/${retryCount} failed:`, error.message);
      
      if (attempt === retryCount) {
        throw new Error(`Failed to upload image after ${retryCount} attempts: ${error.message}`);
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  
  throw new Error('Upload failed after all retry attempts');
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
  const now = new Date();
  
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
    amenities: data.amenities.map(amenity => ({
      category: sanitizeString(amenity.category),
      items: amenity.items.map(item => sanitizeString(item)).filter(item => item.length > 0)
    })).filter(amenity => amenity.category.length > 0 && amenity.items.length > 0),
    unitTypes: data.unitTypes.map(unit => ({
      type: sanitizeString(unit.type),
      size: sanitizeString(unit.size),
      price: sanitizeString(unit.price)
    })).filter(unit => unit.type.length > 0 && unit.size.length > 0 && unit.price.length > 0),
    categories: data.categories.map(cat => sanitizeString(cat)).filter(cat => cat.length > 0),
    tags: data.tags?.map(tag => sanitizeString(tag)).filter(tag => tag.length > 0) || []
  };
}

/**
 * Main POST handler with authentication
 */
export const POST = withAuth(async (request: NextRequest, { user, audit }) => {
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

    // Parse form data
    const formData = await request.formData();
    const projectDataString = formData.get('projectData') as string;
    
    if (!projectDataString) {
      return NextResponse.json(
        { success: false, message: "Project data is required", error: "MISSING_PROJECT_DATA" },
        { status: 400 }
      );
    }

    // Parse and validate JSON
    let projectData: ProjectData;
    try {
      projectData = JSON.parse(projectDataString);
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

    // Handle cover image upload
    const coverImageFile = formData.get('coverImage') as File;
    if (!coverImageFile || coverImageFile.size === 0) {
      return NextResponse.json(
        { success: false, message: "Cover image is required", error: "MISSING_COVER_IMAGE" },
        { status: 400 }
      );
    }

    // Validate image file
    if (coverImageFile.size > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json(
        { success: false, message: "Cover image must be less than 10MB", error: "FILE_TOO_LARGE" },
        { status: 400 }
      );
    }

    // Upload cover image
    const coverImageBuffer = Buffer.from(await coverImageFile.arrayBuffer());
    const coverImageUrl = await uploadImageToCloudinary(
      coverImageBuffer,
      `cover-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      slugs.slug,
      false
    );

    // Handle gallery images upload
    const galleryUrls: string[] = [];
    let galleryIndex = 0;
    const maxGalleryImages = 20;
    
    while (galleryIndex < maxGalleryImages && formData.get(`gallery_${galleryIndex}`)) {
      const galleryFile = formData.get(`gallery_${galleryIndex}`) as File;
      
      if (galleryFile && galleryFile.size > 0) {
        if (galleryFile.size > 10 * 1024 * 1024) {
          return NextResponse.json(
            { success: false, message: `Gallery image ${galleryIndex + 1} must be less than 10MB`, error: "FILE_TOO_LARGE" },
            { status: 400 }
          );
        }

        const galleryBuffer = Buffer.from(await galleryFile.arrayBuffer());
        const galleryUrl = await uploadImageToCloudinary(
          galleryBuffer,
          `gallery-${galleryIndex}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          slugs.slug,
          true
        );
        galleryUrls.push(galleryUrl);
      }
      galleryIndex++;
    }

    if (galleryUrls.length === 0) {
      return NextResponse.json(
        { success: false, message: "At least one gallery image is required", error: "MISSING_GALLERY_IMAGES" },
        { status: 400 }
      );
    }

    // Prepare project data for database
    const projectToSave = {
      ...projectData,
      ...slugs,
      image: coverImageUrl,
      gallery: galleryUrls,
      completionDate: new Date(projectData.completionDate),
      launchDate: new Date(projectData.launchDate),
      createdBy: audit,
      updatedBy: audit,
      version: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Create project
    const createdProject = await Project.create(projectToSave);

    // Log successful creation
    console.log(`Project created successfully by ${user.email}:`, {
      id: createdProject._id,
      name: createdProject.name,
      slug: createdProject.slug
    });

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
          createdBy: createdProject.createdBy.email
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
});