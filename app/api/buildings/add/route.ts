// app/api/buildings/add/route.ts

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

// Generate unique building ID
async function generateBuildingId(): Promise<string> {
  const latestBuilding = await Building.findOne({}, {}, { sort: { 'buildingId': -1 } });
  
  if (!latestBuilding?.buildingId) {
    return "BLDG_001";
  }
  
  const currentNumber = parseInt(latestBuilding.buildingId.split('_')[1]);
  const nextNumber = currentNumber + 1;
  return `BLDG_${nextNumber.toString().padStart(3, '0')}`;
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

// Update building slugs for consistency
async function updateBuildingSlugs(buildingData: any, buildingId: string) {
  const baseSlug = generateSlug(buildingData.name);
  
  // Check if slug exists
  const existingBuilding = await Building.findOne({ slug: baseSlug });
  let slug = baseSlug;
  
  if (existingBuilding) {
    // Generate unique slug by appending number
    let counter = 1;
    while (true) {
      const testSlug = `${baseSlug}-${counter}`;
      const exists = await Building.findOne({ slug: testSlug });
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
    const buildingData: BuildingFormData = await request.json();
    
    // Check if any data was provided
    if (Object.keys(buildingData).length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: "No building data provided. Please include building information.", 
          error: "EMPTY_DATA",
          details: "Request body cannot be empty. Please provide building data."
        },
        { status: 400 }
      );
    }

    // Sanitize data
    const sanitizedData = sanitizeBuildingData(buildingData);

    // Validate building data with shared validation
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

    // Generate unique IDs
    const buildingId = await generateBuildingId();
    const slugs = await updateBuildingSlugs(sanitizedData, buildingId);

    // Handle image URLs - use provided URLs directly
    const mainImageUrl = buildingData.mainImage;
    const galleryUrls = buildingData.gallery || [];
    const floorPlanUrls = buildingData.floorPlans || [];

    // Auto-calculate area conversions if needed
    if (sanitizedData.dimensions?.totalArea && sanitizedData.dimensions.totalArea > 0) {
      // Ensure we have basic calculations ready
      console.log(`Building dimensions: ${sanitizedData.dimensions.totalArea} total area`);
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

    // Create new building document
    const newBuilding = new Building({
      ...sanitizedData,
      buildingId: slugs.buildingId,
      slug: slugs.slug,
      mainImage: mainImageUrl,
      gallery: galleryUrls,
      floorPlans: floorPlanUrls,
      createdBy: audit.email,
      updatedBy: audit.email,
    });

    // Save to database
    const savedBuilding = await newBuilding.save();

    // Create audit log entry for successful building creation
    AuditLog.createLog({
      action: AuditAction.CONTENT_CREATED,
      level: AuditLevel.INFO,
      userId: user.uid,
      userEmail: user.email,
      ip: audit.ipAddress || 'unknown',
      userAgent: audit.userAgent,
      resource: 'building',
      resourceId: savedBuilding.buildingId,
      details: {
        buildingId: savedBuilding.buildingId,
        name: savedBuilding.name,
        slug: savedBuilding.slug,
        location: savedBuilding.location,
        subLocation: savedBuilding.subLocation,
        category: savedBuilding.category,
        type: savedBuilding.type,
        totalUnits: savedBuilding.totalUnits,
        price: savedBuilding.price,
        verified: savedBuilding.verified,
        isActive: savedBuilding.isActive,
        isFeatured: savedBuilding.isFeatured,
        operation: 'create'
      },
      success: true
    });

    // Log successful creation
    console.log(`Building created successfully by ${user.email}:`, {
      id: savedBuilding._id,
      buildingId: savedBuilding.buildingId,
      name: savedBuilding.name,
      slug: savedBuilding.slug,
      location: savedBuilding.location
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Building created successfully",
        warnings: validation.warnings,
        building: {
          id: savedBuilding._id,
          buildingId: savedBuilding.buildingId,
          name: savedBuilding.name,
          subtitle: savedBuilding.subtitle,
          slug: savedBuilding.slug,
          category: savedBuilding.category,
          type: savedBuilding.type,
          location: savedBuilding.location,
          subLocation: savedBuilding.subLocation,
          price: savedBuilding.price,
          priceRange: savedBuilding.priceRange,
          dimensions: savedBuilding.dimensions,
          year: savedBuilding.year,
          yearBuilt: savedBuilding.yearBuilt,
          totalUnits: savedBuilding.totalUnits,
          availableUnits: savedBuilding.availableUnits,
          units: savedBuilding.units,
          amenities: savedBuilding.amenities,
          features: savedBuilding.features,
          highlights: savedBuilding.highlights,
          financials: savedBuilding.financials,
          saleInformation: savedBuilding.saleInformation,
          legalDetails: savedBuilding.legalDetails,
          operationalDetails: savedBuilding.operationalDetails,
          marketingMaterials: savedBuilding.marketingMaterials,
          investorRelations: savedBuilding.investorRelations,
          mainImage: savedBuilding.mainImage,
          gallery: savedBuilding.gallery,
          floorPlans: savedBuilding.floorPlans,
          locationDetails: savedBuilding.locationDetails,
          developer: savedBuilding.developer,
          currentOwner: savedBuilding.currentOwner,
          masterDeveloper: savedBuilding.masterDeveloper,
          rating: savedBuilding.rating,
          sustainabilityRating: savedBuilding.sustainabilityRating,
          architecture: savedBuilding.architecture,
          architect: savedBuilding.architect,
          description: savedBuilding.description,
          status: savedBuilding.status,
          verified: savedBuilding.verified,
          isActive: savedBuilding.isActive,
          isFeatured: savedBuilding.isFeatured,
          createdAt: savedBuilding.createdAt,
          createdBy: savedBuilding.createdBy
        },
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Error creating building:", error);

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
      const message = field === 'buildingId' 
        ? "Building ID already exists" 
        : field === 'slug'
        ? "Building with this name already exists"
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