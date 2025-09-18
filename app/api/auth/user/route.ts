import { NextRequest, NextResponse } from 'next/server';
import { createAuthService } from '@/lib/auth/AuthService';
import { FirebaseAdminService } from '@/lib/firebaseAdmin';
import { ClientUser, FullRole, UserStatus, Collection, SubRole } from '@/types/user';
import { IEnhancedUser } from '@/models/enhancedUser';

// Transform EnhancedUser to ClientUser structure
function transformToClientUser(enhancedUser: IEnhancedUser): ClientUser {
  return {
    _id: enhancedUser._id?.toString(),
    firebaseUid: enhancedUser.firebaseUid,
    email: enhancedUser.email,
    displayName: enhancedUser.displayName,
    fullRole: enhancedUser.fullRole,
    status: enhancedUser.status,
    collectionPermissions: enhancedUser.collectionPermissions,
    permissionOverrides: enhancedUser.permissionOverrides,
    department: enhancedUser.department,
    phone: enhancedUser.phone,
    address: enhancedUser.address,
    bio: enhancedUser.bio,
    profileImage: enhancedUser.profileImage,
    loginAttempts: enhancedUser.loginAttempts || 0,
    lastLogin: enhancedUser.lastLogin,
    lastPasswordChange: undefined, // Not in current structure
    createdBy: enhancedUser.createdBy?.toString(),
    createdAt: enhancedUser.createdAt,
    updatedAt: enhancedUser.updatedAt
  };
}

export async function POST(request: NextRequest) {
  try {
    const { firebaseUid } = await request.json();
    console.log('🔍 Auth API called with Firebase UID:', firebaseUid);

    if (!firebaseUid) {
      console.log('❌ No Firebase UID provided');
      return NextResponse.json(
        { error: 'Firebase UID is required' },
        { status: 400 }
      );
    }

    // Get client IP
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const userAgent = request.headers.get('user-agent') || undefined;

    // Create auth service instance
    const authService = createAuthService({
      ip,
      userAgent,
    });

    // Authenticate user and get MongoDB data
    const user = await authService.authenticateUser(firebaseUid);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 404 }
      );
    }

    // Transform to ClientUser structure
    const clientUser = transformToClientUser(user);

    return NextResponse.json({ 
      success: true, 
      user: clientUser 
    });

  } catch (error) {
    console.error('Auth user API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}