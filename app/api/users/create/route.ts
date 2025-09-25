import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { FirebaseAdminService, adminAuth } from "@/lib/firebaseAdmin";
import { createAuthService } from "@/lib/auth/AuthService";
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
import { ZeroTrustChecker, SystemCapability } from "@/lib/auth/zeroTrust";
import { parse } from "cookie";
import crypto from "crypto";

// Input validation schema
interface CreateUserRequest {
  email: string;
  displayName: string;
  fullRole: FullRole;
  collectionPermissions: CollectionPermission[];
  status?: UserStatus;
  department?: string;
  phoneNumber?: string;
  sendInvitation?: boolean;
}

// Response interfaces
interface CreateUserSuccess {
  success: true;
  user: {
    firebaseUid: string;
    email: string;
    displayName: string;
    fullRole: FullRole;
    status: UserStatus;
    invitationSent?: boolean;
    tempPassword?: string; // Only for development/testing
  };
  message: string;
}

interface CreateUserError {
  success: false;
  error: string;
  details?: string;
}

// Role hierarchy type definition
type RoleHierarchy = Record<FullRole, number>;

// Helper function to validate collection permissions
function validateCollectionPermissions(permissions: CollectionPermission[]): boolean {
  const validCollections = Object.values(Collection);
  const validSubRoles = Object.values(SubRole);
  
  return permissions.every(p => 
    validCollections.includes(p.collection) && 
    validSubRoles.includes(p.subRole)
  );
}

// Helper function to validate full role
function validateFullRole(role: string): role is FullRole {
  return Object.values(FullRole).includes(role as FullRole);
}

