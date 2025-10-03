// app/api/auth/user/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createAuthService } from '@/lib/auth/AuthService';
import { redis, CACHE_KEYS, CACHE_TTL } from '@/lib/redis/redisClient';
import { 
  ClientUser, 
  SubRole as ClientSubRole,
  CollectionPermission as ClientCollectionPermission 
} from '@/types/user';
import { 
  IEnhancedUser, 
  CollectionPermission as ServerCollectionPermission,
} from '@/models/enhancedUser';

// Mapping between server and client SubRole enums
const SUB_ROLE_MAPPING: Record<string, ClientSubRole> = {
  'observer': ClientSubRole.OBSERVER,
  'contributor': ClientSubRole.CONTRIBUTOR,
  'moderator': ClientSubRole.MODERATOR,
  'admin': ClientSubRole.COLLECTION_ADMIN,
  'collection_admin': ClientSubRole.COLLECTION_ADMIN,
  'editor': ClientSubRole.CONTRIBUTOR,
  'manager': ClientSubRole.MODERATOR,
};

function transformCollectionPermission(serverPermission: ServerCollectionPermission): ClientCollectionPermission {
  const subRole = serverPermission.subRole as string;
  const mappedSubRole = SUB_ROLE_MAPPING[subRole] || ClientSubRole.OBSERVER;
  
  return {
    collection: serverPermission.collection,
    subRole: mappedSubRole,
    customActions: serverPermission.customActions,
    restrictions: serverPermission.restrictions
  };
}

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

// 🐛 DEBUG: Track request sources
let requestCounter = 0;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = ++requestCounter;
  
  // 🐛 DEBUG: Log request details
  console.log(`\n═══════════════════════════════════════════════════════`);
  console.log(`🔍 [API #${requestId}] /api/auth/user called at ${new Date().toISOString()}`);
  console.log(`📍 [API #${requestId}] Referer: ${request.headers.get('referer') || 'NONE'}`);
  console.log(`📍 [API #${requestId}] Origin: ${request.headers.get('origin') || 'NONE'}`);
  console.log(`📍 [API #${requestId}] User-Agent: ${request.headers.get('user-agent')?.substring(0, 50) || 'NONE'}...`);
  console.log(`📍 [API #${requestId}] X-Requested-With: ${request.headers.get('x-requested-with') || 'NONE'}`);
  console.log(`📍 [API #${requestId}] Content-Type: ${request.headers.get('content-type') || 'NONE'}`);
  
  // Log all custom headers that might indicate source
  const customHeaders: string[] = [];
  request.headers.forEach((value, key) => {
    if (key.startsWith('x-') || key.startsWith('sec-')) {
      customHeaders.push(`${key}: ${value}`);
    }
  });
  if (customHeaders.length > 0) {
    console.log(`📍 [API #${requestId}] Custom Headers:`, customHeaders.join(', '));
  }
  
  try {
    const { firebaseUid } = await request.json();
    console.log(`🔍 [API #${requestId}] Firebase UID: ${firebaseUid}`);

    if (!firebaseUid) {
      console.log(`❌ [API #${requestId}] No Firebase UID provided`);
      return NextResponse.json(
        { error: 'Firebase UID is required' },
        { status: 400 }
      );
    }

    // Check Redis cache first
    const cacheKey = CACHE_KEYS.user(firebaseUid);
    let clientUser: ClientUser | null = null;

    try {
      const redisStart = Date.now();
      const cachedData = await redis.get(cacheKey);
      const redisTime = Date.now() - redisStart;
      
      if (cachedData) {
        const parseStart = Date.now();
        clientUser = typeof cachedData === 'string' 
          ? JSON.parse(cachedData) 
          : cachedData;
        const parseTime = Date.now() - parseStart;
        
        const totalTime = Date.now() - startTime;
        console.log(`🎯 [API #${requestId}] Cache HIT | Redis: ${redisTime}ms | Parse: ${parseTime}ms | Total: ${totalTime}ms`);
        console.log(`═══════════════════════════════════════════════════════\n`);
        
        return NextResponse.json({ 
          success: true, 
          user: clientUser,
          cached: true 
        });
      }
      
      console.log(`❌ [API #${requestId}] Cache MISS | Redis lookup: ${redisTime}ms`);
    } catch (cacheError) {
      console.error(`⚠️ [API #${requestId}] Redis cache read error:`, cacheError);
    }

    // If not in cache, fetch from database
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const userAgent = request.headers.get('user-agent') || undefined;

    const authService = createAuthService({
      ip,
      userAgent,
    });

    const dbStart = Date.now();
    const user = await authService.authenticateUser(firebaseUid);
    const dbTime = Date.now() - dbStart;

    if (!user) {
      console.log(`❌ [API #${requestId}] User not found or inactive: ${firebaseUid}`);
      console.log(`═══════════════════════════════════════════════════════\n`);
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 404 }
      );
    }

    const transformStart = Date.now();
    clientUser = transformToClientUser(user);
    const transformTime = Date.now() - transformStart;

    // Store in Redis cache
    let cacheWriteTime = 0;
    try {
      const cacheWriteStart = Date.now();
      await redis.setex(
        cacheKey,
        CACHE_TTL.USER_DATA,
        JSON.stringify(clientUser)
      );
      cacheWriteTime = Date.now() - cacheWriteStart;
      console.log(`💾 [API #${requestId}] Cache write: ${cacheWriteTime}ms`);
    } catch (cacheError) {
      console.error(`⚠️ [API #${requestId}] Redis cache write error:`, cacheError);
    }

    const totalTime = Date.now() - startTime;
    console.log(`✅ [API #${requestId}] DB Path | Query: ${dbTime}ms | Transform: ${transformTime}ms | Cache Write: ${cacheWriteTime}ms | Total: ${totalTime}ms`);
    console.log(`✅ [API #${requestId}] User authenticated: ${clientUser.email}`);
    console.log(`═══════════════════════════════════════════════════════\n`);

    return NextResponse.json({ 
      success: true, 
      user: clientUser,
      cached: false 
    });

  } catch (error) {
    console.error(`❌ [API #${requestId}] Auth user API error:`, error);
    console.log(`═══════════════════════════════════════════════════════\n`);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}