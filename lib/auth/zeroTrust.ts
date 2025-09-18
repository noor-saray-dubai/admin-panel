/**
 * ZERO TRUST PERMISSION SYSTEM
 * 
 * This module implements strict role separation to prevent privilege escalation.
 * Collection admins can NEVER become system admins through any code path.
 */

import { FullRole, SubRole, Collection, Action } from '@/types/user';
import type { IEnhancedUser } from '@/models/enhancedUser';

/**
 * CRITICAL: These are the ONLY system-wide administrative roles
 * Collection admins (SubRole.COLLECTION_ADMIN) are NOT included
 */
export const SYSTEM_ADMIN_ROLES = [
  FullRole.SUPER_ADMIN,  // Ultimate admin - can do everything
  FullRole.ADMIN         // System admin - can manage users and system settings
] as const;

export type SystemAdminRole = typeof SYSTEM_ADMIN_ROLES[number];

/**
 * CRITICAL: Collection-level permissions that do NOT grant system access
 */
export const COLLECTION_LEVEL_ROLES = [
  SubRole.OBSERVER,
  SubRole.CONTRIBUTOR, 
  SubRole.MODERATOR,
  SubRole.COLLECTION_ADMIN  // ⚠️ This is COLLECTION-ONLY admin
] as const;

/**
 * System-level capabilities that require FullRole system admin
 */
export enum SystemCapability {
  MANAGE_USERS = 'manage_users',           // Create, edit, delete users
  MANAGE_ROLES = 'manage_roles',           // Change user roles
  VIEW_AUDIT_TRAIL = 'view_audit_trail',   // Access system audit logs
  SYSTEM_SETTINGS = 'system_settings',     // Change system configuration
  DATABASE_ACCESS = 'database_access',     // Direct database operations
  SECURITY_SETTINGS = 'security_settings', // Firewall, auth settings
  USER_PERMISSIONS = 'user_permissions',   // Grant/revoke permissions
}

/**
 * Collection-level capabilities that collection admins can have
 */
export enum CollectionCapability {
  VIEW_COLLECTION = 'view_collection',
  CREATE_CONTENT = 'create_content', 
  EDIT_CONTENT = 'edit_content',
  DELETE_CONTENT = 'delete_content',
  MODERATE_CONTENT = 'moderate_content',
  MANAGE_COLLECTION = 'manage_collection',  // Full collection control ONLY
}

/**
 * ZERO TRUST CHECKER - Strict role validation
 */
export class ZeroTrustChecker {
  
  /**
   * Check if user is a SYSTEM administrator
   * CRITICAL: This excludes collection admins completely
   */
  static isSystemAdmin(user: IEnhancedUser): boolean {
    return SYSTEM_ADMIN_ROLES.includes(user.fullRole as SystemAdminRole);
  }
  
  /**
   * Check if user is a SUPER administrator
   * CRITICAL: Only FullRole.SUPER_ADMIN qualifies
   */
  static isSuperAdmin(user: IEnhancedUser): boolean {
    return user.fullRole === FullRole.SUPER_ADMIN;
  }
  
  /**
   * Check if user has SYSTEM-LEVEL capability
   * CRITICAL: Only system admins can have system capabilities
   */
  static hasSystemCapability(user: IEnhancedUser, capability: SystemCapability): boolean {
    if (!this.isSystemAdmin(user)) {
      return false; // Collection admins CANNOT have system capabilities
    }
    
    // Super admin has all system capabilities
    if (this.isSuperAdmin(user)) {
      return true;
    }
    
    // Regular system admin capabilities
    const systemAdminCapabilities = [
      SystemCapability.MANAGE_USERS,
      SystemCapability.MANAGE_ROLES,
      SystemCapability.USER_PERMISSIONS,
    ];
    
    return systemAdminCapabilities.includes(capability);
  }
  
  /**
   * Check if user has COLLECTION-LEVEL capability
   * CRITICAL: This is separate from system capabilities
   */
  static hasCollectionCapability(
    user: IEnhancedUser, 
    collection: Collection, 
    capability: CollectionCapability
  ): boolean {
    // Get user's sub-role for this specific collection
    const subRole = this.getUserSubRoleForCollection(user, collection);
    if (!subRole) return false;
    
    // Map capabilities to required sub-roles
    const capabilityRequirements: Record<CollectionCapability, SubRole[]> = {
      [CollectionCapability.VIEW_COLLECTION]: [
        SubRole.OBSERVER, SubRole.CONTRIBUTOR, SubRole.MODERATOR, SubRole.COLLECTION_ADMIN
      ],
      [CollectionCapability.CREATE_CONTENT]: [
        SubRole.CONTRIBUTOR, SubRole.MODERATOR, SubRole.COLLECTION_ADMIN
      ],
      [CollectionCapability.EDIT_CONTENT]: [
        SubRole.CONTRIBUTOR, SubRole.MODERATOR, SubRole.COLLECTION_ADMIN
      ],
      [CollectionCapability.DELETE_CONTENT]: [
        SubRole.COLLECTION_ADMIN // Only collection admin can delete
      ],
      [CollectionCapability.MODERATE_CONTENT]: [
        SubRole.MODERATOR, SubRole.COLLECTION_ADMIN
      ],
      [CollectionCapability.MANAGE_COLLECTION]: [
        SubRole.COLLECTION_ADMIN // ONLY collection admin, NOT system admin
      ],
    };
    
    const requiredRoles = capabilityRequirements[capability] || [];
    return requiredRoles.includes(subRole);
  }
  
