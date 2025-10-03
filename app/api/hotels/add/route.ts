// app/api/hotels/add/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Hotel from "@/models/hotels";
import { withAuth } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limiter";
import { validateHotelFormData, sanitizeHotelData } from "@/lib/hotel-validation";
import { AuditLog, AuditAction, AuditLevel } from "@/models/auditLog";
import type { HotelFormData } from "@/types/hotels";

// Force Node.js runtime
export const runtime = "nodejs";

// Generate unique hotel ID
async function generateHotelId(): Promise<string> {
  const latestHotel = await Hotel.findOne({}, {}, { sort: { 'hotelId': -1 } });
  
  if (!latestHotel?.hotelId) {
    return "HOTEL_001";
  }
  
  const currentNumber = parseInt(latestHotel.hotelId.split('_')[1]);
  const nextNumber = currentNumber + 1;
  return `HOTEL_${nextNumber.toString().padStart(3, '0')}`;
}

// Generate URL-friendly slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Remove duplicate hyphens
}

// Update hotel slugs for consistency
async function updateHotelSlugs(hotelData: any, hotelId: string) {
  const baseSlug = generateSlug(hotelData.name);
  
  // Check if slug exists
  const existingHotel = await Hotel.findOne({ slug: baseSlug });
  let slug = baseSlug;
  
  if (existingHotel) {
    // Generate unique slug by appending number
    let counter = 1;
    while (true) {
      const testSlug = `${baseSlug}-${counter}`;
      const exists = await Hotel.findOne({ slug: testSlug });
      if (!exists) {
        slug = testSlug;
        break;
      }
      counter++;
    }
  }
  
  return {
    slug,
    hotelId
  };
}

/**
 * Main POST handler with authentication
 */
