import mongoose from "mongoose";
import { Collection, SubRole, FullRole } from "./enhancedUser";

export enum RequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

export interface IPermissionRequest {
  _id?: mongoose.Types.ObjectId;
  
  // User who made the request
  requestedBy: string; // Firebase UID
  requestedByEmail: string;
  requestedByName: string;
  
  // What permissions are being requested
  requestedPermissions: {
    collection: Collection;
    subRole: SubRole;
  }[];
  
  // Request details
  message: string; // Why they need these permissions
  businessJustification?: string; // Additional justification
  
  // Expiry and status
  requestedExpiry?: Date; // When they want permissions to expire (null = permanent)
  status: RequestStatus;
  
  // Admin response
  reviewedBy?: string; // Firebase UID of admin who reviewed
  reviewedByEmail?: string;
  reviewedByName?: string;
  reviewedAt?: Date;
  reviewNotes?: string; // Admin's notes about the decision
  
  // Actual granted permissions (might be different from requested)
  grantedPermissions?: {
    collection: Collection;
    subRole: SubRole;
  }[];
  grantedExpiry?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

const PermissionRequestSchema = new mongoose.Schema<IPermissionRequest>({
  // User who made the request
  requestedBy: {
    type: String,
    required: true,
    index: true,
  },
  requestedByEmail: {
    type: String,
    required: true,
    lowercase: true,
  },
  requestedByName: {
    type: String,
    required: true,
  },
  
  // Requested permissions
  requestedPermissions: [{
    collection: {
      type: String,
      enum: Object.values(Collection),
      required: true,
    },
    subRole: {
      type: String,
      enum: Object.values(SubRole),
      required: true,
    }
  }],
  
  // Request details
  message: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  businessJustification: {
    type: String,
    maxlength: 2000,
  },
  
  // Expiry and status
  requestedExpiry: {
    type: Date,
    default: null, // null means permanent
  },
  status: {
    type: String,
    enum: Object.values(RequestStatus),
    default: RequestStatus.PENDING,
    required: true,
    index: true,
  },
  
  // Admin response
  reviewedBy: {
    type: String,
    index: true,
  },
  reviewedByEmail: String,
  reviewedByName: String,
  reviewedAt: Date,
  reviewNotes: {
    type: String,
    maxlength: 1000,
  },
  
  // Granted permissions
  grantedPermissions: [{
    collection: {
      type: String,
      enum: Object.values(Collection),
    },
    subRole: {
      type: String,
      enum: Object.values(SubRole),
    }
  }],
  grantedExpiry: Date,
  
  // Metadata
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  }
}, {
  timestamps: true,
});

// Indexes for efficient querying
PermissionRequestSchema.index({ requestedBy: 1, createdAt: -1 });
PermissionRequestSchema.index({ status: 1, createdAt: -1 });
PermissionRequestSchema.index({ reviewedBy: 1, reviewedAt: -1 });
PermissionRequestSchema.index({ requestedExpiry: 1 }); // For cleanup of expired requests

// Static method to get pending requests
PermissionRequestSchema.statics.getPendingRequests = function(limit = 50) {
  return this.find({ status: RequestStatus.PENDING })
    .sort({ priority: -1, createdAt: 1 }) // High priority first, then oldest first
    .limit(limit);
};

// Static method to get user's requests
PermissionRequestSchema.statics.getUserRequests = function(firebaseUid: string, limit = 20) {
  return this.find({ requestedBy: firebaseUid })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Method to check if request has expired
PermissionRequestSchema.methods.isExpired = function() {
  if (!this.requestedExpiry) return false; // Permanent requests don't expire
  return new Date() > this.requestedExpiry;
};

export const PermissionRequest = mongoose.models.PermissionRequest || 
  mongoose.model<IPermissionRequest>('PermissionRequest', PermissionRequestSchema);