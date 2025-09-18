import { NextRequest } from 'next/server';
import { 
  Collection, 
  Action, 
  FullRole, 
  SubRole, 
  IEnhancedUser, 
  SUB_ROLE_ACTIONS,
  FULL_ROLE_COLLECTIONS,
  FULL_ROLE_DEFAULT_SUBROLES 
} from '@/models/enhancedUser';
import { FirebaseAdminService } from '../firebaseAdmin';
import { createAuthService } from './AuthService';

/**
 * Universal Permission Checker - Works for both client and server
 */
export class AuthChecker {
  /**
   * Check if a sub-role has permission for specific action
   */
  static subRoleHasAction(subRole: SubRole, action: Action): boolean {
    const allowedActions = SUB_ROLE_ACTIONS[subRole] || [];
    return allowedActions.includes(action);
  }

  /**
   * Check if user has permission for collection and action
   */
  static userHasCollectionPermission(
    user: IEnhancedUser, 
    collection: Collection, 
    action: Action
  ): boolean {
    // Check permission overrides first (higher priority)
    const override = user.permissionOverrides?.find(p => p.collection === collection);
    if (override) {
      return this.subRoleHasAction(override.subRole, action);
    }

    // Check role-based permissions
    const rolePermission = user.collectionPermissions?.find(p => p.collection === collection);
    if (rolePermission) {
      return this.subRoleHasAction(rolePermission.subRole, action);
    }

    return false;
  }

  /**
   * Get user's sub-role for a collection
   */
  static getUserSubRoleForCollection(
    user: IEnhancedUser, 
    collection: Collection
  ): SubRole | null {
    // Check overrides first
    const override = user.permissionOverrides?.find(p => p.collection === collection);
    if (override) {
      return override.subRole;
    }

    // Check role permissions
    const rolePermission = user.collectionPermissions?.find(p => p.collection === collection);
    if (rolePermission) {
      return rolePermission.subRole;
    }

    return null;
  }

  /**
   * Get all actions user can perform on a collection
   */
  static getUserActionsForCollection(
    user: IEnhancedUser, 
    collection: Collection
  ): Action[] {
    const subRole = this.getUserSubRoleForCollection(user, collection);
    if (!subRole) return [];
    
    return SUB_ROLE_ACTIONS[subRole] || [];
  }

  /**
   * Get all collections user has access to
   */
  static getUserAccessibleCollections(user: IEnhancedUser): Collection[] {
    const collections = new Set<Collection>();

    // Add from role permissions
    user.collectionPermissions?.forEach(p => collections.add(p.collection));
    
    // Add from overrides
    user.permissionOverrides?.forEach(p => collections.add(p.collection));

    return Array.from(collections);
  }

  /**
   * Check if user has any of the specified roles
   */
  static userHasAnyRole(user: IEnhancedUser, roles: FullRole[]): boolean {
    return roles.includes(user.fullRole);
  }

  /**
   * Check if user is admin level
   */
  static userIsAdmin(user: IEnhancedUser): boolean {
    return this.userHasAnyRole(user, [FullRole.ADMIN, FullRole.SUPER_ADMIN]);
  }

  /**
   * Check if user is super admin
   */
  static userIsSuperAdmin(user: IEnhancedUser): boolean {
    return user.fullRole === FullRole.SUPER_ADMIN;
  }

  /**
   * Check if user can create other users
   */
  static userCanCreateUsers(user: IEnhancedUser): boolean {
    return this.userHasCollectionPermission(user, Collection.USERS, Action.ADD);
  }

  /**
   * Check if user can manage other users
   */
  static userCanManageUsers(user: IEnhancedUser): boolean {
    return this.userHasCollectionPermission(user, Collection.USERS, Action.EDIT);
  }

  /**
   * Get collections a full role can access by default
   */
  static getFullRoleCollections(fullRole: FullRole): Collection[] {
    return FULL_ROLE_COLLECTIONS[fullRole] || [];
  }

  /**
   * Get default sub-role for a full role
   */
  static getFullRoleDefaultSubRole(fullRole: FullRole): SubRole {
    return FULL_ROLE_DEFAULT_SUBROLES[fullRole] || SubRole.OBSERVER;
  }

  /**
   * Check if user can access navigation item
   */
  static userCanAccessNavigation(
    user: IEnhancedUser, 
    navCollection: Collection
  ): boolean {
    return this.getUserAccessibleCollections(user).includes(navCollection);
  }
}

/**
 * Server-Side Auth Utilities
 */
export class ServerAuth {
  /**
   * Extract Firebase ID token from request
   */
  static extractIdToken(request: NextRequest): string | null {
    // Try authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try cookies
    const tokenCookie = request.cookies.get('firebase-token')?.value ||
                       request.cookies.get('auth-token')?.value ||
                       request.cookies.get('__session')?.value;
    
    if (tokenCookie) {
      return tokenCookie;
    }

    return null;
  }

