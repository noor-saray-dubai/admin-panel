// app/api/hotels/delete/[slug]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Hotel from "@/models/hotels";
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
  let hotelInfo: any = null;
  
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
        resource: 'hotel',
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
          message: 'Hotel slug is required and must be a string' 
        },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // First, find the hotel to get its info before deletion (for audit log)
    const hotelToDelete = await Hotel.findOne({ slug }).select('hotelId name location type totalRooms totalSuites verified isActive isAvailable createdBy updatedBy');
    
    if (!hotelToDelete) {
      // Log failed deletion attempt
      AuditLog.createLog({
        action: AuditAction.CONTENT_DELETED,
        level: AuditLevel.WARNING,
        userId: user.uid,
        userEmail: user.email,
        ip: audit.ipAddress || 'unknown',
        userAgent: audit.userAgent,
        resource: 'hotel',
        resourceId: slug,
        details: {
          reason: 'Hotel not found',
          slug: slug,
          operation: 'delete'
        },
        success: false,
        errorMessage: 'Hotel not found or may have already been deleted'
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'NOT_FOUND',
          message: 'Hotel not found or may have already been deleted' 
        },
        { status: 404 }
      );
    }

    // Store hotel info for audit log and response
    hotelInfo = {
      hotelId: hotelToDelete.hotelId,
      name: hotelToDelete.name,
      location: hotelToDelete.location,
      type: hotelToDelete.type,
      totalRooms: hotelToDelete.totalRooms,
      totalSuites: hotelToDelete.totalSuites,
      verified: hotelToDelete.verified,
      isActive: hotelToDelete.isActive,
      isAvailable: hotelToDelete.isAvailable,
      createdBy: hotelToDelete.createdBy,
      updatedBy: hotelToDelete.updatedBy
    };

    // Now delete the hotel
    const deletedHotel = await Hotel.findOneAndDelete({ slug });

    if (!deletedHotel) {
      // This shouldn't happen, but handle it just in case
      AuditLog.createLog({
        action: AuditAction.CONTENT_DELETED,
        level: AuditLevel.ERROR,
        userId: user.uid,
        userEmail: user.email,
        ip: audit.ipAddress || 'unknown',
        userAgent: audit.userAgent,
        resource: 'hotel',
        resourceId: hotelInfo.hotelId,
        details: {
          reason: 'Hotel found but delete operation failed',
          slug: slug,
          hotelName: hotelInfo.name,
          operation: 'delete'
        },
        success: false,
        errorMessage: 'Delete operation failed unexpectedly'
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'DELETE_FAILED',
          message: 'Failed to delete hotel. Please try again.' 
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
      resource: 'hotel',
      resourceId: hotelInfo.hotelId,
      details: {
        slug: slug,
        hotelName: hotelInfo.name,
        hotelId: hotelInfo.hotelId,
        location: hotelInfo.location,
        type: hotelInfo.type,
        totalRooms: hotelInfo.totalRooms,
        totalSuites: hotelInfo.totalSuites,
        wasVerified: hotelInfo.verified,
        wasActive: hotelInfo.isActive,
        wasAvailable: hotelInfo.isAvailable,
        originalCreator: hotelInfo.createdBy,
        lastUpdatedBy: hotelInfo.updatedBy,
        deletedAt: new Date().toISOString(),
        operation: 'delete'
      },
      success: true
    });

    // Log successful deletion to console
    console.log(`Hotel deleted successfully by ${user.email}:`, {
      hotelId: hotelInfo.hotelId,
      name: hotelInfo.name,
      slug: slug,
      location: hotelInfo.location
    });

    // Return success response with deleted hotel info
    return NextResponse.json({
      success: true,
      message: `Hotel "${hotelInfo.name}" deleted successfully`,
      data: {
        hotelId: hotelInfo.hotelId,
        name: hotelInfo.name,
        slug: slug,
        location: hotelInfo.location,
        deletedAt: new Date().toISOString(),
        deletedBy: user.email
      }
    });

  } catch (error: any) {
    console.error('Delete hotel API error:', error);

    // Log error to audit trail
    AuditLog.createLog({
      action: AuditAction.CONTENT_DELETED,
      level: AuditLevel.ERROR,
      userId: user.uid,
      userEmail: user.email,
      ip: audit.ipAddress || 'unknown',
      userAgent: audit.userAgent,
      resource: 'hotel',
      resourceId: hotelInfo?.hotelId || params.slug,
      details: {
        slug: params.slug,
        hotelName: hotelInfo?.name || 'Unknown',
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
        message: 'An unexpected error occurred while deleting the hotel' 
      },
      { status: 500 }
    );
  }
});