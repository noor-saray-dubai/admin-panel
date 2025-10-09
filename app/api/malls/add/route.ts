// app/api/malls/add/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Mall from "@/models/malls";
import { withCollectionPermission } from "@/lib/auth/server";
import { Collection, Action } from "@/types/user";
import { rateLimit } from "@/lib/rate-limiter";
import { validateMallData, sanitizeMallData } from "@/lib/mall-validation";
import type { MallFormData } from "@/types/mall";

// Force Node.js runtime
export const runtime = "nodejs";

// Generate unique mall ID
async function generateMallId(): Promise<string> {
  const latestMall = await Mall.findOne({}, {}, { sort: { 'mallId': -1 } });
  
  if (!latestMall?.mallId) {
    return "MALL_001";
  }
  
  const currentNumber = parseInt(latestMall.mallId.split('_')[1]);
  const nextNumber = currentNumber + 1;
  return `MALL_${nextNumber.toString().padStart(3, '0')}`;
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

// Update mall slugs for consistency
async function updateMallSlugs(mallData: any, mallId: string) {
  const baseSlug = generateSlug(mallData.name);
  
  // Check if slug exists
  const existingMall = await Mall.findOne({ slug: baseSlug });
  let slug = baseSlug;
  
  if (existingMall) {
    // Generate unique slug by appending number
    let counter = 1;
    while (true) {
      const testSlug = `${baseSlug}-${counter}`;
      const exists = await Mall.findOne({ slug: testSlug });
      if (!exists) {
        slug = testSlug;
        break;
      }
      counter++;
    }
  }
  
  return {
    slug,
    mallId
  };
}

/**
 * Main POST handler with ZeroTrust authentication
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

    // Parse JSON data
    const mallData: MallFormData = await request.json();
    
    // Check if any data was provided
    if (Object.keys(mallData).length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: "No mall data provided. Please include mall information.", 
          error: "EMPTY_DATA",
          details: "Request body cannot be empty. Please provide mall data."
        },
        { status: 400 }
      );
    }

    // Sanitize data
    const sanitizedData = sanitizeMallData(mallData);

    // Validate mall data with shared validation
    const validation = validateMallData(sanitizedData);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Mall data validation failed", 
          errors: validation.fieldErrors,
          warnings: validation.warnings,
          error: "VALIDATION_ERROR"
        },
        { status: 400 }
      );
    }

    // Generate unique IDs
    const mallId = await generateMallId();
    const slugs = await updateMallSlugs(sanitizedData, mallId);

    // Handle image URLs - use provided URLs directly
    const coverImageUrl = mallData.image;
    const galleryUrls = mallData.gallery || [];
    const floorPlanUrl = mallData.floorPlan;

    // Auto-calculate area conversions if needed
    if (sanitizedData.size?.totalArea && !sanitizedData.size.totalSqm) {
      sanitizedData.size.totalSqm = Math.round(sanitizedData.size.totalArea * 0.092903 * 100) / 100;
    }
    if (sanitizedData.size?.retailArea && !sanitizedData.size.retailSqm) {
      sanitizedData.size.retailSqm = Math.round(sanitizedData.size.retailArea * 0.092903 * 100) / 100;
    }

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

    // Client-side validation handles rental calculations

    // Create new mall document
    const newMall = new Mall({
      ...sanitizedData,
      mallId: slugs.mallId,
      slug: slugs.slug,
      image: coverImageUrl,
      gallery: galleryUrls,
      floorPlan: floorPlanUrl,
      // Rich audit data matching schema requirements
      createdBy: {
        email: user.email,
        timestamp: new Date(),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      },
      updatedBy: {
        email: user.email,
        timestamp: new Date(),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      },
      version: 1,
      isActive: sanitizedData.isActive !== undefined ? sanitizedData.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Save to database
    const savedMall = await newMall.save();

    // Log successful creation
    console.log(`Mall created successfully by ${user.email}:`, {
      id: savedMall._id,
      mallId: savedMall.mallId,
      name: savedMall.name,
      slug: savedMall.slug,
      location: savedMall.location
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Mall created successfully",
        warnings: validation.warnings,
        mall: {
          id: savedMall._id,
          mallId: savedMall.mallId,
          name: savedMall.name,
          subtitle: savedMall.subtitle,
          slug: savedMall.slug,
          status: savedMall.status,
          location: savedMall.location,
          subLocation: savedMall.subLocation,
          ownership: savedMall.ownership,
          price: savedMall.price,
          size: savedMall.size,
          rentalDetails: savedMall.rentalDetails,
          financials: savedMall.financials,
          saleInformation: savedMall.saleInformation,
          image: savedMall.image,
          gallery: savedMall.gallery,
          floorPlan: savedMall.floorPlan,
          verified: savedMall.verified,
          isActive: savedMall.isActive,
          isAvailable: savedMall.isAvailable,
          isOperational: savedMall.isOperational,
          createdAt: savedMall.createdAt,
          createdBy: savedMall.createdBy
        }
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Error creating mall:", error);

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
      const message = field === 'mallId' 
        ? "Mall ID already exists" 
        : field === 'slug'
        ? "Mall with this name already exists"
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
}

// Export with ZeroTrust collection permission validation
export const POST = withCollectionPermission(Collection.MALLS, Action.ADD)(handler);