  /**
   * Get authenticated user from request
   */
  static async getAuthenticatedUser(request: NextRequest): Promise<{
    user?: IEnhancedUser;
    error?: string;
    status?: number;
  }> {
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

      // Get user from database
      const authService = createAuthService({ ip, userAgent });
      const user = await authService.authenticateUser(decodedToken.uid);

      if (!user) {
        return { error: 'User not found or inactive', status: 404 };
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
   * Require authentication for API route
   */
  static async requireAuth(request: NextRequest) {
    return await this.getAuthenticatedUser(request);
  }

  /**
   * Require specific role for API route
   */
  static async requireRole(request: NextRequest, role: FullRole) {
    const authResult = await this.getAuthenticatedUser(request);
    
    if (authResult.error) {
      return authResult;
    }

    const { user } = authResult;
    if (user!.fullRole !== role) {
      return { 
        error: `Insufficient role. Required: ${role}, Current: ${user!.fullRole}`, 
        status: 403 
      };
    }

    return { user };
  }

  /**
   * Require any of specified roles for API route
   */
  static async requireAnyRole(request: NextRequest, roles: FullRole[]) {
    const authResult = await this.getAuthenticatedUser(request);
    
    if (authResult.error) {
      return authResult;
    }

    const { user } = authResult;
    if (!AuthChecker.userHasAnyRole(user!, roles)) {
      return { 
        error: `Insufficient role. Required any of: ${roles.join(', ')}, Current: ${user!.fullRole}`, 
        status: 403 
      };
    }

    return { user };
  }

  /**
   * Require admin role for API route
   */
  static async requireAdmin(request: NextRequest) {
    return await this.requireAnyRole(request, [FullRole.ADMIN, FullRole.SUPER_ADMIN]);
  }

  /**
   * Require super admin role for API route
   */
  static async requireSuperAdmin(request: NextRequest) {
    return await this.requireRole(request, FullRole.SUPER_ADMIN);
  }

  /**
   * Require permission for collection and action
   */
  static async requireCollectionPermission(
    request: NextRequest, 
    collection: Collection, 
    action: Action
  ) {
    const authResult = await this.getAuthenticatedUser(request);
    
    if (authResult.error) {
      return authResult;
    }

    const { user } = authResult;
    if (!AuthChecker.userHasCollectionPermission(user!, collection, action)) {
      return { 
        error: `Insufficient permissions. Required: ${action} on ${collection}`, 
        status: 403 
      };
    }

    return { user };
  }

  /**
   * Require any permission for collection (user just needs access)
   */
  static async requireCollectionAccess(
    request: NextRequest, 
    collection: Collection
  ) {
    const authResult = await this.getAuthenticatedUser(request);
    
    if (authResult.error) {
      return authResult;
    }

    const { user } = authResult;
    const accessibleCollections = AuthChecker.getUserAccessibleCollections(user!);
    
    if (!accessibleCollections.includes(collection)) {
      return { 
        error: `No access to collection: ${collection}`, 
        status: 403 
      };
    }

    return { user };
  }
}

/**
 * Higher-Order Components for API Route Protection
 */

/**
 * Require authentication
 */
export function withAuth(handler: Function) {
  return async function (request: NextRequest, context: any) {
    const authResult = await ServerAuth.requireAuth(request);
    
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
 * Require specific role
 */
export function withRole(role: FullRole) {
  return function (handler: Function) {
    return async function (request: NextRequest, context: any) {
      const authResult = await ServerAuth.requireRole(request, role);
      
      if (authResult.error) {
        return Response.json(
          { error: authResult.error },
          { status: authResult.status }
        );
      }

      (request as any).user = authResult.user;
      return handler(request, context);
    };
  };
}

/**
 * Require admin role
 */
export function withAdmin(handler: Function) {
  return async function (request: NextRequest, context: any) {
    const authResult = await ServerAuth.requireAdmin(request);
    
    if (authResult.error) {
      return Response.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    (request as any).user = authResult.user;
    return handler(request, context);
  };
}

/**
 * Require super admin role
 */
export function withSuperAdmin(handler: Function) {
  return async function (request: NextRequest, context: any) {
    const authResult = await ServerAuth.requireSuperAdmin(request);
    
    if (authResult.error) {
      return Response.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    (request as any).user = authResult.user;
    return handler(request, context);
  };
}

/**
 * Require collection permission
 */
export function withCollectionPermission(collection: Collection, action: Action) {
  return function (handler: Function) {
    return async function (request: NextRequest, context: any) {
      const authResult = await ServerAuth.requireCollectionPermission(request, collection, action);
      
      if (authResult.error) {
        return Response.json(
          { error: authResult.error },
          { status: authResult.status }
        );
      }

      (request as any).user = authResult.user;
      return handler(request, context);
    };
  };
}

/**
 * Require collection access (any permission)
 */
export function withCollectionAccess(collection: Collection) {
  return function (handler: Function) {
    return async function (request: NextRequest, context: any) {
      const authResult = await ServerAuth.requireCollectionAccess(request, collection);
      
      if (authResult.error) {
        return Response.json(
          { error: authResult.error },
          { status: authResult.status }
        );
      }

      (request as any).user = authResult.user;
      return handler(request, context);
    };
  };
}

/**
 * Navigation helper - maps collections to navigation items
 */
export const NAVIGATION_COLLECTION_MAP = {
  dashboard: null, // Everyone can see dashboard
  projects: Collection.PROJECTS,
  blogs: Collection.BLOGS,
  news: Collection.NEWS,
  communities: Collection.COMMUNITIES,
  developers: Collection.DEVELOPERS,
  careers: Collection.CAREERS,
  plots: Collection.PLOTS,
  malls: Collection.MALLS,
  users: Collection.USERS,
  settings: Collection.SYSTEM,
} as const;

export type NavigationItem = keyof typeof NAVIGATION_COLLECTION_MAP;

/**
 * Check if user can access navigation item
 */
export function userCanAccessNav(user: IEnhancedUser, navItem: NavigationItem): boolean {
  const collection = NAVIGATION_COLLECTION_MAP[navItem];
  
  if (!collection) {
    return true; // No collection requirement (like dashboard)
  }

  return AuthChecker.userCanAccessNavigation(user, collection);
}

/**
 * Get accessible navigation items for user
 */
export function getUserAccessibleNavItems(user: IEnhancedUser): NavigationItem[] {
  return (Object.keys(NAVIGATION_COLLECTION_MAP) as NavigationItem[]).filter(
    navItem => userCanAccessNav(user, navItem)
  );
}