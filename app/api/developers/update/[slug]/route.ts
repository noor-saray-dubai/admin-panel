// app/api/developers/update/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import Developer from "@/models/developers";
import { connectToDatabase } from "@/lib/db";

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

// Ensure unique slug in DB (excluding current developer)
async function ensureUniqueSlug(baseSlug: string, currentSlug?: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    // If checking against current slug, allow it to keep the same slug
    if (slug === currentSlug) return slug;

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

// PUT - Update existing developer
export async function PUT(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    await connectToDatabase();

    const { slug: currentSlug } = params;
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

    // Find existing developer
    const developer = await Developer.findOne({ slug: currentSlug });
    if (!developer) {
      return NextResponse.json({
        success: false,
        error: "NOT_FOUND",
        message: "Developer not found",
        errors: { general: ["Developer not found"] }
      }, { status: 404 });
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

    // Validate image files (not required for updates)
    if (logoFile && logoFile.size > 0) {
      const logoValidation = validateImageFile(logoFile, "Logo", false);
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
    }

    if (coverImageFile && coverImageFile.size > 0) {
      const coverValidation = validateImageFile(coverImageFile, "Cover image", false);
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
    }

    // Handle slug update if name changed
    let newSlug = currentSlug;
    if (name.trim() !== developer.name.trim()) {
      const baseSlug = generateSlug(name);

      // Check if the new slug would conflict with existing developers (excluding current one)
      if (baseSlug !== currentSlug) {
        const existingWithNewSlug = await Developer.findOne({
          slug: baseSlug,
          _id: { $ne: developer._id }
        });

        if (existingWithNewSlug) {
          return NextResponse.json(
            {
              success: false,
              message: "This developer name already exists",
              error: "DEVELOPER_EXISTS",
              errors: { name: ["A developer with this name already exists in the system."] }
            },
            { status: 409 }
          );
        }

        newSlug = baseSlug;
      }
    }

    let logoUrl = developer.logo;
    let coverImageUrl = developer.coverImage;

    // Upload new logo if provided
    if (logoFile && logoFile.size > 0) {
      try {
        logoUrl = await uploadToCloudinary(logoFile, newSlug, "logo");
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

    // Upload new cover image if provided
    if (coverImageFile && coverImageFile.size > 0) {
      try {
        coverImageUrl = await uploadToCloudinary(coverImageFile, newSlug, "cover");
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

    // Update developer fields
    const updatedDeveloper = await Developer.findByIdAndUpdate(
      developer._id,
      {
        ...developerData,
        slug: newSlug,
        logo: logoUrl,
        coverImage: coverImageUrl,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    // Log successful update
    console.log(`Developer updated successfully:`, {
      id: updatedDeveloper._id,
      name: updatedDeveloper.name,
      slug: updatedDeveloper.slug,
      changes: {
        nameChanged: name !== developer.name,
        slugChanged: newSlug !== currentSlug,
        logoUpdated: logoFile && logoFile.size > 0,
        coverImageUpdated: coverImageFile && coverImageFile.size > 0,
      }
    });

    return NextResponse.json({
      success: true,
      message: "Developer updated successfully",
      warnings: validation.warnings,
      developer: {
        id: updatedDeveloper._id.toString(),
        name: updatedDeveloper.name,
        slug: updatedDeveloper.slug,
        email: updatedDeveloper.email,
        location: updatedDeveloper.location,
        overview: updatedDeveloper.overview,
        description: updatedDeveloper.description,
        logo: updatedDeveloper.logo,
        coverImage: updatedDeveloper.coverImage,
        verified: updatedDeveloper.verified,
        specialization: updatedDeveloper.specialization,
        awards: updatedDeveloper.awards,
        establishedYear: updatedDeveloper.establishedYear,
        website: updatedDeveloper.website,
        phone: updatedDeveloper.phone,
        createdAt: updatedDeveloper.createdAt,
        updatedAt: updatedDeveloper.updatedAt,
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error updating developer:", error);

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
}