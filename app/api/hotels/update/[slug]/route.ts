// app/api/hotels/update/[slug]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Hotel from "@/models/hotels";
import { withCollectionPermission } from "@/lib/auth/server";
import { Collection, Action } from "@/types/user";
import { rateLimit } from "@/lib/rate-limiter";
import { validateHotelFormData, sanitizeHotelData } from "@/lib/hotel-validation";
import { AuditLog, AuditAction, AuditLevel } from "@/models/auditLog";
import type { HotelFormData } from "@/types/hotels";

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

// Update hotel slugs for consistency
async function updateHotelSlugs(hotelData: any, existingHotel: any) {
  const hotelId = existingHotel.hotelId; // Keep existing hotel ID
  
  // Only regenerate slug if name changed
  if (!hotelData.name || hotelData.name === existingHotel.name) {
    return {
      slug: existingHotel.slug,
      hotelId
    };
  }
  
  const baseSlug = generateSlug(hotelData.name);
  
  // Check if slug exists (excluding current hotel)
  const existingWithSlug = await Hotel.findOne({ 
    slug: baseSlug,
    _id: { $ne: existingHotel._id }
  });
  
  let slug = baseSlug;
  
  if (existingWithSlug) {
    // Generate unique slug by appending number
    let counter = 1;
    while (true) {
      const testSlug = `${baseSlug}-${counter}`;
      const exists = await Hotel.findOne({ 
        slug: testSlug,
        _id: { $ne: existingHotel._id }
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
    hotelId
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

    const { slug } = params;
    
    // Find existing hotel by slug
    const existingHotel = await Hotel.findOne({ slug });

    if (!existingHotel) {
      return NextResponse.json(
        { success: false, message: "Hotel not found", error: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Parse JSON data
    const updateData: HotelFormData = await request.json();
    
    // Check if any data was provided
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: "No hotel data provided. Please include fields to update.", 
          error: "EMPTY_UPDATE_DATA",
          details: "Please provide at least one field to update."
        },
        { status: 400 }
      );
    }

    // Sanitize data
    const sanitizedData = sanitizeHotelData(updateData);

    // Validate update data with shared validation
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

    // Prepare merged data for slug generation
    const mergedData = { ...existingHotel.toObject(), ...sanitizedData };
    
    // Generate updated slugs
    const slugs = await updateHotelSlugs(mergedData, existingHotel);

    // Handle image updates - use provided URLs or keep existing
    const mainImageUrl = updateData.mainImage || existingHotel.mainImage;
    const galleryUrls = updateData.gallery || existingHotel.gallery || [];
    const floorPlanUrl = updateData.floorPlan || existingHotel.floorPlan;

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

    // Update hotel
    const updatedHotel = await Hotel.findOneAndUpdate(
      { _id: existingHotel._id },
      { $set: updateObject },
      { 
        new: true,
        runValidators: false  // We handle validation manually above
      }
    );

    if (!updatedHotel) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Failed to update hotel. Please try again.", 
          error: "UPDATE_FAILED" 
        },
        { status: 500 }
      );
    }

    // Create audit log entry for successful hotel update
    AuditLog.createLog({
      action: AuditAction.CONTENT_UPDATED,
      level: AuditLevel.INFO,
      userId: user.firebaseUid,
      userEmail: user.email,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      resource: 'hotel',
      resourceId: updatedHotel.hotelId,
      details: {
        hotelId: updatedHotel.hotelId,
        name: updatedHotel.name,
        slug: updatedHotel.slug,
        location: updatedHotel.location,
        subLocation: updatedHotel.subLocation,
        type: updatedHotel.type,
        fieldsUpdated: Object.keys(sanitizedData),
        previousSlug: existingHotel.slug !== updatedHotel.slug ? existingHotel.slug : undefined,
        verified: updatedHotel.verified,
        isActive: updatedHotel.isActive,
        isAvailable: updatedHotel.isAvailable,
        operation: 'update'
      },
      success: true
    });

    // Log successful update
    console.log(`Hotel updated successfully by ${user.email}:`, {
      id: updatedHotel._id,
      hotelId: updatedHotel.hotelId,
      name: updatedHotel.name,
      slug: updatedHotel.slug,
      location: updatedHotel.location,
      changes: Object.keys(sanitizedData)
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Hotel updated successfully",
        warnings: validation.warnings,
        hotel: updatedHotel
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Error updating hotel:", error);

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
export const PUT = withCollectionPermission(Collection.HOTELS, Action.EDIT)(handler);
