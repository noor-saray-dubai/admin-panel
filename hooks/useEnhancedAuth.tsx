"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/firebase';
import { 
  Collection, 
  Action, 
  FullRole, 
  SubRole, 
  UserStatus,
  ClientUser,
  SUB_ROLE_ACTIONS,
  ClientPermissionChecker
} from '@/types/user';

// Navigation mapping for client-side
export const NAVIGATION_COLLECTION_MAP = {
  dashboard: null,
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

function userCanAccessNav(user: ClientUser, navItem: NavigationItem): boolean {
  const collection = NAVIGATION_COLLECTION_MAP[navItem];
  
  if (!collection) {
    return true;
  }

  return ClientPermissionChecker.getUserAccessibleCollections(user).includes(collection);
}

function getUserAccessibleNavItems(user: ClientUser): NavigationItem[] {
  return (Object.keys(NAVIGATION_COLLECTION_MAP) as NavigationItem[]).filter(
    navItem => userCanAccessNav(user, navItem)
  );
}

interface EnhancedAuthUser extends ClientUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  emailVerified: boolean;
}

interface UseEnhancedAuthReturn {
  user: EnhancedAuthUser | null;
  mongoUser: ClientUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  hasCollectionPermission: (collection: Collection, action: Action) => boolean;
  getUserSubRoleForCollection: (collection: Collection) => SubRole | null;
  getUserActionsForCollection: (collection: Collection) => Action[];
  getAccessibleCollections: () => Collection[];
  hasRole: (role: FullRole) => boolean;
  hasAnyRole: (roles: FullRole[]) => boolean;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  canCreateUsers: () => boolean;
  canManageUsers: () => boolean;
  canAccessNav: (navItem: NavigationItem) => boolean;
  getAccessibleNavItems: () => NavigationItem[];
  isActive: () => boolean;
  isInvited: () => boolean;
  isSuspended: () => boolean;
}

// 🔥 DEDUPLICATION: Global pending fetches map
const pendingFetches = new Map<string, Promise<ClientUser | null>>();

// 🔥 DEBUG: Track hook instances
let hookInstanceCounter = 0;

