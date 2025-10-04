"use client"

import { LogOut, Loader2, AlertTriangle } from "lucide-react"
import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "firebase/auth"
import { auth } from "@/firebase"
import { useToast } from "@/components/ui/toast-system"
import { useAuth } from "@/hooks/useAuth"
import {
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

interface LogoutButtonProps {
  onLogoutStart?: () => void
  onLogoutComplete?: () => void
  className?: string
}

const MAX_RETRY_ATTEMPTS = 2

export function LogoutButton({ onLogoutStart, onLogoutComplete, className }: LogoutButtonProps) {
  const router = useRouter()
  const { info, success, error: showError } = useToast()
  const { user } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  
  const logoutTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (logoutTimeoutRef.current) {
        clearTimeout(logoutTimeoutRef.current)
      }
    }
  }, [])

  // 🔥 INSTANT CLIENT-SIDE CLEANUP
  const clearClientData = useCallback(() => {
    try {
      console.log("🧹 Clearing client-side data...");

      // 1️⃣ Set logout flag (middleware will see this immediately)
      document.cookie = "__logout=true; path=/; max-age=3"; // 3 second TTL (shorter to prevent loops)
      
      // 2️⃣ Clear session cookie IMMEDIATELY
      const clearCookie = (name: string) => {
        const variations = [
          `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`,
          `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`,
          `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`,
        ];

        if (process.env.NODE_ENV === "production") {
          variations.push(
            `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.noorsaray.com`,
            `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=noorsaray.com`
          );
        }

        variations.forEach(cookieStr => {
          document.cookie = cookieStr;
        });
      };

      // Clear critical auth cookies
      const authCookies = [
        "__session",
        "auth-token",
        "firebase-token",
        "refresh-token",
        "session-id",
        "user-session",
      ];

      authCookies.forEach(clearCookie);

      // 3️⃣ Clear storage
      localStorage.clear();
      sessionStorage.clear();

      // 4️⃣ Clear IndexedDB (async, fire-and-forget)
      if ('indexedDB' in window) {
        const firebaseDBs = [
          'firebaseLocalStorageDb',
          'firebase-installations-database',
          'firebase-auth-state',
        ];
        
        firebaseDBs.forEach(dbName => {
          indexedDB.deleteDatabase(dbName);
        });
      }

      console.log("✅ Client-side data cleared");
    } catch (err) {
      console.warn("⚠️ Client cleanup warning:", err);
      // Don't throw - cleanup is best-effort
    }
  }, []);

  // 🚀 INSTANT REDIRECT
  const forceRedirect = useCallback(() => {
    console.log("🚀 Force redirect to login");
    
    // Clear one more time for safety
    clearClientData();

    // Clean redirect to login page
    if (typeof window !== 'undefined') {
      // Use replace to avoid back button issues
      window.location.replace('/login');
      
      // Fallback after reasonable time if somehow replace fails
      setTimeout(() => {
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }, 1000);
    }
  }, [clearClientData]);

  // 🔥 GOD-TIER LOGOUT FUNCTION
  const handleLogout = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);
    onLogoutStart?.();

    console.log("🚪 Starting optimized logout...");

    try {
      // ⚡ PHASE 1: INSTANT CLIENT CLEANUP (no waiting!)
      clearClientData();

      // ⚡ PHASE 2: FIREBASE SIGN OUT (async, don't wait long)
      const firebaseLogout = signOut(auth).catch(err => {
        console.warn("⚠️ Firebase signOut warning:", err);
        // Don't throw - we'll proceed anyway
      });

      // ⚡ PHASE 3: BACKEND TOKEN REVOCATION (fire-and-forget)
      const backendLogout = fetch("/api/logout", {
        method: "POST",
        credentials: "include",
        headers: { 
          "Content-Type": "application/json",
          "X-Logout-In-Progress": "true",
        },
      }).catch(err => {
        console.warn("⚠️ Backend logout warning:", err);
        // Don't throw - we'll proceed anyway
      });

      // Wait max 2 seconds for Firebase (background task)
      await Promise.race([
        firebaseLogout,
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);

      // Don't wait for backend - it happens in background

      console.log("✅ Logout complete, redirecting...");
      
      // Success notification
      success("Signed Out", "Redirecting to login...", 2000);
      
      onLogoutComplete?.();

      // ⚡ PHASE 4: REDIRECT WITH REASONABLE DELAY
      // Allow user to see the "Signed Out" message briefly
      setTimeout(forceRedirect, 500); // Half second delay for better UX

    } catch (err) {
      console.error("❌ Logout error:", err);
      
      const newRetryCount = retryCount + 1;
      
      if (newRetryCount >= MAX_RETRY_ATTEMPTS) {
        showError(
          "Logout Failed", 
          "Forcing logout for security...",
          3000
        );
        setTimeout(forceRedirect, 1000);
        return;
      }

      const errorMessage = err instanceof Error ? err.message : "Logout failed";
      setError(errorMessage);
      setRetryCount(newRetryCount);
      setIsLoading(false);
      
      showError(
        "Logout Failed", 
        `${errorMessage}. Please retry.`,
        5000
      );
    }
  }, [isLoading, retryCount, clearClientData, forceRedirect, onLogoutStart, onLogoutComplete, success, showError]);

  // 🔴 FORCE LOGOUT (nuclear option)
  const handleForceLogout = useCallback(() => {
    info("Force Logout", "Clearing all data...", 2000);
    setTimeout(forceRedirect, 500);
  }, [forceRedirect, info]);

  // Render different states
  if (error && retryCount < MAX_RETRY_ATTEMPTS) {
    return (
      <>
        <div className="px-2 py-2 bg-red-50 border border-red-200 rounded mx-2 mb-2">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-medium text-red-700">Logout Failed</p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
              <p className="text-xs text-red-500 mt-1">
                Attempt {retryCount}/{MAX_RETRY_ATTEMPTS}
              </p>
            </div>
          </div>
        </div>
        
        <DropdownMenuItem
          onClick={handleLogout}
          className="hover:bg-orange-50 hover:text-orange-600 transition-colors cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Retry Logout</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={handleForceLogout}
          className="hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          <span>Force Logout</span>
        </DropdownMenuItem>
      </>
    );
  }

  return (
    <DropdownMenuItem
      onClick={handleLogout}
      disabled={isLoading}
      className={`transition-colors cursor-pointer ${
        isLoading
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:bg-red-50 hover:text-red-600'
      } ${className || ''}`}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin text-blue-500" />
      ) : (
        <LogOut className="mr-2 h-4 w-4" />
      )}
      <span>{isLoading ? 'Logging out...' : 'Sign Out'}</span>
    </DropdownMenuItem>
  );
}