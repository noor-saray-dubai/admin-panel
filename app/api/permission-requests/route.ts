import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { adminAuth } from "@/lib/firebaseAdmin";
import { PermissionRequest, RequestStatus, IPermissionRequest } from "@/models/permissionRequest";
import { EnhancedUser, FullRole, Collection, SubRole } from "@/models/enhancedUser";
import { AuditLog, AuditAction, AuditLevel } from "@/models/auditLog";
import { parse } from "cookie";

// POST - Submit a new permission request
export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = parse(cookieHeader);
    const sessionCookie = cookies.__session;
    
    if (!sessionCookie) {
      return NextResponse.json({
        success: false,
        error: "Authentication required"
      }, { status: 401 });
    }
    
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userFirebaseUid = decodedToken.uid;
    
    // 2. Get current user
    await connectToDatabase();
    const currentUser = await EnhancedUser.findOne({ firebaseUid: userFirebaseUid });
    
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: "User profile not found"
      }, { status: 404 });
    }
    
    // 3. Prevent super admins from making requests (they already have all access)
    if (currentUser.fullRole === FullRole.SUPER_ADMIN) {
      return NextResponse.json({
        success: false,
        error: "Super administrators already have all permissions"
      }, { status: 400 });
    }
    
    // 4. Parse and validate request data
    const body = await request.json();
    const {
      requestedPermissions,
      message,
      businessJustification,
      requestedExpiry,
      priority = 'normal'
    } = body;
    
    // Validation
    if (!requestedPermissions || !Array.isArray(requestedPermissions) || requestedPermissions.length === 0) {
      return NextResponse.json({
        success: false,
        error: "At least one permission must be requested"
      }, { status: 400 });
    }
    
    if (!message || message.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: "Message explaining the request is required"
      }, { status: 400 });
    }
    
    // Validate requested permissions format
    for (const perm of requestedPermissions) {
      if (!Object.values(Collection).includes(perm.collection) || 
          !Object.values(SubRole).includes(perm.subRole)) {
        return NextResponse.json({
          success: false,
          error: "Invalid permission format"
        }, { status: 400 });
      }
    }
    
    // 5. Check for duplicate permissions (same collection-subrole combination)
    const permissionKeys = new Set();
    for (const perm of requestedPermissions) {
      const key = `${perm.collection}-${perm.subRole}`;
      if (permissionKeys.has(key)) {
        return NextResponse.json({
          success: false,
          error: "Duplicate permissions detected"
        }, { status: 400 });
      }
      permissionKeys.add(key);
    }
    
    // 6. Filter out permissions user already has
    const currentPermissions = currentUser.collectionPermissions || [];
    const newPermissions = requestedPermissions.filter(requested => {
      return !currentPermissions.some(current => 
        current.collection === requested.collection && 
        current.subRole === requested.subRole
      );
    });
    
    if (newPermissions.length === 0) {
      return NextResponse.json({
        success: false,
        error: "You already have all the requested permissions"
      }, { status: 400 });
    }
    
    // 7. Check for existing pending request with overlapping permissions
    const existingPendingRequests = await PermissionRequest.find({
      requestedBy: userFirebaseUid,
      status: RequestStatus.PENDING
    });
    
    const hasOverlappingRequest = existingPendingRequests.some(existingRequest => 
      existingRequest.requestedPermissions.some(existing => 
        newPermissions.some(requested => 
          existing.collection === requested.collection && 
          existing.subRole === requested.subRole
        )
      )
    );
    
    if (hasOverlappingRequest) {
      return NextResponse.json({
        success: false,
        error: "You already have a pending request for some of these permissions"
      }, { status: 400 });
    }
    
    // 8. Parse expiry date
    let parsedExpiry = null;
    if (requestedExpiry && requestedExpiry !== 'permanent') {
      parsedExpiry = new Date(requestedExpiry);
      if (isNaN(parsedExpiry.getTime()) || parsedExpiry <= new Date()) {
        return NextResponse.json({
          success: false,
          error: "Invalid expiry date - must be in the future"
        }, { status: 400 });
      }
    }
    
    // 9. Create permission request
    const permissionRequest = new PermissionRequest({
      requestedBy: userFirebaseUid,
      requestedByEmail: currentUser.email,
      requestedByName: currentUser.displayName,
      requestedPermissions: newPermissions,
      message: message.trim(),
      businessJustification: businessJustification?.trim() || '',
      requestedExpiry: parsedExpiry,
      priority: priority,
      status: RequestStatus.PENDING
    });
    
    await permissionRequest.save();
    
    // 10. Create audit log
    const clientInfo = {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent')
    };
    
    await AuditLog.create({
      action: AuditAction.USER_UPDATED, // Using existing enum value
      success: true,
      level: AuditLevel.INFO,
      userId: userFirebaseUid,
      userEmail: currentUser.email,
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      resource: 'permission_request',
      details: {
        action: 'permission_request_created',
        requestedPermissions: newPermissions,
        message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
        expiry: parsedExpiry?.toISOString() || 'permanent',
        priority: priority
      },
      timestamp: new Date()
    });
    
    return NextResponse.json({
      success: true,
      message: "Permission request submitted successfully",
      requestId: permissionRequest._id,
      requestedPermissions: newPermissions
    });
    
  } catch (error: any) {
    console.error('Error creating permission request:', error);
    
    return NextResponse.json({
      success: false,
      error: "Failed to submit permission request",
      details: error.message
    }, { status: 500 });
  }
}

