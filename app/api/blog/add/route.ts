// app/api/blogs/add/route.ts
import { NextRequest, NextResponse } from "next/server";
import Blog from "@/models/blog";
import { connectToDatabase } from "@/lib/db";
import { withAuth } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limiter";
import type { 
  IContentBlock, 
  IParagraphBlock, 
  IHeadingBlock, 
  IImageBlock, 
  ILinkBlock, 
  IQuoteBlock, 
  IListBlock,
  // IContentSegment,
  ITextSegment,
  ILinkSegment,
  IListItem
} from "@/models/blog";

export const runtime = "nodejs";

// =============================================
// TYPE DEFINITIONS & INTERFACES
// =============================================

interface ValidationError {
  field: string;
  code: string;
  message: string;
  value?: any;
  constraints?: Record<string, any>;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

interface BlogRequestData {
  title: string;
  excerpt: string;
  contentBlocks: IContentBlock[];
  author: string;
  category: string;
  tags: string[];
  status: "Published" | "Draft" | "Scheduled";
  publishDate: string;
  readTime?: number; // Optional - will be auto-calculated if not provided
  featured: boolean;
  featuredImage?: string;
}

// Error response interface for consistent API responses
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    type: 'VALIDATION_ERROR' | 'BUSINESS_LOGIC_ERROR' | 'SYSTEM_ERROR';
    details?: any;
  };
  errors?: ValidationError[];
  warnings?: ValidationError[];
  timestamp: string;
  requestId?: string;
}

interface SuccessResponse {
  success: true;
  data: any;
  warnings?: ValidationError[];
  timestamp: string;
  requestId?: string;
}

// =============================================
// VALIDATION CONSTANTS & RULES
// =============================================

const VALIDATION_RULES = {
  TITLE: { MIN_LENGTH: 2, MAX_LENGTH: 200 },
  EXCERPT: { MIN_LENGTH: 10, MAX_LENGTH: 500 },
  AUTHOR: { MIN_LENGTH: 2, MAX_LENGTH: 100 },
  CATEGORY: { MIN_LENGTH: 2, MAX_LENGTH: 100 },
  TAG: { MIN_LENGTH: 1, MAX_LENGTH: 50, MAX_COUNT: 10 },
  READ_TIME: { MIN: 1, MAX: 300 },
  CONTENT_BLOCKS: { MIN_COUNT: 1, MAX_COUNT: 15 },
  PARAGRAPH_SEGMENTS: { MIN_COUNT: 1, MAX_COUNT: 50 },
  QUOTE_SEGMENTS: { MIN_COUNT: 1, MAX_COUNT: 30 },
  LIST_ITEMS: { MIN_COUNT: 1, MAX_COUNT: 20 },
  HEADING_CONTENT: { MIN_LENGTH: 1, MAX_LENGTH: 200 },
  IMAGE_ALT: { MIN_LENGTH: 1, MAX_LENGTH: 200 },
  IMAGE_CAPTION: { MAX_LENGTH: 300 },
  LINK_COVER_TEXT: { MIN_LENGTH: 1, MAX_LENGTH: 200 },
  LIST_TITLE: { MIN_LENGTH: 1, MAX_LENGTH: 200 },
  LIST_ITEM_TEXT: { MIN_LENGTH: 1, MAX_LENGTH: 300 },
  QUOTE_AUTHOR: { MAX_LENGTH: 100 },
  QUOTE_SOURCE: { MAX_LENGTH: 200 },
  CONTENT_SEGMENT_TEXT: { MIN_LENGTH: 1, MAX_LENGTH: 500 },
  WORDS_PER_MINUTE: 200 // Average reading speed
} as const;

const ALLOWED_STATUSES = ['Published', 'Draft', 'Scheduled'] as const;
const ALLOWED_CONTENT_TYPES = ['paragraph', 'heading', 'image', 'link', 'quote', 'list'] as const;
const ALLOWED_HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const;
const ALLOWED_LIST_TYPES = ['ordered', 'unordered'] as const;
const ALLOWED_SEGMENT_TYPES = ['text', 'link'] as const;

