import mongoose from "mongoose";
import { FullRole } from "./enhancedUser";

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

export interface IInvitation extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  role: FullRole;
  department?: string;
  invitedBy: mongoose.Types.ObjectId;
  invitedAt: Date;
  expiresAt: Date;
  acceptedAt?: Date;
  status: InvitationStatus;
  token: string;
  
  // Additional invitation data
  personalMessage?: string;
  temporaryPassword?: string; // Encrypted
  
  createdAt: Date;
  updatedAt: Date;

  // Methods
  isExpired(): boolean;
  isValid(): boolean;
}

const InvitationSchema = new mongoose.Schema<IInvitation>({
  email: {
    type: String,
    required: true,
    lowercase: true,
    index: true,
  },
  role: {
    type: String,
    enum: Object.values(FullRole),
    required: true,
  },
  department: {
    type: String,
    trim: true,
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EnhancedUser',
    required: true,
  },
  invitedAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },
  acceptedAt: Date,
  status: {
    type: String,
    enum: Object.values(InvitationStatus),
    default: InvitationStatus.PENDING,
    required: true,
    index: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  personalMessage: String,
  temporaryPassword: String,
}, {
  timestamps: true,
});

// Compound indexes for queries
InvitationSchema.index({ email: 1, status: 1 });
InvitationSchema.index({ invitedBy: 1, createdAt: -1 });
InvitationSchema.index({ expiresAt: 1, status: 1 });

// Method to check if invitation is expired
InvitationSchema.methods.isExpired = function(): boolean {
  return new Date() > this.expiresAt;
};

// Method to check if invitation is valid
InvitationSchema.methods.isValid = function(): boolean {
  return this.status === InvitationStatus.PENDING && !this.isExpired();
};

// Pre-save middleware to update status if expired
InvitationSchema.pre('save', function(next) {
  if (this.isExpired() && this.status === InvitationStatus.PENDING) {
    this.status = InvitationStatus.EXPIRED;
  }
  next();
});

export const Invitation = mongoose.models.Invitation || mongoose.model<IInvitation>('Invitation', InvitationSchema);