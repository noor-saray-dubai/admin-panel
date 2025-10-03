// app/api/projects/fetch/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Project from "@/models/project";
import { withCollectionPermission } from "@/lib/auth/server";
import { Collection, Action } from "@/types/user";
import { rateLimit } from "@/lib/rate-limiter";

// Force Node.js runtime
export const runtime = "nodejs";

interface ProjectFilters {
  search?: string;
  location?: string;
  developer?: string;
  type?: string;
  status?: string;
  featured?: boolean;
  elite?: boolean;
  registrationOpen?: boolean;
  minPrice?: number;
  maxPrice?: number;
  minUnits?: number;
  maxUnits?: number;
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
    const filters: ProjectFilters = {
      search: url.searchParams.get("search") || undefined,
      location: url.searchParams.get("location") || undefined,
      developer: url.searchParams.get("developer") || undefined,
      type: url.searchParams.get("type") || undefined,
      status: url.searchParams.get("status") || undefined,
      featured: url.searchParams.get("featured") === "true" ? true : 
                url.searchParams.get("featured") === "false" ? false : undefined,
      elite: url.searchParams.get("elite") === "true" ? true :
             url.searchParams.get("elite") === "false" ? false : undefined,
      registrationOpen: url.searchParams.get("registrationOpen") === "true" ? true :
                       url.searchParams.get("registrationOpen") === "false" ? false : undefined,
      minPrice: url.searchParams.get("minPrice") ? parseFloat(url.searchParams.get("minPrice")!) : undefined,
      maxPrice: url.searchParams.get("maxPrice") ? parseFloat(url.searchParams.get("maxPrice")!) : undefined,
      minUnits: url.searchParams.get("minUnits") ? parseInt(url.searchParams.get("minUnits")!) : undefined,
      maxUnits: url.searchParams.get("maxUnits") ? parseInt(url.searchParams.get("maxUnits")!) : undefined,
    };

    // Build MongoDB query
    const query: any = { isActive: true };

    // Tab-based filtering
    switch (tab) {
      case "elite":
        query["flags.elite"] = true;
        break;
      case "featured":
        query.$or = [
          { "flags.featured": true },
          { featured: true }
        ];
        break;
      case "launched":
        query.status = { $in: ["Launched", "Launching Soon", "Pre-Launch"] };
        break;
      case "completed":
        query.status = { $in: ["Completed", "Ready to Move"] };
        break;
      case "draft":
        query.$or = [
          { status: "Draft" },
          { isActive: false }
        ];
        break;
      // "all" case doesn't add filters
    }

    // Apply additional filters
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { location: { $regex: filters.search, $options: "i" } },
        { developer: { $regex: filters.search, $options: "i" } },
        { description: { $regex: filters.search, $options: "i" } },
        { type: { $regex: filters.search, $options: "i" } },
        { categories: { $in: [new RegExp(filters.search, "i")] } },
        { tags: { $in: [new RegExp(filters.search, "i")] } }
      ];
    }

    if (filters.location) {
      query.location = { $regex: filters.location, $options: "i" };
    }

    if (filters.developer) {
      query.developer = { $regex: filters.developer, $options: "i" };
    }

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.featured !== undefined) {
      if (filters.featured) {
        query.$or = query.$or || [];
        query.$or.push({ "flags.featured": true }, { featured: true });
      } else {
        query["flags.featured"] = { $ne: true };
        query.featured = { $ne: true };
      }
    }

    if (filters.elite !== undefined) {
      query["flags.elite"] = filters.elite;
    }

    if (filters.registrationOpen !== undefined) {
      query.registrationOpen = filters.registrationOpen;
    }

    // Price range filter
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.priceNumeric = {};
      if (filters.minPrice !== undefined) {
        query.priceNumeric.$gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        query.priceNumeric.$lte = filters.maxPrice;
      }
    }

    // Units range filter
    if (filters.minUnits !== undefined || filters.maxUnits !== undefined) {
      query.totalUnits = {};
      if (filters.minUnits !== undefined) {
        query.totalUnits.$gte = filters.minUnits;
      }
      if (filters.maxUnits !== undefined) {
        query.totalUnits.$lte = filters.maxUnits;
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder;

    // Execute query with pagination
    const [projects, totalCount] = await Promise.all([
      Project.find(query)
        .select({
          id: 1,
          slug: 1,
          name: 1,
          location: 1,
          locationSlug: 1,
          type: 1,
          status: 1,
          statusSlug: 1,
          developer: 1,
          developerSlug: 1,
          price: 1,
          priceNumeric: 1,
          image: 1,
          description: 1,
          overview: 1,
          completionDate: 1,
          launchDate: 1,
          totalUnits: 1,
          amenities: 1,
          unitTypes: 1,
          gallery: 1,
          paymentPlan: 1,
          locationDetails: 1,
          categories: 1,
          featured: 1,
          registrationOpen: 1,
          flags: 1,
          isActive: 1,
          tags: 1,
          createdAt: 1,
          updatedAt: 1,
          createdBy: 1,
          updatedBy: 1,
          version: 1
        })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Project.countDocuments(query)
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Get summary statistics
    const stats = await Project.aggregate([
      { $match: { isActive: true } }, // Only active projects for stats
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          elite: {
            $sum: {
              $cond: [{ $eq: ["$flags.elite", true] }, 1, 0]
            }
          },
          featured: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$flags.featured", true] },
                    { $eq: ["$featured", true] }
                  ]
                },
                1,
                0
              ]
            }
          },
          launched: {
            $sum: {
              $cond: [
                {
                  $in: ["$status", ["Launched", "Launching Soon", "Pre-Launch"]]
                },
                1,
                0
              ]
            }
          },
          completed: {
            $sum: {
              $cond: [
                {
                  $in: ["$status", ["Completed", "Ready to Move"]]
                },
                1,
                0
              ]
            }
          },
          totalValue: { 
            $sum: "$priceNumeric" 
          },
          avgUnits: { 
            $avg: "$totalUnits" 
          }
        }
      }
    ]);

    const summary = stats[0] || {
      total: 0,
      elite: 0,
      featured: 0,
      launched: 0,
      completed: 0,
      totalValue: 0,
      avgUnits: 0
    };

    // Get distinct filter values for dropdowns
    const filterOptions = await Promise.all([
      Project.distinct("location", { isActive: true }),
      Project.distinct("developer", { isActive: true }),
      Project.distinct("type", { isActive: true }),
      Project.distinct("status", { isActive: true })
    ]);


    // Return success response with audit metadata
    return NextResponse.json(
      {
        success: true,
        data: {
          projects,
          pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            limit,
            hasNextPage,
            hasPrevPage
          },
          summary,
          filters: {
            tab,
            sortBy,
            sortOrder: sortOrder === 1 ? "asc" : "desc",
            appliedFilters: filters,
            filterOptions: {
              locations: (filterOptions[0] as string[]).sort(),
              developers: (filterOptions[1] as string[]).sort(),
              types: (filterOptions[2] as string[]).sort(),
              statuses: (filterOptions[3] as string[]).sort()
            }
          }
        },
        meta: {
          accessedBy: user.firebaseUid,
          accessedAt: new Date().toISOString(),
          userRole: user.fullRole,
          permissions: user.collectionPermissions?.find((p: { collection: string; }) => p.collection === 'projects')?.subRole || 'default'
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Error fetching projects:", error);

    // Generic server error
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
