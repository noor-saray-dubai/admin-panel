// app/api/sessionLogin/route.ts - WITH REDIS CACHE PRE-WARMING

import { adminAuth } from "@/lib/firebaseAdmin";
import { connectToDatabase } from "@/lib/db";
import { EnhancedUser, UserStatus } from "@/models/enhancedUser";
import { AuditLog, AuditAction, AuditLevel } from "@/models/auditLog";
import { redis, CACHE_KEYS, CACHE_TTL } from "@/lib/redis/redisClient";

export async function POST(req: Request) {
  const startTime = Date.now();
  console.log('🔐 Login attempt started');
  
  // Set a timeout for the entire login process
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Login timeout after 25 seconds')), 25000)
  );
  
  // Get client info for audit logging
  const clientInfo = {
    ip: req.headers.get('x-forwarded-for') || 
         req.headers.get('x-real-ip') || 
         'unknown',
    userAgent: req.headers.get('user-agent') || 'unknown',
    origin: req.headers.get('origin') || 'unknown'
  };
  
  const loginProcess = async () => {
    const { firebaseUid, email, rememberMe } = await req.json();
    console.log('🕰️ [LOGIN] Processing login for:', email);
    
    // Get the Authorization header with the ID token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      await logFailedLogin(firebaseUid, email, 'Missing or invalid authorization header', clientInfo);
      return new Response(JSON.stringify({ error: "Authentication token required" }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    const idToken = authHeader.substring(7);
    
    if (!firebaseUid || !email || !idToken) {
      await logFailedLogin(firebaseUid, email, 'Missing required authentication data', clientInfo);
      return new Response(JSON.stringify({ error: "Authentication data required" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Verify the ID token with Firebase Admin
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
      
      if (decodedToken.uid !== firebaseUid) {
        await logFailedLogin(firebaseUid, email, 'UID mismatch in token', clientInfo);
        return new Response(JSON.stringify({ error: "Invalid authentication token" }), { 
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }
    } catch (tokenError: any) {
      console.error('ID token verification failed:', tokenError);
      await logFailedLogin(firebaseUid, email, `Token verification failed: ${tokenError.code}`, clientInfo);
      return new Response(JSON.stringify({ error: "Invalid authentication token" }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Connect to database for user checks (with timeout logging)
    console.log('🚀 [LOGIN] Connecting to database...');
    const dbStart = Date.now();
    await connectToDatabase();
    console.log(`✅ [LOGIN] Database connected in ${Date.now() - dbStart}ms`);
    
    // Check if user exists in MongoDB using Firebase UID
    const user = await EnhancedUser.findOne({ firebaseUid });
    
    if (!user) {
      await logFailedLogin(null, email, 'User not found in database', clientInfo);
      return new Response(JSON.stringify({ error: "Invalid credentials" }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Check if user account is active
    if (user.status === UserStatus.SUSPENDED) {
      await logFailedLogin(user.firebaseUid, email, 'Account suspended', clientInfo);
      return new Response(JSON.stringify({ error: "Account is suspended. Contact administrator." }), { 
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    if (user.status === UserStatus.DELETED) {
      await logFailedLogin(user.firebaseUid, email, 'Account deleted', clientInfo);
      return new Response(JSON.stringify({ error: "Account not found" }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // 🎆 AUTO-ACTIVATE INVITED USERS ON FIRST LOGIN
    let statusChanged = false;
    if (user.status === UserStatus.INVITED) {
      console.log(`🚀 First login detected for invited user: ${email}`);
      console.log(`🔄 Changing status from INVITED to ACTIVE`);
      
      user.status = UserStatus.ACTIVE;
      await user.save();
      statusChanged = true;
      
      console.log(`✅ User status updated to ACTIVE for ${email}`);
    }
    
    // Check if user is locked due to too many failed attempts
    if (user.isLocked && user.isLocked()) {
      await logFailedLogin(user.firebaseUid, email, 'Account temporarily locked', clientInfo);
      return new Response(JSON.stringify({ 
        error: "Account is temporarily locked due to multiple failed login attempts. Try again later." 
      }), { 
        status: 423,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Set session expiration
    const expiresIn = rememberMe
      ? 60 * 60 * 24 * 5 * 1000 // 5 days in ms
      : 60 * 60 * 24 * 1 * 1000; // 1 day in ms

    // Create session cookie from ID token (with timing)
    console.log('🍪 [LOGIN] Creating Firebase session cookie...');
    const sessionStart = Date.now();
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    console.log(`✅ [LOGIN] Session cookie created in ${Date.now() - sessionStart}ms`);

    // Update user login information
    const loginTime = new Date();
    await EnhancedUser.updateOne(
      { firebaseUid: user.firebaseUid },
      {
        $set: {
          lastLogin: loginTime,
          loginAttempts: 0
        },
        $unset: {
          lockedUntil: ""
        }
      }
    );

    // Prepare user response (transform to ClientUser format)
    const userResponse = {
      _id: user._id.toString(),
      firebaseUid: user.firebaseUid,
      email: user.email,
      displayName: user.displayName,
      fullRole: user.fullRole,
      department: user.department,
      status: user.status, // This will be ACTIVE if statusChanged occurred
      collectionPermissions: user.collectionPermissions,
      permissionOverrides: user.permissionOverrides,
      profileImage: user.profileImage,
      phone: user.phone,
      address: user.address,
      bio: user.bio,
      lastLogin: loginTime.toISOString(),
      loginAttempts: 0,
      createdAt: user.createdAt,
      updatedAt: loginTime.toISOString()
    };

    // ✅ PRE-WARM REDIS CACHE FOR INSTANT NAVIGATION
    let cachePreWarmed = false;
    try {
      const cacheKey = CACHE_KEYS.user(user.firebaseUid);
      
      // Store as JSON string for consistency
      await redis.setex(
        cacheKey, 
        CACHE_TTL.USER_DATA, 
        JSON.stringify(userResponse)
      );
      
      cachePreWarmed = true;
      console.log(`💾 User cached on login: ${user.firebaseUid} (6 hours TTL)`);
    } catch (cacheError) {
      console.error('❌ Redis cache pre-warm error:', cacheError);
      // Don't fail login if cache fails - graceful degradation
    }

    // Create comprehensive audit log for successful login
    await AuditLog.create({
      action: AuditAction.USER_LOGIN,
      success: true,
      level: AuditLevel.INFO,
      userId: user.firebaseUid,
      userEmail: email,
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      resource: 'auth',
      details: {
        loginTime: loginTime.toISOString(),
        sessionDuration: rememberMe ? '5 days' : '1 day',
        userRole: user.fullRole,
        userStatus: user.status,
        statusChanged: statusChanged,
        statusChangeType: statusChanged ? 'INVITED → ACTIVE' : null,
        firstLogin: statusChanged,
        rememberMe,
        origin: clientInfo.origin,
        processingTime: Date.now() - startTime,
        cachePreWarmed
      },
      timestamp: loginTime
    });
    
    // 📝 Create additional audit log for status change if it occurred
    if (statusChanged) {
      await AuditLog.create({
        action: AuditAction.USER_UPDATED,
        success: true,
        level: AuditLevel.INFO,
        userId: user.firebaseUid,
        userEmail: email,
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        resource: 'user_status',
        details: {
          statusChange: 'INVITED → ACTIVE',
          reason: 'Automatic activation on first login',
          triggeredBy: 'system',
          loginTime: loginTime.toISOString()
        },
        timestamp: loginTime
      });
    }

    // Create Set-Cookie header
    const cookieValue = `__session=${sessionCookie}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${
      expiresIn / 1000
    };${process.env.NODE_ENV === "production" ? " Secure;" : ""}`;

    const statusMessage = statusChanged ? ' | Status: INVITED → ACTIVE' : '';
    console.log(`✅ Login successful for ${email} in ${Date.now() - startTime}ms (cached: ${cachePreWarmed})${statusMessage}`);
    
    return new Response(JSON.stringify({ 
      success: true,
      user: userResponse
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": cookieValue,
        "Cache-Control": "no-cache, no-store, must-revalidate"
      },
    });
  };
  
  // Race between login process and timeout
  try {
    const result = await Promise.race([loginProcess(), timeoutPromise]);
    return result as Response;
  } catch (error: any) {
    console.error('❌ [LOGIN] Process failed:', error.message);
    
    // Handle timeout specifically
    if (error.message.includes('timeout')) {
      return new Response(JSON.stringify({ 
        error: "Login is taking longer than expected. Please try again.",
        code: "TIMEOUT"
      }), { 
        status: 408, // Request Timeout
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Original error handling for non-timeout errors
    console.error("❌ Session login error:", error);
    try {
      await AuditLog.create({
        action: AuditAction.USER_LOGIN,
        success: false,
        level: AuditLevel.ERROR,
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        resource: 'auth',
        errorMessage: error.message,
        details: {
          error: 'System error during login',
          processingTime: Date.now() - startTime
        },
        timestamp: new Date()
      });
    } catch (auditError) {
      console.error('Failed to log system error:', auditError);
    }
    
    return new Response(JSON.stringify({ error: "Login failed. Please try again." }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// Helper function to log failed login attempts
async function logFailedLogin(
  firebaseUid: string | null, 
  email: string | null, 
  reason: string, 
  clientInfo: any
) {
  try {
    await AuditLog.create({
      action: AuditAction.USER_LOGIN,
      success: false,
      level: AuditLevel.WARNING,
      userId: firebaseUid,
      userEmail: email,
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      resource: 'auth',
      errorMessage: reason,
      details: {
        failureReason: reason,
        origin: clientInfo.origin,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date()
    });
  } catch (auditError) {
    console.error('Failed to log failed login attempt:', auditError);
  }
}