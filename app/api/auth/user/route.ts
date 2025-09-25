import { NextRequest, NextResponse } from 'next/server';
import { createAuthService } from '@/lib/auth/AuthService';
import { FirebaseAdminService } from '@/lib/firebaseAdmin';
import { 
  ClientUser, 
  FullRole, 
  UserStatus, 
  Collection, 
  SubRole as ClientSubRole,
  CollectionPermission as ClientCollectionPermission 
} from '@/types/user';
import { 
  IEnhancedUser, 
  CollectionPermission as ServerCollectionPermission,
  SubRole as ServerSubRole 
} from '@/models/enhancedUser';

// Mapping between server and client SubRole enums
const SUB_ROLE_MAPPING: Record<ServerSubRole, ClientSubRole> = {
  [ServerSubRole.OBSERVER]: ClientSubRole.OBSERVER,
  [ServerSubRole.CONTRIBUTOR]: ClientSubRole.CONTRIBUTOR,
  [ServerSubRole.EDITOR]: ClientSubRole.CONTRIBUTOR, // Map EDITOR to CONTRIBUTOR
  [ServerSubRole.MODERATOR]: ClientSubRole.MODERATOR,
  [ServerSubRole.MANAGER]: ClientSubRole.MODERATOR,   // Map MANAGER to MODERATOR
  [ServerSubRole.ADMIN]: ClientSubRole.COLLECTION_ADMIN, // Map ADMIN to COLLECTION_ADMIN
};

// Transform server CollectionPermission to client CollectionPermission
function transformCollectionPermission(serverPermission: ServerCollectionPermission): ClientCollectionPermission {
  return {
    collection: serverPermission.collection, // Collection enum should be the same
    subRole: SUB_ROLE_MAPPING[serverPermission.subRole] || ClientSubRole.OBSERVER,
    customActions: serverPermission.customActions,
    restrictions: serverPermission.restrictions
  };
}

// Transform EnhancedUser to ClientUser structure
function transformToClientUser(enhancedUser: IEnhancedUser): ClientUser {
  return {
    _id: enhancedUser._id?.toString(),
    firebaseUid: enhancedUser.firebaseUid,
    email: enhancedUser.email,
    displayName: enhancedUser.displayName,
    fullRole: enhancedUser.fullRole,
    status: enhancedUser.status,
    collectionPermissions: enhancedUser.collectionPermissions.map(transformCollectionPermission),
    permissionOverrides: enhancedUser.permissionOverrides.map(transformCollectionPermission),
    department: enhancedUser.department,
    phone: enhancedUser.phone,
    address: enhancedUser.address,
    bio: enhancedUser.bio,
    profileImage: enhancedUser.profileImage,
    loginAttempts: enhancedUser.loginAttempts || 0,
    lastLogin: enhancedUser.lastLogin,
    lockedUntil: enhancedUser.lockedUntil,
    createdBy: enhancedUser.createdBy?.toString(),
    approvedBy: enhancedUser.approvedBy?.toString(),
    createdAt: enhancedUser.createdAt,
    updatedAt: enhancedUser.updatedAt,
    updatedBy: enhancedUser.updatedBy?.toString()
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

    console.log('✅ User authenticated successfully:', clientUser.email);

    return NextResponse.json({ 
      success: true, 
      user: clientUser 
    });

  } catch (error) {
    console.error('❌ Auth user API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}