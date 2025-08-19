// app/api/blogs/update/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import Blog from "@/models/blog";
import { connectToDatabase } from "@/lib/db";
import { withAuth } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limiter";

// Force Node.js runtime (sharp + Cloudinary safe)
export const runtime = "nodejs";

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

// Process image to WebP
async function processImage(file: File): Promise<Buffer> {
    const sharp = (await import("sharp")).default;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    return sharp(buffer)
        .webp({ quality: 80 })
        .resize(1200, 800, { fit: "inside", withoutEnlargement: true })
        .toBuffer();
}

// Upload to Cloudinary
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
        const currentSlug = parts[parts.indexOf("update") + 1]
        // const { slug: currentSlug } = params;
        const blog = await Blog.findOne({ slug: currentSlug, isActive: true });
        if (!blog) {
            return NextResponse.json({ success: false, error: "Blog not found" }, { status: 404 });
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

        // Validate required fields
        if (!title || !excerpt || !content || !author || !category) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        // Update slug if title changed
        let newSlug = currentSlug;
        if (title !== blog.title) {
            const baseSlug = generateSlug(title);
            newSlug = await ensureUniqueSlug(baseSlug, currentSlug);
        }

        // Handle featured image if uploaded
        if (featuredImageFile) {
            try {
                const processedImage = await processImage(featuredImageFile);
                const featuredImageUrl = await uploadToCloudinary(processedImage, newSlug, "featured");
                blog.featuredImage = [featuredImageUrl];
            } catch (err) {
                console.error("Error processing featured image:", err);
                return NextResponse.json({ success: false, error: "Failed to process featured image" }, { status: 500 });
            }
        }

        // Update fields
        blog.title = title;
        blog.slug = newSlug;
        blog.excerpt = excerpt;
        blog.content = content;
        blog.author = author;
        blog.category = category;
        blog.tags = tags;
        blog.status = status;
        blog.publishDate = new Date(publishDate);
        blog.readTime = readTime;
        blog.featured = featured;
        blog.updatedBy = audit;
        blog.version = blog.version + 1;

        await blog.save();

        return NextResponse.json({
            success: true,
            message: "Blog post updated successfully",
            blog,
        });
    } catch (error) {
        console.error("Error updating blog post:", error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
            { status: 500 }
        );
    }
});
