// app/api/blogs/add/route.ts
import { NextRequest, NextResponse } from "next/server";
import Blog from "@/models/blog";
import { connectToDatabase } from "@/lib/db";
import { withAuth } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limiter";

export const runtime = "nodejs"; // Force Node.js runtime (sharp + Cloudinary safe)

interface BlogData {
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  status: "Published" | "Draft" | "Scheduled";
  publishDate: string;
  readTime: number;
  featured: boolean;
}

// Helper to generate slug from title
function generateSlug(title: string): string {
  return title
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
    const existingBlog = await Blog.findOne({ slug, isActive: true });
    if (!existingBlog) return slug;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// Process image to WebP using sharp (lazy-loaded)
async function processImage(file: File): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return await sharp(buffer)
    .webp({ quality: 80 })
    .resize(1200, 800, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .toBuffer();
}

// Upload to Cloudinary (lazy-loaded + config inside function)
async function uploadToCloudinary(buffer: Buffer, folder: string, fileName: string): Promise<string> {
  const { v2: cloudinary } = await import("cloudinary");
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
  });

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: "image",
          folder: `blogs/${folder}`,
          public_id: fileName,
          format: "webp",
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
 * Comprehensive validation function
 */
function validateBlogData(data: BlogData): { isValid: boolean; errors: string[]; warnings: string[] } {
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
  validateString(data.title, "title", 2, 200);
  validateString(data.excerpt, "excerpt", 10, 500);
  validateString(data.content, "content", 50, 20000);
  validateString(data.author, "author", 2, 100);
  validateString(data.category, "category", 2, 100);

  // Validate enums
  const validStatuses = ['Published', 'Draft', 'Scheduled'];
  if (!validStatuses.includes(data.status)) {
    errors.push(`status must be one of: ${validStatuses.join(', ')}`);
  }

  // Numeric validations
  if (typeof data.readTime !== "number" || data.readTime <= 0) {
    errors.push("readTime must be a positive number.");
  }

  // Boolean validations
  if (typeof data.featured !== "boolean") {
    errors.push("featured must be a boolean.");
  }

  // Array validations
  if (!Array.isArray(data.tags)) {
    errors.push("tags must be an array.");
  } else {
    data.tags.forEach((tag, idx) => {
      validateString(tag, `tag[${idx}]`, 1, 50);
    });
  }

  // Date validation
  const publishDate = new Date(data.publishDate);
  if (isNaN(publishDate.getTime())) {
    errors.push("publishDate must be a valid date.");
  }

  return { 
    isValid: errors.length === 0, 
    errors, 
    warnings 
  };
}

/**
 * Clean and sanitize blog data
 */
function sanitizeBlogData(data: BlogData): BlogData {
  const sanitizeString = (str: string): string => str.trim().replace(/\s+/g, ' ');
  
  return {
    ...data,
    title: sanitizeString(data.title),
    excerpt: sanitizeString(data.excerpt),
    content: sanitizeString(data.content),
    author: sanitizeString(data.author),
    category: sanitizeString(data.category),
    tags: data.tags.map(tag => sanitizeString(tag)).filter(tag => tag.length > 0)
  };
}

// POST - Create new blog post with authentication
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

    await connectToDatabase();

    const formData = await request.formData();

    // Extract form fields
    const title = formData.get("title") as string;
    const excerpt = formData.get("excerpt") as string;
    const content = formData.get("content") as string;
    const author = formData.get("author") as string;
    const category = formData.get("category") as string;
    const status = formData.get("status") as "Published" | "Draft" | "Scheduled";
    const publishDate = formData.get("publishDate") as string;
    const readTime = parseInt(formData.get("readTime") as string);
    const featured = formData.get("featured") === "true";
    const tags = JSON.parse(formData.get("tags") as string || "[]");

    const featuredImageFile = formData.get("featuredImageFile") as File | null;

    // Create blog data object
    let blogData: BlogData = {
      title,
      excerpt,
      content,
      author,
      category,
      tags,
      status,
      publishDate,
      readTime,
      featured,
    };

    // Basic required field check
    if (!title || !excerpt || !content || !author || !category) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing required fields" 
      }, { status: 400 });
    }

    // Sanitize data
    blogData = sanitizeBlogData(blogData);

    // Validate blog data
    const validation = validateBlogData(blogData);
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

    const baseSlug = generateSlug(title);
    const slug = await ensureUniqueSlug(baseSlug);

    // Check for existing blog by title
    const existingBlog = await Blog.findOne({
      title: { $regex: new RegExp(`^${title}$`, "i") },
      isActive: true
    });

    if (existingBlog) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Blog post with this title already exists", 
          error: "DUPLICATE_TITLE" 
        },
        { status: 409 }
      );
    }

    let featuredImageUrl = "";

    // Process and upload featured image
    if (featuredImageFile) {
      try {
        const processedImage = await processImage(featuredImageFile);
        featuredImageUrl = await uploadToCloudinary(processedImage, slug, "featured");
      } catch (err) {
        console.error("Error processing featured image:", err);
        return NextResponse.json({ 
          success: false,
          error: "Failed to process featured image" 
        }, { status: 500 });
      }
    }

    // Prepare blog data for database
    const blogToSave = {
      title,
      slug,
      excerpt,
      content,
      featuredImage: featuredImageUrl ? [featuredImageUrl] : [],
      author,
      category,
      tags,
      status,
      publishDate: new Date(publishDate),
      readTime,
      views: 0,
      featured,
      
      // Audit info
      createdBy: audit,
      updatedBy: audit,
      version: 1,
      isActive: true,
    };

    const newBlog = await Blog.create(blogToSave);

    // Log successful creation
    console.log(`Blog post created successfully by ${user.email}:`, {
      id: newBlog._id,
      title: newBlog.title,
      slug: newBlog.slug
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Blog post created successfully",
        warnings: validation.warnings,
        blog: {
          _id: newBlog._id,
          title: newBlog.title,
          slug: newBlog.slug,
          excerpt: newBlog.excerpt,
          content: newBlog.content,
          featuredImage: newBlog.featuredImage[0] || "",
          author: newBlog.author,
          category: newBlog.category,
          tags: newBlog.tags,
          status: newBlog.status,
          publishDate: newBlog.publishDate,
          readTime: newBlog.readTime,
          views: newBlog.views,
          featured: newBlog.featured,
          createdAt: newBlog.createdAt,
          createdBy: newBlog.createdBy.email
        },
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Error creating blog post:", error);

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

// GET - Fetch all blog posts
export async function GET() {
  try {
    await connectToDatabase();
    const blogs = await Blog.find({ isActive: true }).sort({ createdAt: -1 });
    return NextResponse.json({
      success: true,
      blogs: blogs
    });
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json({ 
      success: false,
      error: "Internal Server Error" 
    }, { status: 500 });
  }
}