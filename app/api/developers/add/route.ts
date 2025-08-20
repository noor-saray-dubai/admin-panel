// app/api/developers/add/route.ts
import { NextRequest, NextResponse } from "next/server";
import Developer from "@/models/developers";
import { connectToDatabase } from "@/lib/db";
import { withAuth } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limiter";

export const runtime = "nodejs";

interface DeveloperData {
  name: string;
  description: string;
  location: string;
  establishedYear: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  website: string;
  email: string;
  phone: string;
  rating: number;
  verified: boolean;
  specialization: string[];
}

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
    const existingDeveloper = await Developer.findOne({ slug });
    if (!existingDeveloper) return slug;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// Upload to Cloudinary without Sharp processing
async function uploadToCloudinary(file: File, folder: string, fileName: string): Promise<string> {
  const { v2: cloudinary } = await import("cloudinary");
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
  });

  // Convert File to Buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: "image",
          folder: `developers/${folder}`,
          public_id: fileName,
          format: "webp",
          quality: "auto:good",
          fetch_format: "auto",
          // Let Cloudinary handle optimization
          transformation: [
            { width: 800, height: 600, crop: "limit" },
            { quality: "auto:good" },
            { format: "auto" }
          ],
          overwrite: true,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result?.secure_url || "");
        }
      )
      .end(buffer);
  });
}

/**
 * Validate developer data
 */
function validateDeveloperData(data: DeveloperData): { isValid: boolean; errors: string[]; warnings: string[] } {
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

  // Required string fields
  validateString(data.name, "name", 2, 200);
  validateString(data.description, "description", 10, 2000);
  validateString(data.location, "location", 2, 100);
  validateString(data.website, "website", 5, 200);
  validateString(data.email, "email", 5, 100);
  validateString(data.phone, "phone", 5, 50);

  // Email validation
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push("email must be a valid email address.");
  }

  // URL validation for website
  if (data.website) {
    try {
      new URL(data.website);
    } catch {
      errors.push("website must be a valid URL.");
    }
  }

  // Numeric validations
  const currentYear = new Date().getFullYear();
  if (typeof data.establishedYear !== "number" || data.establishedYear < 1900 || data.establishedYear > currentYear) {
    errors.push(`establishedYear must be between 1900 and ${currentYear}.`);
  }

  if (typeof data.totalProjects !== "number" || data.totalProjects < 0 || data.totalProjects > 10000) {
    errors.push("totalProjects must be between 0 and 10,000.");
  }

  if (typeof data.activeProjects !== "number" || data.activeProjects < 0 || data.activeProjects > data.totalProjects) {
    errors.push("activeProjects must be between 0 and totalProjects.");
  }

  if (typeof data.completedProjects !== "number" || data.completedProjects < 0 || data.completedProjects > data.totalProjects) {
    errors.push("completedProjects must be between 0 and totalProjects.");
  }

  if (typeof data.rating !== "number" || data.rating < 0 || data.rating > 5) {
    errors.push("rating must be between 0 and 5.");
  }

  // Boolean validation
  if (typeof data.verified !== "boolean") {
    errors.push("verified must be a boolean.");
  }

  // Array validation
  if (!Array.isArray(data.specialization)) {
    errors.push("specialization must be an array.");
  } else {
    data.specialization.forEach((spec, idx) => {
      validateString(spec, `specialization[${idx}]`, 1, 100);
    });
  }

  // Business logic warnings
  if (data.activeProjects + data.completedProjects !== data.totalProjects) {
    warnings.push("Active + Completed projects should equal Total projects.");
  }

  return { 
    isValid: errors.length === 0, 
    errors, 
    warnings 
  };
}

/**
 * Sanitize developer data
 */
function sanitizeDeveloperData(data: DeveloperData): DeveloperData {
  const sanitizeString = (str: string): string => str.trim().replace(/\s+/g, ' ');
  
  return {
    ...data,
    name: sanitizeString(data.name),
    description: sanitizeString(data.description),
    location: sanitizeString(data.location),
    website: sanitizeString(data.website),
    email: sanitizeString(data.email.toLowerCase()),
    phone: sanitizeString(data.phone),
    specialization: data.specialization.map(spec => sanitizeString(spec)).filter(spec => spec.length > 0)
  };
}

/**
 * Validate image file
 */
function validateImageFile(file: File | null, fieldName: string, required: boolean = false): { isValid: boolean; error?: string } {
  if (!file || file.size === 0) {
    if (required) {
      return { isValid: false, error: `${fieldName} is required` };
    }
    return { isValid: true };
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: `${fieldName} must be one of: ${allowedTypes.join(', ')}` 
    };
  }

  const maxBytes = 5 * 1024 * 1024; // 5MB
  if (file.size > maxBytes) {
    return { 
      isValid: false, 
      error: `${fieldName} must be less than 5MB` 
    };
  }

  return { isValid: true };
}