export async function POST(request: NextRequest): Promise<NextResponse<CreateUserSuccess | CreateUserError>> {
  console.log('🚀 Create User API called');
  const startTime = Date.now();
  
  try {
    // 1. Get current user from session cookie
    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = parse(cookieHeader);
    const sessionCookie = cookies.__session;
    
    if (!sessionCookie) {
      return NextResponse.json({
        success: false,
        error: "Authentication required"
      }, { status: 401 });
    }
    
    // Verify session and get current user
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    const currentUserFirebaseUid = decodedToken.uid;
    
    // Get current user's MongoDB profile using EnhancedUser model
    await connectToDatabase();
    const currentUser = await EnhancedUser.findOne({ firebaseUid: currentUserFirebaseUid });
    
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: "User profile not found"
      }, { status: 404 });
    }
    
    // 🛡️ ZERO TRUST: Check if current user has MANAGE_USERS capability
    const canManageUsers = ZeroTrustChecker.hasSystemCapability(
      currentUser, 
      SystemCapability.MANAGE_USERS
    );
    
    if (!canManageUsers) {
      // Log unauthorized access attempt with Zero Trust details
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
        errorMessage: `Zero Trust: Unauthorized user creation attempt by ${currentUser.fullRole}`,
        details: {
          attemptedAction: 'create_user',
          userRole: currentUser.fullRole,
          requiredCapability: SystemCapability.MANAGE_USERS,
          isSystemAdmin: ZeroTrustChecker.isSystemAdmin(currentUser),
          securitySystem: 'ZeroTrust',
          method: 'api_create_user'
        },
        timestamp: new Date()
      });
      
      return NextResponse.json({
        success: false,
        error: "User management requires system admin privileges"
      }, { status: 403 });
    }
    
    // 3. Parse and validate request body
    let body: CreateUserRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: "Invalid JSON in request body"
      }, { status: 400 });
    }
    
    const {
      email,
      displayName,
      fullRole,
      collectionPermissions,
      status = UserStatus.INVITED,
      department,
      phoneNumber,
      sendInvitation = true
    } = body;
    
    // 4. Validate required fields
    if (!email || !displayName || !fullRole || !collectionPermissions) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: email, displayName, fullRole, collectionPermissions"
      }, { status: 400 });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: "Invalid email format"
      }, { status: 400 });
    }
    
    // Validate full role
    if (!validateFullRole(fullRole)) {
      return NextResponse.json({
        success: false,
        error: `Invalid full role. Must be one of: ${Object.values(FullRole).join(', ')}`
      }, { status: 400 });
    }
    
    // Validate collection permissions
    if (!validateCollectionPermissions(collectionPermissions)) {
      return NextResponse.json({
        success: false,
        error: "Invalid collection permissions"
      }, { status: 400 });
    }
    
    // 5. Role hierarchy and admin creation restrictions - FIXED TYPE SAFETY
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
    
    // Type-safe role level access
    const currentUserRoleLevel = roleHierarchy[currentUser.fullRole as FullRole];
    const newUserRoleLevel = roleHierarchy[fullRole];
    
    // Additional safety check - ensure we have valid role levels
    if (currentUserRoleLevel === undefined || newUserRoleLevel === undefined) {
      return NextResponse.json({
        success: false,
        error: "Invalid role detected in hierarchy check"
      }, { status: 400 });
    }
    
    // Only super admins can create admin roles
    if (fullRole === FullRole.ADMIN && currentUser.fullRole !== FullRole.SUPER_ADMIN) {
      return NextResponse.json({
        success: false,
        error: "Only super admins can create admin users"
      }, { status: 403 });
    }
    
    // Cannot create super admin roles at all via API (security measure)
    if (fullRole === FullRole.SUPER_ADMIN) {
      return NextResponse.json({
        success: false,
        error: "Super admin users cannot be created via API for security reasons"
      }, { status: 403 });
    }
    
    // General role hierarchy check
    if (newUserRoleLevel >= currentUserRoleLevel) {
      return NextResponse.json({
        success: false,
        error: "Cannot create user with equal or higher role than your own"
      }, { status: 403 });
    }
    
    // 6. Check if user already exists
    try {
      await FirebaseAdminService.getUserByEmail(email);
      return NextResponse.json({
        success: false,
        error: "User with this email already exists"
      }, { status: 409 });
    } catch (error: any) {
      // If user doesn't exist, this is good - continue
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }
    
    // 7. Generate temporary password and create Firebase user
    const tempPassword = FirebaseAdminService.generateTempPassword();
    
    const { user: firebaseUser } = await FirebaseAdminService.createUserWithTempPassword({
      email,
      displayName
    });
    
    console.log(`✅ Firebase user created: ${firebaseUser.uid}`);
    
    // 8. Set Firebase custom claims
    await FirebaseAdminService.setCustomUserClaims(firebaseUser.uid, {
      role: fullRole,
      permissions: collectionPermissions.map(p => `${p.collection}:${p.subRole}`)
    });
    
    console.log('✅ Custom claims set');
    
    // 9. Create MongoDB user document using EnhancedUser model
    const userDoc = new EnhancedUser({
      firebaseUid: firebaseUser.uid,
      email,
      displayName,
      fullRole,
      status,
      collectionPermissions,
      permissionOverrides: [],
      loginAttempts: 0,
      department,
      phoneNumber: phoneNumber,
      createdBy: currentUser._id,
      lastLogin: undefined
    });
    
    const result = await userDoc.save();
    console.log('✅ MongoDB user created');
    
    // 10. Send invitation email if requested
    let invitationSent = false;
    let passwordResetLink = '';
    
    if (sendInvitation) {
      try {
        // Generate Firebase password reset link
        passwordResetLink = await FirebaseAdminService.sendPasswordResetEmail(email);
        
        // Import EmailService dynamically to avoid import issues
        const { default: EmailService } = await import('@/lib/emailService');
        
        // Send the actual email with the reset link
        await EmailService.sendPasswordReset(email, displayName, passwordResetLink);
        
        invitationSent = true;
        console.log('✅ Invitation email sent via SMTP');
      } catch (error) {
        console.warn('⚠️ Failed to send invitation email:', error);
        // Don't fail the user creation if email fails
      }
    }
    
    // 11. Create audit log
    const clientInfo = {
      ip: request.headers.get('x-forwarded-for') || 
          request.headers.get('x-real-ip') || 
          'unknown',
      userAgent: request.headers.get('user-agent')
    };
    
    await AuditLog.create({
      action: AuditAction.USER_CREATED,
      success: true,
      level: AuditLevel.INFO,
      userId: currentUserFirebaseUid,
      userEmail: currentUser.email,
      targetUserId: firebaseUser.uid,
      targetUserEmail: email,
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      resource: 'users',
      details: {
        fullRole,
        collectionPermissions,
        status,
        department,
        invitationSent,
        createdBy: currentUser.displayName,
        method: 'api_create_user'
      },
      timestamp: new Date()
    });
    
    console.log('✅ Audit log created');
    
    // 12. Prepare response
    const responseData: CreateUserSuccess = {
      success: true,
      user: {
        firebaseUid: firebaseUser.uid,
        email,
        displayName,
        fullRole,
        status,
        invitationSent
      },
      message: `User ${displayName} created successfully`
    };
    
    // Add temp password in development mode only
    if (process.env.NODE_ENV === 'development' && !sendInvitation) {
      responseData.user.tempPassword = tempPassword;
    }
    
    const processingTime = Date.now() - startTime;
    console.log(`🎉 User creation completed successfully in ${processingTime}ms`);
    
    return NextResponse.json(responseData, { status: 201 });
    
  } catch (error: any) {
    console.error('❌ User creation error:', error);
    
    // Create audit log for failed attempt
    try {
      const clientInfo = {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent')
      };
      
      await AuditLog.create({
        action: AuditAction.USER_CREATED,
        success: false,
        level: AuditLevel.ERROR,
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        resource: 'users',
        errorMessage: error.message,
        details: {
          method: 'api_create_user',
          processingTime: Date.now() - startTime
        },
        timestamp: new Date()
      });
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
    }
    
    // Return appropriate error response
    const statusCode = error.code === 'auth/email-already-exists' ? 409 : 
                      error.code === 'auth/invalid-email' ? 400 : 
                      500;
    
    return NextResponse.json({
      success: false,
      error: "Failed to create user",
      details: error.message
    }, { status: statusCode });
  }
}

