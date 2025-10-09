// app/api/projects/dropdown/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Project from "@/models/project";
import { withCollectionPermission } from "@/lib/auth/server";
import { Collection, Action } from "@/types/user";
import { rateLimit } from "@/lib/rate-limiter";

// Force Node.js runtime
export const runtime = "nodejs";

/**
 * GET handler for fetching projects dropdown data (name and slug only)
 */
async function handler(request: NextRequest) {
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

    // Parse optional search parameter
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";

    // Build query for active projects only
    const query: any = { isActive: true };

    // Add search filter if provided
    if (search.trim()) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } }
      ];
    }

    // Fetch projects with only name and slug
    const projects = await Project.find(query)
      .select({
        name: 1,
        slug: 1
      })
      .sort({ name: 1 })
      .limit(100) // Limit to 100 for performance
      .lean();

    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: projects.map(project => ({
          id: project._id?.toString() || '',
          name: project.name,
          slug: project.slug
        }))
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Error fetching projects dropdown:", error);

    return NextResponse.json(
      { 
        success: false, 
        message: "An unexpected error occurred while fetching projects", 
        error: "INTERNAL_ERROR" 
      },
      { status: 500 }
    );
  }
}

// Export with ZeroTrust collection permission validation
export const GET = withCollectionPermission(Collection.PROJECTS, Action.VIEW)(handler);