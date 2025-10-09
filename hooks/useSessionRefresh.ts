// hooks/useSessionRefresh.ts

import { useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

/**
 * Hook for automatic session refresh
 * Periodically refreshes the session to prevent logout
 */
export function useSessionRefresh(enabled: boolean = true) {
  const { user } = useAuth();

  const refreshSession = useCallback(async () => {
    if (!user) return false;

    try {
      const response = await fetch('/api/auth/refresh-session', {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Session refreshed automatically');
        return true;
      } else {
        console.warn('⚠️ Session refresh failed:', data.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Session refresh error:', error);
      return false;
    }
  }, [user]);

  // Auto-refresh every 8 minutes (before 10-minute expiry)
  useEffect(() => {
    if (!enabled || !user) return;

    const interval = setInterval(() => {
      refreshSession();
    }, 8 * 60 * 1000); // 8 minutes

    // Initial refresh after 1 minute to handle any existing sessions close to expiry
    const initialTimeout = setTimeout(() => {
      refreshSession();
    }, 60 * 1000); // 1 minute

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout);
    };
  }, [enabled, user, refreshSession]);

  return { refreshSession };
}