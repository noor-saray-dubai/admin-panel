"use client"

import React from 'react';
import { useAuth } from './useAuth';
import { UserRole, Permission } from '@/models/user';
import { canAccessNavItem, NAVIGATION_PERMISSIONS } from '@/lib/auth/permissions';

interface UsePermissionsReturn {
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  canAccessNav: (navItem: keyof typeof NAVIGATION_PERMISSIONS) => boolean;
  loading: boolean;
}

export function usePermissions(): UsePermissionsReturn {
  const { user, loading } = useAuth();

  const hasPermission = (permission: Permission): boolean => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  };

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return user?.role ? roles.includes(user.role) : false;
  };

  const isAdmin = (): boolean => {
    return user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;
  };

  const isSuperAdmin = (): boolean => {
    return user?.role === UserRole.SUPER_ADMIN;
  };

  const canAccessNav = (navItem: keyof typeof NAVIGATION_PERMISSIONS): boolean => {
    if (!user || !user.role || !user.permissions) return false;
    return canAccessNavItem(user.role, user.permissions, navItem);
  };

  return {
    hasPermission,
    hasRole,
    hasAnyRole,
    isAdmin,
    isSuperAdmin,
    canAccessNav,
    loading,
  };
}

/**
 * HOC for protecting client-side components with permissions
 */
export function withPermission<T extends object>(
  Component: React.ComponentType<T>,
  permission: Permission,
  fallback?: React.ComponentType | null
) {
  return function PermissionWrapper(props: T) {
    const { hasPermission, loading } = usePermissions();

    if (loading) {
      return <div>Loading...</div>; // Or your loading component
    }

    if (!hasPermission(permission)) {
      if (fallback === null) return null;
      if (fallback) return React.createElement(fallback);
      return <div>Access denied</div>; // Default fallback
    }

    return React.createElement(Component, props);
  };
}

/**
 * HOC for protecting client-side components with roles
 */
export function withRole<T extends object>(
  Component: React.ComponentType<T>,
  role: UserRole,
  fallback?: React.ComponentType | null
) {
  return function RoleWrapper(props: T) {
    const { hasRole, loading } = usePermissions();

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

/**
 * HOC for protecting client-side components requiring admin access
 */
export function withAdmin<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: React.ComponentType | null
) {
  return function AdminWrapper(props: T) {
    const { isAdmin, loading } = usePermissions();

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

/**
 * Component for conditionally rendering content based on permissions
 */
interface PermissionGuardProps {
  permission?: Permission;
  role?: UserRole;
  roles?: UserRole[];
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGuard({
  permission,
  role,
  roles,
  requireAdmin,
  requireSuperAdmin,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { hasPermission, hasRole, hasAnyRole, isAdmin, isSuperAdmin, loading } = usePermissions();

  if (loading) {
    return <div>Loading...</div>;
  }

  let hasAccess = true;

  if (permission && !hasPermission(permission)) {
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