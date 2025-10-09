// types/user.ts - Client-safe user types without Mongoose dependencies

// Collection types that can be managed
export enum Collection {
  PROJECTS = 'projects',
  PROPERTIES = 'properties',
  BLOGS = 'blogs',
  NEWS = 'news',
  CAREERS = 'careers',
  DEVELOPERS = 'developers',
  PLOTS = 'plots',
  BUILDINGS = 'buildings',
  HOTELS = 'hotels',
  MALLS = 'malls',
  COMMUNITIES = 'communities',
  USERS = 'users',
  SYSTEM = 'system',
}

// Actions that can be performed on collections
export enum Action {
  VIEW = 'view',
  ADD = 'add',
  EDIT = 'edit',
  DELETE = 'delete',
  APPROVE = 'approve',
  REJECT = 'reject',
  PUBLISH = 'publish',
  UNPUBLISH = 'unpublish',
  EXPORT = 'export',
  IMPORT = 'import',
}

// Full Roles (Collection Scope) - What collections they can access
export enum FullRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  AGENT = 'agent',           // Projects
  MARKETING = 'marketing',   // Blogs, News
  SALES = 'sales',          // Plots, Malls
  HR = 'hr',               // Careers, Developers
  COMMUNITY_MANAGER = 'community_manager', // Communities
  USER = 'user',           // Basic access
}

// Sub-Roles (Action Scope) - What actions they can perform within a collection
export enum SubRole {
  OBSERVER = 'observer',           // View only
  CONTRIBUTOR = 'contributor',     // View + Add + Edit
  MODERATOR = 'moderator',         // View + Add + Edit + Approve/Reject
  COLLECTION_ADMIN = 'collection_admin', // All actions within this collection only
}

// User status
export enum UserStatus {
  INVITED = 'invited',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted'
}

// Collection assignment with sub-role
export interface CollectionPermission {
  collection: Collection;
  subRole: SubRole;
  customActions?: string[];
  restrictions?: {
    ownContentOnly?: boolean;
    approvedContentOnly?: boolean;
    departmentContentOnly?: boolean;
  };
}

// Client-safe user interface (without Mongoose ObjectIds)
export interface ClientUser {
  _id?: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  
  // Role system
  fullRole: FullRole;
  department?: string;
  status: UserStatus;
  
  // Dynamic permissions per collection
  collectionPermissions: CollectionPermission[];
  
  // Permission overrides (granted outside of role)
  permissionOverrides: CollectionPermission[];
  
  // Admin tracking
  createdBy?: string;
  approvedBy?: string;
  
  // Profile data
  profileImage?: string;
  phone?: string;
  address?: string;
  bio?: string;
  
  // Security
  lastLogin?: Date | string;
  loginAttempts: number;
  lockedUntil?: Date | string;
  
  // Audit trail
  createdAt: Date | string;
  updatedAt: Date | string;
  updatedBy?: string;
}

// Default collection access for each Full Role
export const FULL_ROLE_COLLECTIONS: Record<FullRole, Collection[]> = {
  [FullRole.SUPER_ADMIN]: Object.values(Collection), // Access to all collections
  [FullRole.ADMIN]: [
    Collection.PROJECTS, Collection.PROPERTIES, Collection.BLOGS, Collection.NEWS, Collection.CAREERS,
    Collection.DEVELOPERS, Collection.PLOTS, Collection.BUILDINGS, Collection.HOTELS, Collection.MALLS, Collection.COMMUNITIES, Collection.USERS
  ],
  [FullRole.AGENT]: [Collection.PROJECTS, Collection.PROPERTIES],
  [FullRole.MARKETING]: [Collection.BLOGS, Collection.NEWS],
  [FullRole.SALES]: [Collection.PROPERTIES, Collection.PLOTS, Collection.BUILDINGS, Collection.HOTELS, Collection.MALLS],
  [FullRole.HR]: [Collection.CAREERS, Collection.DEVELOPERS],
  [FullRole.COMMUNITY_MANAGER]: [Collection.COMMUNITIES],
  [FullRole.USER]: [Collection.PROJECTS], // Very limited default access
};

