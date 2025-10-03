// app/api/buildings/delete/[slug]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Building from "@/models/buildings";
import { withAuth } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limiter";
import { AuditLog, AuditAction, AuditLevel } from "@/models/auditLog";

// Force Node.js runtime
export const runtime = "nodejs";

/**
 * Main DELETE handler with authentication and audit trail
 */
export const DELETE = withAuth(async (
  request: NextRequest,
  { user, audit },
  { params }: { params: { slug: string } }
) => {
  let buildingInfo: any = null;
  
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimit(request, user);
    if (!rateLimitResult.success) {
      // Log rate limit violation
      AuditLog.createLog({
        action: AuditAction.SUSPICIOUS_ACTIVITY,
        level: AuditLevel.WARNING,
        userId: user.uid,
        userEmail: user.email,
        ip: audit.ipAddress || 'unknown',
        userAgent: audit.userAgent,
        resource: 'building',
        details: {
          reason: 'Rate limit exceeded on delete operation',
          slug: params.slug,
          retryAfter: rateLimitResult.retryAfter
        },
        success: false,
        errorMessage: 'Rate limit exceeded'
      });
      
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

    // Extract slug from params
    const { slug } = params;

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'INVALID_SLUG',
          message: 'Building slug is required and must be a string' 
        },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // First, find the building to get its info before deletion (for audit log)
    const buildingToDelete = await Building.findOne({ slug }).select('buildingId name location category type totalUnits verified isActive createdBy updatedBy');
    
    if (!buildingToDelete) {
      // Log failed deletion attempt
      AuditLog.createLog({
        action: AuditAction.CONTENT_DELETED,
        level: AuditLevel.WARNING,
        userId: user.uid,
        userEmail: user.email,
        ip: audit.ipAddress || 'unknown',
        userAgent: audit.userAgent,
        resource: 'building',
        resourceId: slug,
        details: {
          reason: 'Building not found',
          slug: slug,
          operation: 'delete'
        },
        success: false,
        errorMessage: 'Building not found or may have already been deleted'
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'NOT_FOUND',
          message: 'Building not found or may have already been deleted' 
        },
        { status: 404 }
      );
    }

    // Store building info for audit log and response
    buildingInfo = {
      buildingId: buildingToDelete.buildingId,
      name: buildingToDelete.name,
      location: buildingToDelete.location,
      category: buildingToDelete.category,
      type: buildingToDelete.type,
      totalUnits: buildingToDelete.totalUnits,
      verified: buildingToDelete.verified,
      isActive: buildingToDelete.isActive,
      createdBy: buildingToDelete.createdBy,
      updatedBy: buildingToDelete.updatedBy
    };

    // Now delete the building
    const deletedBuilding = await Building.findOneAndDelete({ slug });

    if (!deletedBuilding) {
      // This shouldn't happen, but handle it just in case
      AuditLog.createLog({
        action: AuditAction.CONTENT_DELETED,
        level: AuditLevel.ERROR,
        userId: user.uid,
        userEmail: user.email,
        ip: audit.ipAddress || 'unknown',
        userAgent: audit.userAgent,
        resource: 'building',
        resourceId: buildingInfo.buildingId,
        details: {
          reason: 'Building found but delete operation failed',
          slug: slug,
          buildingName: buildingInfo.name,
          operation: 'delete'
        },
        success: false,
        errorMessage: 'Delete operation failed unexpectedly'
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'DELETE_FAILED',
          message: 'Failed to delete building. Please try again.' 
        },
        { status: 500 }
      );
    }

    // Log successful deletion
    AuditLog.createLog({
      action: AuditAction.CONTENT_DELETED,
      level: AuditLevel.INFO,
      userId: user.uid,
      userEmail: user.email,
      ip: audit.ipAddress || 'unknown',
      userAgent: audit.userAgent,
      resource: 'building',
      resourceId: buildingInfo.buildingId,
      details: {
        slug: slug,
        buildingName: buildingInfo.name,
        buildingId: buildingInfo.buildingId,
        location: buildingInfo.location,
        category: buildingInfo.category,
        type: buildingInfo.type,
        totalUnits: buildingInfo.totalUnits,
        wasVerified: buildingInfo.verified,
        wasActive: buildingInfo.isActive,
        originalCreator: buildingInfo.createdBy,
        lastUpdatedBy: buildingInfo.updatedBy,
        deletedAt: new Date().toISOString(),
        operation: 'delete'
      },
      success: true
    });

    // Log successful deletion to console
    console.log(`Building deleted successfully by ${user.email}:`, {
      buildingId: buildingInfo.buildingId,
      name: buildingInfo.name,
      slug: slug,
      location: buildingInfo.location
    });

    // Return success response with deleted building info
    return NextResponse.json({
      success: true,
      message: `Building "${buildingInfo.name}" deleted successfully`,
      data: {
        buildingId: buildingInfo.buildingId,
        name: buildingInfo.name,
        slug: slug,
        location: buildingInfo.location,
        deletedAt: new Date().toISOString(),
        deletedBy: user.email
      }
    });

  } catch (error: any) {
    console.error('Delete building API error:', error);

    // Log error to audit trail
    AuditLog.createLog({
      action: AuditAction.CONTENT_DELETED,
      level: AuditLevel.ERROR,
      userId: user.uid,
      userEmail: user.email,
      ip: audit.ipAddress || 'unknown',
      userAgent: audit.userAgent,
      resource: 'building',
      resourceId: buildingInfo?.buildingId || params.slug,
      details: {
        slug: params.slug,
        buildingName: buildingInfo?.name || 'Unknown',
        errorName: error.name,
        errorMessage: error.message,
        operation: 'delete'
      },
      success: false,
      errorMessage: error.message || 'Unknown error occurred during deletion'
    });

    // Handle specific database errors
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'DATABASE_ERROR',
          message: 'Database operation failed. Please try again.' 
        },
        { status: 500 }
      );
    }

    // Handle connection errors
    if (error.message?.includes('connect') || error.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'CONNECTION_ERROR',
          message: 'Unable to connect to database. Please try again later.' 
        },
        { status: 503 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { 
        success: false, 
        error: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while deleting the building' 
      },
      { status: 500 }
    );
  }
});
