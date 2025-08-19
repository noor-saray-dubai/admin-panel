import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Career from "@/models/careers";
import { withAuth } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limiter";

interface CareerData {
  title: string;
  department: string;
  location: string;
  type: "Full-time" | "Part-time" | "Contract" | "Internship";
  level: "Entry" | "Mid" | "Senior" | "Executive";
  salary: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  status: "Active" | "Paused" | "Closed";
  postedDate: string;
  applicationDeadline: string;
  applicationsCount: number;
  featured: boolean;
  tags?: string[];
}

/**
 * Generate career slug from title
 */
function generateCareerSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .substring(0, 100); // Limit length
}

/**
 * Ensure unique slug
 */
async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  while (await Career.findOne({ slug, isActive: true })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}

/**
 * Comprehensive validation function
 */
function validateCareerData(data: CareerData): { isValid: boolean; errors: string[]; warnings: string[] } {
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
  validateString(data.title, "title", 2, 150);
  validateString(data.department, "department", 2, 100);
  validateString(data.location, "location", 2, 100);
  validateString(data.salary, "salary", 1, 100);
  validateString(data.description, "description", 10, 5000);

  // Validate enums
  const validTypes = ['Full-time', 'Part-time', 'Contract', 'Internship'];
  if (!validTypes.includes(data.type)) {
    errors.push(`type must be one of: ${validTypes.join(', ')}`);
  }

  const validLevels = ['Entry', 'Mid', 'Senior', 'Executive'];
  if (!validLevels.includes(data.level)) {
    errors.push(`level must be one of: ${validLevels.join(', ')}`);
  }

  const validStatuses = ['Active', 'Paused', 'Closed'];
  if (!validStatuses.includes(data.status)) {
    errors.push(`status must be one of: ${validStatuses.join(', ')}`);
  }

  // Numeric validations
  if (typeof data.applicationsCount !== "number" || data.applicationsCount < 0) {
    errors.push("applicationsCount must be a non-negative number.");
  }

  // Boolean validations
  if (typeof data.featured !== "boolean") {
    errors.push("featured must be a boolean.");
  }

  // Array validations
  if (!Array.isArray(data.requirements) || data.requirements.length === 0) {
    errors.push("At least one requirement is needed.");
  } else {
    data.requirements.forEach((req, idx) => {
      validateString(req, `requirement[${idx}]`, 1, 500);
    });
  }

  if (!Array.isArray(data.responsibilities) || data.responsibilities.length === 0) {
    errors.push("At least one responsibility is needed.");
  } else {
    data.responsibilities.forEach((resp, idx) => {
      validateString(resp, `responsibility[${idx}]`, 1, 500);
    });
  }

  if (!Array.isArray(data.benefits) || data.benefits.length === 0) {
    errors.push("At least one benefit is needed.");
  } else {
    data.benefits.forEach((benefit, idx) => {
      validateString(benefit, `benefit[${idx}]`, 1, 500);
    });
  }

  // Date validations
  const postedDate = new Date(data.postedDate);
  const applicationDeadline = new Date(data.applicationDeadline);
  
  if (isNaN(postedDate.getTime())) {
    errors.push("postedDate must be a valid date.");
  }
  
  if (isNaN(applicationDeadline.getTime())) {
    errors.push("applicationDeadline must be a valid date.");
  } else if (applicationDeadline <= postedDate) {
    errors.push("Application deadline must be after posted date.");
  }

  // Tags validation (optional)
  if (data.tags && Array.isArray(data.tags)) {
    data.tags.forEach((tag, idx) => {
      validateString(tag, `tag[${idx}]`, 1, 50);
    });
  }

  return { 
    isValid: errors.length === 0, 
    errors, 
    warnings 
  };
}

/**
 * Clean and sanitize career data
 */
function sanitizeCareerData(data: CareerData): CareerData {
  const sanitizeString = (str: string): string => str.trim().replace(/\s+/g, ' ');
  
  return {
    ...data,
    title: sanitizeString(data.title),
    department: sanitizeString(data.department),
    location: sanitizeString(data.location),
    salary: sanitizeString(data.salary),
    description: sanitizeString(data.description),
    requirements: data.requirements.map(req => sanitizeString(req)).filter(req => req.length > 0),
    responsibilities: data.responsibilities.map(resp => sanitizeString(resp)).filter(resp => resp.length > 0),
    benefits: data.benefits.map(benefit => sanitizeString(benefit)).filter(benefit => benefit.length > 0),
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

    // Parse request body
    let careerData: CareerData;
    try {
      careerData = await request.json();
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return NextResponse.json(
        { success: false, message: "Invalid JSON data", error: "INVALID_JSON" },
        { status: 400 }
      );
    }

    // Sanitize data
    careerData = sanitizeCareerData(careerData);

    // Validate career data
    const validation = validateCareerData(careerData);
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

    // Generate unique slug
    const baseSlug = generateCareerSlug(careerData.title);
    const uniqueSlug = await ensureUniqueSlug(baseSlug);

    // Check for existing career by title
    const existingCareer = await Career.findOne({
      title: { $regex: new RegExp(`^${careerData.title}$`, "i") },
      isActive: true
    });

    if (existingCareer) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Career with this title already exists", 
          error: "DUPLICATE_TITLE" 
        },
        { status: 409 }
      );
    }

    // Prepare career data for database
    const careerToSave = {
      ...careerData,
      slug: uniqueSlug,
      postedDate: new Date(careerData.postedDate),
      applicationDeadline: new Date(careerData.applicationDeadline),
      createdBy: audit,
      updatedBy: audit,
      version: 1,
      isActive: true,
    };

    // Create career
    const createdCareer = await Career.create(careerToSave);

    // Log successful creation
    console.log(`Career created successfully by ${user.email}:`, {
      id: createdCareer._id,
      title: createdCareer.title,
      slug: createdCareer.slug
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Career created successfully",
        warnings: validation.warnings,
        career: {
          id: createdCareer._id,
          title: createdCareer.title,
          slug: createdCareer.slug,
          department: createdCareer.department,
          location: createdCareer.location,
          type: createdCareer.type,
          level: createdCareer.level,
          status: createdCareer.status,
          featured: createdCareer.featured,
          postedDate: createdCareer.postedDate,
          applicationDeadline: createdCareer.applicationDeadline,
          createdAt: createdCareer.createdAt,
          createdBy: createdCareer.createdBy.email
        },
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Error creating career:", error);

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
});