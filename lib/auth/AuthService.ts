import mongoose from 'mongoose';
import { connectToDatabase } from '../db';
import { EnhancedUser, IEnhancedUser, FullRole, UserStatus } from '../../models/enhancedUser';
import { Invitation, IInvitation, InvitationStatus } from '../../models/invitation';
import { AuditLog, AuditAction, AuditLevel } from '../../models/auditLog';
import { FirebaseAdminService } from '../firebaseAdmin';
import { nanoid } from 'nanoid';

export interface CreateUserData {
  email: string;
  displayName: string;
  role: FullRole;
  department?: string;
  personalMessage?: string;
}

export interface InvitationData extends CreateUserData {
  invitedBy: string;
}

export interface AuthServiceOptions {
  ip: string;
  userAgent?: string;
  sessionId?: string;
}

export class AuthService {
  private options: AuthServiceOptions;

  constructor(options: AuthServiceOptions) {
    this.options = options;
  }

  /**
   * Create a new user invitation (admin only)
   */
  async createUserInvitation(
    invitationData: InvitationData
  ): Promise<{ invitation: IInvitation; resetLink: string }> {
    try {
      await connectToDatabase();

      // Check if user already exists
      const existingUser = await EnhancedUser.findOne({ email: invitationData.email });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Check if there's already a pending invitation
      const existingInvitation = await Invitation.findOne({
        email: invitationData.email,
        status: InvitationStatus.PENDING,
      });
      
      if (existingInvitation && !existingInvitation.isExpired()) {
        throw new Error('A pending invitation already exists for this email');
      }

      // Create Firebase user with temporary password
      const { user: firebaseUser, tempPassword } = await FirebaseAdminService.createUserWithTempPassword({
        email: invitationData.email,
        displayName: invitationData.displayName,
      });

      // Create user record in MongoDB
      const newUser = new EnhancedUser({
        firebaseUid: firebaseUser.uid,
        email: invitationData.email,
        displayName: invitationData.displayName,
        fullRole: invitationData.role,
        department: invitationData.department,
        status: UserStatus.INVITED,
        createdBy: invitationData.invitedBy,
        collectionPermissions: [], // Will be populated based on role
        permissionOverrides: [],
        loginAttempts: 0,
      });

      await newUser.save();

      // Generate invitation token
      const invitationToken = nanoid(32);

      // Create invitation record
      const invitation = new Invitation({
        email: invitationData.email,
        role: invitationData.role,
        department: invitationData.department,
        invitedBy: invitationData.invitedBy,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        token: invitationToken,
        personalMessage: invitationData.personalMessage,
        temporaryPassword: tempPassword, // Store encrypted in production
      });

      await invitation.save();

      // Generate password reset link for the invitation
      const resetLink = await FirebaseAdminService.sendPasswordResetEmail(invitationData.email);

      // Log the action
      await this.createAuditLog({
        action: AuditAction.INVITATION_SENT,
        userId: invitationData.invitedBy,
        targetUserEmail: invitationData.email,
        success: true,
        details: {
          role: invitationData.role,
          department: invitationData.department,
        },
      });

      return { invitation, resetLink };
    } catch (error) {
      // Log failed attempt
      await this.createAuditLog({
        action: AuditAction.INVITATION_SENT,
        userId: invitationData.invitedBy,
        targetUserEmail: invitationData.email,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        level: AuditLevel.ERROR,
      });

      throw error;
    }
  }

  /**
   * Accept invitation and activate user account
   */
  async acceptInvitation(token: string): Promise<IEnhancedUser> {
    try {
      await connectToDatabase();

      // Find and validate invitation
      const invitation = await Invitation.findOne({ 
        token, 
        status: InvitationStatus.PENDING 
      });

      if (!invitation || !invitation.isValid()) {
        throw new Error('Invalid or expired invitation');
      }

      // Find the user
      const user = await EnhancedUser.findOne({ email: invitation.email });
      if (!user) {
        throw new Error('User not found');
      }

      // Update user status to active
      user.status = UserStatus.ACTIVE;
      await user.save();

      // Update invitation status
      invitation.status = InvitationStatus.ACCEPTED;
      invitation.acceptedAt = new Date();
      await invitation.save();

      // Set Firebase custom claims for role-based access
      await FirebaseAdminService.setCustomUserClaims(user.firebaseUid, {
        role: user.fullRole,
        permissions: user.getAccessibleCollections(),
      });

      // Log the action
      await this.createAuditLog({
        action: AuditAction.INVITATION_ACCEPTED,
        targetUserId: user._id?.toString(),
        targetUserEmail: user.email,
        success: true,
      });

      return user;
    } catch (error) {
      await this.createAuditLog({
        action: AuditAction.INVITATION_ACCEPTED,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        level: AuditLevel.ERROR,
      });

      throw error;
    }
  }

