"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/firebase';
import { 
  FullRole, 
  Collection, 
  Action, 
  SubRole, 
  UserStatus,
  ClientUser as IEnhancedUser 
} from '@/types/user';
import { 
  ZeroTrustChecker, 
  SystemCapability, 
  CollectionCapability,
  userCanAccessNav,
  getUserAccessibleNavItems,
  NAVIGATION_COLLECTION_MAP 
} from '@/lib/auth';

export type NavigationItem = keyof typeof NAVIGATION_COLLECTION_MAP;

interface AuthUser extends IEnhancedUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  emailVerified: boolean;
}

interface UseAuthReturn {
  // User data
  user: AuthUser | null;
  mongoUser: IEnhancedUser | null;
  loading: boolean;
  
  // Auth actions
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  
  // ZeroTrust Security (System Level)
  hasSystemCapability: (capability: SystemCapability) => boolean;
  isSystemAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  canManageUsers: () => boolean;
  canManageRoles: () => boolean;
  canAccessSystemSettings: () => boolean;
  canViewAuditTrail: () => boolean;
  
  // ZeroTrust Security (Collection Level)
  hasCollectionCapability: (collection: Collection, capability: CollectionCapability) => boolean;
  getUserSubRoleForCollection: (collection: Collection) => SubRole | null;
  getUserAccessibleCollections: () => Collection[];
  
  // Role checking
  hasRole: (role: FullRole) => boolean;
  hasAnyRole: (roles: FullRole[]) => boolean;
  
  // Navigation
  canAccessNav: (navItem: NavigationItem) => boolean;
  getAccessibleNavItems: () => NavigationItem[];
  
  // Status checks
  isActive: () => boolean;
  isInvited: () => boolean;
  isSuspended: () => boolean;
}