export function useEnhancedAuth(): UseEnhancedAuthReturn {
  const [user, setUser] = useState<EnhancedAuthUser | null>(null);
  const [mongoUser, setMongoUser] = useState<ClientUser | null>(null);
  const [loading, setLoading] = useState(true);

  // 🐛 DEBUG: Identify this hook instance
  const hookInstanceId = useMemo(() => {
    const id = ++hookInstanceCounter;
    const stack = new Error().stack;
    const callerLine = stack?.split('\n')[2] || 'unknown';
    console.log(`🎣 [useEnhancedAuth #${id}] Hook initialized`);
    console.log(`📍 [useEnhancedAuth #${id}] Called from:`, callerLine.trim());
    return id;
  }, []);

  // Fetch user data from MongoDB with deduplication
  const fetchUserData = async (firebaseUid: string): Promise<ClientUser | null> => {
    console.log(`📞 [Hook #${hookInstanceId}] fetchUserData called for UID:`, firebaseUid);
    
    // 🔥 DEDUPLICATION: Check if fetch is already in progress
    if (pendingFetches.has(firebaseUid)) {
      console.log(`🔄 [Hook #${hookInstanceId}] ⚡ DEDUPLICATING - Using existing fetch for:`, firebaseUid);
      return pendingFetches.get(firebaseUid)!;
    }

    console.log(`🆕 [Hook #${hookInstanceId}] Creating NEW fetch for:`, firebaseUid);
    console.log(`📚 [Hook #${hookInstanceId}] Stack trace:`, new Error().stack?.split('\n').slice(1, 4).join('\n'));

    // Create new fetch promise
    const fetchPromise = (async () => {
      try {
        const fetchStart = Date.now();
        console.log(`🌐 [Hook #${hookInstanceId}] Sending API request...`);
        
        const response = await fetch('/api/auth/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firebaseUid }),
        });

        const fetchTime = Date.now() - fetchStart;
        console.log(`🌐 [Hook #${hookInstanceId}] API response in ${fetchTime}ms - Status:`, response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ [Hook #${hookInstanceId}] User data fetched successfully`);
          return data.user;
        } else {
          const errorData = await response.text();
          console.log(`❌ [Hook #${hookInstanceId}] API error:`, errorData);
        }
        return null;
      } catch (error) {
        console.error(`❌ [Hook #${hookInstanceId}] Exception:`, error);
        return null;
      } finally {
        // Clean up after fetch completes
        console.log(`🧹 [Hook #${hookInstanceId}] Cleaning up pending fetch for:`, firebaseUid);
        pendingFetches.delete(firebaseUid);
      }
    })();

    // Store promise for deduplication
    pendingFetches.set(firebaseUid, fetchPromise);
    console.log(`💾 [Hook #${hookInstanceId}] Stored pending fetch. Total pending:`, pendingFetches.size);
    
    return fetchPromise;
  };

  // Refresh user data from MongoDB
  const refreshUserData = async (): Promise<void> => {
    console.log(`🔄 [Hook #${hookInstanceId}] refreshUserData called`);
    if (user?.uid) {
      const userData = await fetchUserData(user.uid);
      if (userData) {
        setMongoUser(userData);
        setUser(prev => prev ? { ...prev, ...userData } : null);
        console.log(`✅ [Hook #${hookInstanceId}] User data refreshed`);
      }
    }
  };

  useEffect(() => {
    console.log(`🔥 [Hook #${hookInstanceId}] Setting up Firebase auth listener`);
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      console.log(`🔥 [Hook #${hookInstanceId}] Firebase auth state changed`);
      console.log(`👤 [Hook #${hookInstanceId}] Firebase user:`, firebaseUser ? firebaseUser.uid : 'No user');
      
      if (firebaseUser) {
        console.log(`📞 [Hook #${hookInstanceId}] Triggering fetchUserData...`);
        
        // Get MongoDB user data
        const userData = await fetchUserData(firebaseUser.uid);
        console.log(`📊 [Hook #${hookInstanceId}] MongoDB user data:`, userData ? 'Received' : 'None');
        setMongoUser(userData);

        if (userData) {
          const combinedUser: EnhancedAuthUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || userData.email,
            displayName: firebaseUser.displayName || userData.displayName,
            photoURL: firebaseUser.photoURL || userData.profileImage || undefined,
            emailVerified: firebaseUser.emailVerified,
            ...userData,
          };
          
          console.log(`✅ [Hook #${hookInstanceId}] Combined user created`);
          setUser(combinedUser);
        } else {
          console.log(`⚠️ [Hook #${hookInstanceId}] No MongoDB record, using Firebase only`);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || undefined,
            emailVerified: firebaseUser.emailVerified,
            _id: undefined,
            firebaseUid: firebaseUser.uid,
            fullRole: FullRole.USER,
            status: UserStatus.INVITED,
            collectionPermissions: [],
            permissionOverrides: [],
            loginAttempts: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      } else {
        console.log(`🚫 [Hook #${hookInstanceId}] No Firebase user, clearing state`);
        setUser(null);
        setMongoUser(null);
      }
      setLoading(false);
      console.log(`✅ [Hook #${hookInstanceId}] Auth state processing complete`);
    });

    return () => {
      console.log(`🧹 [Hook #${hookInstanceId}] Cleaning up Firebase listener`);
      unsubscribe();
    };
  }, [hookInstanceId]);

  const handleSignOut = async () => {
    console.log(`🚪 [Hook #${hookInstanceId}] Sign out initiated`);
    try {
      if (user) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            firebaseUid: user.uid,
            email: user.email 
          }),
        });
      }

      await signOut(auth);
      localStorage.removeItem("isAuthenticated");
      setUser(null);
      setMongoUser(null);
      console.log(`✅ [Hook #${hookInstanceId}] Sign out complete`);
    } catch (error) {
      console.error(`❌ [Hook #${hookInstanceId}] Sign out error:`, error);
    }
  };

  // Permission checking methods
  const hasCollectionPermission = useMemo(() => 
    (collection: Collection, action: Action): boolean => {
      if (!user) return false;
      return ClientPermissionChecker.userHasCollectionPermission(user, collection, action);
    }, [user]
  );

  const getUserSubRoleForCollection = useMemo(() =>
    (collection: Collection): SubRole | null => {
      if (!user) return null;
      return ClientPermissionChecker.getUserSubRoleForCollection(user, collection);
    }, [user]
  );

  const getUserActionsForCollection = useMemo(() =>
    (collection: Collection): Action[] => {
      if (!user) return [];
      return ClientPermissionChecker.getUserActionsForCollection(user, collection);
    }, [user]
  );

  const getAccessibleCollections = useMemo(() =>
    (): Collection[] => {
      if (!user) return [];
      return ClientPermissionChecker.getUserAccessibleCollections(user);
    }, [user]
  );

  const hasRole = useMemo(() =>
    (role: FullRole): boolean => {
      return user?.fullRole === role;
    }, [user]
  );

  const hasAnyRole = useMemo(() =>
    (roles: FullRole[]): boolean => {
      if (!user) return false;
      return ClientPermissionChecker.userHasAnyRole(user, roles);
    }, [user]
  );

  const isAdmin = useMemo(() =>
    (): boolean => {
      if (!user) return false;
      return ClientPermissionChecker.userIsAdmin(user);
    }, [user]
  );

  const isSuperAdmin = useMemo(() =>
    (): boolean => {
      if (!user) return false;
      return ClientPermissionChecker.userIsSuperAdmin(user);
    }, [user]
  );

  const canCreateUsers = useMemo(() =>
    (): boolean => {
      if (!user) return false;
      return ClientPermissionChecker.userCanCreateUsers(user);
    }, [user]
  );

  const canManageUsers = useMemo(() =>
    (): boolean => {
      if (!user) return false;
      return ClientPermissionChecker.userCanManageUsers(user);
    }, [user]
  );

  const canAccessNav = useMemo(() =>
    (navItem: NavigationItem): boolean => {
      if (!user) return false;
      return userCanAccessNav(user, navItem);
    }, [user]
  );

  const getAccessibleNavItems = useMemo(() =>
    (): NavigationItem[] => {
      if (!user) return [];
      return getUserAccessibleNavItems(user);
    }, [user]
  );

  const isActive = useMemo(() =>
    (): boolean => {
      return user?.status === UserStatus.ACTIVE;
    }, [user]
  );

  const isInvited = useMemo(() =>
    (): boolean => {
      return user?.status === UserStatus.INVITED;
    }, [user]
  );

  const isSuspended = useMemo(() =>
    (): boolean => {
      return user?.status === UserStatus.SUSPENDED;
    }, [user]
  );

  return {
    user,
    mongoUser,
    loading,
    signOut: handleSignOut,
    refreshUserData,
    hasCollectionPermission,
    getUserSubRoleForCollection,
    getUserActionsForCollection,
    getAccessibleCollections,
    hasRole,
    hasAnyRole,
    isAdmin,
    isSuperAdmin,
    canCreateUsers,
    canManageUsers,
    canAccessNav,
    getAccessibleNavItems,
    isActive,
    isInvited,
    isSuspended,
  };
}

