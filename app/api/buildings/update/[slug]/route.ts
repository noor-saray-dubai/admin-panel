// app/api/buildings/update/[slug]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Building from "@/models/buildings";
import { withAuth } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limiter";
import { validateBuildingFormData, sanitizeBuildingData } from "@/lib/building-validation";
import { AuditLog, AuditAction, AuditLevel } from "@/models/auditLog";
import type { BuildingFormData } from "@/types/buildings";

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

// Update building slugs for consistency
async function updateBuildingSlugs(buildingData: any, existingBuilding: any) {
  const buildingId = existingBuilding.buildingId; // Keep existing building ID
  
  // Only regenerate slug if name changed
  if (!buildingData.name || buildingData.name === existingBuilding.name) {
    return {
      slug: existingBuilding.slug,
      buildingId
    };
  }
  
  const baseSlug = generateSlug(buildingData.name);
  
  // Check if slug exists (excluding current building)
  const existingWithSlug = await Building.findOne({ 
    slug: baseSlug,
    _id: { $ne: existingBuilding._id }
  });
  
  let slug = baseSlug;
  
  if (existingWithSlug) {
    // Generate unique slug by appending number
    let counter = 1;
    while (true) {
      const testSlug = `${baseSlug}-${counter}`;
      const exists = await Building.findOne({ 
        slug: testSlug,
        _id: { $ne: existingBuilding._id }
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
    buildingId
  };
}

interface RouteParams {
  params: {
    slug: string;
  };
}

/**
 * Main PUT handler with authentication
 */
export const PUT = withAuth(async (
  request: NextRequest, 
  { user, audit }, 
  { params }: { params: { slug: string } }
) => {
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
    
    // Find existing building by slug
    const existingBuilding = await Building.findOne({ slug });

    if (!existingBuilding) {
      return NextResponse.json(
        { success: false, message: "Building not found", error: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Permission check is handled by withAuth wrapper

    // Parse JSON data
    const updateData: BuildingFormData = await request.json();
    
    // Check if any data was provided
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: "No building data provided. Please include fields to update.", 
          error: "EMPTY_UPDATE_DATA",
          details: "Please provide at least one field to update."
        },
        { status: 400 }
      );
    }

    // Sanitize data
    const sanitizedData = sanitizeBuildingData(updateData);

    // Validate update data with shared validation
    const validation = validateBuildingFormData(sanitizedData);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Building data validation failed", 
          errors: validation.errors,
          warnings: validation.warnings,
          error: "VALIDATION_ERROR"
        },
        { status: 400 }
      );
    }

    // Prepare merged data for slug generation
    const mergedData = { ...existingBuilding.toObject(), ...sanitizedData };
    
    // Generate updated slugs
    const slugs = await updateBuildingSlugs(mergedData, existingBuilding);

    // Handle image updates - use provided URLs or keep existing
    const mainImageUrl = updateData.mainImage || existingBuilding.mainImage;
    const galleryUrls = updateData.gallery || existingBuilding.gallery || [];
    const floorPlanUrls = updateData.floorPlans || existingBuilding.floorPlans || [];

    // Auto-calculate area conversions if total area changed
    if (sanitizedData.dimensions?.totalArea && sanitizedData.dimensions?.totalArea !== existingBuilding.dimensions?.totalArea) {
      console.log(`Building dimensions updated: ${sanitizedData.dimensions.totalArea} total area`);
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

    // Prepare update object
    const updateObject: any = {
      ...sanitizedData,
      ...slugs,
      mainImage: mainImageUrl,
      gallery: galleryUrls,
      floorPlans: floorPlanUrls,
      updatedBy: audit.email,
      updatedAt: new Date(),
    };

    // Prepare MongoDB update operations
    let mongoUpdate: any = { $set: updateObject };

    // Create a merged document to validate the final state
    const mergedDocForValidation = { ...existingBuilding.toObject(), ...updateObject };

    // Apply $unset operations to the merged document
    if (mongoUpdate.$unset) {
      Object.keys(mongoUpdate.$unset).forEach(field => {
        delete mergedDocForValidation[field];
      });
    }

    // Update building (disable schema validators to avoid context issues)
    const updatedBuilding = await Building.findOneAndUpdate(
      { _id: existingBuilding._id },
      mongoUpdate,
      { 
        new: true,
        runValidators: false  // We handle validation manually above
      }
    );

    if (!updatedBuilding) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Failed to update building. Please try again.", 
          error: "UPDATE_FAILED" 
        },
        { status: 500 }
      );
    }

    // Create audit log entry for successful building update
    AuditLog.createLog({
      action: AuditAction.CONTENT_UPDATED,
      level: AuditLevel.INFO,
      userId: user.uid,
      userEmail: user.email,
      ip: audit.ipAddress || 'unknown',
      userAgent: audit.userAgent,
      resource: 'building',
      resourceId: updatedBuilding.buildingId,
      details: {
        buildingId: updatedBuilding.buildingId,
        name: updatedBuilding.name,
        slug: updatedBuilding.slug,
        location: updatedBuilding.location,
        subLocation: updatedBuilding.subLocation,
        category: updatedBuilding.category,
        type: updatedBuilding.type,
        fieldsUpdated: Object.keys(sanitizedData),
        previousSlug: existingBuilding.slug !== updatedBuilding.slug ? existingBuilding.slug : undefined,
        verified: updatedBuilding.verified,
        isActive: updatedBuilding.isActive,
        isFeatured: updatedBuilding.isFeatured,
        operation: 'update'
      },
      success: true
    });

    // Log successful update
    console.log(`Building updated successfully by ${user.email}:`, {
      id: updatedBuilding._id,
      buildingId: updatedBuilding.buildingId,
      name: updatedBuilding.name,
      slug: updatedBuilding.slug,
      location: updatedBuilding.location,
      changes: Object.keys(sanitizedData)
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Building updated successfully",
        warnings: validation.warnings,
        building: {
          id: updatedBuilding._id,
          buildingId: updatedBuilding.buildingId,
          name: updatedBuilding.name,
          subtitle: updatedBuilding.subtitle,
          slug: updatedBuilding.slug,
          category: updatedBuilding.category,
          type: updatedBuilding.type,
          location: updatedBuilding.location,
          subLocation: updatedBuilding.subLocation,
          price: updatedBuilding.price,
          priceRange: updatedBuilding.priceRange,
          dimensions: updatedBuilding.dimensions,
          year: updatedBuilding.year,
          yearBuilt: updatedBuilding.yearBuilt,
          totalUnits: updatedBuilding.totalUnits,
          availableUnits: updatedBuilding.availableUnits,
          units: updatedBuilding.units,
          amenities: updatedBuilding.amenities,
          features: updatedBuilding.features,
          highlights: updatedBuilding.highlights,
          financials: updatedBuilding.financials,
          saleInformation: updatedBuilding.saleInformation,
          legalDetails: updatedBuilding.legalDetails,
          operationalDetails: updatedBuilding.operationalDetails,
          marketingMaterials: updatedBuilding.marketingMaterials,
          investorRelations: updatedBuilding.investorRelations,
          mainImage: updatedBuilding.mainImage,
          gallery: updatedBuilding.gallery,
          floorPlans: updatedBuilding.floorPlans,
          locationDetails: updatedBuilding.locationDetails,
          developer: updatedBuilding.developer,
          currentOwner: updatedBuilding.currentOwner,
          masterDeveloper: updatedBuilding.masterDeveloper,
          rating: updatedBuilding.rating,
          sustainabilityRating: updatedBuilding.sustainabilityRating,
          architecture: updatedBuilding.architecture,
          architect: updatedBuilding.architect,
          description: updatedBuilding.description,
          status: updatedBuilding.status,
          verified: updatedBuilding.verified,
          isActive: updatedBuilding.isActive,
          isFeatured: updatedBuilding.isFeatured,
          updatedAt: updatedBuilding.updatedAt,
          updatedBy: updatedBuilding.updatedBy
        },
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Error updating building:", error);

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
});