// app/api/users/manage/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { adminAuth } from "@/lib/firebaseAdmin";
import { SessionValidationService, SessionValidationError, ValidatedSession } from "@/lib/auth/sessionValidationService";
import { AuditLog, AuditAction, AuditLevel } from "@/models/auditLog";
import {
  Collection,
  Action,
  FullRole,
  SubRole,
  UserStatus,
  IEnhancedUser,
  CollectionPermission,
  EnhancedUser
} from "@/models/enhancedUser";
import { parse } from "cookie";
type RoleHierarchy = Record<FullRole, number>;
// GET - List all users with pagination and filtering
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // ⚡ Verify authentication with cached session validation
    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = parse(cookieHeader);
    const sessionCookie = cookies.__session;

    if (!sessionCookie) {
      return NextResponse.json({
        success: false,
        error: "Authentication required"
      }, { status: 401 });
    }

    // Use cached session validation for 97% performance improvement
    const validationResult = await SessionValidationService.validateSession(sessionCookie);
    
    if (!validationResult.valid) {
      return NextResponse.json({
        success: false,
        error: "Authentication required"
      }, { status: 401 });
    }
    
    // Type assertion since we know validationResult is ValidatedSession when valid is true
    const validatedSession = validationResult as ValidatedSession;
    const currentUserFirebaseUid = validatedSession.uid!;

    // Get current user and check permissions using EnhancedUser
    await connectToDatabase();
    const currentUser = await EnhancedUser.findOne({ firebaseUid: currentUserFirebaseUid });

    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: "User profile not found"
      }, { status: 404 });
    }

    // Only admins and super admins can view users
    const isAdmin = [FullRole.ADMIN, FullRole.SUPER_ADMIN].includes(currentUser.fullRole);

    if (!isAdmin) {
      return NextResponse.json({
        success: false,
        error: "Only admins and super admins can view users"
      }, { status: 403 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    const status = url.searchParams.get('status');
    const role = url.searchParams.get('role');
    const search = url.searchParams.get('search');

    // Build filter criteria
    const filter: any = {};

    if (status && Object.values(UserStatus).includes(status as UserStatus)) {
      filter.status = status;
    }

    if (role && Object.values(FullRole).includes(role as FullRole)) {
      filter.fullRole = role;
    }

    if (search) {
      filter.$or = [
        { displayName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    // Get users with pagination using EnhancedUser model directly
    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const users = await EnhancedUser.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await EnhancedUser.countDocuments(filter);

    // Remove sensitive information
    const sanitizedUsers = users.map(user => ({
      _id: user._id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      displayName: user.displayName,
      fullRole: user.fullRole,
      status: user.status,
      collectionPermissions: user.collectionPermissions,
      department: user.department,
      phone: user.phone,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
      loginAttempts: user.loginAttempts,
      createdBy: user.createdBy
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: sanitizedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        status,
        role,
        search,
        sortBy,
        sortOrder
      }
    });

  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch users",
      details: error.message
    }, { status: 500 });
  }
}

// PUT - Update user (status, role, permissions)
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    // ⚡ Verify authentication with cached session validation
    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = parse(cookieHeader);
    const sessionCookie = cookies.__session;

    if (!sessionCookie) {
      return NextResponse.json({
        success: false,
        error: "Authentication required"
      }, { status: 401 });
    }

    // Use cached session validation for 97% performance improvement
    const validationResult = await SessionValidationService.validateSession(sessionCookie);
    
    if (!validationResult.valid) {
      return NextResponse.json({
        success: false,
        error: "Authentication required"
      }, { status: 401 });
    }
    
    // Type assertion since we know validationResult is ValidatedSession when valid is true
    const validatedSession = validationResult as ValidatedSession;
    const currentUserFirebaseUid = validatedSession.uid!;

    // Get current user and check permissions using EnhancedUser
    await connectToDatabase();
    const currentUser = await EnhancedUser.findOne({ firebaseUid: currentUserFirebaseUid });

    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: "User profile not found"
      }, { status: 404 });
    }

    // Only admins and super admins can edit users
    const isAdmin = [FullRole.ADMIN, FullRole.SUPER_ADMIN].includes(currentUser.fullRole);
    const isSuperAdmin = currentUser.fullRole === FullRole.SUPER_ADMIN;

    if (!isAdmin) {
      // Create audit log for unauthorized access attempt
      const clientInfo = {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent')
      };

      await AuditLog.create({
        action: AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT,
        success: false,
        level: AuditLevel.WARNING,
        userId: currentUserFirebaseUid,
        userEmail: currentUser.email,
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        resource: 'users',
        errorMessage: 'Insufficient permissions to edit users',
        details: {
          attemptedAction: 'edit_user',
          currentUserRole: currentUser.fullRole,
          method: 'api_update_user'
        },
        timestamp: new Date()
      });

      return NextResponse.json({
        success: false,
        error: "Only admins and super admins can edit users"
      }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const {
      firebaseUid,
      updates
    }: {
      firebaseUid: string;
      updates: {
        displayName?: string;
        fullRole?: FullRole;
        status?: UserStatus;
        collectionPermissions?: CollectionPermission[];
        department?: string;
        phoneNumber?: string;
      }
    } = body;

    if (!firebaseUid || !updates) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: firebaseUid, updates"
      }, { status: 400 });
    }

    // Get target user using EnhancedUser model
    const targetUser = await EnhancedUser.findOne({ firebaseUid });

    if (!targetUser) {
      return NextResponse.json({
        success: false,
        error: "Target user not found"
      }, { status: 404 });
    }

    // Role hierarchy check - can't edit users with equal or higher roles
    // STRICT ENFORCEMENT: No self-editing allowed in admin management interface
    const roleHierarchy: RoleHierarchy = {
      [FullRole.USER]: 1,
      [FullRole.AGENT]: 2,
      [FullRole.MARKETING]: 2,
      [FullRole.SALES]: 2,
      [FullRole.HR]: 2,
      [FullRole.COMMUNITY_MANAGER]: 2,
      [FullRole.ADMIN]: 3,
      [FullRole.SUPER_ADMIN]: 4
    };
    const currentUserRoleLevel = roleHierarchy[currentUser.fullRole as FullRole];
    const targetUserRoleLevel = roleHierarchy[targetUser.fullRole as FullRole];

    // Admin management interface: strict role hierarchy - no self-editing allowed
    // For self-editing, users should use the dedicated profile settings page
    if (targetUserRoleLevel >= currentUserRoleLevel) {
      return NextResponse.json({
        success: false,
        error: "Cannot edit user with equal or higher role than your own. Use Profile Settings to edit your own profile."
      }, { status: 403 });
    }

    // If updating role, check new role level and admin creation restrictions
    if (updates.fullRole) {
      const newRoleLevel = roleHierarchy[updates.fullRole];

      // Only super admins can assign admin roles
      if (updates.fullRole === FullRole.ADMIN && !isSuperAdmin) {
        return NextResponse.json({
          success: false,
          error: "Only super admins can assign admin roles"
        }, { status: 403 });
      }

      // Cannot assign super admin roles via API for security
      if (updates.fullRole === FullRole.SUPER_ADMIN) {
        return NextResponse.json({
          success: false,
          error: "Super admin roles cannot be assigned via API for security reasons"
        }, { status: 403 });
      }

      // Role level restrictions
      if (newRoleLevel >= currentUserRoleLevel) {
        return NextResponse.json({
          success: false,
          error: "Cannot assign role equal or higher than your own"
        }, { status: 403 });
      }

      // Additional check: Regular admins cannot demote other admins or super admins
      if (!isSuperAdmin && targetUserRoleLevel >= 3) { // Admin or Super Admin
        return NextResponse.json({
          success: false,
          error: "Only super admins can modify admin-level users"
        }, { status: 403 });
      }
    }

    // Store original values for audit log
    const originalValues = {
      displayName: targetUser.displayName,
      fullRole: targetUser.fullRole,
      status: targetUser.status,
      collectionPermissions: targetUser.collectionPermissions,
      department: targetUser.department,
      phoneNumber: targetUser.phoneNumber
    };

    // Update user in MongoDB using EnhancedUser model
    Object.assign(targetUser, {
      ...updates,
      updatedAt: new Date(),
      updatedBy: currentUser._id
    });

    const updatedUser = await targetUser.save();

    // Update Firebase custom claims if role or permissions changed
    if (updates.fullRole || updates.collectionPermissions) {
      const newRole = updates.fullRole || targetUser.fullRole;
      const newPermissions = updates.collectionPermissions || targetUser.collectionPermissions;

      await adminAuth.setCustomUserClaims(firebaseUid, {
        role: newRole,
        permissions: newPermissions.map((p: { collection: any; subRole: any; }) => `${p.collection}:${p.subRole}`)
      });
    }

    // Update Firebase user profile if display name changed
    if (updates.displayName) {
      await adminAuth.updateUser(firebaseUid, {
        displayName: updates.displayName
      });
    }

    // Create audit log
    const clientInfo = {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent')
    };

    await AuditLog.create({
      action: AuditAction.USER_UPDATED,
      success: true,
      level: AuditLevel.INFO,
      userId: currentUserFirebaseUid,
      userEmail: currentUser.email,
      targetUserId: firebaseUid,
      targetUserEmail: targetUser.email,
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      resource: 'users',
      details: {
        updatedBy: currentUser.displayName,
        originalValues,
        updates,
        method: 'api_update_user'
      },
      timestamp: new Date()
    });

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: {
        firebaseUid: updatedUser.firebaseUid,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        fullRole: updatedUser.fullRole,
        status: updatedUser.status,
        collectionPermissions: updatedUser.collectionPermissions
      }
    });

  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({
      success: false,
      error: "Failed to update user",
      details: error.message
    }, { status: 500 });
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    // ⚡ Verify authentication with cached session validation
    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = parse(cookieHeader);
    const sessionCookie = cookies.__session;

    if (!sessionCookie) {
      return NextResponse.json({
        success: false,
        error: "Authentication required"
      }, { status: 401 });
    }

    // Use cached session validation for 97% performance improvement
    const validationResult = await SessionValidationService.validateSession(sessionCookie);
    
    if (!validationResult.valid) {
      return NextResponse.json({
        success: false,
        error: "Authentication required"
      }, { status: 401 });
    }
    
    // Type assertion since we know validationResult is ValidatedSession when valid is true
    const validatedSession = validationResult as ValidatedSession;
    const currentUserFirebaseUid = validatedSession.uid!;

    // Get current user and check permissions using EnhancedUser
    await connectToDatabase();
    const currentUser = await EnhancedUser.findOne({ firebaseUid: currentUserFirebaseUid });

    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: "User profile not found"
      }, { status: 404 });
    }

    // Only super admins can delete users (more restrictive)
    if (currentUser.fullRole !== FullRole.SUPER_ADMIN) {
      // Create audit log for unauthorized delete attempt
      const clientInfo = {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent')
      };

      await AuditLog.create({
        action: AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT,
        success: false,
        level: AuditLevel.WARNING,
        userId: currentUserFirebaseUid,
        userEmail: currentUser.email,
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        resource: 'users',
        errorMessage: 'Attempted user deletion without super admin privileges',
        details: {
          attemptedAction: 'delete_user',
          currentUserRole: currentUser.fullRole,
          method: 'api_delete_user'
        },
        timestamp: new Date()
      });

      return NextResponse.json({
        success: false,
        error: "Only super admins can delete users"
      }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { firebaseUid }: { firebaseUid: string } = body;

    if (!firebaseUid) {
      return NextResponse.json({
        success: false,
        error: "Missing required field: firebaseUid"
      }, { status: 400 });
    }

    // Can't delete yourself
    if (firebaseUid === currentUserFirebaseUid) {
      return NextResponse.json({
        success: false,
        error: "Cannot delete your own account"
      }, { status: 400 });
    }

    // Get target user using EnhancedUser model
    const targetUser = await EnhancedUser.findOne({ firebaseUid });

    if (!targetUser) {
      return NextResponse.json({
        success: false,
        error: "Target user not found"
      }, { status: 404 });
    }

    // Role hierarchy check
    const roleHierarchy: RoleHierarchy = {
      [FullRole.USER]: 1,
      [FullRole.AGENT]: 2,
      [FullRole.MARKETING]: 2,
      [FullRole.SALES]: 2,
      [FullRole.HR]: 2,
      [FullRole.COMMUNITY_MANAGER]: 2,
      [FullRole.ADMIN]: 3,
      [FullRole.SUPER_ADMIN]: 4
    };

    const currentUserRoleLevel = roleHierarchy[currentUser.fullRole as FullRole];
    const targetUserRoleLevel = roleHierarchy[targetUser.fullRole as FullRole];

    if (targetUserRoleLevel >= currentUserRoleLevel) {
      return NextResponse.json({
        success: false,
        error: "Cannot delete user with equal or higher role than your own"
      }, { status: 403 });
    }

    // Delete from Firebase first
    await adminAuth.deleteUser(firebaseUid);

    // Delete from MongoDB using EnhancedUser model
    await EnhancedUser.findOneAndDelete({ firebaseUid });

    // Create audit log
    const clientInfo = {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent')
    };

    await AuditLog.create({
      action: AuditAction.USER_DELETED,
      success: true,
      level: AuditLevel.WARNING,
      userId: currentUserFirebaseUid,
      userEmail: currentUser.email,
      targetUserId: firebaseUid,
      targetUserEmail: targetUser.email,
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      resource: 'users',
      details: {
        deletedBy: currentUser.displayName,
        deletedUser: {
          displayName: targetUser.displayName,
          fullRole: targetUser.fullRole,
          status: targetUser.status
        },
        method: 'api_delete_user'
      },
      timestamp: new Date()
    });

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.displayName} deleted successfully`
    });

  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({
      success: false,
      error: "Failed to delete user",
      details: error.message
    }, { status: 500 });
  }
}