import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Plot from "@/models/plots";
import { withAuth } from "@/lib/auth-utils";
import { updatePlotSlugs } from "@/lib/slug-utils";
import { rateLimit } from "@/lib/rate-limiter";
import { validatePlotData, sanitizePlotData, type PlotData } from "@/lib/plot-validation";

interface IPrice {
  perSqft?: number;
  total?: string; // Display format like "AED 12.5M"
  totalNumeric?: number; // Actual number for calculations
  currency?: string;
}

interface ISize {
  sqft?: number;
  sqm?: number;
  acres?: number;
}

interface IPermissions {
  floors?: string; // e.g., "G+P+M+25"
  usage?: string; // e.g., "5-Star Hotel"
  far?: number; // Floor Area Ratio
  coverage?: number; // Coverage percentage
}

interface IInvestment {
  roi?: number; // Return on Investment percentage
  appreciation?: number; // Expected appreciation percentage
  payback?: number; // Payback period in years
}

interface ICoordinates {
  latitude?: number;
  longitude?: number;
}

interface ILocationDetails {
  description?: string;
  coordinates?: ICoordinates;
  accessibility?: string[];
}

interface PlotUpdateData {
  plotId?: string;
  title?: string;
  subtitle?: string;
  type?: "industrial" | "community" | "building";
  subtype?: "hotel" | "residential" | "mixuse";
  location?: string;
  subLocation?: string;
  ownership?: "freehold" | "leasehold";
  price?: IPrice;
  size?: ISize;
  image?: string; // Cover image URL
  gallery?: string[]; // Array of image URLs
  description?: string;
  permissions?: IPermissions;
  investment?: IInvestment;
  features?: string[];
  developer?: string;
  status?: string;
  locationDetails?: ILocationDetails;
  verified?: boolean;
  isActive?: boolean;
  isAvailable?: boolean;
}


/**
 * Check if user has permission to update plot
 */
