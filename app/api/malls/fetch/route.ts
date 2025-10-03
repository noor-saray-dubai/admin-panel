// app/api/malls/fetch/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Mall from "@/models/malls";
import { withCollectionPermission } from "@/lib/auth/server";
import { Collection, Action } from "@/types/user";
import { rateLimit } from "@/lib/rate-limiter";

// Force Node.js runtime
export const runtime = "nodejs";

interface MallFilters {
  search?: string;
  location?: string;
  status?: string;
  ownership?: string;
  saleStatus?: string;
  verified?: boolean;
  isOperational?: boolean;
  minPrice?: number;
  maxPrice?: number;
  minCapRate?: number;
  maxCapRate?: number;
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
    const filters: MallFilters = {
      search: url.searchParams.get("search") || undefined,
      location: url.searchParams.get("location") || undefined,
      status: url.searchParams.get("status") || undefined,
      ownership: url.searchParams.get("ownership") || undefined,
      saleStatus: url.searchParams.get("saleStatus") || undefined,
      verified: url.searchParams.get("verified") === "true" ? true : 
                url.searchParams.get("verified") === "false" ? false : undefined,
      isOperational: url.searchParams.get("isOperational") === "true" ? true :
                    url.searchParams.get("isOperational") === "false" ? false : undefined,
      minPrice: url.searchParams.get("minPrice") ? parseFloat(url.searchParams.get("minPrice")!) : undefined,
      maxPrice: url.searchParams.get("maxPrice") ? parseFloat(url.searchParams.get("maxPrice")!) : undefined,
      minCapRate: url.searchParams.get("minCapRate") ? parseFloat(url.searchParams.get("minCapRate")!) : undefined,
      maxCapRate: url.searchParams.get("maxCapRate") ? parseFloat(url.searchParams.get("maxCapRate")!) : undefined,
    };

    // Build MongoDB query
    const query: any = {};

    // Tab-based filtering
    switch (tab) {
      case "available":
        query["saleInformation.saleStatus"] = "available";
        query.isActive = true;
        break;
      case "operational":
        query.isOperational = true;
        break;
      case "sold":
        query["saleInformation.saleStatus"] = "sold";
        break;
      case "verified":
        query.verified = true;
        break;
      case "draft":
        query.verified = false;
        break;
      // "all" case doesn't add filters
    }

    // Apply additional filters
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { subtitle: { $regex: filters.search, $options: "i" } },
        { location: { $regex: filters.search, $options: "i" } },
        { subLocation: { $regex: filters.search, $options: "i" } },
        { mallId: { $regex: filters.search, $options: "i" } }
      ];
    }

    if (filters.location) {
      query.location = { $regex: filters.location, $options: "i" };
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.ownership) {
      query.ownership = filters.ownership;
    }

    if (filters.saleStatus) {
      query["saleInformation.saleStatus"] = filters.saleStatus;
    }

    if (filters.verified !== undefined) {
      query.verified = filters.verified;
    }

    if (filters.isOperational !== undefined) {
      query.isOperational = filters.isOperational;
    }

    // Price range filter
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query["price.totalNumeric"] = {};
      if (filters.minPrice !== undefined) {
        query["price.totalNumeric"].$gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        query["price.totalNumeric"].$lte = filters.maxPrice;
      }
    }

    // Cap rate range filter
    if (filters.minCapRate !== undefined || filters.maxCapRate !== undefined) {
      query["financials.capRate"] = {};
      if (filters.minCapRate !== undefined) {
        query["financials.capRate"].$gte = filters.minCapRate;
      }
      if (filters.maxCapRate !== undefined) {
        query["financials.capRate"].$lte = filters.maxCapRate;
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder;

    // Execute query with pagination
    const [malls, totalCount] = await Promise.all([
      Mall.find(query)
        .select({
          mallId: 1,
          slug: 1,
          name: 1,
          subtitle: 1,
          status: 1,
          location: 1,
          subLocation: 1,
          ownership: 1,
          price: 1,
          size: 1,
          rentalDetails: 1,
          financials: 1,
          saleInformation: 1,
          image: 1,
          verified: 1,
          isActive: 1,
          isAvailable: 1,
          isOperational: 1,
          createdAt: 1,
          updatedAt: 1,
          createdBy: 1,
          updatedBy: 1,
        })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Mall.countDocuments(query)
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Get summary statistics
    const stats = await Mall.aggregate([
      { $match: {} }, // No filters for stats
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          available: {
            $sum: {
              $cond: [
                { $eq: ["$saleInformation.saleStatus", "available"] },
                1,
                0
              ]
            }
          },
          operational: {
            $sum: {
              $cond: [{ $eq: ["$isOperational", true] }, 1, 0]
            }
          },
          sold: {
            $sum: {
              $cond: [
                { $eq: ["$saleInformation.saleStatus", "sold"] },
                1,
                0
              ]
            }
          },
          verified: {
            $sum: {
              $cond: [{ $eq: ["$verified", true] }, 1, 0]
            }
          },
          totalValue: { 
            $sum: "$price.totalNumeric" 
          },
          avgCapRate: { 
            $avg: "$financials.capRate" 
          }
        }
      }
    ]);

    const summary = stats[0] || {
      total: 0,
      available: 0,
      operational: 0,
      sold: 0,
      verified: 0,
      totalValue: 0,
      avgCapRate: 0
    };

    // Get distinct filter values for dropdowns
    const filterOptions = await Promise.all([
      Mall.distinct("location", { isActive: true }),
      Mall.distinct("status", { isActive: true }),
      Mall.distinct("ownership", { isActive: true }),
      Mall.distinct("saleInformation.saleStatus", { isActive: true })
    ]);

    // Return success response with audit metadata
    return NextResponse.json(
      {
        success: true,
        data: {
          malls,
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
              statuses: (filterOptions[1] as string[]).sort(),
              ownerships: (filterOptions[2] as string[]).sort(),
              saleStatuses: (filterOptions[3] as string[]).sort()
            }
          }
        },
        meta: {
          accessedBy: user.firebaseUid,
          accessedAt: new Date().toISOString(),
          userRole: user.fullRole,
          permissions: user.collectionPermissions?.find((p: { collection: string; }) => p.collection === 'malls')?.subRole || 'default'
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Error fetching malls:", error);

    // Generic server error
    return NextResponse.json(
      { 
        success: false, 
        message: "An unexpected error occurred while fetching malls", 
        error: "INTERNAL_ERROR" 
      },
      { status: 500 }
    );
  }
}

// Export with ZeroTrust collection permission validation
export const GET = withCollectionPermission(Collection.MALLS, Action.VIEW)(handler);