// URL validation patterns
const URL_PATTERNS = {
  EXTERNAL: /^https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w/_.])*(?:\?(?:[\w&=%.]*))?(?:\#(?:[\w.]*))?)?$/,
  INTERNAL: /^\/[a-zA-Z0-9\-\/]*$/,
  IMAGE: /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i,
  COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
};

// =============================================
// UTILITY FUNCTIONS
// =============================================

function createError(field: string, code: string, message: string, value?: any, constraints?: Record<string, any>): ValidationError {
  return { field, code, message, value, constraints };
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100); // Limit slug length
}

async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  while (counter <= 100) { // Prevent infinite loop
    const existingBlog = await Blog.findOne({ slug, isActive: true });
    if (!existingBlog) return slug;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  // If we still can't find a unique slug, append timestamp
  return `${baseSlug}-${Date.now()}`;
}

function sanitizeString(str: string): string {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/\s+/g, ' ').replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
}

function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100;
}

function isValidUrl(url: string, type: 'external' | 'internal' | 'image' | 'any' = 'any'): boolean {
  if (!url || typeof url !== 'string') return false;
  
  switch (type) {
    case 'external':
      return URL_PATTERNS.EXTERNAL.test(url);
    case 'internal':
      return URL_PATTERNS.INTERNAL.test(url);
    case 'image':
      return URL_PATTERNS.IMAGE.test(url);
    case 'any':
      return URL_PATTERNS.EXTERNAL.test(url) || URL_PATTERNS.INTERNAL.test(url);
    default:
      return false;
  }
}

function isValidColor(color: string): boolean {
  if (!color || typeof color !== 'string') return false;
  return URL_PATTERNS.COLOR.test(color) || /^[a-zA-Z]+$/.test(color); // Allow named colors too
}

// Helper to extract content image files from FormData
function extractContentImageFiles(formData: FormData): { [blockIndex: number]: File } {
  const imageFiles: { [blockIndex: number]: File } = {};
  
  // Look for content image files with pattern: contentImage_${blockIndex}
  for (const [key, value] of formData.entries()) {
    const match = key.match(/^contentImage_(\d+)$/);
    if (match && value instanceof File && value.size > 0) {
      const blockIndex = parseInt(match[1]);
      imageFiles[blockIndex] = value;
    }
  }
  
  return imageFiles;
}

// Helper to validate image file (for BOTH featured and content images)
function validateImageFile(file: File, fieldName: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // File size validation (10MB limit)
  const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSizeInBytes) {
    errors.push(createError(
      fieldName, 
      'FILE_TOO_LARGE', 
      `Image file size must not exceed 10MB`,
      { maxSize: '10MB', actualSize: `${(file.size / (1024 * 1024)).toFixed(2)}MB` }
    ));
  }
  
  // File type validation (same for both image types)
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    errors.push(createError(
      fieldName,
      'INVALID_FILE_TYPE',
      'Image must be a valid image file (JPEG, PNG, GIF, WebP)',
      { allowedTypes, actualType: file.type }
    ));
  }
  
  return errors;
}

function countWordsInText(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  // Remove HTML tags, extra whitespace, and split by words
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0).length;
}

function calculateReadTime(contentBlocks: IContentBlock[], excerpt: string = ''): number {
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
        totalWords += countWordsInText(listBlock.title);
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
        // Images typically add 12-15 seconds to reading time
        totalWords += 50; // Equivalent word count for image processing time
        break;
    }
  });
  
  // Calculate reading time (minimum 1 minute)
  const readTimeMinutes = Math.max(1, Math.ceil(totalWords / VALIDATION_RULES.WORDS_PER_MINUTE));
  return Math.min(readTimeMinutes, VALIDATION_RULES.READ_TIME.MAX);
}

// =============================================
// CLOUDINARY UPLOAD HELPER (Handles BOTH image types)
// =============================================

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
          folder: `blogs/${folder}`,
          public_id: fileName,
          format: "webp",
          quality: "auto:good",
          fetch_format: "auto",
          transformation: [
            { width: 1200, height: 800, crop: "limit" },
            { quality: "auto:good" },
            { format: "auto" }
          ],
          overwrite: true,
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(new Error(`Failed to upload image: ${error.message}`));
          } else {
            resolve(result?.secure_url || "");
          }
        }
      )
      .end(buffer);
  });
}

