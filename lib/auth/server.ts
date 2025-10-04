/**
 * 🔐 SERVER-SIDE AUTH UTILITIES
 * 
 * This file contains server-side auth utilities that can use 'next/headers'
 * and other server-only functions. Should only be imported in API routes
 * and server components.
 */

import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebaseAdmin';
import { connectToDatabase } from '@/lib/db';
import { EnhancedUser } from '@/models/enhancedUser';
import { ClientUser as IEnhancedUser, FullRole, Collection, Action, SubRole } from '@/types/user';
import { ZeroTrustChecker, CollectionCapability } from './zeroTrust';
import { SessionValidationService, SessionValidationError } from './sessionValidationService';

// Re-export everything from AuthService (our business logic)
export * from './AuthService';

/**
 * 🛡️ SERVER-SIDE AUTH UTILITIES
 * Single source for server authentication
 */
export class UnifiedServerAuth {
  
  /**
   * Get authenticated user from request (works with any token source)
   */
  static async getAuthenticatedUser(request: NextRequest): Promise<{
    user?: IEnhancedUser;
    error?: string;
    status?: number;
  }> {
    try {
      const { token, isSessionCookie } = this.extractToken(request);
      if (!token) {
        return { error: 'No authentication token found', status: 401 };
      }

      // Verify Firebase token based on type (with caching for session cookies)
      let decodedToken;
      if (isSessionCookie) {
        // Use SessionValidationService for session cookies (cached)
        const validationResult = await SessionValidationService.validateSession(token);
        if (!validationResult.valid) {
          // Type assertion since we know validationResult is SessionValidationError when valid is false
          const errorResult = validationResult as SessionValidationError;
          return { error: errorResult.error || 'Invalid session', status: 401 };
        }
        // Create a mock decodedToken structure for compatibility
        decodedToken = {
          uid: validationResult.uid!,
          email: validationResult.email,
          role: validationResult.role
        };
      } else {
        // Use verifyIdToken for regular ID tokens (no caching as these are short-lived)
        decodedToken = await adminAuth.verifyIdToken(token);
      }
      
      if (!decodedToken) {
        return { error: 'Invalid authentication token', status: 401 };
      }

      // Get user from database
      await connectToDatabase();
      
      const user = await EnhancedUser.findOne({ 
        firebaseUid: decodedToken.uid,
        status: { $in: ['active', 'ACTIVE', 'invited', 'INVITED'] } // Support INVITED users too
      });
      
      // 🎆 AUTO-ACTIVATE INVITED USERS (backup for server-side auth flows)
      if (user && (user.status === 'invited' || user.status === 'INVITED')) {
        console.log(`🚀 [ServerAuth] Auto-activating invited user: ${user.email}`);
        user.status = 'ACTIVE';
        await user.save();
        console.log(`✅ [ServerAuth] User status updated to ACTIVE for ${user.email}`);
      }

      if (!user) {
        return { error: 'User not found or inactive', status: 404 };
      }

      // Check if account is locked
      if (user.isLocked && user.isLocked()) {
        return { error: 'Account is temporarily locked', status: 423 };
      }

      return { user };
    } catch (error) {
      console.error('Server auth error:', error);
      return { 
        error: 'Authentication failed', 
        status: 500
      };
    }
  }

  /**
   * Get authenticated user from server components (cookie-based)
   */
  static async getCurrentUserFromCookies(): Promise<{
    user: IEnhancedUser | null;
    error?: string;
  }> {
    try {
      const cookieStore = cookies();
      const sessionCookie = (await cookieStore).get('__session')?.value;

      if (!sessionCookie) {
        return { user: null, error: 'no_session' };
      }

      // Verify session with SessionValidationService (cached)
      const validationResult = await SessionValidationService.validateSession(sessionCookie);
      if (!validationResult.valid) {
        return { user: null, error: 'session_invalid' };
      }
      const firebaseUid = validationResult.uid!;

      // Connect to database and get user
      await connectToDatabase();
      const user = await EnhancedUser.findOne({ firebaseUid }).lean();

      if (!user) {
        return { user: null, error: 'user_not_found' };
      }

      return { user: user as unknown as IEnhancedUser };
    } catch (error) {
      console.error('Error getting current user:', error);
      return { user: null, error: 'auth_error' };
    }
  }

