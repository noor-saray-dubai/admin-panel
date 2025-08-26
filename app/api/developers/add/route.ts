// app/api/developers/add/route.ts
import { NextRequest, NextResponse } from "next/server";
import Developer from "@/models/developers";
import { connectToDatabase } from "@/lib/db";
import { withAuth } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limiter";

export const runtime = "nodejs";

interface IDescriptionSection {
  title?: string;
  description: string;
}

interface IAward {
  name: string;
  year: number;
}

interface DeveloperData {
  name: string;
  description: IDescriptionSection[];
  overview: string;
  location: string;
  establishedYear: number;
  website: string;
  email: string;
  phone: string;
  verified: boolean;
  specialization: string[];
  awards: IAward[];
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

// Upload to Cloudinary
async function uploadToCloudinary(file: File, folder: string, fileName: string): Promise<string> {
  const { v2: cloudinary } = await import("cloudinary");
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
  });

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
 * Count words in a string
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Validate developer data with detailed field-specific errors
 */
function validateDeveloperData(data: DeveloperData): { 
  isValid: boolean; 
  errors: Record<string, string[]>; 
  warnings: string[] 
} {
  const errors: Record<string, string[]> = {};
  const warnings: string[] = [];

  // Helper to add field error
  const addError = (field: string, message: string) => {
    if (!errors[field]) errors[field] = [];
    errors[field].push(message);
  };

  // Name validation
  if (!data.name || typeof data.name !== "string") {
    addError("name", "Name is required");
  } else {
    const trimmed = data.name.trim();
    if (trimmed.length < 2) addError("name", "Name must be at least 2 characters long");
    if (trimmed.length > 100) addError("name", "Name cannot exceed 100 characters");
  }

  // Description validation (array of sections)
  if (!Array.isArray(data.description)) {
    addError("description", "Description must be an array of sections");
  } else {
    if (data.description.length === 0) {
      addError("description", "At least one description section is required");
    } else {
      data.description.forEach((section, index) => {
        if (!section.description || typeof section.description !== "string") {
          addError("description", `Section ${index + 1}: Description is required`);
        } else {
          if (section.description.trim().length < 10) {
            addError("description", `Section ${index + 1}: Description must be at least 10 characters`);
          }
          if (section.description.trim().length > 500) {
            addError("description", `Section ${index + 1}: Description cannot exceed 500 characters`);
          }
        }
        
        if (section.title) {
          if (typeof section.title !== "string") {
            addError("description", `Section ${index + 1}: Title must be a string`);
          } else if (section.title.trim().length > 100) {
            addError("description", `Section ${index + 1}: Title cannot exceed 100 characters`);
          }
        }
      });
    }
  }

  // Overview validation (max 20 words)
  if (!data.overview || typeof data.overview !== "string") {
    addError("overview", "Overview is required");
  } else {
    const trimmed = data.overview.trim();
    if (trimmed.length === 0) {
      addError("overview", "Overview cannot be empty");
    } else {
      const wordCount = countWords(trimmed);
      if (wordCount > 20) {
        addError("overview", `Overview must not exceed 20 words (current: ${wordCount} words)`);
      }
    }
  }

  // Location validation
  if (!data.location || typeof data.location !== "string") {
    addError("location", "Location is required");
  } else {
    const trimmed = data.location.trim();
    if (trimmed.length < 2) addError("location", "Location must be at least 2 characters long");
    if (trimmed.length > 100) addError("location", "Location cannot exceed 100 characters");
  }

  // Email validation
  if (!data.email || typeof data.email !== "string") {
    addError("email", "Email is required");
  } else {
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(data.email)) {
      addError("email", "Please provide a valid email address");
    }
  }

  // Phone validation
  if (!data.phone || typeof data.phone !== "string") {
    addError("phone", "Phone is required");
  } else {
    const trimmed = data.phone.trim();
    if (trimmed.length < 5) addError("phone", "Phone must be at least 5 characters long");
  }

  // Website validation (optional)
  if (data.website && typeof data.website === "string" && data.website.trim()) {
    try {
      new URL(data.website);
    } catch {
      addError("website", "Website must be a valid URL");
    }
  }

  // Established Year validation
  const currentYear = new Date().getFullYear();
  if (typeof data.establishedYear !== "number") {
    addError("establishedYear", "Established year is required");
  } else {
    if (data.establishedYear < 1800) {
      addError("establishedYear", "Established year cannot be before 1800");
    }
    if (data.establishedYear > currentYear) {
      addError("establishedYear", "Established year cannot be in the future");
    }
  }

  // Specialization validation
  if (!Array.isArray(data.specialization)) {
    addError("specialization", "Specialization must be an array");
  } else {
    if (data.specialization.length === 0) {
      addError("specialization", "At least one specialization is required");
    } else {
      data.specialization.forEach((spec, index) => {
        if (!spec || typeof spec !== "string") {
          addError("specialization", `Specialization ${index + 1} is required`);
        } else {
          const trimmed = spec.trim();
          if (trimmed.length === 0) {
            addError("specialization", `Specialization ${index + 1} cannot be empty`);
          }
        }
      });
    }
  }

  // Awards validation (optional array - only validate if awards exist)
  if (data.awards && Array.isArray(data.awards) && data.awards.length > 0) {
    data.awards.forEach((award, index) => {
      // Only validate if award object exists and has properties
      if (award && typeof award === 'object') {
        if (!award.name || typeof award.name !== "string" || award.name.trim().length === 0) {
          addError("awards", `Award ${index + 1}: Name is required`);
        } else if (award.name.trim().length > 200) {
          addError("awards", `Award ${index + 1}: Name cannot exceed 200 characters`);
        }
        
        if (typeof award.year !== "number" || isNaN(award.year)) {
          addError("awards", `Award ${index + 1}: Year is required and must be a valid number`);
        } else {
          if (award.year < 1900) {
            addError("awards", `Award ${index + 1}: Year cannot be before 1900`);
          }
          if (award.year > currentYear) {
            addError("awards", `Award ${index + 1}: Year cannot be in the future`);
          }
        }
      } else {
        addError("awards", `Award ${index + 1}: Invalid award data`);
      }
    });
  }

  // Verified validation
  if (typeof data.verified !== "boolean") {
    addError("verified", "Verified status must be true or false");
  }

  return { 
    isValid: Object.keys(errors).length === 0, 
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
    name: sanitizeString(data.name || ""),
    overview: sanitizeString(data.overview || ""),
    location: sanitizeString(data.location || ""),
    website: data.website ? sanitizeString(data.website) : "",
    email: sanitizeString((data.email || "").toLowerCase()),
    phone: sanitizeString(data.phone || ""),
    description: data.description?.map(section => ({
      title: section.title ? sanitizeString(section.title) : undefined,
      description: sanitizeString(section.description || "")
    })) || [],
    specialization: data.specialization?.map(spec => sanitizeString(spec)).filter(spec => spec.length > 0) || [],
    awards: (data.awards && Array.isArray(data.awards)) ? 
      data.awards
        .filter(award => award && typeof award === 'object' && award.name && award.year) // Filter out invalid awards
        .map(award => ({
          name: sanitizeString(award.name || ""),
          year: award.year
        })) : []
  };
}

