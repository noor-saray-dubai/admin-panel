// hooks/useAuth.ts
"use client"

import { useState, useEffect } from 'react'
import { User, onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '@/firebase'
import { UserRole, Permission, IUser } from '@/models/enhancedUser'

interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  emailVerified: boolean
  // Enhanced properties from MongoDB
  role?: UserRole
  permissions?: Permission[]
  status?: string
  department?: string
  mongoId?: string
  lastLogin?: Date
}

interface UseAuthReturn {
  user: AuthUser | null
  mongoUser: IUser | null
  loading: boolean
  signOut: () => Promise<void>
  hasPermission: (permission: Permission) => boolean
  hasRole: (role: UserRole) => boolean
  isAdmin: () => boolean
  isSuperAdmin: () => boolean
  refreshUserData: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [mongoUser, setMongoUser] = useState<IUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch user data from MongoDB
  const fetchMongoUserData = async (firebaseUid: string): Promise<IUser | null> => {
    try {
      const response = await fetch('/api/auth/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firebaseUid }),
      });

      if (response.ok) {
        const userData = await response.json();
        return userData.user;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  // Refresh user data from MongoDB
  const refreshUserData = async (): Promise<void> => {
    if (user?.uid) {
      const mongoUserData = await fetchMongoUserData(user.uid);
      setMongoUser(mongoUserData);
      
      if (mongoUserData) {
        // Update the combined user object with MongoDB data
        setUser(prev => prev ? {
          ...prev,
          role: mongoUserData.role,
          permissions: mongoUserData.getAllPermissions(),
          status: mongoUserData.status,
          department: mongoUserData.department,
          mongoId: mongoUserData._id?.toString(),
          lastLogin: mongoUserData.lastLogin,
        } : null);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        // Create base user object from Firebase
        const baseUser: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
        };

        setUser(baseUser);

        // Fetch additional data from MongoDB
        const mongoUserData = await fetchMongoUserData(firebaseUser.uid);
        setMongoUser(mongoUserData);

        if (mongoUserData) {
          // Merge Firebase and MongoDB data
          setUser({
            ...baseUser,
            role: mongoUserData.role,
            permissions: mongoUserData.getAllPermissions(),
            status: mongoUserData.status,
            department: mongoUserData.department,
            mongoId: mongoUserData._id?.toString(),
            lastLogin: mongoUserData.lastLogin,
          });
        }
      } else {
        setUser(null);
        setMongoUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      // Call logout API to log the action
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          firebaseUid: user?.uid,
          email: user?.email 
        }),
      });

      await signOut(auth);
      
      // Clear any local storage
      localStorage.removeItem("isAuthenticated");
      
      // Reset state
      setUser(null);
      setMongoUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Permission checking functions
  const hasPermission = (permission: Permission): boolean => {
    if (!user?.permissions) return false;
    return user.permissions.includes(permission);
  };

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const isAdmin = (): boolean => {
    return user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;
  };

  const isSuperAdmin = (): boolean => {
    return user?.role === UserRole.SUPER_ADMIN;
  };

  return {
    user,
    mongoUser,
    loading,
    signOut: handleSignOut,
    hasPermission,
    hasRole,
    isAdmin,
    isSuperAdmin,
    refreshUserData,
  };
}
