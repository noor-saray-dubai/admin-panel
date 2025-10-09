// app/api/malls/update/[slug]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Mall from "@/models/malls";
import { withCollectionPermission } from "@/lib/auth/server";
import { Collection, Action } from "@/types/user";
import { rateLimit } from "@/lib/rate-limiter";
import { validateMallData, sanitizeMallData } from "@/lib/mall-validation";
import type { MallUpdateData } from "@/types/mall";

// Force Node.js runtime
export const runtime = "nodejs";

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
async function updateMallSlugs(mallData: any, existingMall: any) {
  const mallId = existingMall.mallId; // Keep existing mall ID
  
  // Only regenerate slug if name changed
  if (!mallData.name || mallData.name === existingMall.name) {
    return {
      slug: existingMall.slug,
      mallId
    };
  }
  
  const baseSlug = generateSlug(mallData.name);
  
  // Check if slug exists (excluding current mall)
  const existingWithSlug = await Mall.findOne({ 
    slug: baseSlug,
    _id: { $ne: existingMall._id }
  });
  
  let slug = baseSlug;
  
  if (existingWithSlug) {
    // Generate unique slug by appending number
    let counter = 1;
    while (true) {
      const testSlug = `${baseSlug}-${counter}`;
      const exists = await Mall.findOne({ 
        slug: testSlug,
        _id: { $ne: existingMall._id }
      });
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

interface RouteParams {
  params: {
    slug: string;
  };
}

/**
 * Main PUT handler with ZeroTrust authentication
 */
async function handler(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
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

    const { slug } = await params;
    
    // Find existing mall by slug
    const existingMall = await Mall.findOne({ slug });

    if (!existingMall) {
      return NextResponse.json(
        { success: false, message: "Mall not found", error: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Permission check is handled by withAuth wrapper

    // Parse JSON data
    const updateData: MallUpdateData = await request.json();
    
    // Check if any data was provided
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: "No mall data provided. Please include fields to update.", 
          error: "EMPTY_UPDATE_DATA",
          details: "Please provide at least one field to update."
        },
        { status: 400 }
      );
    }

    // Sanitize data
    const sanitizedData = sanitizeMallData(updateData);

    // Validate update data with shared validation
    const validation = validateMallData(sanitizedData, true);
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

    // Note: mallId conflicts are handled at the database level

    // Prepare merged data for slug generation
    const mergedData = { ...existingMall.toObject(), ...sanitizedData };
    
    // Generate updated slugs (assuming we have a mall-specific slug function)
    const slugs = await updateMallSlugs(mergedData, existingMall);

    // Handle image updates - use provided URLs or keep existing
    const coverImageUrl = updateData.image || existingMall.image;
    const galleryUrls = updateData.gallery || existingMall.gallery || [];
    const floorPlanUrl = updateData.floorPlan || existingMall.floorPlan;

    // Auto-calculate area conversions if total area changed
    if (sanitizedData.size?.totalArea && sanitizedData.size?.totalArea !== existingMall.size?.totalArea) {
      if (!sanitizedData.size.totalSqm) {
        sanitizedData.size.totalSqm = Math.round(sanitizedData.size.totalArea * 0.092903 * 100) / 100;
      }
    }
    if (sanitizedData.size?.retailArea && sanitizedData.size?.retailArea !== existingMall.size?.retailArea) {
      if (!sanitizedData.size.retailSqm) {
        sanitizedData.size.retailSqm = Math.round(sanitizedData.size.retailArea * 0.092903 * 100) / 100;
      }
    }

    // Clean up mortgage details - remove if empty
    if (sanitizedData.legalDetails?.mortgageDetails) {
      const mortgageDetails = sanitizedData.legalDetails.mortgageDetails;
      const hasLender = mortgageDetails.lender && mortgageDetails.lender.trim().length > 0;
      const hasOutstandingAmount = mortgageDetails.outstandingAmount !== undefined && mortgageDetails.outstandingAmount !== null && mortgageDetails.outstandingAmount > 0;
      const hasMaturityDate = mortgageDetails.maturityDate !== undefined && mortgageDetails.maturityDate !== null;
      
      // If no meaningful mortgage data is provided, remove the entire mortgageDetails object
      if (!hasLender && !hasOutstandingAmount && !hasMaturityDate) {
        console.log('Removing empty mortgage details object during update');
        delete sanitizedData.legalDetails.mortgageDetails;
      }
    }

    // Client-side validation handles rental calculations

    // Prepare update object
    const updateObject: any = {
      ...sanitizedData,
      ...slugs,
      image: coverImageUrl,
      gallery: galleryUrls,
      floorPlan: floorPlanUrl,
      // Rich audit data matching schema requirements
      updatedBy: {
        email: user.email,
        timestamp: new Date(),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      },
      updatedAt: new Date(),
    };

    // Prepare MongoDB update operations
    let mongoUpdate: any = { $set: updateObject };

    // Create a merged document to validate the final state
    const mergedDocForValidation = { ...existingMall.toObject(), ...updateObject };

    // Apply $unset operations to the merged document
    if (mongoUpdate.$unset) {
      Object.keys(mongoUpdate.$unset).forEach(field => {
        delete mergedDocForValidation[field];
      });
    }

    // Update mall (disable schema validators to avoid context issues)
    const updatedMall = await Mall.findOneAndUpdate(
      { _id: existingMall._id },
      mongoUpdate,
      { 
        new: true,
        runValidators: false  // We handle validation manually above
      }
    );

    if (!updatedMall) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Failed to update mall. Please try again.", 
          error: "UPDATE_FAILED" 
        },
        { status: 500 }
      );
    }

    // Log successful update
    console.log(`Mall updated successfully by ${user.email}:`, {
      id: updatedMall._id,
      mallId: updatedMall.mallId,
      name: updatedMall.name,
      slug: updatedMall.slug,
      location: updatedMall.location,
      changes: Object.keys(sanitizedData)
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Mall updated successfully",
        warnings: validation.warnings,
        mall: {
          id: updatedMall._id,
          mallId: updatedMall.mallId,
          name: updatedMall.name,
          subtitle: updatedMall.subtitle,
          slug: updatedMall.slug,
          status: updatedMall.status,
          location: updatedMall.location,
          subLocation: updatedMall.subLocation,
          ownership: updatedMall.ownership,
          price: updatedMall.price,
          size: updatedMall.size,
          rentalDetails: updatedMall.rentalDetails,
          financials: updatedMall.financials,
          saleInformation: updatedMall.saleInformation,
          legalDetails: updatedMall.legalDetails,
          operationalDetails: updatedMall.operationalDetails,
          leaseDetails: updatedMall.leaseDetails,
          marketingMaterials: updatedMall.marketingMaterials,
          investorRelations: updatedMall.investorRelations,
          amenities: updatedMall.amenities,
          features: updatedMall.features,
          developer: updatedMall.developer,
          yearBuilt: updatedMall.yearBuilt,
          yearOpened: updatedMall.yearOpened,
          rating: updatedMall.rating,
          visitorsAnnually: updatedMall.visitorsAnnually,
          architecture: updatedMall.architecture,
          image: updatedMall.image,
          gallery: updatedMall.gallery,
          floorPlan: updatedMall.floorPlan,
          locationDetails: updatedMall.locationDetails,
          verified: updatedMall.verified,
          isActive: updatedMall.isActive,
          isAvailable: updatedMall.isAvailable,
          isOperational: updatedMall.isOperational,
          updatedAt: updatedMall.updatedAt,
          updatedBy: updatedMall.updatedBy
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Error updating mall:", error);

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
      return NextResponse.json(
        {
          success: false,
          message: "Duplicate entry error",
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
export const PUT = withCollectionPermission(Collection.MALLS, Action.EDIT)(handler);
