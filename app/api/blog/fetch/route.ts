import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../../lib/db";
import Blog from "../../../../models/blog";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";
    const author = searchParams.get("author") || "";
    const featured = searchParams.get("featured");

    // Build filter object
    const filter: any = { isActive: true };

    // Search in title, excerpt, author, and tags
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } }
      ];
    }

    // Filter by status
    if (status) {
      filter.status = status;
    }

    // Filter by category
    if (category) {
      filter.category = category;
    }

    // Filter by author
    if (author) {
      filter.author = { $regex: author, $options: "i" };
    }

    // Filter by featured
    if (featured !== null && featured !== "") {
      filter.featured = featured === "true";
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalBlogs = await Blog.countDocuments(filter);

    // Fetch blogs with pagination, including contentBlocks since we'll pass as props
    const blogs = await Blog.find(filter)
      .sort({ updatedAt: -1 }) // Sort by last updated
      .skip(skip)
      .limit(limit)
      .lean();

    // Get unique categories and authors for filters
    const [categories, authors] = await Promise.all([
      Blog.distinct("category", { isActive: true }),
      Blog.distinct("author", { isActive: true })
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalBlogs / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json(
      {
        success: true,
        blogs,
        pagination: {
          currentPage: page,
          totalPages,
          totalBlogs,
          limit,
          hasNextPage,
          hasPrevPage,
        },
        filters: {
          categories: categories.sort(),
          authors: authors.sort(),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching blogs:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch blogs",
        error: error.message || "UNKNOWN_ERROR",
      },
      { status: 500 }
    );
  }
}