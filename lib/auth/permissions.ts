import { NextRequest } from 'next/server';
import { UserRole, Permission, ROLE_PERMISSIONS } from '@/models/user';
import { FirebaseAdminService } from '../firebaseAdmin';
import { createAuthService } from './AuthService';

/**
 * Permission checking utilities
 */
export class PermissionChecker {
  /**
   * Check if a role has a specific permission
   */
  static roleHasPermission(role: UserRole, permission: Permission): boolean {
    const rolePermissions = ROLE_PERMISSIONS[role] || [];
    return rolePermissions.includes(permission);
  }

  /**
   * Check if user has specific permission (including custom permissions)
   */
  static userHasPermission(
    userRole: UserRole, 
    userPermissions: Permission[], 
    permission: Permission
  ): boolean {
    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
    const customPermissions = userPermissions || [];
    return rolePermissions.includes(permission) || customPermissions.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  static userHasAnyPermission(
    userRole: UserRole,
    userPermissions: Permission[],
    permissions: Permission[]
  ): boolean {
    return permissions.some(permission => 
      this.userHasPermission(userRole, userPermissions, permission)
    );
  }

  /**
   * Check if user has all of the specified permissions
   */
  static userHasAllPermissions(
    userRole: UserRole,
    userPermissions: Permission[],
    permissions: Permission[]
  ): boolean {
    return permissions.every(permission => 
      this.userHasPermission(userRole, userPermissions, permission)
    );
  }

  /**
   * Get all permissions for a role
   */
  static getRolePermissions(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Get all permissions for a user (role + custom)
   */
  static getUserPermissions(userRole: UserRole, customPermissions: Permission[] = []): Permission[] {
    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
    return [...new Set([...rolePermissions, ...customPermissions])];
  }
}

/**
 * Server-side authentication and authorization utilities
 */
export class ServerAuthUtils {
  /**
   * Extract Firebase ID token from request
   */
  static extractIdToken(request: NextRequest): string | null {
    // Try multiple sources for the token
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try cookie
    const tokenCookie = request.cookies.get('firebase-token')?.value;
    if (tokenCookie) {
      return tokenCookie;
    }

    return null;
  }

  /**
   * Verify and get user from Firebase token
   */
  static async verifyAndGetUser(request: NextRequest) {
    try {
      const idToken = this.extractIdToken(request);
      if (!idToken) {
        return { error: 'No authentication token found', status: 401 };
      }

      // Verify Firebase token
      const decodedToken = await FirebaseAdminService.verifyIdToken(idToken);
      if (!decodedToken) {
        return { error: 'Invalid authentication token', status: 401 };
      }

      // Get client info
      const ip = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown';
      const userAgent = request.headers.get('user-agent') || undefined;

      // Create auth service and get user data
      const authService = createAuthService({ ip, userAgent });
      const user = await authService.authenticateUser(decodedToken.uid);

      if (!user) {
        return { error: 'User not found or inactive', status: 404 };
      }

      return { user, decodedToken };
    } catch (error) {
      console.error('Auth verification error:', error);
      return { 
        error: 'Authentication verification failed', 
        status: 500,
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if authenticated user has required permission
   */
  static async requirePermission(request: NextRequest, permission: Permission) {
    const authResult = await this.verifyAndGetUser(request);
    
    if ('error' in authResult) {
      return authResult;
    }

    const { user } = authResult;

    // Check permission
    if (!user.hasPermission(permission)) {
      return { 
        error: `Insufficient permissions. Required: ${permission}`, 
        status: 403 
      };
    }

    return { user };
  }

  /**
   * Check if authenticated user has any of the required permissions
   */
  static async requireAnyPermission(request: NextRequest, permissions: Permission[]) {
    const authResult = await this.verifyAndGetUser(request);
    
    if ('error' in authResult) {
      return authResult;
    }

    const { user } = authResult;

    // Check if user has any of the permissions
    const hasAnyPermission = permissions.some(permission => 
      user.hasPermission(permission)
    );

    if (!hasAnyPermission) {
      return { 
        error: `Insufficient permissions. Required any of: ${permissions.join(', ')}`, 
        status: 403 
      };
    }

    return { user };
  }

  /**
   * Check if authenticated user has required role
   */
  static async requireRole(request: NextRequest, role: UserRole) {
    const authResult = await this.verifyAndGetUser(request);
    
    if ('error' in authResult) {
      return authResult;
    }

    const { user } = authResult;

    if (user.role !== role) {
      return { 
        error: `Insufficient role. Required: ${role}, Current: ${user.role}`, 
        status: 403 
      };
    }

    return { user };
  }

  /**
   * Check if authenticated user has any of the required roles
   */
  static async requireAnyRole(request: NextRequest, roles: UserRole[]) {
    const authResult = await this.verifyAndGetUser(request);
    
    if ('error' in authResult) {
      return authResult;
    }

    const { user } = authResult;

    if (!roles.includes(user.role)) {
      return { 
        error: `Insufficient role. Required any of: ${roles.join(', ')}, Current: ${user.role}`, 
        status: 403 
      };
    }

    return { user };
  }

  /**
   * Require admin role (ADMIN or SUPER_ADMIN)
   */
  static async requireAdmin(request: NextRequest) {
    return this.requireAnyRole(request, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  }

  /**
   * Require super admin role
   */
  static async requireSuperAdmin(request: NextRequest) {
    return this.requireRole(request, UserRole.SUPER_ADMIN);
  }
}

/**
 * HOC for protecting API routes with permissions
 */
export function withPermission(permission: Permission) {
  return function (handler: Function) {
    return async function (request: NextRequest, context: any) {
      const authResult = await ServerAuthUtils.requirePermission(request, permission);
      
      if ('error' in authResult) {
        return Response.json(
          { error: authResult.error },
          { status: authResult.status }
        );
      }

      // Add user to request context
      (request as any).user = authResult.user;
      
      return handler(request, context);
    };
  };
}

/**
 * HOC for protecting API routes with role requirements
 */
export function withRole(role: UserRole) {
  return function (handler: Function) {
    return async function (request: NextRequest, context: any) {
      const authResult = await ServerAuthUtils.requireRole(request, role);
      
      if ('error' in authResult) {
        return Response.json(
          { error: authResult.error },
          { status: authResult.status }
        );
      }

      // Add user to request context
      (request as any).user = authResult.user;
      
      return handler(request, context);
    };
  };
}

/**
 * HOC for protecting API routes requiring admin access
 */
export function withAdmin(handler: Function) {
  return async function (request: NextRequest, context: any) {
    const authResult = await ServerAuthUtils.requireAdmin(request);
    
    if ('error' in authResult) {
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
 * HOC for protecting API routes requiring super admin access
 */
export function withSuperAdmin(handler: Function) {
  return async function (request: NextRequest, context: any) {
    const authResult = await ServerAuthUtils.requireSuperAdmin(request);
    
    if ('error' in authResult) {
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
 * Navigation permissions mapping
 */
export const NAVIGATION_PERMISSIONS = {
  dashboard: null, // Everyone can access dashboard
  projects: Permission.MANAGE_PROJECTS,
  blogs: Permission.MANAGE_BLOGS,
  communities: Permission.MANAGE_COMMUNITIES,
  developers: Permission.MANAGE_DEVELOPERS,
  careers: Permission.MANAGE_CAREERS,
  plots: Permission.MANAGE_PLOTS,
  malls: Permission.MANAGE_MALLS,
  settings: Permission.SYSTEM_SETTINGS, // Only admins/super admins
} as const;

/**
 * Check if user can access a navigation item
 */
export function canAccessNavItem(userRole: UserRole, userPermissions: Permission[], navItem: keyof typeof NAVIGATION_PERMISSIONS): boolean {
  const requiredPermission = NAVIGATION_PERMISSIONS[navItem];
  
  if (!requiredPermission) {
    return true; // No permission required
  }

  return PermissionChecker.userHasPermission(userRole, userPermissions, requiredPermission);
}