  /**
   * Get user data for already authenticated user (does NOT perform login)
   * This method should only be called after Firebase authentication is verified
   */
  async authenticateUser(firebaseUid: string): Promise<IEnhancedUser | null> {
    try {
      await connectToDatabase();

      const user = await EnhancedUser.findOne({ 
        firebaseUid, 
        status: { $in: [UserStatus.ACTIVE] }
      });

      if (!user) {
        return null;
      }

      // Check if account is locked
      if (user.isLocked()) {
        throw new Error('Account is temporarily locked');
      }

      // Note: lastLogin should be updated by the actual login API, not here
      // This method is just for fetching authenticated user data
      
      return user;
    } catch (error) {
      // Don't log as login failure - this is just a data fetch operation
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(
    userId: string,
    updates: Partial<IEnhancedUser>,
    updatedBy?: string
  ): Promise<IEnhancedUser> {
    try {
      await connectToDatabase();

      const user = await EnhancedUser.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Prevent certain fields from being updated via this method
      const allowedUpdates = [
        'displayName', 'phone', 'address', 'bio', 'profileImage', 'department'
      ];
      
      const sanitizedUpdates: any = {};
      Object.keys(updates).forEach(key => {
        if (allowedUpdates.includes(key)) {
          sanitizedUpdates[key] = updates[key as keyof IEnhancedUser];
        }
      });

      // Update user
      Object.assign(user, sanitizedUpdates);
      user.updatedBy = updatedBy ? new mongoose.Types.ObjectId(updatedBy) : undefined;
      await user.save();

      // Update Firebase user if display name changed
      if (sanitizedUpdates.displayName) {
        await FirebaseAdminService.updateUser(user.firebaseUid, {
          displayName: sanitizedUpdates.displayName,
        });
      }

      // Log the action
      await this.createAuditLog({
        action: AuditAction.USER_UPDATED,
        userId: updatedBy,
        targetUserId: userId,
        targetUserEmail: user.email,
        success: true,
        details: sanitizedUpdates,
      });

      return user;
    } catch (error) {
      await this.createAuditLog({
        action: AuditAction.USER_UPDATED,
        userId: updatedBy,
        targetUserId: userId,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        level: AuditLevel.ERROR,
      });

      throw error;
    }
  }

  /**
   * Update user role and permissions (admin only)
   */
  async updateUserRole(
    userId: string,
    newRole: FullRole,
    updatedBy: string
  ): Promise<IEnhancedUser> {
    try {
      await connectToDatabase();

      const user = await EnhancedUser.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const oldRole = user.fullRole;
      user.fullRole = newRole;
      user.updatedBy = new mongoose.Types.ObjectId(updatedBy);
      await user.save();

      // Update Firebase custom claims
      await FirebaseAdminService.setCustomUserClaims(user.firebaseUid, {
        role: newRole,
        permissions: user.getAccessibleCollections(),
      });

      // Log the action
      await this.createAuditLog({
        action: AuditAction.USER_ROLE_CHANGED,
        userId: updatedBy,
        targetUserId: userId,
        targetUserEmail: user.email,
        success: true,
        details: {
          oldRole,
          newRole,
        },
      });

      return user;
    } catch (error) {
      await this.createAuditLog({
        action: AuditAction.USER_ROLE_CHANGED,
        userId: updatedBy,
        targetUserId: userId,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        level: AuditLevel.ERROR,
      });

      throw error;
    }
  }

  /**
   * Suspend or reactivate user
   */
  async updateUserStatus(
    userId: string,
    newStatus: UserStatus,
    updatedBy: string
  ): Promise<IEnhancedUser> {
    try {
      await connectToDatabase();

      const user = await EnhancedUser.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const oldStatus = user.status;
      user.status = newStatus;
      user.updatedBy = new mongoose.Types.ObjectId(updatedBy);
      await user.save();

      // Disable/enable Firebase user based on status
      await FirebaseAdminService.updateUser(user.firebaseUid, {
        disabled: newStatus === UserStatus.SUSPENDED || newStatus === UserStatus.DELETED,
      });

      // Log the action
      const action = newStatus === UserStatus.SUSPENDED ? 
        AuditAction.USER_SUSPENDED : 
        AuditAction.USER_REACTIVATED;

      await this.createAuditLog({
        action,
        userId: updatedBy,
        targetUserId: userId,
        targetUserEmail: user.email,
        success: true,
        details: {
          oldStatus,
          newStatus,
        },
      });

      return user;
    } catch (error) {
      await this.createAuditLog({
        action: AuditAction.USER_SUSPENDED,
        userId: updatedBy,
        targetUserId: userId,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        level: AuditLevel.ERROR,
      });

      throw error;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      await connectToDatabase();

      // Check if user exists and is active
      const user = await EnhancedUser.findOne({ 
        email, 
        status: UserStatus.ACTIVE 
      });

      if (!user) {
        // Don't reveal if user exists or not
        return;
      }

      // Generate password reset link
      await FirebaseAdminService.sendPasswordResetEmail(email);

      // Log the action
      await this.createAuditLog({
        action: AuditAction.PASSWORD_RESET_REQUESTED,
        targetUserId: user._id?.toString(),
        targetUserEmail: user.email,
        success: true,
      });
    } catch (error) {
      await this.createAuditLog({
        action: AuditAction.PASSWORD_RESET_REQUESTED,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        level: AuditLevel.WARNING,
      });

      // Don't throw error to prevent email enumeration
      console.error('Password reset error:', error);
    }
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(filters?: {
    role?: FullRole;
    status?: UserStatus;
    department?: string;
  }): Promise<IEnhancedUser[]> {
    try {
      await connectToDatabase();

      const query: any = {};
      
      if (filters?.role) query.fullRole = filters.role;
      if (filters?.status) query.status = filters.status;
      if (filters?.department) query.department = filters.department;

      return await EnhancedUser.find(query)
        .populate('createdBy', 'displayName email')
        .populate('updatedBy', 'displayName email')
        .sort({ createdAt: -1 });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    total: number;
    active: number;
    invited: number;
    suspended: number;
    byRole: Record<FullRole, number>;
  }> {
    try {
      await connectToDatabase();

      const [total, active, invited, suspended, roleStats] = await Promise.all([
        EnhancedUser.countDocuments(),
        EnhancedUser.countDocuments({ status: UserStatus.ACTIVE }),
        EnhancedUser.countDocuments({ status: UserStatus.INVITED }),
        EnhancedUser.countDocuments({ status: UserStatus.SUSPENDED }),
        EnhancedUser.aggregate([
          { $group: { _id: '$fullRole', count: { $sum: 1 } } }
        ]),
      ]);

      const byRole: Record<FullRole, number> = Object.values(FullRole).reduce((acc, role) => {
        acc[role] = 0;
        return acc;
      }, {} as Record<FullRole, number>);

      roleStats.forEach((stat: any) => {
        if (stat._id) {
          byRole[stat._id as FullRole] = stat.count;
        }
      });

      return {
        total,
        active,
        invited,
        suspended,
        byRole,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create audit log entry
   */
  private async createAuditLog(logData: {
    action: AuditAction;
    userId?: string;
    targetUserId?: string;
    userEmail?: string;
    targetUserEmail?: string;
    success: boolean;
    errorMessage?: string;
    level?: AuditLevel;
    details?: any;
  }): Promise<void> {
    try {
      await AuditLog.create({
        ...logData,
        ip: this.options.ip,
        userAgent: this.options.userAgent,
        sessionId: this.options.sessionId,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw error to prevent disrupting main operations
    }
  }
}

// Export singleton helper for easy access
export const createAuthService = (options: AuthServiceOptions) => new AuthService(options);