  /**
   * Get user's sub-role for a specific collection
   * CRITICAL: This determines collection-level permissions only
   */
  static getUserSubRoleForCollection(user: IEnhancedUser, collection: Collection): SubRole | null {
    // Check permission overrides first (higher priority)
    const override = user.permissionOverrides?.find(p => p.collection === collection);
    if (override) {
      return override.subRole;
    }
    
    // Check role-based permissions
    const rolePermission = user.collectionPermissions?.find(p => p.collection === collection);
    if (rolePermission) {
      return rolePermission.subRole;
    }
    
    return null;
  }
  
  /**
   * CRITICAL: Can user manage OTHER users?
   * ONLY system admins can manage users, NEVER collection admins
   */
  static canManageUsers(user: IEnhancedUser): boolean {
    return this.hasSystemCapability(user, SystemCapability.MANAGE_USERS);
  }
  
  /**
   * CRITICAL: Can user change roles?
   * ONLY system admins can change roles, NEVER collection admins
   */
  static canManageRoles(user: IEnhancedUser): boolean {
    return this.hasSystemCapability(user, SystemCapability.MANAGE_ROLES);
  }
  
  /**
   * CRITICAL: Can user access audit trail?
   * ONLY super admins can access system audit trail
   */
  static canViewAuditTrail(user: IEnhancedUser): boolean {
    return this.hasSystemCapability(user, SystemCapability.VIEW_AUDIT_TRAIL);
  }
  
  /**
   * CRITICAL: Can user access system settings?
   * ONLY system admins can access system settings
   */
  static canAccessSystemSettings(user: IEnhancedUser): boolean {
    return this.hasSystemCapability(user, SystemCapability.SYSTEM_SETTINGS);
  }
  
  /**
   * Get all collections user can access
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
   * CRITICAL VALIDATION: Prevent privilege escalation
   * This method validates that collection admins cannot escalate to system admin
   */
  static validateNoPrivilegeEscalation(user: IEnhancedUser, requestedCapability: string): boolean {
    // If user is requesting system capability but is not system admin
    if (Object.values(SystemCapability).includes(requestedCapability as SystemCapability)) {
      return this.isSystemAdmin(user);
    }
    
    return true; // Collection-level capabilities are allowed
  }
}

/**
 * ZERO TRUST API GUARDS - Use these in API routes
 */
export class ZeroTrustGuards {
  
  /**
   * Require SYSTEM admin (not collection admin)
   */
  static requireSystemAdmin(user: IEnhancedUser): { allowed: boolean; reason?: string } {
    if (!ZeroTrustChecker.isSystemAdmin(user)) {
      return {
        allowed: false,
        reason: `System admin required. Current role: ${user.fullRole}. Collection admins cannot access system functions.`
      };
    }
    return { allowed: true };
  }
  
  /**
   * Require SUPER admin only
   */
  static requireSuperAdmin(user: IEnhancedUser): { allowed: boolean; reason?: string } {
    if (!ZeroTrustChecker.isSuperAdmin(user)) {
      return {
        allowed: false,
        reason: `Super admin required. Current role: ${user.fullRole}`
      };
    }
    return { allowed: true };
  }
  
  /**
   * Require specific COLLECTION capability
   */
  static requireCollectionCapability(
    user: IEnhancedUser, 
    collection: Collection, 
    capability: CollectionCapability
  ): { allowed: boolean; reason?: string } {
    if (!ZeroTrustChecker.hasCollectionCapability(user, collection, capability)) {
      const subRole = ZeroTrustChecker.getUserSubRoleForCollection(user, collection);
      return {
        allowed: false,
        reason: `Insufficient collection permissions. Required: ${capability} for ${collection}. Current: ${subRole || 'none'}`
      };
    }
    return { allowed: true };
  }
  
  /**
   * Block collection admin from system functions
   */
  static blockCollectionAdminFromSystem(user: IEnhancedUser): { allowed: boolean; reason?: string } {
    // Check if user is trying to access system functions with collection admin role
    const hasCollectionAdmin = user.collectionPermissions?.some(p => p.subRole === SubRole.COLLECTION_ADMIN) ||
                              user.permissionOverrides?.some(p => p.subRole === SubRole.COLLECTION_ADMIN);
    
    if (hasCollectionAdmin && !ZeroTrustChecker.isSystemAdmin(user)) {
      return {
        allowed: false,
        reason: 'Collection administrators cannot access system-level functions. Contact super admin for system access.'
      };
    }
    
    return { allowed: true };
  }
}

/**
 * MIGRATION HELPERS - Use these to update existing code
 */
export class ZeroTrustMigration {
  
  /**
   * Replace dangerous isAdmin checks with specific capability checks
   * @deprecated Use ZeroTrustChecker.hasSystemCapability instead
   */
  static isAdmin_DEPRECATED_USE_SPECIFIC_CAPABILITY(user: IEnhancedUser): boolean {
    console.warn('🚨 SECURITY WARNING: Using deprecated isAdmin check. Use specific capability checks instead.');
    return ZeroTrustChecker.isSystemAdmin(user);
  }
  
  /**
   * Get replacement capability for old admin checks
   */
  static getRequiredCapabilityForContext(context: string): SystemCapability | CollectionCapability {
    const contextMapping: Record<string, SystemCapability | CollectionCapability> = {
      'user_management': SystemCapability.MANAGE_USERS,
      'role_management': SystemCapability.MANAGE_ROLES,
      'audit_trail': SystemCapability.VIEW_AUDIT_TRAIL,
      'system_settings': SystemCapability.SYSTEM_SETTINGS,
      'collection_management': CollectionCapability.MANAGE_COLLECTION,
    };
    
    return contextMapping[context] || SystemCapability.MANAGE_USERS;
  }
}

// Export for backward compatibility but with warnings
export const DEPRECATED_isAdmin = ZeroTrustMigration.isAdmin_DEPRECATED_USE_SPECIFIC_CAPABILITY;