function canUpdatePlot(user: any, plot: any): { canUpdate: boolean; reason?: string } {
  // Admin can update any plot
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
  if (adminEmails.includes(user.email)) {
    return { canUpdate: true };
  }

  // Plot creator can update their own plot (createdBy is a string, not an object)
  if (plot.createdBy === user.email) {
    return { canUpdate: true };
  }

  // Check if user is in allowed updaters list (if implemented)
  const allowedUpdaters = plot.allowedUpdaters || [];
  if (allowedUpdaters.includes(user.email)) {
    return { canUpdate: true };
  }

  return { 
    canUpdate: false, 
    reason: "You don't have permission to update this plot" 
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
    
    // Find existing plot
    const existingPlot = await Plot.findOne({ slug, isActive: true });
    if (!existingPlot) {
      return NextResponse.json(
        { success: false, message: "Plot not found", error: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Check permissions
    const permissionCheck = canUpdatePlot(user, existingPlot);
    if (!permissionCheck.canUpdate) {
      return NextResponse.json(
        { 
          success: false, 
          message: permissionCheck.reason || "Insufficient permissions", 
          error: "FORBIDDEN" 
        },
        { status: 403 }
      );
    }

    // Parse JSON data
    const updateData: PlotUpdateData = await request.json();
    
    // Check if any data was provided
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: "No plot data provided. Please include fields to update.", 
          error: "EMPTY_UPDATE_DATA",
          details: "Please provide at least one field to update."
        },
        { status: 400 }
      );
    }

    // Sanitize data
    const sanitizedData = sanitizePlotData(updateData);

    // Clear subtype if type is not building (cleanup for data consistency)
    if (sanitizedData.type && sanitizedData.type !== 'building') {
      sanitizedData.subtype = undefined;
    }
    
    // Validate update data with shared validation
    const validation = validatePlotData(sanitizedData, true);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Plot data validation failed", 
          errors: validation.fieldErrors,
          warnings: validation.warnings,
          error: "VALIDATION_ERROR"
        },
        { status: 400 }
      );
    }

    // Note: plotId conflicts are handled at the database level

    // Prepare merged data for slug generation
    const mergedData = { ...existingPlot.toObject(), ...sanitizedData };
    
    // Generate updated slugs (assuming we have a plot-specific slug function)
    const slugs = await updatePlotSlugs(mergedData, existingPlot);

    // Handle image updates - use provided URLs or keep existing
    const coverImageUrl = updateData.image || existingPlot.image;
    const galleryUrls = updateData.gallery || existingPlot.gallery || [];

    // Auto-calculate price per sqft if price and size data are available
    if (sanitizedData.price?.totalNumeric && sanitizedData.size?.sqft) {
      sanitizedData.price.perSqft = sanitizedData.price.totalNumeric / sanitizedData.size.sqft;
    } else if (sanitizedData.price?.totalNumeric && existingPlot.size?.sqft) {
      sanitizedData.price.perSqft = sanitizedData.price.totalNumeric / existingPlot.size.sqft;
    } else if (existingPlot.price?.totalNumeric && sanitizedData.size?.sqft) {
      if (!sanitizedData.price) sanitizedData.price = {};
      sanitizedData.price.perSqft = existingPlot.price.totalNumeric / sanitizedData.size.sqft;
    }

    // Prepare update object
    const updateObject: any = {
      ...sanitizedData,
      ...slugs,
      image: coverImageUrl,
      gallery: galleryUrls,
      updatedBy: audit.email,
      updatedAt: new Date(),
    };
    

    // Prepare MongoDB update operations
    let mongoUpdate: any = { $set: updateObject };
    
    // Determine the final type after update
    const finalType = sanitizedData.type || existingPlot.type;
    
    // If the final type is not building, ensure subtype is removed
    if (finalType !== 'building' && existingPlot.subtype) {
      mongoUpdate.$unset = { subtype: 1 };
      // Remove subtype from the $set operation to avoid conflicts
      delete updateObject.subtype;
    }
    
    // Create a merged document to validate the final state
    const mergedDocForValidation = { ...existingPlot.toObject(), ...updateObject };
    
    // Apply $unset operations to the merged document
    if (mongoUpdate.$unset) {
      Object.keys(mongoUpdate.$unset).forEach(field => {
        delete mergedDocForValidation[field];
      });
    }
    
    // Manual validation of subtype logic
    if (mergedDocForValidation.type === 'building') {
      if (!mergedDocForValidation.subtype || mergedDocForValidation.subtype.trim().length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'Subtype is required when type is "building"',
            error: 'VALIDATION_ERROR'
          },
          { status: 400 }
        );
      }
    } else {
      if (mergedDocForValidation.subtype && mergedDocForValidation.subtype.trim().length > 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'Subtype should only be provided when type is "building"',
            error: 'VALIDATION_ERROR'
          },
          { status: 400 }
        );
      }
    }
    
    // Update plot (disable schema validators to avoid context issues)
    const updatedPlot = await Plot.findOneAndUpdate(
      { _id: existingPlot._id },
      mongoUpdate,
      { 
        new: true,
        runValidators: false  // We handle validation manually above
      }
    );

    if (!updatedPlot) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Failed to update plot. Please try again.", 
          error: "UPDATE_FAILED" 
        },
        { status: 500 }
      );
    }

    // Log successful update
    console.log(`Plot updated successfully by ${user.email}:`, {
      id: updatedPlot._id,
      plotId: updatedPlot.plotId,
      title: updatedPlot.title,
      slug: updatedPlot.slug,
      location: updatedPlot.location,
      changes: Object.keys(sanitizedData)
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Plot updated successfully",
        warnings: validation.warnings,
        plot: {
          id: updatedPlot._id,
          plotId: updatedPlot.plotId,
          title: updatedPlot.title,
          subtitle: updatedPlot.subtitle,
          slug: updatedPlot.slug,
          type: updatedPlot.type,
          subtype: updatedPlot.subtype,
          location: updatedPlot.location,
          subLocation: updatedPlot.subLocation,
          ownership: updatedPlot.ownership,
          status: updatedPlot.status,
          price: updatedPlot.price,
          size: updatedPlot.size,
          image: updatedPlot.image,
          gallery: updatedPlot.gallery,
          verified: updatedPlot.verified,
          isActive: updatedPlot.isActive,
          isAvailable: updatedPlot.isAvailable,
          updatedAt: updatedPlot.updatedAt,
          updatedBy: updatedPlot.updatedBy
        },
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Error updating plot:", error);

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