// Global deduplication for API calls
const pendingFetches = new Map<string, Promise<IEnhancedUser | null>>();

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mongoUser, setMongoUser] = useState<IEnhancedUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data from MongoDB with deduplication
  const fetchUserData = async (firebaseUid: string): Promise<IEnhancedUser | null> => {
    // Check if fetch is already in progress
    if (pendingFetches.has(firebaseUid)) {
      return pendingFetches.get(firebaseUid)!;
    }

    // Create new fetch promise
    const fetchPromise = (async () => {
      try {
        const response = await fetch('/api/auth/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firebaseUid }),
        });

        if (response.ok) {
          const data = await response.json();
          return data.user;
        }
        return null;
      } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
      } finally {
        // Clean up after fetch completes
        pendingFetches.delete(firebaseUid);
      }
    })();

    // Store promise for deduplication
    pendingFetches.set(firebaseUid, fetchPromise);
    return fetchPromise;
  };

  // Refresh user data from MongoDB
  const refreshUserData = async (): Promise<void> => {
    if (user?.uid) {
      const userData = await fetchUserData(user.uid);
      if (userData) {
        setMongoUser(userData);
        setUser(prev => prev ? { ...prev, ...userData } : null);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        // Get MongoDB user data
        const userData = await fetchUserData(firebaseUser.uid);
        setMongoUser(userData);

        if (userData) {
          const combinedUser: AuthUser = {
            ...userData,
            uid: firebaseUser.uid,
            email: firebaseUser.email || userData.email,
            displayName: firebaseUser.displayName || userData.displayName,
            photoURL: firebaseUser.photoURL || userData.profileImage || undefined,
            emailVerified: firebaseUser.emailVerified,
          };
          
          setUser(combinedUser);
        } else {
          // Firebase user without MongoDB record (new/incomplete user)
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
        setUser(null);
        setMongoUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
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
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // 🛡️ ZEROTRUST SECURITY FUNCTIONS
  // ═══════════════════════════════════════════════════════════════

  // System-level capabilities (only true system admins)
  const hasSystemCapability = useMemo(() => 
    (capability: SystemCapability): boolean => {
      if (!user) return false;
      return ZeroTrustChecker.hasSystemCapability(user, capability);
    }, [user]
  );

  const isSystemAdmin = useMemo(() => 
    (): boolean => {
      if (!user) return false;
      return ZeroTrustChecker.isSystemAdmin(user);
    }, [user]
  );

  const isSuperAdmin = useMemo(() => 
    (): boolean => {
      if (!user) return false;
      return ZeroTrustChecker.isSuperAdmin(user);
    }, [user]
  );

  const canManageUsers = useMemo(() => 
    (): boolean => {
      if (!user) return false;
      return ZeroTrustChecker.canManageUsers(user);
    }, [user]
  );

  const canManageRoles = useMemo(() => 
    (): boolean => {
      if (!user) return false;
      return ZeroTrustChecker.canManageRoles(user);
    }, [user]
  );

  const canAccessSystemSettings = useMemo(() => 
    (): boolean => {
      if (!user) return false;
      return ZeroTrustChecker.canAccessSystemSettings(user);
    }, [user]
  );

  const canViewAuditTrail = useMemo(() => 
    (): boolean => {
      if (!user) return false;
      return ZeroTrustChecker.canViewAuditTrail(user);
    }, [user]
  );

  // Collection-level capabilities
  const hasCollectionCapability = useMemo(() => 
    (collection: Collection, capability: CollectionCapability): boolean => {
      if (!user) return false;
      return ZeroTrustChecker.hasCollectionCapability(user, collection, capability);
    }, [user]
  );

  const getUserSubRoleForCollection = useMemo(() =>
    (collection: Collection): SubRole | null => {
      if (!user) return null;
      return ZeroTrustChecker.getUserSubRoleForCollection(user, collection);
    }, [user]
  );

  const getUserAccessibleCollections = useMemo(() =>
    (): Collection[] => {
      if (!user) return [];
      return ZeroTrustChecker.getUserAccessibleCollections(user);
    }, [user]
  );

  // Role checking
  const hasRole = useMemo(() =>
    (role: FullRole): boolean => {
      return user?.fullRole === role;
    }, [user]
  );

  const hasAnyRole = useMemo(() =>
    (roles: FullRole[]): boolean => {
      if (!user) return false;
      return roles.includes(user.fullRole);
    }, [user]
  );

  // Navigation
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
    
    // Auth actions
    signOut: handleSignOut,
    refreshUserData,
    
    // ZeroTrust Security (System Level)
    hasSystemCapability,
    isSystemAdmin,
    isSuperAdmin,
    canManageUsers,
    canManageRoles,
    canAccessSystemSettings,
    canViewAuditTrail,
    
    // ZeroTrust Security (Collection Level)
    hasCollectionCapability,
    getUserSubRoleForCollection,
    getUserAccessibleCollections,
    
    // Role checking
    hasRole,
    hasAnyRole,
    
    // Navigation
    canAccessNav,
    getAccessibleNavItems,
    
    // Status checks
    isActive,
    isInvited,
    isSuspended,
  };
}

// ═══════════════════════════════════════════════════════════════
// 🔒 PERMISSION GUARDS & HOCs
// ═══════════════════════════════════════════════════════════════

interface PermissionGuardProps {
  // System capabilities
  systemCapability?: SystemCapability;
  requireSystemAdmin?: boolean;
  requireSuperAdmin?: boolean;
  
  // Collection capabilities
  collectionCapability?: { collection: Collection; capability: CollectionCapability };
  
  // Role requirements
  role?: FullRole;
  roles?: FullRole[];
  
  // Status requirements
  requireActive?: boolean;
  
  // UI
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGuard({
  systemCapability,
  requireSystemAdmin,
  requireSuperAdmin,
  collectionCapability,
  role,
  roles,
  requireActive = true,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { 
    hasSystemCapability, 
    hasCollectionCapability, 
    hasRole, 
    hasAnyRole, 
    isSystemAdmin, 
    isSuperAdmin, 
    isActive,
    loading 
  } = useAuth();

  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  let hasAccess = true;

  if (requireActive && !isActive()) {
    hasAccess = false;
  }

  if (systemCapability && !hasSystemCapability(systemCapability)) {
    hasAccess = false;
  }

  if (requireSystemAdmin && !isSystemAdmin()) {
    hasAccess = false;
  }

  if (requireSuperAdmin && !isSuperAdmin()) {
    hasAccess = false;
  }

  if (collectionCapability && !hasCollectionCapability(collectionCapability.collection, collectionCapability.capability)) {
    hasAccess = false;
  }

  if (role && !hasRole(role)) {
    hasAccess = false;
  }

  if (roles && !hasAnyRole(roles)) {
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
  const { canAccessNav, loading } = useAuth();

  if (loading) {
    return <div className="animate-pulse h-10 bg-gray-200 rounded"></div>;
  }

  return canAccessNav(navItem) ? <>{children}</> : <>{fallback}</>;
}

// ═══════════════════════════════════════════════════════════════
// 🔧 HIGHER-ORDER COMPONENTS
// ═══════════════════════════════════════════════════════════════

export function withSystemAdmin<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: React.ComponentType | null
) {
  return function SystemAdminWrapper(props: T) {
    const { isSystemAdmin, loading } = useAuth();

    if (loading) {
      return <div>Loading...</div>;
    }

    if (!isSystemAdmin()) {
      if (fallback === null) return null;
      if (fallback) return React.createElement(fallback);
      return <div>System admin access required</div>;
    }

    return React.createElement(Component, props);
  };
}

export function withSuperAdmin<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: React.ComponentType | null
) {
  return function SuperAdminWrapper(props: T) {
    const { isSuperAdmin, loading } = useAuth();

    if (loading) {
      return <div>Loading...</div>;
    }

    if (!isSuperAdmin()) {
      if (fallback === null) return null;
      if (fallback) return React.createElement(fallback);
      return <div>Super admin access required</div>;
    }

    return React.createElement(Component, props);
  };
}

export function withSystemCapability<T extends object>(
  Component: React.ComponentType<T>,
  capability: SystemCapability,
  fallback?: React.ComponentType | null
) {
  return function CapabilityWrapper(props: T) {
    const { hasSystemCapability, loading } = useAuth();

    if (loading) {
      return <div>Loading...</div>;
    }

    if (!hasSystemCapability(capability)) {
      if (fallback === null) return null;
      if (fallback) return React.createElement(fallback);
      return <div>Insufficient permissions</div>;
    }

    return React.createElement(Component, props);
  };
}

export function withCollectionCapability<T extends object>(
  Component: React.ComponentType<T>,
  collection: Collection,
  capability: CollectionCapability,
  fallback?: React.ComponentType | null
) {
  return function CollectionCapabilityWrapper(props: T) {
    const { hasCollectionCapability, loading } = useAuth();

    if (loading) {
      return <div>Loading...</div>;
    }

    if (!hasCollectionCapability(collection, capability)) {
      if (fallback === null) return null;
      if (fallback) return React.createElement(fallback);
      return <div>Insufficient permissions for this collection</div>;
    }

    return React.createElement(Component, props);
  };
}

export function withRole<T extends object>(
  Component: React.ComponentType<T>,
  role: FullRole,
  fallback?: React.ComponentType | null
) {
  return function RoleWrapper(props: T) {
    const { hasRole, loading } = useAuth();

    if (loading) {
      return <div>Loading...</div>;
    }

    if (!hasRole(role)) {
      if (fallback === null) return null;
      if (fallback) return React.createElement(fallback);
      return <div>Role access required</div>;
    }

    return React.createElement(Component, props);
  };
}