// GET - Get permission requests (user's own requests or all for admins)
export async function GET(request: NextRequest) {
  try {
    // 1. Verify authentication
    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = parse(cookieHeader);
    const sessionCookie = cookies.__session;
    
    if (!sessionCookie) {
      return NextResponse.json({
        success: false,
        error: "Authentication required"
      }, { status: 401 });
    }
    
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userFirebaseUid = decodedToken.uid;
    
    // 2. Get current user
    await connectToDatabase();
    const currentUser = await EnhancedUser.findOne({ firebaseUid: userFirebaseUid });
    
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: "User profile not found"
      }, { status: 404 });
    }
    
    const isAdmin = [FullRole.ADMIN, FullRole.SUPER_ADMIN].includes(currentUser.fullRole);
    
    // 3. Get URL parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // 4. Build query
    let query: any = {};
    
    if (isAdmin) {
      // Admins can see all requests, optionally filtered
      if (status) query.status = status;
      if (userId) query.requestedBy = userId;
    } else {
      // Regular users can only see their own requests
      query.requestedBy = userFirebaseUid;
      if (status) query.status = status;
    }
    
    // 5. Fetch requests
    const requests = await PermissionRequest.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);
    
    // 6. Get summary stats for admins
    let stats = null;
    if (isAdmin) {
      const [pending, approved, rejected] = await Promise.all([
        PermissionRequest.countDocuments({ status: RequestStatus.PENDING }),
        PermissionRequest.countDocuments({ status: RequestStatus.APPROVED }),
        PermissionRequest.countDocuments({ status: RequestStatus.REJECTED })
      ]);
      
      stats = { pending, approved, rejected, total: pending + approved + rejected };
    }
    
    return NextResponse.json({
      success: true,
      requests: requests.map(req => ({
        _id: req._id,
        requestedBy: req.requestedBy,
        requestedByName: req.requestedByName,
        requestedByEmail: req.requestedByEmail,
        requestedPermissions: req.requestedPermissions,
        message: req.message,
        businessJustification: req.businessJustification,
        requestedExpiry: req.requestedExpiry,
        status: req.status,
        priority: req.priority,
        reviewedBy: req.reviewedByName,
        reviewedAt: req.reviewedAt,
        reviewNotes: req.reviewNotes,
        grantedPermissions: req.grantedPermissions,
        createdAt: req.createdAt,
        updatedAt: req.updatedAt
      })),
      stats,
      isAdmin
    });
    
  } catch (error: any) {
    console.error('Error fetching permission requests:', error);
    
    return NextResponse.json({
      success: false,
      error: "Failed to fetch permission requests",
      details: error.message
    }, { status: 500 });
  }
}

