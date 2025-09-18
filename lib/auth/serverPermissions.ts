// lib/auth/serverPermissions.ts
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebaseAdmin';
import { connectToDatabase } from '@/lib/db';
import { EnhancedUser, FullRole } from '@/models/enhancedUser';

export async function checkAdminAccess(): Promise<{
  hasAccess: boolean;
  reason?: string;
  user?: any;
}> {
  try {
    // Get session cookie
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('__session')?.value;

    if (!sessionCookie) {
      return { hasAccess: false, reason: 'no_session' };
    }

    // Verify session with Firebase Admin
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    const firebaseUid = decodedToken.uid;

    // Connect to database and get user
    await connectToDatabase();
    const user = await EnhancedUser.findOne({ firebaseUid }).lean();

    if (!user) {
      return { hasAccess: false, reason: 'user_not_found' };
    }

    // Check if user is admin or super admin
    const isAdmin = [FullRole.ADMIN, FullRole.SUPER_ADMIN].includes(user.fullRole);

    if (!isAdmin) {
      return { hasAccess: false, reason: 'insufficient_role', user };
    }

    return { hasAccess: true, user };

  } catch (error) {
    console.error('Error checking admin access:', error);
    return { hasAccess: false, reason: 'auth_error' };
  }
}

export async function getCurrentUser(): Promise<{
  user: any | null;
  error?: string;
}> {
  try {
    // Get session cookie
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('__session')?.value;

    if (!sessionCookie) {
      return { user: null, error: 'no_session' };
    }

    // Verify session with Firebase Admin
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    const firebaseUid = decodedToken.uid;

    // Connect to database and get user
    await connectToDatabase();
    const user = await EnhancedUser.findOne({ firebaseUid }).lean();

    if (!user) {
      return { user: null, error: 'user_not_found' };
    }

    return { user };

  } catch (error) {
    console.error('Error getting current user:', error);
    return { user: null, error: 'auth_error' };
  }
}