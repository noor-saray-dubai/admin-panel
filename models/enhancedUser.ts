// models/enhancedUser.ts

import mongoose from "mongoose";

// Collection types that can be managed
export enum Collection {
  PROJECTS = 'projects',
  BLOGS = 'blogs',
  NEWS = 'news',
  CAREERS = 'careers',
  DEVELOPERS = 'developers',
  PLOTS = 'plots',
  MALLS = 'malls',
  BUILDINGS = 'buildings',
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
  SALES = 'sales',          // Plots, Malls, Buildings
  HR = 'hr',               // Careers, Developers
  COMMUNITY_MANAGER = 'community_manager', // Communities
  USER = 'user',           // Basic access
}

// Sub-Roles (Action Scope) - What actions they can perform
export enum SubRole {
  OBSERVER = 'observer',           // View only
  CONTRIBUTOR = 'contributor',     // View + Add + Edit
  MODERATOR = 'moderator',         // View + Add + Edit + Approve/Reject
  COLLECTION_ADMIN = 'collection_admin', // All actions within this collection
}

// User status
export enum UserStatus {
  INVITED = 'invited',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted'
}

// Permission override request status
export enum RequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
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

// Permission override request
export interface PermissionRequest {
  _id?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  requestedBy: mongoose.Types.ObjectId;
  collection: Collection;
  requestedSubRole: SubRole;
  currentSubRole?: SubRole;
  reason: string;
  status: RequestStatus;
  requestedAt: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Main User interface
export interface IEnhancedUser {
  _id?: mongoose.Types.ObjectId;
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
  createdBy?: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  lastRoleChange?: {
    previousRole: FullRole;
    newRole: FullRole;
    changedBy: mongoose.Types.ObjectId;
    changedAt: Date;
    reason?: string;
  };
  
  // Profile data
  profileImage?: string;
  phone?: string;
  address?: string;
  bio?: string;
  
  // Security
  lastLogin?: Date;
  loginAttempts: number;
  lockedUntil?: Date;
  
  // Audit trail
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: mongoose.Types.ObjectId;
}

// Default collection access for each Full Role
export const FULL_ROLE_COLLECTIONS: Record<FullRole, Collection[]> = {
  [FullRole.SUPER_ADMIN]: Object.values(Collection), // Access to all collections
  [FullRole.ADMIN]: [
    Collection.PROJECTS, Collection.BLOGS, Collection.NEWS, Collection.CAREERS,
    Collection.DEVELOPERS, Collection.PLOTS, Collection.MALLS, Collection.BUILDINGS, 
    Collection.COMMUNITIES, Collection.USERS
  ],
  [FullRole.AGENT]: [Collection.PROJECTS],
  [FullRole.MARKETING]: [Collection.BLOGS, Collection.NEWS],
  [FullRole.SALES]: [Collection.PLOTS, Collection.MALLS, Collection.BUILDINGS],
  [FullRole.HR]: [Collection.CAREERS, Collection.DEVELOPERS],
  [FullRole.COMMUNITY_MANAGER]: [Collection.COMMUNITIES],
  [FullRole.USER]: [Collection.PROJECTS],
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
  [SubRole.COLLECTION_ADMIN]: Object.values(Action), // All actions
};

// Permission Request Schema
const PermissionRequestSchema = new mongoose.Schema<PermissionRequest>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EnhancedUser',
    required: true,
    index: true,
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EnhancedUser',
    required: true,
  },
  collection: {
    type: String,
    enum: Object.values(Collection),
    required: true,
    index: true,
  },
  requestedSubRole: {
    type: String,
    enum: Object.values(SubRole),
    required: true,
  },
  currentSubRole: {
    type: String,
    enum: Object.values(SubRole),
  },
  reason: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(RequestStatus),
    default: RequestStatus.PENDING,
    required: true,
    index: true,
  },
  requestedAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EnhancedUser',
  },
  reviewedAt: Date,
  reviewNotes: String,
  expiresAt: Date,
}, {
  timestamps: true,
});

// Enhanced User Schema
const EnhancedUserSchema = new mongoose.Schema<IEnhancedUser>({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true,
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
  },
  fullRole: {
    type: String,
    enum: Object.values(FullRole),
    default: FullRole.USER,
    required: true,
    index: true,
  },
  department: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: Object.values(UserStatus),
    default: UserStatus.INVITED,
    required: true,
    index: true,
  },
  
  // Dynamic collection permissions
  collectionPermissions: [{
    collection: {
      type: String,
      enum: Object.values(Collection),
      required: true,
    },
    subRole: {
      type: String,
      enum: Object.values(SubRole),
      required: true,
    },
    customActions: [String],
    restrictions: {
      ownContentOnly: { type: Boolean, default: false },
      approvedContentOnly: { type: Boolean, default: false },
      departmentContentOnly: { type: Boolean, default: false },
    }
  }],
  
  // Permission overrides (granted outside of role)
  permissionOverrides: [{
    collection: {
      type: String,
      enum: Object.values(Collection),
      required: true,
    },
    subRole: {
      type: String,
      enum: Object.values(SubRole),
      required: true,
    },
    customActions: [String],
    restrictions: {
      ownContentOnly: { type: Boolean, default: false },
      approvedContentOnly: { type: Boolean, default: false },
      departmentContentOnly: { type: Boolean, default: false },
    }
  }],
  
  // Admin tracking
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EnhancedUser',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EnhancedUser',
  },
  lastRoleChange: {
    previousRole: {
      type: String,
      enum: Object.values(FullRole),
    },
    newRole: {
      type: String,
      enum: Object.values(FullRole),
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EnhancedUser',
    },
    changedAt: Date,
    reason: String,
  },
  
  // Profile data
  profileImage: String,
  phone: String,
  address: String,
  bio: String,
  
  // Security
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockedUntil: Date,
  
  // Audit trail
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EnhancedUser',
  },
}, {
  timestamps: true,
});