// PATCH - Review permission request (approve/reject)
export async function PATCH(request: NextRequest) {
  try {
    // 1. Verify authentication
    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = parse(cookieHeader);
    const sessionCookie = cookies.__session;
    
    if (!sessionCookie) {
      return NextResponse.json({
        success: false,
        error: "Authentication required"
      }, { status: 401 });
    }
    
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userFirebaseUid = decodedToken.uid;
    
    // 2. Get current user and verify admin rights
    await connectToDatabase();
    const currentUser = await EnhancedUser.findOne({ firebaseUid: userFirebaseUid });
    
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: "User profile not found"
      }, { status: 404 });
    }
    
    // Only admins and super admins can review requests
    const isAdmin = [FullRole.ADMIN, FullRole.SUPER_ADMIN].includes(currentUser.fullRole);
    if (!isAdmin) {
      return NextResponse.json({
        success: false,
        error: "Insufficient permissions - admin access required"
      }, { status: 403 });
    }
    
    // 3. Parse request data
    const body = await request.json();
    const {
      requestId,
      action, // 'approve' or 'reject'
      reviewNotes,
      grantedPermissions, // For partial approvals
      grantedExpiry
    } = body;
    
    // Validation
    if (!requestId) {
      return NextResponse.json({
        success: false,
        error: "Request ID is required"
      }, { status: 400 });
    }
    
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({
        success: false,
        error: "Action must be 'approve' or 'reject'"
      }, { status: 400 });
    }
    
    // 4. Find the permission request
    const permissionRequest = await PermissionRequest.findById(requestId);
    if (!permissionRequest) {
      return NextResponse.json({
        success: false,
        error: "Permission request not found"
      }, { status: 404 });
    }
    
    // Check if already reviewed
    if (permissionRequest.status !== RequestStatus.PENDING) {
      return NextResponse.json({
        success: false,
        error: `Request has already been ${permissionRequest.status}`
      }, { status: 400 });
    }
    
    // 5. Update request status
    const newStatus = action === 'approve' ? RequestStatus.APPROVED : RequestStatus.REJECTED;
    
    permissionRequest.status = newStatus;
    permissionRequest.reviewedBy = userFirebaseUid;
    permissionRequest.reviewedByEmail = currentUser.email;
    permissionRequest.reviewedByName = currentUser.displayName;
    permissionRequest.reviewedAt = new Date();
    permissionRequest.reviewNotes = reviewNotes || '';
    
    if (action === 'approve') {
      // Use granted permissions if provided, otherwise use requested permissions
      permissionRequest.grantedPermissions = grantedPermissions || permissionRequest.requestedPermissions;
      
      // Set granted expiry
      if (grantedExpiry) {
        permissionRequest.grantedExpiry = new Date(grantedExpiry);
      } else if (permissionRequest.requestedExpiry) {
        permissionRequest.grantedExpiry = permissionRequest.requestedExpiry;
      }
      
      // 6. Grant actual permissions to user
      const targetUser = await EnhancedUser.findOne({ firebaseUid: permissionRequest.requestedBy });
      if (!targetUser) {
        return NextResponse.json({
          success: false,
          error: "Target user not found"
        }, { status: 404 });
      }
      
      // Add new permissions to user
      const currentPermissions = targetUser.collectionPermissions || [];
      const newPermissions = [...currentPermissions];
      
      for (const grantedPerm of permissionRequest.grantedPermissions) {
        // Check if user already has this permission
        const existingIndex = newPermissions.findIndex(p => 
          p.collection === grantedPerm.collection && p.subRole === grantedPerm.subRole
        );
        
        if (existingIndex === -1) {
          // Add new permission
          newPermissions.push({
            collection: grantedPerm.collection,
            subRole: grantedPerm.subRole,
            grantedBy: userFirebaseUid,
            grantedAt: new Date(),
            expiresAt: permissionRequest.grantedExpiry || null
          });
        } else {
          // Update existing permission
          newPermissions[existingIndex] = {
            ...newPermissions[existingIndex],
            grantedBy: userFirebaseUid,
            grantedAt: new Date(),
            expiresAt: permissionRequest.grantedExpiry || null
          };
        }
      }
      
      targetUser.collectionPermissions = newPermissions;
      await targetUser.save();
    }
    
    await permissionRequest.save();
    
    // 7. Create audit log
    const clientInfo = {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent')
    };
    
    await AuditLog.create({
      action: AuditAction.USER_UPDATED,
      success: true,
      level: AuditLevel.INFO,
      userId: userFirebaseUid,
      userEmail: currentUser.email,
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      resource: 'permission_request',
      details: {
        action: `permission_request_${action}d`,
        requestId: requestId,
        targetUser: permissionRequest.requestedBy,
        targetUserEmail: permissionRequest.requestedByEmail,
        permissions: action === 'approve' ? permissionRequest.grantedPermissions : permissionRequest.requestedPermissions,
        reviewNotes: reviewNotes || 'No notes provided'
      },
      timestamp: new Date()
    });
    
    return NextResponse.json({
      success: true,
      message: `Permission request ${action}d successfully`,
      request: {
        _id: permissionRequest._id,
        status: permissionRequest.status,
        reviewedBy: permissionRequest.reviewedByName,
        reviewedAt: permissionRequest.reviewedAt,
        reviewNotes: permissionRequest.reviewNotes,
        grantedPermissions: permissionRequest.grantedPermissions
      }
    });
    
  } catch (error: any) {
    console.error('Error reviewing permission request:', error);
    
    return NextResponse.json({
      success: false,
      error: "Failed to review permission request",
      details: error.message
    }, { status: 500 });
  }
}