  /**
   * Extract Firebase token from request and identify type
   */
  private static extractToken(request: NextRequest): { token: string | null; isSessionCookie: boolean } {
    // Try authorization header (these are usually ID tokens)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return { token: authHeader.substring(7), isSessionCookie: false };
    }

    // Try session cookie first (this is a session cookie)
    const sessionCookie = request.cookies.get('__session')?.value;
    if (sessionCookie) {
      return { token: sessionCookie, isSessionCookie: true };
    }

    // Try other token cookies (these are usually ID tokens)
    const idTokenCookie = request.cookies.get('firebase-token')?.value ||
                         request.cookies.get('auth-token')?.value;
    if (idTokenCookie) {
      return { token: idTokenCookie, isSessionCookie: false };
    }

    return { token: null, isSessionCookie: false };
  }
}

/**
 * 🔒 SERVER API ROUTE PROTECTION
 * Higher-Order Components for API route protection using ZeroTrust
 */

/**
 * Require authentication
 */
export function withAuth(handler: Function) {
  return async function (request: NextRequest, context: any) {
    const authResult = await UnifiedServerAuth.getAuthenticatedUser(request);
    
    if (authResult.error) {
      return Response.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    // Add user to request context
    (request as any).user = authResult.user;
    
    return handler(request, context);
  };
}

/**
 * Require specific collection permission (uses ZeroTrust)
 */
export function withCollectionPermission(collection: Collection, action: Action) {
  return function (handler: Function) {
    return async function (request: NextRequest, context: any) {
      const authResult = await UnifiedServerAuth.getAuthenticatedUser(request);
      
      if (authResult.error) {
        return Response.json(
          { error: authResult.error },
          { status: authResult.status }
        );
      }

      const { user } = authResult;
      
      // Map Action to CollectionCapability
      const actionToCapability: Partial<Record<Action, any>> = {
        [Action.VIEW]: CollectionCapability.VIEW_COLLECTION,
        [Action.ADD]: CollectionCapability.CREATE_CONTENT,
        [Action.EDIT]: CollectionCapability.EDIT_CONTENT,
        [Action.DELETE]: CollectionCapability.DELETE_CONTENT,
        [Action.APPROVE]: CollectionCapability.MODERATE_CONTENT,
        [Action.REJECT]: CollectionCapability.MODERATE_CONTENT,
        [Action.PUBLISH]: CollectionCapability.MODERATE_CONTENT,
        [Action.UNPUBLISH]: CollectionCapability.MODERATE_CONTENT,
      };

      const requiredCapability = actionToCapability[action];
      
      if (!requiredCapability) {
        return Response.json(
          { error: `Invalid action: ${action}` },
          { status: 400 }
        );
      }
      
      const hasPermission = ZeroTrustChecker.hasCollectionCapability(user!, collection, requiredCapability);
      
      if (!hasPermission) {
        return Response.json(
          { error: `Insufficient permissions. Required: ${action} on ${collection}` },
          { status: 403 }
        );
      }

      (request as any).user = authResult.user;
      return handler(request, context);
    };
  };
}

/**
 * Require system admin (uses ZeroTrust)
 */
export function withSystemAdmin(handler: Function) {
  return async function (request: NextRequest, context: any) {
    const authResult = await UnifiedServerAuth.getAuthenticatedUser(request);
    
    if (authResult.error) {
      return Response.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { user } = authResult;
    
    if (!ZeroTrustChecker.isSystemAdmin(user!)) {
      return Response.json(
        { error: 'System admin access required' },
        { status: 403 }
      );
    }

    (request as any).user = authResult.user;
    return handler(request, context);
  };
}

/**
 * Require super admin (uses ZeroTrust)
 */
export function withSuperAdmin(handler: Function) {
  return async function (request: NextRequest, context: any) {
    const authResult = await UnifiedServerAuth.getAuthenticatedUser(request);
    
    if (authResult.error) {
      return Response.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { user } = authResult;
    
    if (!ZeroTrustChecker.isSuperAdmin(user!)) {
      return Response.json(
        { error: 'Super admin access required' },
        { status: 403 }
      );
    }

    (request as any).user = authResult.user;
    return handler(request, context);
  };
}