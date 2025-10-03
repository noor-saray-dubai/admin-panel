// app/api/hotels/fetch/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Hotel from "@/models/hotels";
import { withAuth } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limiter";

// Force Node.js runtime
export const runtime = "nodejs";

/**
 * Main GET handler with authentication
 */
export const GET = withAuth(async (request: NextRequest, { user, audit }) => {
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
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const tab = searchParams.get("tab") || "all";
    const search = searchParams.get("search") || "";
    const location = searchParams.get("location");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const serviceStandard = searchParams.get("serviceStandard");
    const saleStatus = searchParams.get("saleStatus");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const rating = searchParams.get("rating");

    // Build MongoDB query
    let query: any = {};

    // Tab-based filtering
    switch (tab) {
      case "operational":
        query.status = "Operational";
        query.verified = true;
        query.isActive = true;
        break;
      case "luxury":
        query.$or = [
          { rating: { $gte: 5 } },
          { 'operationalDetails.serviceStandard': { $in: ['5-Star', '6-Star', '7-Star', 'Luxury', 'Ultra-Luxury'] } }
        ];
        query.verified = true;
        query.isActive = true;
        break;
      case "ultraLuxury":
        query.$or = [
          { rating: { $gte: 6 } },
          { 'operationalDetails.serviceStandard': { $in: ['6-Star', '7-Star', 'Ultra-Luxury'] } }
        ];
        query.verified = true;
        query.isActive = true;
        break;
      case "forSale":
        query['saleInformation.saleStatus'] = 'available';
        query.verified = true;
        query.isActive = true;
        query.isAvailable = true;
        break;
      case "verified":
        query.verified = true;
        query.isActive = true;
        break;
      default:
        query.isActive = true;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { hotelId: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
        { 'operationalDetails.brandAffiliation': { $regex: search, $options: 'i' } }
      ];
    }

    // Additional filters
    if (location && location !== "all") {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { location: { $regex: location, $options: 'i' } },
          { subLocation: { $regex: location, $options: 'i' } }
        ]
      });
    }

    if (type && type !== "all") {
      query.type = { $regex: type, $options: 'i' };
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (serviceStandard && serviceStandard !== "all") {
      query['operationalDetails.serviceStandard'] = serviceStandard;
    }

    if (saleStatus && saleStatus !== "all") {
      query['saleInformation.saleStatus'] = saleStatus;
    }

    if (rating) {
      query.rating = { $gte: parseInt(rating) };
    }

    // Price range filtering
    if (minPrice || maxPrice) {
      query['price.totalNumeric'] = {};
      if (minPrice) query['price.totalNumeric'].$gte = parseInt(minPrice);
      if (maxPrice) query['price.totalNumeric'].$lte = parseInt(maxPrice);
    }

    // Count total documents
    const totalCount = await Hotel.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);
    const skip = (page - 1) * limit;

    // Fetch hotels with pagination
    const hotels = await Hotel
      .find(query)
      .select('hotelId slug name subtitle location subLocation type price dimensions year totalRooms totalSuites rating customerRating occupancyRate status verified isActive isAvailable mainImage operationalDetails.serviceStandard saleInformation.saleStatus createdAt updatedAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Build pagination info
    const paginationInfo = {
      currentPage: page,
      totalPages,
      totalCount,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };

    // Get unique filter values (for filter dropdowns)
    const [locations, types, statuses, serviceStandards, saleStatuses] = await Promise.all([
      Hotel.distinct('location', { isActive: true }),
      Hotel.distinct('type', { isActive: true }),
      Hotel.distinct('status', { isActive: true }),
      Hotel.distinct('operationalDetails.serviceStandard', { isActive: true }),
      Hotel.distinct('saleInformation.saleStatus', { isActive: true })
    ]);

    const filters = {
      locations: locations.filter(Boolean),
      types: types.filter(Boolean),
      statuses: statuses.filter(Boolean),
      serviceStandards: serviceStandards.filter(Boolean),
      saleStatuses: saleStatuses.filter(Boolean)
    };

    return NextResponse.json({
      success: true,
      data: {
        hotels,
        pagination: paginationInfo,
        filters,
        summary: {
          totalCount,
          currentTab: tab,
          appliedFilters: {
            search: search || null,
            location: location !== "all" ? location : null,
            type: type !== "all" ? type : null,
            status: status !== "all" ? status : null,
            serviceStandard: serviceStandard !== "all" ? serviceStandard : null,
            saleStatus: saleStatus !== "all" ? saleStatus : null,
            priceRange: (minPrice || maxPrice) ? { min: minPrice, max: maxPrice } : null,
            rating: rating ? parseInt(rating) : null
          }
        }
      }
    });

  } catch (error: any) {
    console.error("Error fetching hotels:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch hotels",
        error: "FETCH_ERROR"
      },
      { status: 500 }
    );
  }
});