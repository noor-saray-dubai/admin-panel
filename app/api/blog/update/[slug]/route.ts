// app/api/blogs/update/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import Blog from "@/models/blog";
import { connectToDatabase } from "@/lib/db";
import { withCollectionPermission } from "@/lib/auth/server";
import { Collection, Action } from "@/types/user";
import { rateLimit } from "@/lib/rate-limiter";
import type { 
  IContentBlock, 
  IParagraphBlock, 
  IHeadingBlock, 
  IImageBlock, 
  ILinkBlock, 
  IQuoteBlock, 
  IListBlock
} from "@/models/blog";

// Force Node.js runtime
export const runtime = "nodejs";

interface BlogData {
  title: string;
  excerpt: string;
  contentBlocks: IContentBlock[]; // Aligned with schema
  author: string;
  category: string;
  tags: string[]; // Will default to [] if not provided  
  status: "Published" | "Draft"; // Aligned with schema
  publishDate: string;
  // readTime is always auto-calculated, never passed by user
  featured: boolean; // Required in API, has default in schema
  featuredImage?: string; // Optional as per schema
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

// Calculate read time based on content
function countWordsInText(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0).length;
}

function calculateReadTime(contentBlocks: IContentBlock[], excerpt: string = ''): number {
  const WORDS_PER_MINUTE = 200;
  let totalWords = 0;
  
  // Add words from excerpt
  totalWords += countWordsInText(excerpt);
  
  // Count words in each content block
  contentBlocks.forEach(block => {
    switch (block.type) {
      case 'paragraph':
      case 'quote':
        const contentBlock = block as IParagraphBlock | IQuoteBlock;
        contentBlock.content.forEach(segment => {
          totalWords += countWordsInText(segment.content);
        });
        if (block.type === 'quote') {
          const quoteBlock = block as IQuoteBlock;
          totalWords += countWordsInText(quoteBlock.author || '');
          totalWords += countWordsInText(quoteBlock.source || '');
        }
        break;
        
      case 'heading':
        const headingBlock = block as IHeadingBlock;
        totalWords += countWordsInText(headingBlock.content);
        break;
        
      case 'link':
        const linkBlock = block as ILinkBlock;
        totalWords += countWordsInText(linkBlock.coverText);
        break;
        
      case 'list':
        const listBlock = block as IListBlock;
        totalWords += countWordsInText(listBlock.title || '');
        listBlock.items.forEach(item => {
          totalWords += countWordsInText(item.text);
          if (item.subItems) {
            item.subItems.forEach(subItem => {
              totalWords += countWordsInText(subItem);
            });
          }
        });
        break;
        
      case 'image':
        const imageBlock = block as IImageBlock;
        totalWords += countWordsInText(imageBlock.alt);
        totalWords += countWordsInText(imageBlock.caption || '');
        // Images typically add processing time
        totalWords += 50; // Equivalent word count for image processing time
        break;
    }
  });
  
  // Calculate reading time (minimum 1 minute)
  const readTimeMinutes = Math.max(1, Math.ceil(totalWords / WORDS_PER_MINUTE));
  return Math.min(readTimeMinutes, 300); // Max 300 minutes
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
  validateString(data.author, "author", 2, 100);
  validateString(data.category, "category", 2, 100);

  // Validate contentBlocks array
  if (!Array.isArray(data.contentBlocks) || data.contentBlocks.length === 0) {
    errors.push("contentBlocks must be a non-empty array.");
  } else if (data.contentBlocks.length > 50) {
    errors.push("contentBlocks must not exceed 50 blocks.");
  }

  // Validate enums
  const validStatuses = ['Published', 'Draft']; // Aligned with schema
  if (!validStatuses.includes(data.status)) {
    errors.push(`status must be one of: ${validStatuses.join(', ')}`);
  }

  // readTime is always auto-calculated, no validation needed for user input

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
    // contentBlocks are objects, not strings - leave as is
    author: sanitizeString(data.author),
    category: sanitizeString(data.category),
    tags: data.tags.map(tag => sanitizeString(tag)).filter(tag => tag.length > 0)
  };
}

/**
 * Main PUT handler with ZeroTrust authentication
 */
async function handler(req: NextRequest) {
    // User is available on request.user (added by withCollectionPermission)
    const user = (req as any).user;
    
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
        const contentBlocksStr = formData.get("contentBlocks") as string;
        const author = formData.get("author") as string;
        const category = formData.get("category") as string;
        const status = formData.get("status") as "Published" | "Draft"; // Aligned with schema
        const publishDate = formData.get("publishDate") as string;
        // readTime is always auto-calculated, never extracted from form
        const featured = formData.get("featured") === "true";
        const tagsStr = formData.get("tags") as string;
        
        // Parse JSON fields
        let contentBlocks: IContentBlock[] = [];
        let tags: string[] = [];
        
        try {
            contentBlocks = contentBlocksStr ? JSON.parse(contentBlocksStr) : [];
        } catch (error) {
            return NextResponse.json({ 
                success: false, 
                error: "Invalid JSON format in contentBlocks field" 
            }, { status: 400 });
        }
        
        try {
            tags = tagsStr ? JSON.parse(tagsStr) : [];
        } catch (error) {
            return NextResponse.json({ 
                success: false, 
                error: "Invalid JSON format in tags field" 
            }, { status: 400 });
        }

        const featuredImageFile = formData.get("featuredImageFile") as File | null;

        // Create blog data object for validation
        let blogData: BlogData = {
            title,
            excerpt,
            contentBlocks,
            author,
            category,
            tags,
            status,
            publishDate,
            // readTime will be auto-calculated
            featured,
        };

        // Basic required field check
        if (!title || !excerpt || !contentBlocks || contentBlocks.length === 0 || !author || !category) {
            return NextResponse.json({ 
                success: false, 
                error: "Missing required fields" 
            }, { status: 400 });
        }

        // Sanitize data
        blogData = sanitizeBlogData(blogData);

        // Always auto-calculate read time (never trust user input for this)
        const calculatedReadTime = calculateReadTime(blogData.contentBlocks, blogData.excerpt);

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
                blog.featuredImage = featuredImageUrl; // Fixed: should be string, not array
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
        blog.contentBlocks = blogData.contentBlocks;
        blog.author = blogData.author;
        blog.category = blogData.category;
        blog.tags = blogData.tags;
        blog.status = blogData.status;
        blog.publishDate = new Date(blogData.publishDate);
        blog.readTime = calculatedReadTime; // Always use calculated value
        blog.featured = blogData.featured;
        
        // Update audit info to match project schema style
        blog.updatedBy = {
            email: user.email,
            timestamp: new Date(),
            ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
            userAgent: req.headers.get('user-agent') || 'unknown'
        };
        // Version is automatically incremented by pre-save middleware

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
                contentBlocks: blog.contentBlocks,
                featuredImage: blog.featuredImage || "",
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
}

// Export with ZeroTrust collection permission validation
// Requires EDIT_CONTENT capability for BLOGS collection
export const PUT = withCollectionPermission(Collection.BLOGS, Action.EDIT)(handler);