export const POST = withAuth(async (request: NextRequest, { user, audit }) => {
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

    // Parse JSON data
    const hotelData: HotelFormData = await request.json();
    
    // Check if any data was provided
    if (Object.keys(hotelData).length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: "No hotel data provided. Please include hotel information.", 
          error: "EMPTY_DATA",
          details: "Request body cannot be empty. Please provide hotel data."
        },
        { status: 400 }
      );
    }

    // Sanitize data
    const sanitizedData = sanitizeHotelData(hotelData);

    // Validate hotel data with shared validation
    const validation = validateHotelFormData(sanitizedData);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Hotel data validation failed", 
          errors: validation.errors,
          warnings: validation.warnings,
          error: "VALIDATION_ERROR"
        },
        { status: 400 }
      );
    }

    // Generate unique IDs
    const hotelId = await generateHotelId();
    const slugs = await updateHotelSlugs(sanitizedData, hotelId);

    // Handle image URLs - use provided URLs directly
    const mainImageUrl = hotelData.mainImage;
    const galleryUrls = hotelData.gallery || [];
    const floorPlanUrl = hotelData.floorPlan;

    // Clean up mortgage details - remove if empty
    if (sanitizedData.legalDetails?.mortgageDetails) {
      const mortgageDetails = sanitizedData.legalDetails.mortgageDetails;
      const hasLender = mortgageDetails.lender && mortgageDetails.lender.trim().length > 0;
      const hasOutstandingAmount = mortgageDetails.outstandingAmount !== undefined && mortgageDetails.outstandingAmount !== null && mortgageDetails.outstandingAmount > 0;
      const hasMaturityDate = mortgageDetails.maturityDate !== undefined && mortgageDetails.maturityDate !== null;
      
      // If no meaningful mortgage data is provided, remove the entire mortgageDetails object
      if (!hasLender && !hasOutstandingAmount && !hasMaturityDate) {
        console.log('Removing empty mortgage details object');
        delete sanitizedData.legalDetails.mortgageDetails;
      }
    }

    // Create new hotel document
    const newHotel = new Hotel({
      ...sanitizedData,
      hotelId: slugs.hotelId,
      slug: slugs.slug,
      mainImage: mainImageUrl,
      gallery: galleryUrls,
      floorPlan: floorPlanUrl,
      createdBy: audit.email,
      updatedBy: audit.email,
    });

    // Save to database
    const savedHotel = await newHotel.save();

    // Create audit log entry for successful hotel creation
    AuditLog.createLog({
      action: AuditAction.CONTENT_CREATED,
      level: AuditLevel.INFO,
      userId: user.uid,
      userEmail: user.email,
      ip: audit.ipAddress || 'unknown',
      userAgent: audit.userAgent,
      resource: 'hotel',
      resourceId: savedHotel.hotelId,
      details: {
        hotelId: savedHotel.hotelId,
        name: savedHotel.name,
        slug: savedHotel.slug,
        location: savedHotel.location,
        subLocation: savedHotel.subLocation,
        type: savedHotel.type,
        totalRooms: savedHotel.totalRooms,
        totalSuites: savedHotel.totalSuites,
        price: savedHotel.price,
        verified: savedHotel.verified,
        isActive: savedHotel.isActive,
        isAvailable: savedHotel.isAvailable,
        operation: 'create'
      },
      success: true
    });

    // Log successful creation
    console.log(`Hotel created successfully by ${user.email}:`, {
      id: savedHotel._id,
      hotelId: savedHotel.hotelId,
      name: savedHotel.name,
      slug: savedHotel.slug,
      location: savedHotel.location
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Hotel created successfully",
        warnings: validation.warnings,
        hotel: {
          id: savedHotel._id,
          hotelId: savedHotel.hotelId,
          name: savedHotel.name,
          subtitle: savedHotel.subtitle,
          slug: savedHotel.slug,
          type: savedHotel.type,
          location: savedHotel.location,
          subLocation: savedHotel.subLocation,
          price: savedHotel.price,
          dimensions: savedHotel.dimensions,
          year: savedHotel.year,
          yearBuilt: savedHotel.yearBuilt,
          yearOpened: savedHotel.yearOpened,
          totalRooms: savedHotel.totalRooms,
          totalSuites: savedHotel.totalSuites,
          roomsSuites: savedHotel.roomsSuites,
          dining: savedHotel.dining,
          wellness: savedHotel.wellness,
          meetings: savedHotel.meetings,
          amenities: savedHotel.amenities,
          features: savedHotel.features,
          facts: savedHotel.facts,
          financials: savedHotel.financials,
          saleInformation: savedHotel.saleInformation,
          legalDetails: savedHotel.legalDetails,
          operationalDetails: savedHotel.operationalDetails,
          marketingMaterials: savedHotel.marketingMaterials,
          investorRelations: savedHotel.investorRelations,
          mainImage: savedHotel.mainImage,
          gallery: savedHotel.gallery,
          floorPlan: savedHotel.floorPlan,
          locationDetails: savedHotel.locationDetails,
          developer: savedHotel.developer,
          currentOwner: savedHotel.currentOwner,
          rating: savedHotel.rating,
          customerRating: savedHotel.customerRating,
          occupancyRate: savedHotel.occupancyRate,
          architecture: savedHotel.architecture,
          description: savedHotel.description,
          status: savedHotel.status,
          verified: savedHotel.verified,
          isActive: savedHotel.isActive,
          isAvailable: savedHotel.isAvailable,
          createdAt: savedHotel.createdAt,
          createdBy: savedHotel.createdBy
        },
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Error creating hotel:", error);

    // Handle specific error types
    if (error.name === "ValidationError") {
      return NextResponse.json(
        {
          success: false,
          message: "Database validation error",
          errors: Object.values(error.errors).map((err: any) => err.message),
          error: "DB_VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const message = field === 'hotelId' 
        ? "Hotel ID already exists" 
        : field === 'slug'
        ? "Hotel with this name already exists"
        : "Duplicate entry error";
      
      return NextResponse.json(
        {
          success: false,
          message,
          error: "DUPLICATE_ENTRY",
        },
        { status: 409 }
      );
    }

    // Generic server error
    return NextResponse.json(
      { 
        success: false, 
        message: "An unexpected error occurred", 
        error: "INTERNAL_ERROR" 
      },
      { status: 500 }
    );
  }
});