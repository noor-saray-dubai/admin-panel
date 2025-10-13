import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../../lib/db";
import Blog from "../../../../models/blog";
import { withCollectionPermission } from "@/lib/auth/server";
import { Collection, Action } from "@/types/user";
import { rateLimit } from "@/lib/rate-limiter";

// Force Node.js runtime
export const runtime = "nodejs";

interface BlogFilters {
  search?: string;
  category?: string;
  author?: string;
  status?: string;
  featured?: boolean;
  minViews?: number;
  maxViews?: number;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Main GET handler with ZeroTrust authentication
 */
async function handler(request: NextRequest) {
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

    // Connect to database
    await connectToDatabase();

    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100); // Max 100 per page
    const tab = url.searchParams.get("tab") || "all";
    const sortBy = url.searchParams.get("sortBy") || "updatedAt";
    const sortOrder = url.searchParams.get("sortOrder") === "asc" ? 1 : -1;

    // Parse filters
    const filters: BlogFilters = {
      search: url.searchParams.get("search") || undefined,
      category: url.searchParams.get("category") || undefined,
      author: url.searchParams.get("author") || undefined,
      status: url.searchParams.get("status") || undefined,
      featured: url.searchParams.get("featured") === "true" ? true : 
                url.searchParams.get("featured") === "false" ? false : undefined,
      minViews: url.searchParams.get("minViews") ? parseInt(url.searchParams.get("minViews")!) : undefined,
      maxViews: url.searchParams.get("maxViews") ? parseInt(url.searchParams.get("maxViews")!) : undefined,
      dateFrom: url.searchParams.get("dateFrom") ? new Date(url.searchParams.get("dateFrom")!) : undefined,
      dateTo: url.searchParams.get("dateTo") ? new Date(url.searchParams.get("dateTo")!) : undefined,
    };

    // Build MongoDB query
    const query: any = { isActive: true };

    // Tab-based filtering
    switch (tab) {
      case "published":
        query.status = "Published";
        break;
      case "draft":
        query.status = "Draft";
        break;
      case "featured":
        query.featured = true;
        break;
      case "popular":
        query.views = { $gte: 100 }; // Blogs with 100+ views
        break;
      // "all" case doesn't add filters
    }

    // Apply additional filters
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: "i" } },
        { excerpt: { $regex: filters.search, $options: "i" } },
        { author: { $regex: filters.search, $options: "i" } },
        { category: { $regex: filters.search, $options: "i" } },
        { tags: { $in: [new RegExp(filters.search, "i")] } }
      ];
    }

    if (filters.category) {
      query.category = { $regex: filters.category, $options: "i" };
    }

    if (filters.author) {
      query.author = { $regex: filters.author, $options: "i" };
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.featured !== undefined) {
      query.featured = filters.featured;
    }

    // Views range filter
    if (filters.minViews !== undefined || filters.maxViews !== undefined) {
      query.views = {};
      if (filters.minViews !== undefined) {
        query.views.$gte = filters.minViews;
      }
      if (filters.maxViews !== undefined) {
        query.views.$lte = filters.maxViews;
      }
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      query.publishDate = {};
      if (filters.dateFrom) {
        query.publishDate.$gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        query.publishDate.$lte = filters.dateTo;
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder;

    // Execute query with pagination - include ALL fields needed for editing
    const [blogs, totalCount] = await Promise.all([
      Blog.find(query)
        .select({
          _id: 1,
          title: 1,
          slug: 1,
          excerpt: 1,
          contentBlocks: 1, // Required for editing
          featuredImage: 1,
          author: 1,
          category: 1,
          tags: 1,
          status: 1,
          publishDate: 1,
          readTime: 1,
          views: 1,
          featured: 1,
          createdBy: 1, // Required for audit info
          updatedBy: 1, // Required for audit info
          version: 1, // Required for versioning
          createdAt: 1,
          updatedAt: 1,
          isActive: 1
        })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Blog.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Get filter options for dropdowns
    const [categories, authors] = await Promise.all([
      Blog.distinct("category", { isActive: true }),
      Blog.distinct("author", { isActive: true })
    ]);

    const filterOptions = {
      categories: categories.filter(Boolean).sort(),
      authors: authors.filter(Boolean).sort()
    };

    return NextResponse.json({
      success: true,
      data: {
        blogs,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage,
          hasPrevPage,
        },
        filters: {
          filterOptions,
          applied: filters
        }
      }
    });
  } catch (error: any) {
    console.error("Blog fetch error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch blogs",
        error: "INTERNAL_ERROR" 
      },
      { status: 500 }
    );
  }
}

// Export with ZeroTrust collection permission validation
export const GET = withCollectionPermission(Collection.BLOGS, Action.VIEW)(handler);
