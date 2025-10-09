import { NextRequest, NextResponse } from "next/server";
import Property from "@/models/properties";
import { connectToDatabase } from "@/lib/db";
import { withCollectionPermission } from "@/lib/auth/server";
import { Collection, Action } from "@/types/user";
import { rateLimit } from "@/lib/rate-limiter";
import { AuditLog, AuditAction, AuditLevel } from "@/models/auditLog";

export const runtime = "nodejs";

// DELETE - Delete property
async function handler(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
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

    await connectToDatabase();

    const { slug } = await params;

    // Find existing property (check both active and inactive)
    const existingProperty = await Property.findOne({ slug });
    if (!existingProperty) {
      return NextResponse.json(
        { 
          success: false, 
          error: "NOT_FOUND", 
          message: "Property not found" 
        },
        { status: 404 }
      );
    }

    // Extract IP address and user agent for audit
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Store property data for audit log before deletion (including original status)
    const propertyData = {
      id: existingProperty.id,
      name: existingProperty.name,
      propertyType: existingProperty.propertyType,
      price: existingProperty.price,
      location: existingProperty.location.area,
      bedrooms: existingProperty.bedrooms,
      bathrooms: existingProperty.bathrooms
    };
    const wasActiveBeforeDeletion = existingProperty.isActive;

    let deletionType: string;
    let auditAction: any;
    let successMessage: string;
    
    if (existingProperty.isActive) {
      // FIRST DELETE: Soft delete (mark as inactive)
      const softDeletedProperty = await Property.findByIdAndUpdate(
        existingProperty._id,
        { 
          isActive: false,
          updatedBy: {
            email: user.email,
            timestamp: new Date(),
            ipAddress: ipAddress,
            userAgent: userAgent
          }
        },
        { new: true }
      );
      
      if (!softDeletedProperty) {
        return NextResponse.json(
          { 
            success: false, 
            error: "DELETE_FAILED", 
            message: "Failed to deactivate property" 
          },
          { status: 500 }
        );
      }
      
      deletionType = "soft_delete";
      auditAction = AuditAction.CONTENT_DELETED;
      successMessage = "Property deactivated successfully. Delete again to permanently remove.";
      
    } else {
      // SECOND DELETE: Hard delete (permanently remove from database)
      const hardDeletedProperty = await Property.findByIdAndDelete(existingProperty._id);
      
      if (!hardDeletedProperty) {
        return NextResponse.json(
          { 
            success: false, 
            error: "DELETE_FAILED", 
            message: "Failed to permanently delete property" 
          },
          { status: 500 }
        );
      }
      
      deletionType = "hard_delete";
      auditAction = AuditAction.CONTENT_DELETED;
      successMessage = "Property permanently deleted from database.";
    }

    // Log to audit log
    await AuditLog.create({
      action: auditAction,
      level: AuditLevel.INFO,
      userId: user.firebaseUid,
      userEmail: user.email,
      ip: ipAddress,
      userAgent: userAgent,
      resource: "properties",
      resourceId: existingProperty._id.toString(),
      details: {
        propertyId: propertyData.id,
        name: propertyData.name,
        propertyType: propertyData.propertyType,
        price: propertyData.price,
        location: propertyData.location,
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        deletionType: deletionType,
        wasActive: wasActiveBeforeDeletion
      },
      success: true,
      timestamp: new Date()
    });

    // Log successful deletion
    console.log(`Property ${deletionType} successfully by ${user.email}:`, {
      id: propertyData.id,
      name: propertyData.name,
      slug: slug,
      deletionType: deletionType
    });

    return NextResponse.json({
      success: true,
      message: successMessage,
      deletionType: deletionType,
      property: {
        id: propertyData.id,
        name: propertyData.name,
        slug: slug
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error deleting property:", error);

    // Handle MongoDB connection errors
    if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
      return NextResponse.json(
        { 
          success: false, 
          error: "DATABASE_CONNECTION_ERROR", 
          message: "Database connection failed. Please try again." 
        },
        { status: 503 }
      );
    }

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
export const DELETE = withCollectionPermission(Collection.PROPERTIES, Action.DELETE)(handler);
