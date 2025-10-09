/**
 * 🔐 CLIENT-SIDE AUTH UTILITIES
 * 
 * This file contains only client-side auth utilities and doesn't import
 * any server-only functions like 'next/headers'.
 */

import { ClientUser as IEnhancedUser, FullRole, Collection, Action, SubRole } from '@/types/user';

// Re-export types for easy access
export { FullRole, Collection, Action, SubRole } from '@/types/user';
export type { ClientUser as IEnhancedUser } from '@/types/user';

// Re-export everything from zeroTrust (our security foundation)
export * from './zeroTrust';

/**
 * 🧭 NAVIGATION UTILITIES
 * Simple navigation access checking for client-side
 */
export const NAVIGATION_COLLECTION_MAP = {
  dashboard: null, // Everyone can see dashboard
  projects: Collection.PROJECTS,
  properties: Collection.PROPERTIES,
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
 * Check if user can access navigation item (client-side)
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
 * Get accessible navigation items for user (client-side)
 */
export function getUserAccessibleNavItems(user: IEnhancedUser): NavigationItem[] {
  return (Object.keys(NAVIGATION_COLLECTION_MAP) as NavigationItem[]).filter(
    navItem => userCanAccessNav(user, navItem)
  );
}

/**
 * 📝 QUICK REFERENCE FOR CLIENT-SIDE USAGE
 * 
 * CLIENT USAGE:
 * ```typescript
 * import { ZeroTrustChecker, CollectionCapability } from '@/lib/auth/client';
 * 
 * // Permission checking
 * const canEdit = ZeroTrustChecker.hasCollectionCapability(user, Collection.BLOGS, CollectionCapability.EDIT_CONTENT);
 * const isSystemAdmin = ZeroTrustChecker.isSystemAdmin(user);
 * ```
 */