// Default sub-roles for each Full Role
export const FULL_ROLE_DEFAULT_SUBROLES: Record<FullRole, SubRole> = {
  [FullRole.SUPER_ADMIN]: SubRole.COLLECTION_ADMIN,
  [FullRole.ADMIN]: SubRole.COLLECTION_ADMIN,
  [FullRole.AGENT]: SubRole.CONTRIBUTOR,
  [FullRole.MARKETING]: SubRole.CONTRIBUTOR,
  [FullRole.SALES]: SubRole.CONTRIBUTOR,
  [FullRole.HR]: SubRole.MODERATOR,
  [FullRole.COMMUNITY_MANAGER]: SubRole.MODERATOR,
  [FullRole.USER]: SubRole.OBSERVER,
};

// Sub-role action definitions
export const SUB_ROLE_ACTIONS: Record<SubRole, Action[]> = {
  [SubRole.OBSERVER]: [Action.VIEW],
  [SubRole.CONTRIBUTOR]: [Action.VIEW, Action.ADD, Action.EDIT],
  [SubRole.MODERATOR]: [Action.VIEW, Action.ADD, Action.EDIT, Action.APPROVE, Action.REJECT],
  [SubRole.COLLECTION_ADMIN]: Object.values(Action), // All actions within this collection only
};

// Client-safe permission checking utilities
export class ClientPermissionChecker {
  static userHasCollectionPermission(
    user: ClientUser, 
    collection: Collection, 
    action: Action
  ): boolean {
    // Check permission overrides first (higher priority)
    const override = user.permissionOverrides?.find(p => p.collection === collection);
    if (override) {
      const allowedActions = SUB_ROLE_ACTIONS[override.subRole] || [];
      return allowedActions.includes(action);
    }

    // Check role-based permissions
    const rolePermission = user.collectionPermissions?.find(p => p.collection === collection);
    if (rolePermission) {
      const allowedActions = SUB_ROLE_ACTIONS[rolePermission.subRole] || [];
      return allowedActions.includes(action);
    }

    // Check default role permissions
    const defaultCollections = FULL_ROLE_COLLECTIONS[user.fullRole] || [];
    if (defaultCollections.includes(collection)) {
      const defaultSubRole = FULL_ROLE_DEFAULT_SUBROLES[user.fullRole];
      const allowedActions = SUB_ROLE_ACTIONS[defaultSubRole] || [];
      return allowedActions.includes(action);
    }

    return false;
  }

  static getUserSubRoleForCollection(
    user: ClientUser, 
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

    // Check if collection is accessible by default role
    const defaultCollections = FULL_ROLE_COLLECTIONS[user.fullRole] || [];
    if (defaultCollections.includes(collection)) {
      return FULL_ROLE_DEFAULT_SUBROLES[user.fullRole];
    }

    return null;
  }

  static getUserActionsForCollection(
    user: ClientUser, 
    collection: Collection
  ): Action[] {
    const subRole = this.getUserSubRoleForCollection(user, collection);
    if (!subRole) return [];
    
    return SUB_ROLE_ACTIONS[subRole] || [];
  }

  static getUserAccessibleCollections(user: ClientUser): Collection[] {
    const collections = new Set<Collection>();

    // Add default collections for user's full role
    const defaultCollections = FULL_ROLE_COLLECTIONS[user.fullRole] || [];
    defaultCollections.forEach(collection => collections.add(collection));

    // Add from role permissions (explicit grants)
    user.collectionPermissions?.forEach(p => collections.add(p.collection));
    
    // Add from overrides (additional grants)
    user.permissionOverrides?.forEach(p => collections.add(p.collection));

    return Array.from(collections);
  }

  static userHasAnyRole(user: ClientUser, roles: FullRole[]): boolean {
    return roles.includes(user.fullRole);
  }

  static userIsAdmin(user: ClientUser): boolean {
    return this.userHasAnyRole(user, [FullRole.ADMIN, FullRole.SUPER_ADMIN]);
  }

  static userIsSuperAdmin(user: ClientUser): boolean {
    return user.fullRole === FullRole.SUPER_ADMIN;
  }

  static userCanCreateUsers(user: ClientUser): boolean {
    return this.userHasCollectionPermission(user, Collection.USERS, Action.ADD);
  }

  static userCanManageUsers(user: ClientUser): boolean {
    return this.userHasCollectionPermission(user, Collection.USERS, Action.EDIT);
  }

  static userCanAccessNavigation(
    user: ClientUser, 
    navCollection: Collection
  ): boolean {
    return this.getUserAccessibleCollections(user).includes(navCollection);
  }
}