/**
 * Validate image file
 */
function validateImageFile(file: File | null, fieldName: string, required: boolean = false): { 
  isValid: boolean; 
  error?: string 
} {
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
    const overview = formData.get("overview") as string;
    const location = formData.get("location") as string;
    const establishedYear = parseInt(formData.get("establishedYear") as string);
    const website = formData.get("website") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const verified = formData.get("verified") === "true";
    
    // Parse JSON fields
    const description = JSON.parse(formData.get("description") as string || "[]");
    const specialization = JSON.parse(formData.get("specialization") as string || "[]");
    const awards = JSON.parse(formData.get("awards") as string || "[]");

    const logoFile = formData.get("logoFile") as File | null;
    const coverImageFile = formData.get("coverImageFile") as File | null;

    // Create developer data object
    let developerData: DeveloperData = {
      name,
      description,
      overview,
      location,
      establishedYear,
      website,
      email,
      phone,
      verified,
      specialization,
      awards,
    };

    // Basic required field check
    if (!name || !overview || !email || !phone || !location) {
      return NextResponse.json({ 
        success: false, 
        error: "MISSING_FIELDS",
        message: "Missing required fields",
        errors: {
          general: ["Name, overview, email, phone, and location are required"]
        }
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
          error: "VALIDATION_ERROR",
          errors: validation.errors,
          warnings: validation.warnings
        },
        { status: 400 }
      );
    }

    // Validate image files
    const logoValidation = validateImageFile(logoFile, "Logo", true);
    if (!logoValidation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          message: logoValidation.error, 
          error: "INVALID_LOGO",
          errors: { logo: [logoValidation.error!] }
        },
        { status: 400 }
      );
    }

    const coverValidation = validateImageFile(coverImageFile, "Cover image", true);
    if (!coverValidation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          message: coverValidation.error, 
          error: "INVALID_COVER_IMAGE",
          errors: { coverImage: [coverValidation.error!] }
        },
        { status: 400 }
      );
    }

    // Generate base slug from name
    const baseSlug = generateSlug(name);
    
    // Check if developer already exists by slug (this is our only uniqueness check)
    const existingDeveloper = await Developer.findOne({ slug: baseSlug });
    if (existingDeveloper) {
      return NextResponse.json(
        { 
          success: false, 
          message: "This developer already exists", 
          error: "DEVELOPER_EXISTS",
          errors: { name: ["This developer already exists in the system."] }
        },
        { status: 409 }
      );
    }

    // Since no existing developer found, use the base slug
    const slug = baseSlug;

    let logoUrl = "";
    let coverImageUrl = "";

    // Upload logo
    if (logoFile && logoFile.size > 0) {
      try {
        logoUrl = await uploadToCloudinary(logoFile, slug, "logo");
      } catch (err) {
        console.error("Error uploading logo:", err);
        return NextResponse.json({ 
          success: false, 
          error: "UPLOAD_ERROR",
          message: "Failed to upload logo image",
          errors: { logo: ["Failed to upload logo image"] }
        }, { status: 500 });
      }
    }

    // Upload cover image
    if (coverImageFile && coverImageFile.size > 0) {
      try {
        coverImageUrl = await uploadToCloudinary(coverImageFile, slug, "cover");
      } catch (err) {
        console.error("Error uploading cover image:", err);
        return NextResponse.json({ 
          success: false, 
          error: "UPLOAD_ERROR",
          message: "Failed to upload cover image",
          errors: { coverImage: ["Failed to upload cover image"] }
        }, { status: 500 });
      }
    }

    // Create developer
    const newDeveloper = await Developer.create({
      ...developerData,
      slug,
      logo: logoUrl,
      coverImage: coverImageUrl,
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
        id: newDeveloper._id.toString(), // Ensure string conversion
        name: newDeveloper.name,
        slug: newDeveloper.slug,
        email: newDeveloper.email,
        location: newDeveloper.location,
        overview: newDeveloper.overview,
        logo: newDeveloper.logo,
        coverImage: newDeveloper.coverImage,
        verified: newDeveloper.verified,
        specialization: newDeveloper.specialization,
        awards: newDeveloper.awards,
        createdAt: newDeveloper.createdAt,
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error creating developer:", error);

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

    // Handle MongoDB duplicate key errors - now only for slug
    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyPattern || {})[0] || 'unknown';
      let errorMessage = `This ${duplicatedField} already exists`;
      let userMessage = `Duplicate ${duplicatedField} error`;
      
      if (duplicatedField === 'slug') {
        errorMessage = "This developer already exists in the system.";
        userMessage = "Developer already exists";
      }
      
      return NextResponse.json(
        {
          success: false,
          message: userMessage,
          error: "DUPLICATE_ENTRY",
          errors: { [duplicatedField]: [errorMessage] }
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
});

// GET - Fetch all developers
export async function GET() {
  try {
    await connectToDatabase();
    const developers = await Developer.find({}).sort({ createdAt: -1 });
    
    // Transform _id to id for consistency
    const transformedDevelopers = developers.map(dev => ({
      ...dev.toObject(),
      id: dev._id.toString(),
    }));

    return NextResponse.json({
      success: true,
      developers: transformedDevelopers
    });
  } catch (error) {
    console.error("Error fetching developers:", error);
    return NextResponse.json({ 
      success: false,
      error: "FETCH_ERROR",
      message: "Failed to fetch developers"
    }, { status: 500 });
  }
}