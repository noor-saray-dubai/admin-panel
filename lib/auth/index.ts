/**
 * 🔐 UNIFIED AUTH SYSTEM
 * 
 * This is the ONLY auth file you need to import.
 * Combines secure permission checking with business logic.
 */

import { ClientUser as IEnhancedUser, FullRole, Collection, Action, SubRole } from '@/types/user';

// Re-export types for easy access
export { FullRole, Collection, Action, SubRole } from '@/types/user';
export type { ClientUser as IEnhancedUser } from '@/types/user';

// Re-export everything from zeroTrust (our security foundation)
export * from './zeroTrust';

// AuthService is server-only and moved to lib/auth/server.ts

// Server-side utilities are moved to lib/auth/server.ts to avoid 'next/headers' imports in client code

// Server-side API route protection functions are moved to lib/auth/server.ts

/**
 * 🧭 NAVIGATION UTILITIES
 * Simple navigation access checking
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

  // Use ZeroTrust to check if user has any access to the collection
  const { ZeroTrustChecker } = require('./zeroTrust');
  const accessibleCollections = ZeroTrustChecker.getUserAccessibleCollections(user);
  return accessibleCollections.includes(collection);
}

/**
 * Get accessible navigation items for user
 */
export function getUserAccessibleNavItems(user: IEnhancedUser): NavigationItem[] {
  return (Object.keys(NAVIGATION_COLLECTION_MAP) as NavigationItem[]).filter(
    navItem => userCanAccessNav(user, navItem)
  );
}

/**
 * 📝 QUICK REFERENCE
 * 
 * SERVER USAGE:
 * ```typescript
 * import { 
 *   withAuth, 
 *   withSystemAdmin, 
 *   withCollectionPermission,
 *   UnifiedServerAuth,
 *   ZeroTrustChecker,
 *   createAuthService 
 * } from '@/lib/auth';
 * 
 * // API Route Protection
 * export const POST = withCollectionPermission(Collection.BLOGS, Action.ADD)(handler);
 * export const DELETE = withSystemAdmin(handler);
 * 
 * // Direct auth checking
 * const authResult = await UnifiedServerAuth.getAuthenticatedUser(request);
 * const canManage = ZeroTrustChecker.hasSystemCapability(user, SystemCapability.MANAGE_USERS);
 * 
 * // Business operations
 * const authService = createAuthService({ ip, userAgent });
 * await authService.createUserInvitation(data);
 * ```
 * 
 * CLIENT USAGE:
 * ```typescript
 * import { ZeroTrustChecker, CollectionCapability } from '@/lib/auth';
 * 
 * // Permission checking
 * const canEdit = ZeroTrustChecker.hasCollectionCapability(user, Collection.BLOGS, CollectionCapability.EDIT_CONTENT);
 * const isSystemAdmin = ZeroTrustChecker.isSystemAdmin(user);
 * ```
 */