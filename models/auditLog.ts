import mongoose from "mongoose";

export enum AuditAction {
  // Authentication
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  LOGIN_FAILED = 'login_failed',
  PASSWORD_RESET_REQUESTED = 'password_reset_requested',
  PASSWORD_RESET_COMPLETED = 'password_reset_completed',
  
  // User management
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  USER_SUSPENDED = 'user_suspended',
  USER_REACTIVATED = 'user_reactivated',
  USER_ROLE_CHANGED = 'user_role_changed',
  
  // Invitations
  INVITATION_SENT = 'invitation_sent',
  INVITATION_ACCEPTED = 'invitation_accepted',
  INVITATION_EXPIRED = 'invitation_expired',
  INVITATION_CANCELLED = 'invitation_cancelled',
  
  // Content management
  CONTENT_CREATED = 'content_created',
  CONTENT_UPDATED = 'content_updated',
  CONTENT_DELETED = 'content_deleted',
  CONTENT_PUBLISHED = 'content_published',
  CONTENT_UNPUBLISHED = 'content_unpublished',
  CONTENT_APPROVED = 'content_approved',
  CONTENT_REJECTED = 'content_rejected',
  
  // System actions
  SYSTEM_SETTINGS_UPDATED = 'system_settings_updated',
  BACKUP_CREATED = 'backup_created',
  BACKUP_RESTORED = 'backup_restored',
  
  // Security events
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  MULTIPLE_LOGIN_ATTEMPTS = 'multiple_login_attempts',
  ACCOUNT_LOCKED = 'account_locked',
  UNAUTHORIZED_ACCESS_ATTEMPT = 'unauthorized_access_attempt',
}

export enum AuditLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface IAuditLog extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  action: AuditAction;
  level: AuditLevel;
  
  // User information
  userId?: string; // Firebase UID of user who performed the action
  userEmail?: string;
  targetUserId?: string; // Firebase UID of user who was affected by the action
  targetUserEmail?: string;
  
  // Request information
  ip: string;
  userAgent?: string;
  
  // Action details
  resource?: string; // What was affected (e.g., 'blog', 'user', 'project')
  resourceId?: string; // ID of the affected resource
  details?: any; // Additional context data
  
  // Result
  success: boolean;
  errorMessage?: string;
  
  // Metadata
  timestamp: Date;
  sessionId?: string;
}

const AuditLogSchema = new mongoose.Schema<IAuditLog>({
  action: {
    type: String,
    enum: Object.values(AuditAction),
    required: true,
    index: true,
  },
  level: {
    type: String,
    enum: Object.values(AuditLevel),
    default: AuditLevel.INFO,
    required: true,
    index: true,
  },
  
  // User information
  userId: {
    type: String, // Firebase UID
    index: true,
  },
  userEmail: {
    type: String,
    lowercase: true,
    index: true,
  },
  targetUserId: {
    type: String, // Firebase UID
    index: true,
  },
  targetUserEmail: {
    type: String,
    lowercase: true,
  },
  
  // Request information
  ip: {
    type: String,
    required: true,
    index: true,
  },
  userAgent: String,
  
  // Action details
  resource: {
    type: String,
    index: true,
  },
  resourceId: {
    type: String,
    index: true,
  },
  details: mongoose.Schema.Types.Mixed,
  
  // Result
  success: {
    type: Boolean,
    default: true,
    required: true,
    index: true,
  },
  errorMessage: String,
  
  // Metadata
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true,
  },
  sessionId: String,
}, {
  // Don't add createdAt/updatedAt as we have timestamp
  timestamps: false,
});

// Compound indexes for common queries
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ level: 1, timestamp: -1 });
AuditLogSchema.index({ resource: 1, resourceId: 1, timestamp: -1 });
AuditLogSchema.index({ ip: 1, timestamp: -1 });
AuditLogSchema.index({ success: 1, level: 1, timestamp: -1 });

// TTL index to automatically remove old logs after 2 years
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 * 2 });

// Static method to create audit log entry
AuditLogSchema.statics.createLog = function(logData: Partial<IAuditLog>) {
  const log = new this({
    timestamp: new Date(),
    ...logData,
  });
  
  // Save asynchronously to avoid blocking the main operation
  log.save().catch((err: Error) => {
    console.error('Failed to save audit log:', err);
  });
  
  return log;
};

// Static method to get logs for a specific user
AuditLogSchema.statics.getUserLogs = function(userId: string, limit = 50) {
  return this.find({ 
    $or: [
      { userId: userId }, // Firebase UID as string
      { targetUserId: userId } // Firebase UID as string
    ]
  })
  .sort({ timestamp: -1 })
  .limit(limit);
};

// Static method to get security events
AuditLogSchema.statics.getSecurityEvents = function(limit = 100) {
  return this.find({
    level: { $in: [AuditLevel.WARNING, AuditLevel.ERROR, AuditLevel.CRITICAL] }
  })
  .sort({ timestamp: -1 })
  .limit(limit);
};

// Interface for static methods
export interface IAuditLogModel extends mongoose.Model<IAuditLog> {
  createLog(logData: Partial<IAuditLog>): IAuditLog;
  getUserLogs(userId: string, limit?: number): mongoose.Query<IAuditLog[], IAuditLog>;
  getSecurityEvents(limit?: number): mongoose.Query<IAuditLog[], IAuditLog>;
}

export const AuditLog = (mongoose.models.AuditLog || mongoose.model<IAuditLog, IAuditLogModel>('AuditLog', AuditLogSchema)) as IAuditLogModel;
