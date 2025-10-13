// app/api/developers/update/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import Developer from "@/models/developers";
import { connectToDatabase } from "@/lib/db";
import { withCollectionPermission } from "@/lib/auth/server";
import { Collection, Action } from "@/types/user";
import { rateLimit } from "@/lib/rate-limiter";
import { AuditLog } from "@/models/auditLog";

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
  logo?: string;
  coverImage?: string;
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

  // Logo URL validation (optional for updates)
  if (data.logo && typeof data.logo === "string") {
    const urlRegex = /^https?:\/\/.+/;
    if (!urlRegex.test(data.logo)) {
      addError("logo", "Logo must be a valid URL");
    }
  }

  // Cover Image URL validation (optional for updates)
  if (data.coverImage && typeof data.coverImage === "string") {
    const urlRegex = /^https?:\/\/.+/;
    if (!urlRegex.test(data.coverImage)) {
      addError("coverImage", "Cover image must be a valid URL");
    }
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
    logo: data.logo ? sanitizeString(data.logo) : undefined,
    coverImage: data.coverImage ? sanitizeString(data.coverImage) : undefined,
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
 * Main PUT handler with authentication
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

    await connectToDatabase();

    const { slug: currentSlug } = params;
    
    // Parse JSON body instead of FormData
    const body = await request.json();

    // Create developer data object from body
    let developerData: DeveloperData = {
      name: body.name,
      description: body.description,
      overview: body.overview,
      location: body.location,
      establishedYear: body.establishedYear,
      website: body.website,
      email: body.email,
      phone: body.phone,
      verified: body.verified,
      specialization: body.specialization,
      awards: body.awards,
      logo: body.logo,
      coverImage: body.coverImage
    };

    // Basic required field check
    if (!developerData.name || !developerData.overview || !developerData.email || !developerData.phone || !developerData.location) {
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

    // Handle slug update if name changed
    let newSlug = currentSlug;
    if (developerData.name.trim() !== developer.name.trim()) {
      const baseSlug = generateSlug(developerData.name);

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

    // Extract IP address and user agent for audit
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create audit info for updatedBy
    const auditInfo = {
      email: user.email,
      timestamp: new Date(),
      ipAddress: ipAddress,
      userAgent: userAgent
    };

    // Prepare update object - only include logo and coverImage if provided
    const updateObj: any = {
      ...developerData,
      slug: newSlug,
      updatedBy: auditInfo
    };

    // Only update logo if provided
    if (developerData.logo) {
      updateObj.logo = developerData.logo;
    }
    
    // Only update coverImage if provided
    if (developerData.coverImage) {
      updateObj.coverImage = developerData.coverImage;
    }

    // Remove undefined logo and coverImage from the update object
    if (updateObj.logo === undefined) delete updateObj.logo;
    if (updateObj.coverImage === undefined) delete updateObj.coverImage;

    // Update developer with optimistic locking (like projects)
    const updatedDeveloper = await Developer.findOneAndUpdate(
      { 
        _id: developer._id,
        version: developer.version // Optimistic locking
      },
      { 
        $set: updateObj,
        $inc: { version: 1 }
      },
      { 
        new: true,
        runValidators: true
      }
    );

    if (!updatedDeveloper) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Developer was modified by another user. Please refresh and try again.", 
          error: "CONFLICT" 
        },
        { status: 409 }
      );
    }

    // Log to audit log
    const changes: any = {
      before: {
        name: developer.name,
        slug: developer.slug,
        location: developer.location,
        verified: developer.verified
      },
      after: {
        name: updatedDeveloper.name,
        slug: updatedDeveloper.slug,
        location: updatedDeveloper.location,
        verified: updatedDeveloper.verified
      }
    };

    await AuditLog.create({
      action: "UPDATE",
      collection: "developers",
      documentId: updatedDeveloper._id.toString(),
      userId: user.email,
      userAgent: userAgent,
      ipAddress: ipAddress,
      changes: changes,
      timestamp: new Date()
    });

    // Log successful update
    console.log(`Developer updated successfully by ${user.email}:`, {
      id: updatedDeveloper._id,
      name: updatedDeveloper.name,
      slug: updatedDeveloper.slug,
      changes: {
        nameChanged: developerData.name !== developer.name,
        slugChanged: newSlug !== currentSlug,
        logoUpdated: !!developerData.logo,
        coverImageUpdated: !!developerData.coverImage
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
        updatedBy: updatedDeveloper.updatedBy,
        version: updatedDeveloper.version
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

// Export with authentication wrapper - requires EDIT capability for DEVELOPERS collection
export const PUT = withCollectionPermission(Collection.DEVELOPERS, Action.EDIT)(handler);
