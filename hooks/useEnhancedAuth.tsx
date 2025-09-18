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

function userCanAccessNav(user: ClientUser, navItem: NavigationItem): boolean {
  const collection = NAVIGATION_COLLECTION_MAP[navItem];
  
  if (!collection) {
    return true; // No collection requirement (like dashboard)
  }

  return ClientPermissionChecker.getUserAccessibleCollections(user).includes(collection);
}

function getUserAccessibleNavItems(user: ClientUser): NavigationItem[] {
  return (Object.keys(NAVIGATION_COLLECTION_MAP) as NavigationItem[]).filter(
    navItem => userCanAccessNav(user, navItem)
  );
}

interface EnhancedAuthUser extends ClientUser {
  // Firebase-specific properties
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  emailVerified: boolean;
}

interface UseEnhancedAuthReturn {
  // User data
  user: EnhancedAuthUser | null;
  mongoUser: ClientUser | null;
  loading: boolean;
  
  // Authentication methods
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  
  // Permission checking methods
  hasCollectionPermission: (collection: Collection, action: Action) => boolean;
  getUserSubRoleForCollection: (collection: Collection) => SubRole | null;
  getUserActionsForCollection: (collection: Collection) => Action[];
  getAccessibleCollections: () => Collection[];
  
  // Role checking methods
  hasRole: (role: FullRole) => boolean;
  hasAnyRole: (roles: FullRole[]) => boolean;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  
  // User management permissions
  canCreateUsers: () => boolean;
  canManageUsers: () => boolean;
  
  // Navigation methods
  canAccessNav: (navItem: NavigationItem) => boolean;
  getAccessibleNavItems: () => NavigationItem[];
  
  // Status checks
  isActive: () => boolean;
  isInvited: () => boolean;
  isSuspended: () => boolean;
}

export function useEnhancedAuth(): UseEnhancedAuthReturn {
  const [user, setUser] = useState<EnhancedAuthUser | null>(null);
  const [mongoUser, setMongoUser] = useState<ClientUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data from MongoDB
  const fetchUserData = async (firebaseUid: string): Promise<ClientUser | null> => {
    try {
      console.log('📞 fetchUserData called with UID:', firebaseUid);
      const response = await fetch('/api/auth/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseUid }),
      });

      console.log('🌐 API Response status:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API Response data:', data);
        return data.user;
      } else {
        const errorData = await response.text();
        console.log('❌ API Error response:', errorData);
      }
      return null;
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
      return null;
    }
  };

  // Refresh user data from MongoDB
  const refreshUserData = async (): Promise<void> => {
    if (user?.uid) {
      const userData = await fetchUserData(user.uid);
      if (userData) {
        setMongoUser(userData);
        // Update the combined user object
        setUser(prev => prev ? { ...prev, ...userData } : null);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      console.log('🔥 Firebase auth state changed:', firebaseUser ? firebaseUser.uid : 'No user');
      if (firebaseUser) {
        console.log('👤 Firebase user found:', {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName
        });
        
        // Get MongoDB user data
        console.log('📞 Calling fetchUserData...');
        const userData = await fetchUserData(firebaseUser.uid);
        console.log('📊 MongoDB user data:', userData);
        setMongoUser(userData);

        if (userData) {
          // Create combined user object
          const combinedUser: EnhancedAuthUser = {
            // Firebase properties
            uid: firebaseUser.uid,
            email: firebaseUser.email || userData.email,
            displayName: firebaseUser.displayName || userData.displayName,
            photoURL: firebaseUser.photoURL || userData.profileImage || undefined,
            emailVerified: firebaseUser.emailVerified,
            
            // MongoDB properties
            ...userData,
          };
          
          setUser(combinedUser);
        } else {
          // Firebase user exists but no MongoDB record
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || undefined,
            emailVerified: firebaseUser.emailVerified,
            
            // Default MongoDB fields
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
        setUser(null);
        setMongoUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      // Call logout API
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
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Permission checking methods using ClientPermissionChecker
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

  // Role checking methods
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

  // User management permissions
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

  // Navigation methods
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

  // Status checks
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
    // User data
    user,
    mongoUser,
    loading,
    
    // Authentication methods
    signOut: handleSignOut,
    refreshUserData,
    
    // Permission checking methods
    hasCollectionPermission,
    getUserSubRoleForCollection,
    getUserActionsForCollection,
    getAccessibleCollections,
    
    // Role checking methods
    hasRole,
    hasAnyRole,
    isAdmin,
    isSuperAdmin,
    
    // User management permissions
    canCreateUsers,
    canManageUsers,
    
    // Navigation methods
    canAccessNav,
    getAccessibleNavItems,
    
    // Status checks
    isActive,
    isInvited,
    isSuspended,
  };
}

/**
 * Client-side Permission Guard Components
 */

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

  // Check if user must be active
  if (requireActive && !isActive()) {
    hasAccess = false;
  }

  // Check collection permission
  if (collection && action && !hasCollectionPermission(collection, action)) {
    hasAccess = false;
  }

  // Check specific role
  if (role && !hasRole(role)) {
    hasAccess = false;
  }

  // Check any of multiple roles
  if (roles && !hasAnyRole(roles)) {
    hasAccess = false;
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin()) {
    hasAccess = false;
  }

  // Check super admin requirement
  if (requireSuperAdmin && !isSuperAdmin()) {
    hasAccess = false;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

/**
 * Navigation Guard for sidebar items
 */
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

/**
 * HOCs for component protection
 */

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