// Upload multiple content images to Cloudinary
async function uploadMultipleImagesToCloudinary(
  imageFiles: { [blockIndex: number]: File },
  slug: string
): Promise<{ [blockIndex: number]: string }> {
  const uploadPromises = Object.entries(imageFiles).map(async ([blockIndexStr, file]) => {
    const blockIndex = parseInt(blockIndexStr);
    const fileName = `content-image-${blockIndex}`;
    
    try {
      const url = await uploadToCloudinary(file, slug, fileName);
      return { blockIndex, url };
    } catch (error) {
      throw new Error(`Failed to upload content image for block ${blockIndex}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
  
  const results = await Promise.all(uploadPromises);
  
  const urlMap: { [blockIndex: number]: string } = {};
  results.forEach(({ blockIndex, url }) => {
    urlMap[blockIndex] = url;
  });
  
  return urlMap;
}

// =============================================
// MAIN API ROUTE HANDLERS
// =============================================

export const POST = withAuth(async (request: NextRequest, { user, audit }) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, user);
    if (!rateLimitResult.success) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please try again later.',
          type: 'SYSTEM_ERROR' as const,
          details: { retryAfter: rateLimitResult.retryAfter }
        },
        timestamp: new Date().toISOString(),
        requestId
      }, { status: 429 });
    }

    await connectToDatabase();

    const contentType = request.headers.get('content-type') || '';
    let blogData: BlogRequestData;
    let featuredImageFile: File | null = null;
    let contentImageFiles: { [blockIndex: number]: File } = {};

    // Handle different content types
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      
      // Extract basic form data
      const title = formData.get("title") as string;
      const excerpt = formData.get("excerpt") as string;
      const contentBlocksStr = formData.get("contentBlocks") as string;
      const author = formData.get("author") as string;
      const category = formData.get("category") as string;
      const status = formData.get("status") as "Published" | "Draft" | "Scheduled";
      const publishDate = formData.get("publishDate") as string;
      const readTime = formData.get("readTime") as string;
      const featured = formData.get("featured") as string;
      const tagsStr = formData.get("tags") as string;
      
      // Extract IMAGE FILES (BOTH types)
      featuredImageFile = formData.get("featuredImageFile") as File | null;
      contentImageFiles = extractContentImageFiles(formData);

      // Parse JSON fields
      let contentBlocks: IContentBlock[] = [];
      let tags: string[] = [];

      try {
        contentBlocks = contentBlocksStr ? JSON.parse(contentBlocksStr) : [];
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'INVALID_JSON',
            message: 'Invalid JSON format in contentBlocks field',
            type: 'VALIDATION_ERROR' as const,
            details: { field: 'contentBlocks' }
          },
          timestamp: new Date().toISOString(),
          requestId
        }, { status: 400 });
      }

      try {
        tags = tagsStr ? JSON.parse(tagsStr) : [];
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'INVALID_JSON',
            message: 'Invalid JSON format in tags field',
            type: 'VALIDATION_ERROR' as const,
            details: { field: 'tags' }
          },
          timestamp: new Date().toISOString(),
          requestId
        }, { status: 400 });
      }

      blogData = {
        title: title || '',
        excerpt: excerpt || '',
        contentBlocks,
        author: author || '',
        category: category || '',
        tags,
        status: status || 'Draft',
        publishDate: publishDate || new Date().toISOString(),
        readTime: readTime ? parseInt(readTime) : undefined, // Allow auto-calculation
        featured: featured === 'true'
      };
    } else if (contentType.includes('application/json')) {
      try {
        blogData = await request.json();
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'INVALID_JSON',
            message: 'Invalid JSON format in request body',
            type: 'VALIDATION_ERROR' as const
          },
          timestamp: new Date().toISOString(),
          requestId
        }, { status: 400 });
      }
    } else {
      return NextResponse.json({
        success: false,
        error: {
          code: 'UNSUPPORTED_CONTENT_TYPE',
          message: 'Content-Type must be application/json or multipart/form-data',
          type: 'VALIDATION_ERROR' as const,
          details: { contentType }
        },
        timestamp: new Date().toISOString(),
        requestId
      }, { status: 400 });
    }

    // Auto-calculate read time if not provided and sanitize data
    if (blogData.readTime === undefined) {
      blogData.readTime = calculateReadTime(blogData.contentBlocks, blogData.excerpt);
    }

    // Validate featured image file if provided (ACTUAL FILE VALIDATION)
    if (featuredImageFile && featuredImageFile.size > 0) {
      const featuredImageErrors = validateImageFile(featuredImageFile, 'featuredImageFile');
      if (featuredImageErrors.length > 0) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'INVALID_FEATURED_IMAGE',
            message: 'Featured image validation failed',
            type: 'VALIDATION_ERROR' as const
          },
          errors: featuredImageErrors,
          timestamp: new Date().toISOString(),
          requestId
        }, { status: 400 });
      }
    }
    
    // Validate content image files if provided (ACTUAL FILE VALIDATION)
    const contentImageErrors: ValidationError[] = [];
    Object.entries(contentImageFiles).forEach(([blockIndex, file]) => {
      const errors = validateImageFile(file, `contentImage_${blockIndex}`);
      contentImageErrors.push(...errors);
    });
    
    if (contentImageErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_CONTENT_IMAGES',
          message: 'Content image validation failed',
          type: 'VALIDATION_ERROR' as const
        },
        errors: contentImageErrors,
        timestamp: new Date().toISOString(),
        requestId
      }, { status: 400 });
    }

    // Generate slug
    const baseSlug = generateSlug(blogData.title);
    const slug = await ensureUniqueSlug(baseSlug);

    // Check for duplicate title
    const existingBlog = await Blog.findOne({
      title: { $regex: new RegExp(`^${blogData.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") },
      isActive: true
    });

    if (existingBlog) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'DUPLICATE_TITLE',
          message: 'A blog post with this title already exists',
          type: 'BUSINESS_LOGIC_ERROR' as const,
          details: { existingSlug: existingBlog.slug }
        },
        timestamp: new Date().toISOString(),
        requestId
      }, { status: 409 });
    }

    // =============================================
    // IMAGE UPLOAD HANDLING (BOTH TYPES)
    // =============================================

    // 1. Handle FEATURED IMAGE upload
    let featuredImageUrl = blogData.featuredImage || '';
    if (featuredImageFile && featuredImageFile.size > 0) {
      try {
        featuredImageUrl = await uploadToCloudinary(featuredImageFile, slug, "featured");
        console.log(`Featured image uploaded: ${featuredImageUrl}`);
      } catch (error: any) {
        console.error("Error uploading featured image:", error);
        return NextResponse.json({
          success: false,
          error: {
            code: 'UPLOAD_FAILED',
            message: 'Failed to upload featured image',
            type: 'SYSTEM_ERROR' as const,
            details: { error: error.message }
          },
          timestamp: new Date().toISOString(),
          requestId
        }, { status: 500 });
      }
    }
    
    // 2. Handle CONTENT IMAGES upload
    let contentImageUrls: { [blockIndex: number]: string } = {};
    if (Object.keys(contentImageFiles).length > 0) {
      try {
        contentImageUrls = await uploadMultipleImagesToCloudinary(contentImageFiles, slug);
        console.log(`Content images uploaded:`, contentImageUrls);
      } catch (error: any) {
        console.error("Error uploading content images:", error);
        return NextResponse.json({
          success: false,
          error: {
            code: 'CONTENT_IMAGES_UPLOAD_FAILED',
            message: 'Failed to upload content images',
            type: 'SYSTEM_ERROR' as const,
            details: { error: error.message }
          },
          timestamp: new Date().toISOString(),
          requestId
        }, { status: 500 });
      }
    }
    
    // 3. Replace placeholder URLs with actual uploaded URLs in content blocks
    const processedContentBlocks = blogData.contentBlocks.map((block, index) => {
      console.log(`Processing content block at index ${index}:`, block);
      if (block.type === 'image' && block.url === '') {
        const uploadedUrl = contentImageUrls[index];
        console.log(`Processing image block at index ${index}: placeholder URL found .,contentImageUrls:`, contentImageUrls);
        if (uploadedUrl) {
          console.log(`Replacing placeholder URL in block ${index} with uploaded URL: ${uploadedUrl}`);
          return {
            ...block,
            url: uploadedUrl
          };
        } else {
          throw new Error(`No uploaded image found for content block at index ${index}`);
        }
      }
      return block;
    });

    // Prepare blog document for database
    const blogDocument = {
      title: blogData.title,
      slug,
      excerpt: blogData.excerpt,
      contentBlocks: processedContentBlocks,
      featuredImage: featuredImageUrl,
      author: blogData.author,
      category: blogData.category,
      tags: blogData.tags,
      status: blogData.status,
      publishDate: new Date(blogData.publishDate),
      readTime: blogData.readTime,
      views: 0,
      featured: blogData.featured,
      createdBy: audit,
      updatedBy: audit,
      version: 1,
      isActive: true,
    };
    console.log("Prepared blog document for creation:", blogDocument);
    // Create blog post in database
    const newBlog = await Blog.create(blogDocument);

    // Log successful creation
    console.log(`Blog post created successfully by ${user.email}:`, {
      id: newBlog._id,
      title: newBlog.title,
      slug: newBlog.slug,
      contentBlocks: newBlog.contentBlocks.length,
      readTime: newBlog.readTime,
      featuredImage: !!featuredImageUrl,
      contentImages: Object.keys(contentImageUrls).length,
      requestId
    });

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        blog: {
          _id: newBlog._id,
          title: newBlog.title,
          slug: newBlog.slug,
          excerpt: newBlog.excerpt,
          contentBlocks: newBlog.contentBlocks,
          featuredImage: newBlog.featuredImage,
          author: newBlog.author,
          category: newBlog.category,
          tags: newBlog.tags,
          status: newBlog.status,
          publishDate: newBlog.publishDate,
          readTime: newBlog.readTime,
          views: newBlog.views,
          featured: newBlog.featured,
          createdAt: newBlog.createdAt,
          createdBy: newBlog.createdBy.email,
          version: newBlog.version
        },
        message: 'Blog post created successfully',
        uploadSummary: {
          featuredImage: !!featuredImageUrl,
          contentImages: Object.keys(contentImageUrls).length,
          totalImagesUploaded: (featuredImageUrl ? 1 : 0) + Object.keys(contentImageUrls).length
        }
      },
      timestamp: new Date().toISOString(),
      requestId
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error creating blog post:", error);

    // Handle specific MongoDB errors
    if (error.name === "ValidationError") {
      const mongoErrors: ValidationError[] = Object.entries(error.errors).map(([path, err]: [string, any]) => ({
        field: path,
        code: 'DB_VALIDATION_ERROR',
        message: err.message,
        value: err.value
      }));

      return NextResponse.json({
        success: false,
        error: {
          code: 'DB_VALIDATION_FAILED',
          message: 'Database validation failed',
          type: 'VALIDATION_ERROR' as const,
          details: { mongooseError: error.message }
        },
        errors: mongoErrors,
        timestamp: new Date().toISOString(),
        requestId
      }, { status: 400 });
    }

    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0] || 'unknown';
      return NextResponse.json({
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: `Duplicate entry detected for field: ${duplicateField}`,
          type: 'BUSINESS_LOGIC_ERROR' as const,
          details: { field: duplicateField, value: error.keyValue }
        },
        timestamp: new Date().toISOString(),
        requestId
      }, { status: 409 });
    }

    // Generic server error
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while creating the blog post',
        type: 'SYSTEM_ERROR' as const,
        details: { error: process.env.NODE_ENV === 'development' ? error.message : undefined }
      },
      timestamp: new Date().toISOString(),
      requestId
    }, { status: 500 });
  }
});

// GET endpoint for fetching blogs
export async function GET(request: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    // Build filter and execute query
    const filter: any = { isActive: true };
    const skip = (page - 1) * limit;
    
    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-createdBy -updatedBy')
        .lean(),
      Blog.countDocuments(filter)
    ]);

    return NextResponse.json({
      success: true,
      data: {
        blogs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      },
      timestamp: new Date().toISOString(),
      requestId
    });
    
  } catch (error: any) {
    console.error("Error fetching blog posts:", error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch blog posts',
        type: 'SYSTEM_ERROR' as const,
        details: { error: process.env.NODE_ENV === 'development' ? error.message : undefined }
      },
      timestamp: new Date().toISOString(),
      requestId
    }, { status: 500 });
  }
}