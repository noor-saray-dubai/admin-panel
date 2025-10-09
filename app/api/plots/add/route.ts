import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Plot from "@/models/plots";
import { withCollectionPermission } from "@/lib/auth/server";
import { Collection, Action } from "@/types/user";
import { rateLimit } from "@/lib/rate-limiter";
import { validatePlotData, sanitizePlotData, type PlotData } from "@/lib/plot-validation";

// Force Node.js runtime
export const runtime = "nodejs";


/**
 * Generate plot ID and slug
 */
function generatePlotIdentifiers(data: PlotData): { plotId: string; slug: string } {
  // Generate plotId based on type
  const typePrefix = data.type ? {
    industrial: 'IND',
    community: 'COM',  
    building: 'BLD'
  }[data.type] : 'UNK';

  // Generate a random 3-digit number (this should be incremental in production)
  const randomId = Math.floor(Math.random() * 900) + 100;
  const plotId = `${typePrefix}_${randomId}`;

  // Generate slug from title
  const slug = (data.title || 'untitled')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  return { plotId, slug };
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
    const plotData: PlotData = await request.json();

    // Sanitize data
    const sanitizedData = sanitizePlotData(plotData);

    // Clear subtype if type is not building (cleanup for data consistency)
    if (sanitizedData.type !== 'building') {
      sanitizedData.subtype = undefined;
    }

    // Validate plot data
    const validation = validatePlotData(sanitizedData, false);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Validation failed", 
          errors: validation.fieldErrors,
          warnings: validation.warnings,
          error: "VALIDATION_ERROR" 
        },
        { status: 400 }
      );
    }

    // Generate plot identifiers
    const identifiers = generatePlotIdentifiers(sanitizedData);

    // Check for existing plot by title or plotId
    const existingPlot = await Plot.findOne({
      $or: [
        { title: { $regex: new RegExp(`^${sanitizedData.title}$`, "i") } },
        { plotId: identifiers.plotId },
        { slug: identifiers.slug }
      ],
      isActive: true
    });

    if (existingPlot) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Plot with this title already exists", 
          error: "DUPLICATE_TITLE" 
        },
        { status: 409 }
      );
    }

    // Validate that required images are provided (URLs should be present)
    if (!sanitizedData.image) {
      return NextResponse.json(
        { success: false, message: "Cover image is required for new plots", error: "MISSING_COVER_IMAGE" },
        { status: 400 }
      );
    }

    // Prepare plot data for database
    const plotToSave = {
      ...sanitizedData,
      ...identifiers,
      image: sanitizedData.image,
      gallery: sanitizedData.gallery || [],
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Create plot
    const createdPlot = await Plot.create(plotToSave);

    // Log successful creation
    console.log(`Plot created successfully by ${user.email}:`, {
      id: createdPlot._id,
      plotId: createdPlot.plotId,
      title: createdPlot.title,
      slug: createdPlot.slug,
      mainImage: createdPlot.image,
      galleryCount: createdPlot.gallery?.length || 0
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Plot created successfully",
        warnings: validation.warnings,
        plot: {
          id: createdPlot._id,
          plotId: createdPlot.plotId,
          title: createdPlot.title,
          slug: createdPlot.slug,
          location: createdPlot.location,
          type: createdPlot.type,
          image: createdPlot.image,
          gallery: createdPlot.gallery,
          createdAt: createdPlot.createdAt,
          createdBy: createdPlot.createdBy
        },
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Error creating plot:", error);

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
export const POST = withCollectionPermission(Collection.PLOTS, Action.ADD)(handler);
