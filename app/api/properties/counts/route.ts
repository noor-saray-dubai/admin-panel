import { NextRequest, NextResponse } from "next/server";
import Property from "@/models/properties";
import { connectToDatabase } from "@/lib/db";
import { withCollectionPermission } from "@/lib/auth/server";
import { Collection, Action } from "@/types/user";

export const runtime = "nodejs";

// GET - Get property counts and statistics
async function handler(request: NextRequest) {
  const user = (request as any).user;
  
  try {
    await connectToDatabase();

    // Execute all count queries in parallel for better performance
    const [
      total,
      active,
      ready,
      offplan,
      featured,
      elite,
      exclusive,
      highValue,
      primary,
      secondary,
      // Property type counts
      apartments,
      villas,
      penthouses,
      condos,
      townhouses,
      studios,
      duplexes,
      lofts,
      // Bedroom counts
      studio_br,
      oneBr,
      twoBr,
      threeBr,
      fourBr,
      fivePlusBr,
      // Furnishing status counts
      furnished,
      semiFurnished,
      unfurnished,
      // Recent properties (last 30 days)
      recentCount,
      // Value segments
      affordable,
      midRange,
      luxury,
      ultraLuxury
    ] = await Promise.all([
      // Basic counts
      Property.countDocuments({}),
      Property.countDocuments({ isActive: true }),
      Property.countDocuments({ isActive: true, availabilityStatus: 'Ready' }),
      Property.countDocuments({ isActive: true, availabilityStatus: 'Offplan' }),
      
      // Flag-based counts
      Property.countDocuments({ isActive: true, 'flags.featured': true }),
      Property.countDocuments({ isActive: true, 'flags.elite': true }),
      Property.countDocuments({ isActive: true, 'flags.exclusive': true }),
      Property.countDocuments({ isActive: true, 'flags.highValue': true }),
      
      // Ownership type counts
      Property.countDocuments({ isActive: true, ownershipType: 'Primary' }),
      Property.countDocuments({ isActive: true, ownershipType: 'Secondary' }),
      
      // Property type counts
      Property.countDocuments({ isActive: true, propertyType: 'Apartment' }),
      Property.countDocuments({ isActive: true, propertyType: 'Villa' }),
      Property.countDocuments({ isActive: true, propertyType: 'Penthouse' }),
      Property.countDocuments({ isActive: true, propertyType: 'Condo' }),
      Property.countDocuments({ isActive: true, propertyType: 'Townhouse' }),
      Property.countDocuments({ isActive: true, propertyType: 'Studio' }),
      Property.countDocuments({ isActive: true, propertyType: 'Duplex' }),
      Property.countDocuments({ isActive: true, propertyType: 'Loft' }),
      
      // Bedroom counts
      Property.countDocuments({ isActive: true, bedrooms: 0 }),
      Property.countDocuments({ isActive: true, bedrooms: 1 }),
      Property.countDocuments({ isActive: true, bedrooms: 2 }),
      Property.countDocuments({ isActive: true, bedrooms: 3 }),
      Property.countDocuments({ isActive: true, bedrooms: 4 }),
      Property.countDocuments({ isActive: true, bedrooms: { $gte: 5 } }),
      
      // Furnishing status counts
      Property.countDocuments({ isActive: true, furnishingStatus: 'Fully Furnished' }),
      Property.countDocuments({ isActive: true, furnishingStatus: 'Semi-Furnished' }),
      Property.countDocuments({ isActive: true, furnishingStatus: 'Unfurnished' }),
      
      // Recent properties
      Property.countDocuments({ 
        isActive: true, 
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
      }),
      
      // Value segments (in AED)
      Property.countDocuments({ isActive: true, priceNumeric: { $lt: 500000 } }), // < 500K
      Property.countDocuments({ isActive: true, priceNumeric: { $gte: 500000, $lt: 2000000 } }), // 500K - 2M
      Property.countDocuments({ isActive: true, priceNumeric: { $gte: 2000000, $lt: 10000000 } }), // 2M - 10M
      Property.countDocuments({ isActive: true, priceNumeric: { $gte: 10000000 } }) // 10M+
    ]);

    // Get top locations (areas) with property counts
    const topLocations = await Property.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$location.area', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { area: '$_id', count: 1, _id: 0 } }
    ]);

    // Get price statistics
    const priceStats = await Property.aggregate([
      { $match: { isActive: true, availabilityStatus: 'Ready' } },
      {
        $group: {
          _id: null,
          avgPrice: { $avg: '$priceNumeric' },
          minPrice: { $min: '$priceNumeric' },
          maxPrice: { $max: '$priceNumeric' },
          medianPrice: { $push: '$priceNumeric' }
        }
      }
    ]);

    // Calculate median price
    let medianPrice = 0;
    if (priceStats.length > 0 && priceStats[0].medianPrice.length > 0) {
      const sorted = priceStats[0].medianPrice.sort((a: number, b: number) => a - b);
      const mid = Math.floor(sorted.length / 2);
      medianPrice = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    // Get monthly trend (last 6 months)
    const monthlyTrend = await Property.aggregate([
      {
        $match: {
          isActive: true,
          createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          month: '$_id.month',
          year: '$_id.year',
          count: 1,
          _id: 0
        }
      }
    ]);

    // Build comprehensive response
    const counts = {
      // Overview
      total,
      active,
      inactive: total - active,
      recent: recentCount,
      
      // Availability status
      availability: {
        ready,
        offplan,
        readyRate: active > 0 ? Math.round((ready / active) * 100) : 0
      },
      
      // Property flags
      flags: {
        featured,
        elite,
        exclusive,
        highValue
      },
      
      // Ownership types
      ownership: {
        primary,
        secondary,
        primaryPercent: active > 0 ? Math.round((primary / active) * 100) : 0,
        secondaryPercent: active > 0 ? Math.round((secondary / active) * 100) : 0
      },
      
      // Property types
      propertyTypes: {
        apartment: apartments,
        villa: villas,
        penthouse: penthouses,
        condo: condos,
        townhouse: townhouses,
        studio: studios,
        duplex: duplexes,
        loft: lofts
      },
      
      // Bedrooms distribution
      bedrooms: {
        studio: studio_br,
        oneBedroom: oneBr,
        twoBedroom: twoBr,
        threeBedroom: threeBr,
        fourBedroom: fourBr,
        fivePlusBedroom: fivePlusBr
      },
      
      // Furnishing status
      furnishing: {
        furnished,
        semiFurnished,
        unfurnished
      },
      
      // Value segments
      valueSegments: {
        affordable: { count: affordable, label: 'Under 500K AED' },
        midRange: { count: midRange, label: '500K - 2M AED' },
        luxury: { count: luxury, label: '2M - 10M AED' },
        ultraLuxury: { count: ultraLuxury, label: '10M+ AED' }
      },
      
      // Location insights
      topLocations,
      
      // Price statistics
      priceStats: {
        average: priceStats.length > 0 ? Math.round(priceStats[0].avgPrice || 0) : 0,
        median: Math.round(medianPrice),
        minimum: priceStats.length > 0 ? priceStats[0].minPrice || 0 : 0,
        maximum: priceStats.length > 0 ? priceStats[0].maxPrice || 0 : 0
      },
      
      // Monthly trend
      monthlyTrend,
      
      // Metadata
      lastUpdated: new Date().toISOString(),
      updatedBy: user.email
    };

    console.log(`Property counts fetched by ${user.email}: ${total} total properties`);

    return NextResponse.json({
      success: true,
      counts,
      summary: {
        total,
        active,
        ready,
        featured,
        recent: recentCount
      }
    });

  } catch (error: any) {
    console.error("Error fetching property counts:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch property counts",
        error: "COUNTS_ERROR",
        errors: { general: ["An error occurred while fetching property statistics"] }
      },
      { status: 500 }
    );
  }
}

// Export with ZeroTrust collection permission validation
export const GET = withCollectionPermission(Collection.PROPERTIES, Action.VIEW)(handler);
