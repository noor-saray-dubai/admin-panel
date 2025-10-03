import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { UserRecord } from "firebase-admin/auth";
import crypto from "crypto";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export const adminAuth = getAuth();

// Enhanced Firebase Admin utilities
export class FirebaseAdminService {
  /**
   * Create a new user with a temporary password (invite-only)
   */
  static async createUserWithTempPassword(userData: {
    email: string;
    displayName: string;
  }): Promise<{ user: UserRecord; tempPassword: string }> {
    try {
      // Generate a secure temporary password
      const tempPassword = this.generateTempPassword();
      
      // Create Firebase user
      const user = await adminAuth.createUser({
        email: userData.email,
        displayName: userData.displayName,
        password: tempPassword,
        emailVerified: false, // User must verify email through password reset
      });
      
      return { user, tempPassword };
    } catch (error) {
      console.error('Error creating Firebase user:', error);
      throw error;
    }
  }
  
  /**
   * Generate a secure temporary password
   */
  static generateTempPassword(): string {
    // Generate a 16-character secure password
    return crypto.randomBytes(12).toString('base64').replace(/[+/=]/g, '').substring(0, 16);
  }
  
  /**
   * Send password reset email (for invitation flow)
   */
  static async sendPasswordResetEmail(email: string): Promise<string> {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';
      const resetLink = await adminAuth.generatePasswordResetLink(email, {
        url: `${appUrl}/login`, // Redirect after password reset
      });
      return resetLink;
    } catch (error) {
      console.error('Error generating password reset link:', error);
      throw error;
    }
  }
  
  /**
   * Generate password reset link with custom options
   */
  static async generatePasswordResetLink(
    email: string, 
    actionCodeSettings?: {
      url: string;
      handleCodeInApp?: boolean;
      iOS?: {
        bundleId: string;
      };
      android?: {
        packageName: string;
        installApp?: boolean;
        minimumVersion?: string;
      };
      dynamicLinkDomain?: string;
    }
  ): Promise<string> {
    try {
      return await adminAuth.generatePasswordResetLink(email, actionCodeSettings);
    } catch (error) {
      console.error('Error generating password reset link:', error);
      throw error;
    }
  }
  
  /**
   * Update user's display name and email
   */
  static async updateUser(uid: string, updates: {
    displayName?: string;
    email?: string;
    disabled?: boolean;
  }): Promise<UserRecord> {
    try {
      return await adminAuth.updateUser(uid, updates);
    } catch (error) {
      console.error('Error updating Firebase user:', error);
      throw error;
    }
  }
  
  /**
   * Delete a user from Firebase Auth
   */
  static async deleteUser(uid: string): Promise<void> {
    try {
      await adminAuth.deleteUser(uid);
    } catch (error) {
      console.error('Error deleting Firebase user:', error);
      throw error;
    }
  }
  
  /**
   * Verify Firebase ID token and get user info
   */
  static async verifyIdToken(idToken: string): Promise<any> {
    try {
      return await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      console.error('Error verifying ID token:', error);
      throw error;
    }
  }
  
  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<UserRecord> {
    try {
      return await adminAuth.getUserByEmail(email);
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }
  
  /**
   * Get user by UID
   */
  static async getUserByUid(uid: string): Promise<UserRecord> {
    try {
      return await adminAuth.getUser(uid);
    } catch (error) {
      console.error('Error getting user by UID:', error);
      throw error;
    }
  }
  
  /**
   * Create custom token for user (for server-side auth)
   */
  static async createCustomToken(uid: string, additionalClaims?: any): Promise<string> {
    try {
      return await adminAuth.createCustomToken(uid, additionalClaims);
    } catch (error) {
      console.error('Error creating custom token:', error);
      throw error;
    }
  }
  
  /**
   * Set custom user claims (for role-based access)
   */
  static async setCustomUserClaims(uid: string, customClaims: any): Promise<void> {
    try {
      await adminAuth.setCustomUserClaims(uid, customClaims);
    } catch (error) {
      console.error('Error setting custom user claims:', error);
      throw error;
    }
  }
}
