// app/api/buildings/fetch/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Building from "@/models/buildings";
import { withCollectionPermission } from "@/lib/auth/server";
import { Collection, Action } from "@/types/user";
import { rateLimit } from "@/lib/rate-limiter";

// Force Node.js runtime
export const runtime = "nodejs";

interface BuildingFilters {
  search?: string;
  location?: string;
  category?: string;
  type?: string;
  status?: string;
  verified?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  minFloors?: number;
  maxFloors?: number;
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
    // Ensure page is at least 1 to prevent negative or zero skip values
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100); // Max 100 per page
    const tab = url.searchParams.get("tab") || "all";
    const sortBy = url.searchParams.get("sortBy") || "updatedAt";
    const sortOrder = url.searchParams.get("sortOrder") === "asc" ? 1 : -1;

    // Parse filters
    const filters: BuildingFilters = {
      search: url.searchParams.get("search") || undefined,
      location: url.searchParams.get("location") || undefined,
      category: url.searchParams.get("category") || undefined,
      type: url.searchParams.get("type") || undefined,
      status: url.searchParams.get("status") || undefined,
      verified: url.searchParams.get("verified") === "true" ? true : 
                url.searchParams.get("verified") === "false" ? false : undefined,
      isActive: url.searchParams.get("isActive") === "true" ? true :
                url.searchParams.get("isActive") === "false" ? false : undefined,
      isFeatured: url.searchParams.get("isFeatured") === "true" ? true :
                  url.searchParams.get("isFeatured") === "false" ? false : undefined,
      minPrice: url.searchParams.get("minPrice") ? parseFloat(url.searchParams.get("minPrice")!) : undefined,
      maxPrice: url.searchParams.get("maxPrice") ? parseFloat(url.searchParams.get("maxPrice")!) : undefined,
      minFloors: url.searchParams.get("minFloors") ? parseInt(url.searchParams.get("minFloors")!) : undefined,
      maxFloors: url.searchParams.get("maxFloors") ? parseInt(url.searchParams.get("maxFloors")!) : undefined,
    };

    // Build MongoDB query
    const query: any = {};

    // Tab-based filtering
    switch (tab) {
      case "residential":
        query.category = "residential";
        query.isActive = true;
        break;
      case "commercial":
        query.category = "commercial";
        query.isActive = true;
        break;
      case "mixed":
        query.category = "mixed";
        query.isActive = true;
        break;
      case "forSale":
        query["saleInformation.isForSale"] = true;
        query.isActive = true;
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
        { buildingId: { $regex: filters.search, $options: "i" } },
        { type: { $regex: filters.search, $options: "i" } },
        { description: { $regex: filters.search, $options: "i" } }
      ];
    }

    if (filters.location) {
      query.location = { $regex: filters.location, $options: "i" };
    }

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.type) {
      query.type = { $regex: filters.type, $options: "i" };
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.verified !== undefined) {
      query.verified = filters.verified;
    }

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    if (filters.isFeatured !== undefined) {
      query.isFeatured = filters.isFeatured;
    }

    // Price range filter
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query["price.valueNumeric"] = {};
      if (filters.minPrice !== undefined) {
        query["price.valueNumeric"].$gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        query["price.valueNumeric"].$lte = filters.maxPrice;
      }
    }

    // Floors range filter
    if (filters.minFloors !== undefined || filters.maxFloors !== undefined) {
      query["dimensions.floors"] = {};
      if (filters.minFloors !== undefined) {
        query["dimensions.floors"].$gte = filters.minFloors;
      }
      if (filters.maxFloors !== undefined) {
        query["dimensions.floors"].$lte = filters.maxFloors;
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder;

    // Execute query with pagination
    const [buildings, totalCount] = await Promise.all([
      Building.find(query)
        .select({
          buildingId: 1,
          slug: 1,
          name: 1,
          subtitle: 1,
          location: 1,
          subLocation: 1,
          category: 1,
          type: 1,
          status: 1,
          price: 1,
          priceRange: 1,
          dimensions: 1,
          year: 1,
          yearBuilt: 1,
          totalUnits: 1,
          availableUnits: 1,
          amenities: 1,
          features: 1,
          highlights: 1,
          financials: 1,
          saleInformation: 1,
          mainImage: 1,
          gallery: 1,
          locationDetails: 1,
          developer: 1,
          rating: 1,
          sustainabilityRating: 1,
          architecture: 1,
          description: 1,
          verified: 1,
          isActive: 1,
          isFeatured: 1,
          createdAt: 1,
          updatedAt: 1,
          createdBy: 1,
          updatedBy: 1,
        })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Building.countDocuments(query)
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Get summary statistics
    const [avgPrice, maxPrice, totalBuildings] = await Promise.all([
      Building.aggregate([
        { $match: { "price.valueNumeric": { $gt: 0 } } },
        { $group: { _id: null, avgPrice: { $avg: "$price.valueNumeric" } } }
      ]).then(result => result[0]?.avgPrice || 0),
      Building.aggregate([
        { $group: { _id: null, maxPrice: { $max: "$price.valueNumeric" } } }
      ]).then(result => result[0]?.maxPrice || 0),
      Building.countDocuments({ isActive: true })
    ]);

    // Get distinct filter values for dropdowns
    const filterOptions = await Promise.all([
      Building.distinct("location", { isActive: true }),
      Building.distinct("category", { isActive: true }),
      Building.distinct("type", { isActive: true }),
      Building.distinct("status", { isActive: true })
    ]);

    // Return success response with audit metadata
    return NextResponse.json(
      {
        success: true,
        data: {
          buildings,
          pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            limit,
            hasNextPage,
            hasPrevPage
          },
          statistics: {
            avgPrice: Math.round(avgPrice),
            maxPrice,
            totalActiveBuildings: totalBuildings
          },
          filters: {
            tab,
            sortBy,
            sortOrder: sortOrder === 1 ? "asc" : "desc",
            appliedFilters: filters,
            filterOptions: {
              locations: (filterOptions[0] as string[]).sort(),
              categories: (filterOptions[1] as string[]).sort(),
              types: (filterOptions[2] as string[]).sort(),
              statuses: (filterOptions[3] as string[]).sort()
            }
          }
        },
        meta: {
          accessedBy: user.firebaseUid,
          accessedAt: new Date().toISOString(),
          userRole: user.fullRole,
          permissions: user.collectionPermissions?.find((p: { collection: string; }) => p.collection === 'buildings')?.subRole || 'default'
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Error fetching buildings:", error);

    // Generic server error
    return NextResponse.json(
      { 
        success: false, 
        message: "An unexpected error occurred while fetching buildings", 
        error: "INTERNAL_ERROR" 
      },
      { status: 500 }
    );
  }
}

// Export with ZeroTrust collection permission validation

export const GET = withCollectionPermission(Collection.BUILDINGS, Action.VIEW)(handler);
