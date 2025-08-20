// app/api/blogs/update/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import Blog from "@/models/blog";
import { connectToDatabase } from "@/lib/db";
import { withAuth } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limiter";

// Force Node.js runtime
export const runtime = "nodejs";

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

// Helper: generate slug from title
function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

// Ensure unique slug (but allow current one)
async function ensureUniqueSlug(baseSlug: string, currentSlug?: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
        if (slug === currentSlug) return slug;
        const existingBlog = await Blog.findOne({ slug, isActive: true });
        if (!existingBlog) return slug;
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
                    folder: `blogs/${folder}`,
                    public_id: fileName,
                    format: "webp",
                    quality: "auto:good",
                    fetch_format: "auto",
                    // Let Cloudinary handle the optimization
                    transformation: [
                        { width: 1200, height: 800, crop: "limit" },
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

// PUT - Update existing blog post
export const PUT = withAuth(async (req: NextRequest, { user, audit }) => {
    try {
        await connectToDatabase();

        // Apply rate limiting
        const rateLimitResult = await rateLimit(req, user);
        if (!rateLimitResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: "RATE_LIMITED",
                    message: "Too many requests. Please try again later.",
                    retryAfter: rateLimitResult.retryAfter,
                },
                { status: 429 }
            );
        }

        const url = new URL(req.url);
        const parts = url.pathname.split("/");
        const currentSlug = parts[parts.indexOf("update") + 1];

        if (!currentSlug) {
            return NextResponse.json({ 
                success: false, 
                error: "Slug parameter is required" 
            }, { status: 400 });
        }

        const blog = await Blog.findOne({ slug: currentSlug, isActive: true });
        if (!blog) {
            return NextResponse.json({ 
                success: false, 
                error: "Blog not found" 
            }, { status: 404 });
        }

        const formData = await req.formData();

        // Extract fields
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

        // Create blog data object for validation
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

        // Update slug if title changed
        let newSlug = currentSlug;
        if (title !== blog.title) {
            const baseSlug = generateSlug(title);
            newSlug = await ensureUniqueSlug(baseSlug, currentSlug);

            // Check for existing blog with same title (excluding current blog)
            const existingBlog = await Blog.findOne({
                title: { $regex: new RegExp(`^${title}$`, "i") },
                slug: { $ne: currentSlug },
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
        }

        // Handle featured image if uploaded
        if (featuredImageFile) {
            try {
                const featuredImageUrl = await uploadToCloudinary(featuredImageFile, newSlug, "featured");
                blog.featuredImage = [featuredImageUrl];
            } catch (err) {
                console.error("Error uploading featured image:", err);
                return NextResponse.json({ 
                    success: false, 
                    error: "Failed to upload featured image" 
                }, { status: 500 });
            }
        }

        // Update fields with sanitized data
        blog.title = blogData.title;
        blog.slug = newSlug;
        blog.excerpt = blogData.excerpt;
        blog.content = blogData.content;
        blog.author = blogData.author;
        blog.category = blogData.category;
        blog.tags = blogData.tags;
        blog.status = blogData.status;
        blog.publishDate = new Date(blogData.publishDate);
        blog.readTime = blogData.readTime;
        blog.featured = blogData.featured;
        blog.updatedBy = audit;
        blog.version = blog.version + 1;

        await blog.save();

        // Log successful update
        console.log(`Blog post updated successfully by ${user.email}:`, {
            id: blog._id,
            title: blog.title,
            slug: blog.slug,
            oldSlug: currentSlug !== newSlug ? currentSlug : undefined
        });

        return NextResponse.json({
            success: true,
            message: "Blog post updated successfully",
            warnings: validation.warnings,
            blog: {
                _id: blog._id,
                title: blog.title,
                slug: blog.slug,
                excerpt: blog.excerpt,
                content: blog.content,
                featuredImage: blog.featuredImage[0] || "",
                author: blog.author,
                category: blog.category,
                tags: blog.tags,
                status: blog.status,
                publishDate: blog.publishDate,
                readTime: blog.readTime,
                views: blog.views,
                featured: blog.featured,
                createdAt: blog.createdAt,
                updatedAt: blog.updatedAt,
                updatedBy: blog.updatedBy.email,
                version: blog.version
            }
        });

    } catch (error: any) {
        console.error("Error updating blog post:", error);

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