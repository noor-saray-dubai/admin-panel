import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { parse } from "cookie";
import { DecodedIdToken } from "firebase-admin/auth";

interface AuthenticatedUser {
  email: string;
  uid: string;
  emailVerified: boolean;
  customClaims?: Record<string, any>;
}

interface AuthResult {
  user: AuthenticatedUser | null;
  error: string | null;
}

interface AuditContext {
  email: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Extract and verify user authentication from request
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  try {
    // Extract session cookie
    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = parse(cookieHeader);
    const sessionCookie = cookies.__session;

    if (!sessionCookie) {
      return { user: null, error: "No session cookie found" };
    }

    // Verify the session cookie
    let decodedToken: DecodedIdToken;
    try {
      decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    } catch (error: any) {
      console.error("Session cookie verification failed:", error.message);
      
      // Handle specific Firebase auth errors
      if (error.code === 'auth/session-cookie-expired') {
        return { user: null, error: "Session expired" };
      } else if (error.code === 'auth/session-cookie-revoked') {
        return { user: null, error: "Session revoked" };
      } else if (error.code === 'auth/invalid-session-cookie') {
        return { user: null, error: "Invalid session" };
      }
      
      return { user: null, error: "Authentication failed" };
    }

    // Verify user still exists and is active
    try {
      const userRecord = await adminAuth.getUser(decodedToken.uid);
      
      if (userRecord.disabled) {
        return { user: null, error: "User account is disabled" };
      }

      return {
        user: {
          email: decodedToken.email!,
          uid: decodedToken.uid,
          emailVerified: decodedToken.email_verified || false,
          customClaims: decodedToken
        },
        error: null
      };
    } catch (userError: any) {
      console.error("User verification failed:", userError.message);
      return { user: null, error: "User not found or inactive" };
    }

  } catch (error: any) {
    console.error("Authentication error:", error);
    return { user: null, error: "Internal authentication error" };
  }
}

/**
 * Create audit context from request and authenticated user
 */
export function createAuditContext(
  request: NextRequest, 
  user: AuthenticatedUser
): AuditContext {
  // Extract IP address (handle various proxy headers)
  const getClientIP = (req: NextRequest): string => {
    const xForwardedFor = req.headers.get('x-forwarded-for');
    const xRealIP = req.headers.get('x-real-ip');
    const cfConnectingIP = req.headers.get('cf-connecting-ip'); // Cloudflare
    const forwarded = req.headers.get('forwarded');
    
    if (xForwardedFor) {
      return xForwardedFor.split(',')[0].trim();
    }
    
    if (xRealIP) return xRealIP;
    if (cfConnectingIP) return cfConnectingIP;
    
    if (forwarded) {
      const match = forwarded.match(/for=([^;,\s]+)/);
      if (match) return match[1];
    }
    
    return 'unknown';
  };

  return {
    email: user.email.toLowerCase().trim(),
    timestamp: new Date(),
    ipAddress: getClientIP(request),
    userAgent: request.headers.get('user-agent') || undefined
  };
}

/**
 * Middleware-style auth wrapper for API routes
 */
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, context: { user: AuthenticatedUser, audit: AuditContext }, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    // Authenticate request
    const authResult = await authenticateRequest(request);
    
    if (authResult.error || !authResult.user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "UNAUTHORIZED", 
          message: authResult.error || "Authentication required" 
        }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Create audit context
    const auditContext = createAuditContext(request, authResult.user);

    try {
      // Call the actual handler with authenticated context
      return await handler(request, { user: authResult.user, audit: auditContext }, ...args);
    } catch (error: any) {
      console.error("Handler error:", error);
      
      // Don't expose internal errors to client
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "INTERNAL_ERROR", 
          message: "An internal server error occurred" 
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  };
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim().toLowerCase());
}

/**
 * Create rate limiting key from request
 */
export function createRateLimitKey(request: NextRequest, user?: AuthenticatedUser): string {
  if (user) {
    return `user:${user.uid}`;
  }
  
  // Fallback to IP-based limiting for unauthenticated requests
  const xForwardedFor = request.headers.get('x-forwarded-for');
  const ip = xForwardedFor ? xForwardedFor.split(',')[0].trim() : 'unknown';
  return `ip:${ip}`;
}

/**
 * Sanitize user data for logging (remove sensitive information)
 */
export function sanitizeUserForLogging(user: AuthenticatedUser) {
  return {
    email: user.email.replace(/(.{2}).*@/, '$1***@'), // Mask email
    uid: user.uid.substring(0, 8) + '***', // Mask UID
    emailVerified: user.emailVerified
  };
}

/**
 * Check if user has required permissions (placeholder for future role-based access)
 */
export function hasPermission(user: AuthenticatedUser, permission: string): boolean {
  // For now, all authenticated users have all permissions
  // In the future, implement role-based access control
  
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
  const isAdmin = adminEmails.includes(user.email);
  
  if (isAdmin) return true;
  
  // Default permissions for regular users
  const allowedPermissions = ['read', 'create', 'update'];
  return allowedPermissions.includes(permission.toLowerCase());
}

// Note: Permission checking is now handled by the withAuth wrapper
// Individual resource permissions can be added here if needed in the future