// Indexes for performance
EnhancedUserSchema.index({ email: 1, status: 1 });
EnhancedUserSchema.index({ fullRole: 1, status: 1 });
EnhancedUserSchema.index({ createdAt: -1 });
EnhancedUserSchema.index({ 'collectionPermissions.collection': 1 });

// Methods for permission checking
EnhancedUserSchema.methods.hasPermissionForCollection = function(collection: Collection, action: Action): boolean {
  // Check role-based permissions first
  const rolePerms = this.collectionPermissions.find((p: CollectionPermission) => p.collection === collection);
  if (rolePerms) {
    const subRoleActions = SUB_ROLE_ACTIONS[rolePerms.subRole as SubRole] || [];
    if (subRoleActions.includes(action)) {
      return true;
    }
  }
  
  // Check permission overrides (these take precedence)
  const overrides = this.permissionOverrides.find((p: CollectionPermission) => p.collection === collection);
  if (overrides) {
    const subRoleActions = SUB_ROLE_ACTIONS[overrides.subRole as SubRole] || [];
    if (subRoleActions.includes(action)) {
      return true;
    }
  }
  
  return false;
};

EnhancedUserSchema.methods.getAllPermissionsForCollection = function(collection: Collection): Action[] {
  // Check if user has override permissions for this collection
  const overrides = this.permissionOverrides.find((p: CollectionPermission) => p.collection === collection);
  if (overrides) {
    return SUB_ROLE_ACTIONS[overrides.subRole as SubRole] || [];
  }
  
  // Otherwise use role-based permissions
  const rolePerms = this.collectionPermissions.find((p: CollectionPermission) => p.collection === collection);
  if (rolePerms) {
    return SUB_ROLE_ACTIONS[rolePerms.subRole as SubRole] || [];
  }
  
  return [];
};

EnhancedUserSchema.methods.getSubRoleForCollection = function(collection: Collection): SubRole | null {
  // Check if user has override permissions for this collection
  const overrides = this.permissionOverrides.find((p: CollectionPermission) => p.collection === collection);
  if (overrides) {
    return overrides.subRole;
  }
  
  // Otherwise use role-based permissions
  const rolePerms = this.collectionPermissions.find((p: CollectionPermission) => p.collection === collection);
  if (rolePerms) {
    return rolePerms.subRole;
  }
  
  return null;
};

EnhancedUserSchema.methods.getAccessibleCollections = function(): Collection[] {
  const collections = new Set<Collection>();
  
  // Add collections from role permissions
  this.collectionPermissions.forEach((p: CollectionPermission) => {
    collections.add(p.collection);
  });
  
  // Add collections from overrides
  this.permissionOverrides.forEach((p: CollectionPermission) => {
    collections.add(p.collection);
  });
  
  return Array.from(collections);
};

// Method to check if user is locked
EnhancedUserSchema.methods.isLocked = function(): boolean {
  return this.lockedUntil && this.lockedUntil > new Date();
};

// Pre-save middleware to set default permissions based on role
// Better pre-save middleware that handles all scenarios
EnhancedUserSchema.pre('save', function(next) {
  // Scenario 1: Brand new user being created
  if (this.isNew) {
    // Set default permissions for new users if not already set
    if (!this.collectionPermissions || this.collectionPermissions.length === 0) {
      const accessibleCollections = FULL_ROLE_COLLECTIONS[this.fullRole] || [];
      const defaultSubRole = FULL_ROLE_DEFAULT_SUBROLES[this.fullRole] || SubRole.OBSERVER;
      
      this.collectionPermissions = accessibleCollections.map(collection => ({
        collection,
        subRole: defaultSubRole,
        customActions: [],
        restrictions: this.fullRole === FullRole.USER ? { approvedContentOnly: true } : {},
      }));
    }
  }
  // Scenario 2: Existing user's role is being changed
  else if (this.isModified('fullRole')) {
    // When role changes, recalculate permissions
    const accessibleCollections = FULL_ROLE_COLLECTIONS[this.fullRole] || [];
    const defaultSubRole = FULL_ROLE_DEFAULT_SUBROLES[this.fullRole] || SubRole.OBSERVER;
    
    this.collectionPermissions = accessibleCollections.map(collection => ({
      collection,
      subRole: defaultSubRole,
      customActions: [],
      restrictions: this.fullRole === FullRole.USER ? { approvedContentOnly: true } : {},
    }));
  }
  // Scenario 3: Other fields modified (like lastLogin) - don't touch permissions
  
  next();
});
export const EnhancedUser = mongoose.models.EnhancedUser || mongoose.model<IEnhancedUser>('EnhancedUser', EnhancedUserSchema);
export const PermissionRequestModel = mongoose.models.PermissionRequest || mongoose.model<PermissionRequest>('PermissionRequest', PermissionRequestSchema);