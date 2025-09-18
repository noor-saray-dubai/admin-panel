// app/api/users/[firebaseUid]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { adminAuth } from "@/lib/firebaseAdmin";
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
import { ZeroTrustChecker, ZeroTrustGuards, SystemCapability } from "@/lib/auth/zeroTrust";
import { parse } from "cookie";

interface UserViewResponse {
  success: boolean;
  user?: {
    _id: string;
    firebaseUid: string;
    email: string;
    displayName: string;
    fullRole: FullRole;
    status: UserStatus;
    collectionPermissions: CollectionPermission[];
    permissionOverrides: CollectionPermission[];
    department?: string;
    phone?: string;
    address?: string;
    bio?: string;
    profileImage?: string;
    createdAt: string;
    updatedAt: string;
    lastLogin?: string;
    loginAttempts: number;
    lockedUntil?: string;
    createdBy?: string;
    approvedBy?: string;
    lastRoleChange?: {
      previousRole: FullRole;
      newRole: FullRole;
      changedBy: string;
      changedAt: string;
      reason?: string;
    };
  };
  availableActions?: {
    canEdit: boolean;
    canDelete: boolean;
    canChangeRole: boolean;
    canChangeStatus: boolean;
    canManagePermissions: boolean;
    canViewSensitiveInfo: boolean;
    canResetPassword: boolean;
    canUnlock: boolean;
  };
  roleHierarchy?: {
    currentUserLevel: number;
    targetUserLevel: number;
    availableRoles: FullRole[];
  };
  auditSummary?: {
    totalActions: number;
    recentActions: Array<{
      action: string;
      timestamp: string;
      performedBy: string;
    }>;
  };
  error?: string;
  details?: string;
}