// Permission Guard Components and HOCs remain the same...
interface PermissionGuardProps {
  collection?: Collection;
  action?: Action;
  role?: FullRole;
  roles?: FullRole[];
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
  requireActive?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGuard({
  collection,
  action,
  role,
  roles,
  requireAdmin,
  requireSuperAdmin,
  requireActive = true,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { 
    hasCollectionPermission, 
    hasRole, 
    hasAnyRole, 
    isAdmin, 
    isSuperAdmin, 
    isActive,
    loading 
  } = useEnhancedAuth();

  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  let hasAccess = true;

  if (requireActive && !isActive()) {
    hasAccess = false;
  }

  if (collection && action && !hasCollectionPermission(collection, action)) {
    hasAccess = false;
  }

  if (role && !hasRole(role)) {
    hasAccess = false;
  }

  if (roles && !hasAnyRole(roles)) {
    hasAccess = false;
  }

  if (requireAdmin && !isAdmin()) {
    hasAccess = false;
  }

  if (requireSuperAdmin && !isSuperAdmin()) {
    hasAccess = false;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

interface NavGuardProps {
  navItem: NavigationItem;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function NavGuard({ navItem, fallback = null, children }: NavGuardProps) {
  const { canAccessNav, loading } = useEnhancedAuth();

  if (loading) {
    return <div className="animate-pulse h-10 bg-gray-200 rounded"></div>;
  }

  return canAccessNav(navItem) ? <>{children}</> : <>{fallback}</>;
}

export function withCollectionPermission<T extends object>(
  Component: React.ComponentType<T>,
  collection: Collection,
  action: Action,
  fallback?: React.ComponentType | null
) {
  return function ProtectedComponent(props: T) {
    const { hasCollectionPermission, loading } = useEnhancedAuth();

    if (loading) {
      return <div>Loading...</div>;
    }

    if (!hasCollectionPermission(collection, action)) {
      if (fallback === null) return null;
      if (fallback) return React.createElement(fallback);
      return <div>Access denied</div>;
    }

    return React.createElement(Component, props);
  };
}

export function withRole<T extends object>(
  Component: React.ComponentType<T>,
  role: FullRole,
  fallback?: React.ComponentType | null
) {
  return function ProtectedComponent(props: T) {
    const { hasRole, loading } = useEnhancedAuth();

    if (loading) {
      return <div>Loading...</div>;
    }

    if (!hasRole(role)) {
      if (fallback === null) return null;
      if (fallback) return React.createElement(fallback);
      return <div>Access denied</div>;
    }

    return React.createElement(Component, props);
  };
}

export function withAdmin<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: React.ComponentType | null
) {
  return function ProtectedComponent(props: T) {
    const { isAdmin, loading } = useEnhancedAuth();

    if (loading) {
      return <div>Loading...</div>;
    }

    if (!isAdmin()) {
      if (fallback === null) return null;
      if (fallback) return React.createElement(fallback);
      return <div>Admin access required</div>;
    }

    return React.createElement(Component, props);
  };
}