// POST - Create new developer with authentication
export const POST = withAuth(async (req: NextRequest, { user, audit }) => {
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimit(req, user);
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

    const formData = await req.formData();

    // Extract form fields
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const location = formData.get("location") as string;
    const establishedYear = parseInt(formData.get("establishedYear") as string);
    const totalProjects = parseInt(formData.get("totalProjects") as string);
    const activeProjects = parseInt(formData.get("activeProjects") as string);
    const completedProjects = parseInt(formData.get("completedProjects") as string);
    const website = formData.get("website") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const rating = parseFloat(formData.get("rating") as string);
    const verified = formData.get("verified") === "true";
    const specialization = JSON.parse(formData.get("specialization") as string || "[]");

    const logoFile = formData.get("logoFile") as File | null;
    const coverImageFile = formData.get("coverImageFile") as File | null;

    // Create developer data object
    let developerData: DeveloperData = {
      name,
      description,
      location,
      establishedYear,
      totalProjects,
      activeProjects,
      completedProjects,
      website,
      email,
      phone,
      rating,
      verified,
      specialization,
    };

    // Basic required field check
    if (!name || !description || !email || !phone || !location) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing required fields" 
      }, { status: 400 });
    }

    // Sanitize data
    developerData = sanitizeDeveloperData(developerData);

    // Validate developer data
    const validation = validateDeveloperData(developerData);
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

    // Validate image files
    const logoValidation = validateImageFile(logoFile, "Logo");
    if (!logoValidation.isValid) {
      return NextResponse.json(
        { success: false, message: logoValidation.error, error: "INVALID_LOGO" },
        { status: 400 }
      );
    }

    const coverValidation = validateImageFile(coverImageFile, "Cover image");
    if (!coverValidation.isValid) {
      return NextResponse.json(
        { success: false, message: coverValidation.error, error: "INVALID_COVER_IMAGE" },
        { status: 400 }
      );
    }

    const baseSlug = generateSlug(name);
    const slug = await ensureUniqueSlug(baseSlug);

    // Check for existing developer by name or email
    const existingDeveloper = await Developer.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${name}$`, "i") } },
        { email: { $regex: new RegExp(`^${email}$`, "i") } }
      ]
    });

    if (existingDeveloper) {
      const field = existingDeveloper.name.toLowerCase() === name.toLowerCase() ? 'name' : 'email';
      return NextResponse.json(
        { 
          success: false, 
          message: `Developer with this ${field} already exists`, 
          error: "DUPLICATE_DEVELOPER" 
        },
        { status: 409 }
      );
    }

    let logoUrl = "";
    let coverImageUrl = "";

    // Upload logo if provided
    if (logoFile && logoFile.size > 0) {
      try {
        logoUrl = await uploadToCloudinary(logoFile, slug, "logo");
      } catch (err) {
        console.error("Error uploading logo:", err);
        return NextResponse.json({ 
          success: false, 
          error: "Failed to upload logo image" 
        }, { status: 500 });
      }
    }

    // Upload cover image if provided
    if (coverImageFile && coverImageFile.size > 0) {
      try {
        coverImageUrl = await uploadToCloudinary(coverImageFile, slug, "cover");
      } catch (err) {
        console.error("Error uploading cover image:", err);
        return NextResponse.json({ 
          success: false, 
          error: "Failed to upload cover image" 
        }, { status: 500 });
      }
    }

    // Create developer with audit info
    const newDeveloper = await Developer.create({
      ...developerData,
      slug,
      logo: logoUrl,
      coverImage: coverImageUrl,
      createdBy: audit,
      updatedBy: audit,
      version: 1,
      isActive: true,
    });

    // Log successful creation
    console.log(`Developer created successfully by ${user.email}:`, {
      id: newDeveloper._id,
      name: newDeveloper.name,
      slug: newDeveloper.slug
    });

    return NextResponse.json({
      success: true,
      message: "Developer created successfully",
      warnings: validation.warnings,
      developer: {
        id: newDeveloper._id,
        name: newDeveloper.name,
        slug: newDeveloper.slug,
        email: newDeveloper.email,
        location: newDeveloper.location,
        logo: newDeveloper.logo,
        coverImage: newDeveloper.coverImage,
        createdAt: newDeveloper.createdAt,
        createdBy: newDeveloper.createdBy.email
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error creating developer:", error);

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

// GET - Fetch all developers
export async function GET() {
  try {
    await connectToDatabase();
    const developers = await Developer.find({ isActive: true }).sort({ createdAt: -1 });
    return NextResponse.json({
      success: true,
      developers: developers
    });
  } catch (error) {
    console.error("Error fetching developers:", error);
    return NextResponse.json({ 
      success: false,
      error: "Internal Server Error" 
    }, { status: 500 });
  }
}