// GET - Get individual user details with role-based permissions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ firebaseUid: string }> }
): Promise<NextResponse<UserViewResponse>> {
  // Await params in Next.js 15+ (outside try block for scope)
  const resolvedParams = await params;
  
  try {
    
    // Validate firebaseUid parameter
    if (!resolvedParams.firebaseUid || resolvedParams.firebaseUid.trim() === '') {
      console.log('❌ Invalid firebaseUid parameter:', resolvedParams.firebaseUid);
      return NextResponse.json({
        success: false,
        error: "Invalid user ID parameter"
      }, { status: 400 });
    }
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
    const currentUserFirebaseUid = decodedToken.uid;
    
    // 2. Get current user and check permissions
    await connectToDatabase();
    const currentUser = await EnhancedUser.findOne({ firebaseUid: currentUserFirebaseUid });
    
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: "User profile not found"
      }, { status: 404 });
    }
    
    // 3. ZERO TRUST: Only SYSTEM admins can view user details - collection admins CANNOT
    const systemAdminCheck = ZeroTrustGuards.requireSystemAdmin(currentUser);
    const isSuperAdmin = ZeroTrustChecker.isSuperAdmin(currentUser);
    
    if (!systemAdminCheck.allowed) {
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
        targetUserId: resolvedParams.firebaseUid,
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        resource: 'user_details',
        errorMessage: systemAdminCheck.reason || 'Insufficient permissions to view user details',
        details: {
          attemptedAction: 'view_user_details',
          currentUserRole: currentUser.fullRole,
          zeroTrustBlock: true,
          method: 'api_get_user'
        },
        timestamp: new Date()
      });
      
      return NextResponse.json({
        success: false,
        error: systemAdminCheck.reason || "System admin access required"
      }, { status: 403 });
    }
    
    // 4. Get target user
    console.log('🔍 Looking for user with firebaseUid:', resolvedParams.firebaseUid);
    console.log('👤 Current user firebaseUid:', currentUserFirebaseUid);
    console.log('👤 Current user role:', currentUser.fullRole);
    
    const targetUser = await EnhancedUser.findOne({ firebaseUid: resolvedParams.firebaseUid })
      .populate('createdBy', 'displayName email')
      .populate('approvedBy', 'displayName email')
      .populate('lastRoleChange.changedBy', 'displayName email');
    
    if (!targetUser) {
      console.log('❌ Target user not found in database for firebaseUid:', resolvedParams.firebaseUid);
      
      // Let's also check what users exist
      const allUsers = await EnhancedUser.find({}).select('firebaseUid displayName email fullRole').limit(5);
      console.log('📋 Available users in database:', allUsers.map(u => ({ 
        firebaseUid: u.firebaseUid, 
        email: u.email, 
        role: u.fullRole 
      })));
      
      return NextResponse.json({
        success: false,
        error: "User not found"
      }, { status: 404 });
    }
    
    console.log('✅ Found target user:', {
      firebaseUid: targetUser.firebaseUid,
      email: targetUser.email,
      displayName: targetUser.displayName,
      fullRole: targetUser.fullRole
    });
    
    // 5. Role hierarchy and permission checks
    const roleHierarchy = {
      [FullRole.USER]: 1,
      [FullRole.AGENT]: 2,
      [FullRole.MARKETING]: 2,
      [FullRole.SALES]: 2,
      [FullRole.HR]: 2,
      [FullRole.COMMUNITY_MANAGER]: 2,
      [FullRole.ADMIN]: 3,
      [FullRole.SUPER_ADMIN]: 4
    };
    
    const currentUserRoleLevel = roleHierarchy[currentUser.fullRole];
    const targetUserRoleLevel = roleHierarchy[targetUser.fullRole];
    
    // 6. Determine available actions based on role hierarchy
    // Special case: allow viewing own profile regardless of role level
    const isViewingSelf = targetUser.firebaseUid === currentUserFirebaseUid;
    
    const canEdit = isViewingSelf || targetUserRoleLevel < currentUserRoleLevel;
    const canDelete = isSuperAdmin && targetUserRoleLevel < currentUserRoleLevel && !isViewingSelf; // Can't delete self
    const canChangeRole = !isViewingSelf && targetUserRoleLevel < currentUserRoleLevel; // Can't change own role
    const canChangeStatus = !isViewingSelf && targetUserRoleLevel < currentUserRoleLevel; // Can't change own status
    const canManagePermissions = !isViewingSelf && targetUserRoleLevel < currentUserRoleLevel; // Can't change own permissions
    const canViewSensitiveInfo = isSuperAdmin || isViewingSelf || targetUserRoleLevel < currentUserRoleLevel;
    const canResetPassword = targetUserRoleLevel <= currentUserRoleLevel;
    const canUnlock = targetUserRoleLevel <= currentUserRoleLevel;
    
    // 7. Get available roles user can assign
    const getAvailableRoles = (): FullRole[] => {
      const allRoles = Object.values(FullRole);
      
      if (isSuperAdmin) {
        // Super admins can assign all roles except other super admins (for security)
        return allRoles.filter(role => role !== FullRole.SUPER_ADMIN);
      } else {
        // Regular admins cannot assign admin or super admin roles
        return allRoles.filter(role => 
          roleHierarchy[role] < currentUserRoleLevel
        );
      }
    };
    
    // 8. Get audit summary if user has permissions
    let auditSummary = undefined;
    if (canViewSensitiveInfo) {
      try {
        const totalActions = await AuditLog.countDocuments({
          $or: [
            { userId: resolvedParams.firebaseUid },
            { targetUserId: resolvedParams.firebaseUid }
          ]
        });
        
        const recentActions = await AuditLog.find({
          $or: [
            { userId: resolvedParams.firebaseUid },
            { targetUserId: resolvedParams.firebaseUid }
          ]
        })
        .sort({ timestamp: -1 })
        .limit(5)
        .populate('userId', 'displayName email')
        .select('action timestamp userId');
        
        auditSummary = {
          totalActions,
          recentActions: recentActions.map(log => ({
            action: log.action,
            timestamp: log.timestamp.toISOString(),
            performedBy: log.userId?.displayName || 'System'
          }))
        };
      } catch (auditError) {
        console.warn('Failed to fetch audit summary:', auditError);
      }
    }
    
    // 9. Prepare user data based on permissions
    const userData = {
      _id: targetUser._id.toString(),
      firebaseUid: targetUser.firebaseUid,
      email: targetUser.email,
      displayName: targetUser.displayName,
      fullRole: targetUser.fullRole,
      status: targetUser.status,
      collectionPermissions: targetUser.collectionPermissions,
      permissionOverrides: targetUser.permissionOverrides || [],
      department: targetUser.department,
      phone: canViewSensitiveInfo ? targetUser.phone : undefined,
      address: canViewSensitiveInfo ? targetUser.address : undefined,
      bio: targetUser.bio,
      profileImage: targetUser.profileImage,
      createdAt: targetUser.createdAt.toISOString(),
      updatedAt: targetUser.updatedAt.toISOString(),
      lastLogin: canViewSensitiveInfo && targetUser.lastLogin ? 
                 targetUser.lastLogin.toISOString() : undefined,
      loginAttempts: canViewSensitiveInfo ? targetUser.loginAttempts : 0,
      lockedUntil: canViewSensitiveInfo && targetUser.lockedUntil ? 
                   targetUser.lockedUntil.toISOString() : undefined,
      createdBy: targetUser.createdBy?.displayName,
      approvedBy: targetUser.approvedBy?.displayName,
      lastRoleChange: targetUser.lastRoleChange ? {
        previousRole: targetUser.lastRoleChange.previousRole,
        newRole: targetUser.lastRoleChange.newRole,
        changedBy: targetUser.lastRoleChange.changedBy?.displayName || 'System',
        changedAt: targetUser.lastRoleChange.changedAt ? targetUser.lastRoleChange.changedAt.toISOString() : new Date().toISOString(),
        reason: targetUser.lastRoleChange.reason
      } : undefined
    };
    
    // Note: We don't log user view actions to avoid noise in audit trail
    // Only actual changes and security events should be audited
    
    // 11. Return comprehensive response
    return NextResponse.json({
      success: true,
      user: userData,
      availableActions: {
        canEdit,
        canDelete,
        canChangeRole,
        canChangeStatus,
        canManagePermissions,
        canViewSensitiveInfo,
        canResetPassword,
        canUnlock
      },
      roleHierarchy: {
        currentUserLevel: currentUserRoleLevel,
        targetUserLevel: targetUserRoleLevel,
        availableRoles: getAvailableRoles()
      },
      auditSummary
    });
    
  } catch (error: any) {
    console.error('Error fetching user details:', error);
    
    // Create audit log for error
    try {
      const clientInfo = {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent')
      };
      
      await AuditLog.create({
        action: AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT,
        success: false,
        level: AuditLevel.ERROR,
        targetUserId: resolvedParams.firebaseUid,
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        resource: 'user_details',
        errorMessage: error.message,
        details: {
          method: 'api_get_user',
          error: error.stack
        },
        timestamp: new Date()
      });
    } catch (auditError) {
      console.error('Failed to create error audit log:', auditError);
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to fetch user details",
      details: error.message
    }, { status: 500 });
  }
}