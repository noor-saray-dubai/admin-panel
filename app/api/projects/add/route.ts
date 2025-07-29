import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../../lib/db";
import Project from "../../../../models/project";
import { v2 as cloudinary } from 'cloudinary';

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
  developerSlug: string;
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
}

// Helper function to create URL-friendly slug
function createSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Helper function to upload image to Cloudinary with compression and WebP conversion
async function uploadImageToCloudinary(
  fileBuffer: Buffer, 
  fileName: string, 
  folderName: string,
  isGallery: boolean = false
): Promise<string> {
  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: folderName,
          public_id: fileName,
          format: 'webp', // Convert to WebP
          quality: 'auto:good', // Automatic quality optimization
          fetch_format: 'auto', // Automatic format selection
          width: isGallery ? 1200 : 1920, // Different sizes for gallery vs cover
          height: isGallery ? 800 : 1080,
          crop: 'limit', // Don't upscale, only downscale if needed
          resource_type: 'image',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(fileBuffer);
    });

    return (result as any).secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
}

// Validation function for project data
function validateProjectData(data: ProjectData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required string fields - ADDED developerSlug here
  const requiredStringFields: (keyof ProjectData)[] = [
    "name", "location", "type", "status", "developer", "developerSlug",
    "price", "description", "overview"
  ];
  
  for (const field of requiredStringFields) {
    if (!data[field] || typeof data[field] !== "string" || !data[field].trim()) {
      errors.push(`${field} is required and must be a non-empty string.`);
    }
  }

  // Numeric fields
  if (typeof data.priceNumeric !== "number" || data.priceNumeric <= 0) {
    errors.push("priceNumeric must be a positive number.");
  }
  if (typeof data.totalUnits !== "number" || data.totalUnits <= 0) {
    errors.push("totalUnits must be a positive number.");
  }

  // Boolean fields
  if (typeof data.registrationOpen !== "boolean") {
    errors.push("registrationOpen must be a boolean.");
  }
  if (typeof data.featured !== "boolean") {
    errors.push("featured must be a boolean.");
  }

  // Dates
  if (!data.completionDate || isNaN(new Date(data.completionDate).getTime())) {
    errors.push("completionDate is required and must be a valid date string.");
  }
  if (!data.launchDate || isNaN(new Date(data.launchDate).getTime())) {
    errors.push("launchDate is required and must be a valid date string.");
  }

  // Flags object
  if (!data.flags || typeof data.flags !== "object") {
    errors.push("flags must be an object.");
  } else {
    const flagKeys: (keyof Flags)[] = ["elite", "exclusive", "featured", "highValue"];
    for (const key of flagKeys) {
      if (typeof data.flags[key] !== "boolean") {
        errors.push(`flags.${key} must be a boolean.`);
      }
    }
  }

  // Validate locationDetails
  if (!data.locationDetails || typeof data.locationDetails !== "object") {
    errors.push("locationDetails must be an object.");
  } else {
    if (!data.locationDetails.description || !data.locationDetails.description.trim()) {
      errors.push("locationDetails.description is required.");
    }
    
    if (!Array.isArray(data.locationDetails.nearby)) {
      errors.push("locationDetails.nearby must be an array.");
    } else {
      data.locationDetails.nearby.forEach((place, idx) => {
        if (!place.name || !place.name.trim()) {
          errors.push(`locationDetails.nearby[${idx}].name is required.`);
        }
        if (!place.distance || !place.distance.trim()) {
          errors.push(`locationDetails.nearby[${idx}].distance is required.`);
        }
      });
    }
    
    if (!data.locationDetails.coordinates ||
        typeof data.locationDetails.coordinates.latitude !== "number" ||
        typeof data.locationDetails.coordinates.longitude !== "number") {
      errors.push("locationDetails.coordinates.latitude and longitude are required numbers.");
    }
  }

  // Validate paymentPlan
  if (!data.paymentPlan || typeof data.paymentPlan !== "object") {
    errors.push("paymentPlan must be an object.");
  } else {
    if (!data.paymentPlan.booking || !data.paymentPlan.booking.trim()) {
      errors.push("paymentPlan.booking is required.");
    }
    
    if (!Array.isArray(data.paymentPlan.construction) || data.paymentPlan.construction.length === 0) {
      errors.push("paymentPlan.construction must be a non-empty array.");
    } else {
      data.paymentPlan.construction.forEach((milestone, idx) => {
        if (!milestone.milestone || !milestone.milestone.trim()) {
          errors.push(`paymentPlan.construction[${idx}].milestone is required.`);
        }
        if (!milestone.percentage || !milestone.percentage.trim()) {
          errors.push(`paymentPlan.construction[${idx}].percentage is required.`);
        }
      });
    }
    
    if (!data.paymentPlan.handover || !data.paymentPlan.handover.trim()) {
      errors.push("paymentPlan.handover is required.");
    }
  }

  return { isValid: errors.length === 0, errors };
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    // Parse FormData from the request
    const formData = await request.formData();
    
    // Extract project data
    const projectDataString = formData.get('projectData') as string;
    console.log(formData)
    console.log(projectDataString)
    if (!projectDataString) {
      return NextResponse.json(
        { success: false, message: "Project data is required", error: "MISSING_PROJECT_DATA" },
        { status: 400 }
      );
    }

    let projectData: ProjectData;
    try {
      projectData = JSON.parse(projectDataString);
      
      // Add debugging logs
      console.log("Received project data:", {
        name: projectData.name,
        developer: projectData.developer,
        developerSlug: projectData.developerSlug
      });
      
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid project data JSON", error: "INVALID_JSON" },
        { status: 400 }
      );
    }

    // Validate project data
    const validation = validateProjectData(projectData);
    if (!validation.isValid) {
      console.log("Validation errors:", validation.errors);
      return NextResponse.json(
        { 
          success: false, 
          message: "Validation failed", 
          errors: validation.errors, 
          error: "VALIDATION_ERROR" 
        },
        { status: 400 }
      );
    }

    // Create slug from project name
    const slug = createSlug(projectData.name);
    
    // Check for existing project by name (case-insensitive)
    const existing = await Project.findOne({ 
      name: { $regex: new RegExp(`^${projectData.name}$`, "i") } 
    });
    if (existing) {
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
    if (!coverImageFile) {
      return NextResponse.json(
        { success: false, message: "Cover image is required", error: "MISSING_COVER_IMAGE" },
        { status: 400 }
      );
    }

    // Upload cover image to Cloudinary
    const coverImageBuffer = Buffer.from(await coverImageFile.arrayBuffer());
    const coverImageUrl = await uploadImageToCloudinary(
      coverImageBuffer,
      `cover-${Date.now()}`,
      slug,
      false
    );

    // Handle gallery images upload
    const galleryUrls: string[] = [];
    let galleryIndex = 0;
    
    while (formData.get(`gallery_${galleryIndex}`)) {
      const galleryFile = formData.get(`gallery_${galleryIndex}`) as File;
      if (galleryFile) {
        const galleryBuffer = Buffer.from(await galleryFile.arrayBuffer());
        const galleryUrl = await uploadImageToCloudinary(
          galleryBuffer,
          `gallery-${galleryIndex}-${Date.now()}`,
          slug,
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

    // Normalize strings (trim) - ADDED developerSlug here
    projectData.name = projectData.name.trim();
    projectData.location = projectData.location.trim();
    projectData.type = projectData.type.trim();
    projectData.status = projectData.status.trim();
    projectData.developer = projectData.developer.trim();
    projectData.developerSlug = projectData.developerSlug.trim();
    projectData.description = projectData.description.trim();
    projectData.overview = projectData.overview.trim();
    projectData.price = projectData.price.trim();

    // Prepare final object to save
    const projectToSave = {
      // Spread all project data first
      ...projectData,
      // Then override/add specific fields
      slug,
      id:slug,
      statusSlug: 'hey',
      locationSlug: 'hey',
      coverImage: coverImageUrl,
      gallery: galleryUrls,
      image: coverImageUrl, // Use cover image as main image for backward compatibility
      completionDate: new Date(projectData.completionDate),
      launchDate: new Date(projectData.launchDate),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add debugging log to see what's being saved
    console.log("Project data being saved:", {
      name: projectToSave.name,
      developer: projectToSave.developer,
      developerSlug: projectToSave.developerSlug,
      slug: projectToSave.slug
    });

    const createdProject = await Project.create(projectToSave);

    return NextResponse.json(
      {
        success: true,
        message: "Project created successfully",
        project: {
          id: createdProject._id,
          name: createdProject.name,
          slug: createdProject.slug,
          location: createdProject.location,
          developer: createdProject.developer,
          developerSlug: createdProject.developerSlug,
          coverImage: createdProject.coverImage,
          gallery: createdProject.gallery,
          createdAt: createdProject.createdAt,
        },
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Error creating project:", error);

    if (error.name === "ValidationError") {
      console.log("MongoDB validation error details:", error.errors);
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

    // Handle Cloudinary-specific errors
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

    return NextResponse.json(
      { success: false, message: "Internal server error", error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}