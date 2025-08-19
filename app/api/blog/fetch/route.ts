import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../../lib/db";
import Blog from "../../../../models/blog"; // make sure this matches your Blog model file

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    // Fetch all active blogs, latest published first
    const blogs = await Blog.find({ isActive: true })
      .sort({ publishDate: -1 }) // latest first
      .lean();

    return NextResponse.json(
      {
        success: true,
        blogs,
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
