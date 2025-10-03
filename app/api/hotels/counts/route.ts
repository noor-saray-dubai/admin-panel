// app/api/hotels/counts/route.ts

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

    // Perform aggregation to get counts efficiently in a single query
    const aggregationPipeline = [
      {
        $facet: {
          total: [
            { $match: { isActive: true } },
            { $count: "count" }
          ],
          operational: [
            { 
              $match: { 
                status: "Operational",
                verified: true,
                isActive: true 
              } 
            },
            { $count: "count" }
          ],
          luxury: [
            {
              $match: {
                $and: [
                  { isActive: true },
                  { verified: true },
                  {
                    $or: [
                      { rating: { $gte: 5 } },
                      { 'operationalDetails.serviceStandard': { $in: ['5-Star', '6-Star', '7-Star', 'Luxury', 'Ultra-Luxury'] } }
                    ]
                  }
                ]
              }
            },
            { $count: "count" }
          ],
          ultraLuxury: [
            {
              $match: {
                $and: [
                  { isActive: true },
                  { verified: true },
                  {
                    $or: [
                      { rating: { $gte: 6 } },
                      { 'operationalDetails.serviceStandard': { $in: ['6-Star', '7-Star', 'Ultra-Luxury'] } }
                    ]
                  }
                ]
              }
            },
            { $count: "count" }
          ],
          forSale: [
            {
              $match: {
                'saleInformation.saleStatus': 'available',
                verified: true,
                isActive: true,
                isAvailable: true
              }
            },
            { $count: "count" }
          ],
          verified: [
            {
              $match: {
                verified: true,
                isActive: true
              }
            },
            { $count: "count" }
          ]
        }
      }
    ];

    const [result] = await Hotel.aggregate(aggregationPipeline);

    // Extract counts from aggregation result
    const counts = {
      total: result.total[0]?.count || 0,
      operational: result.operational[0]?.count || 0,
      luxury: result.luxury[0]?.count || 0,
      ultraLuxury: result.ultraLuxury[0]?.count || 0,
      forSale: result.forSale[0]?.count || 0,
      verified: result.verified[0]?.count || 0
    };

    return NextResponse.json({
      success: true,
      counts
    });

  } catch (error: any) {
    console.error("Error fetching hotel counts:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch hotel counts",
        error: "COUNTS_ERROR"
      },
      { status: 500 }
    );
  }
});