// GET method to retrieve user creation form data (collections, roles, etc.)
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication
    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = parse(cookieHeader);
    const sessionCookie = cookies.__session;
    
    if (!sessionCookie) {
      return NextResponse.json({
        error: "Authentication required"
      }, { status: 401 });
    }
    
    // Verify session
    await adminAuth.verifySessionCookie(sessionCookie, true);
    
    // Type-safe role hierarchy for GET endpoint
    const roleHierarchy: Record<FullRole, { level: number; description: string }> = {
      [FullRole.USER]: {
        level: 1,
        description: "Basic user with limited access"
      },
      [FullRole.AGENT]: {
        level: 2,
        description: "Agent with specialized access"
      },
      [FullRole.MARKETING]: {
        level: 2,
        description: "Marketing team member"
      },
      [FullRole.SALES]: {
        level: 2,
        description: "Sales team member"
      },
      [FullRole.HR]: {
        level: 2,
        description: "HR team member"
      },
      [FullRole.COMMUNITY_MANAGER]: {
        level: 2,
        description: "Community management role"
      },
      [FullRole.ADMIN]: {
        level: 3,
        description: "Administrator with broad access"
      },
      [FullRole.SUPER_ADMIN]: {
        level: 4,
        description: "Super administrator with full access"
      }
    };
    
    // Return form data
    return NextResponse.json({
      success: true,
      data: {
        fullRoles: Object.values(FullRole),
        collections: Object.values(Collection),
        subRoles: Object.values(SubRole),
        userStatuses: Object.values(UserStatus),
        roleHierarchy
      }
    });
    
  } catch (error: any) {
    return NextResponse.json({
      error: "Failed to retrieve form data",
      details: error.message
    }, { status: 500 });
  }
}