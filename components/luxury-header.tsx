"use client"

import { Bell, Search, User, LogOut, Settings, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { browserSessionPersistence, setPersistence, signOut, inMemoryPersistence } from "firebase/auth"
import { auth } from "../firebase"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"

// Types
interface LogoutState {
  isLoading: boolean
  error: string | null
  retryCount: number
}

const MAX_RETRY_ATTEMPTS = 3
const LOGOUT_TIMEOUT = 15000 // 15 seconds

export function LuxuryHeader() {
  // States
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [notificationCount, setNotificationCount] = useState(3)
  const [bellShaking, setBellShaking] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [logoutState, setLogoutState] = useState<LogoutState>({
    isLoading: false,
    error: null,
    retryCount: 0
  })

  // Refs
  const searchRef = useRef<HTMLInputElement>(null)
  const logoutTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (logoutTimeoutRef.current) {
        clearTimeout(logoutTimeoutRef.current)
      }
    }
  }, [])

  // Notification animation
  useEffect(() => {
    const interval = setInterval(() => {
      setBellShaking(true)
      setTimeout(() => setBellShaking(false), 600)
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  // Enhanced clear all storage and cookies
  const clearAllUserData = useCallback(() => {
    try {
      console.log("Clearing all user data...");
      
      // Clear localStorage & sessionStorage
      localStorage.clear();
      sessionStorage.clear();

      // Clear IndexedDB (Firebase uses this extensively)
      if ('indexedDB' in window) {
        try {
          const firebaseDBs = [
            'firebaseLocalStorageDb',
            'firebase-installations-database',
            'firebase-messaging-database',
            'firebase-auth-state',
            'firebase-heartbeat-database'
          ];
          
          firebaseDBs.forEach(dbName => {
            const request = indexedDB.deleteDatabase(dbName);
            request.onerror = (event) => {
              console.warn(`Failed to delete ${dbName}:`, event);
            };
            // Optionally handle onsuccess if needed
            // request.onsuccess = () => {
            //   console.log(`Deleted IndexedDB: ${dbName}`);
            // };
          });
        } catch (idbError) {
          console.warn("IndexedDB cleanup failed:", idbError);
        }
      }

      // Clear Service Worker caches
      if ('serviceWorker' in navigator && 'caches' in window) {
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            if (cacheName.includes('firebase') || cacheName.includes('auth')) {
              caches.delete(cacheName).catch(console.warn);
            }
          });
        }).catch(console.warn);
      }

      // Aggressive cookie clearing
      document.cookie.split(";").forEach((cookie) => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();

        // Clear for multiple domain/path combinations
        const clearVariations = [
          `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`,
          `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`,
          `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`,
          `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;secure`,
        ];

        if (process.env.NODE_ENV === "production") {
          clearVariations.push(
            `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.noorsaray.com`,
            `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=noorsaray.com;secure`
          );
        } else {
          clearVariations.push(
            `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=localhost`,
            `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.localhost`
          );
        }

        clearVariations.forEach(cookieStr => {
          document.cookie = cookieStr;
        });
      });

      console.log("All user data cleared successfully");
    } catch (error) {
      console.warn("Error clearing user data:", error);
    }
  }, []);

  // Force redirect to login with logout parameter
  const forceRedirect = useCallback(() => {
    console.log("Force redirect initiated");
    
    // Final cleanup
    clearAllUserData();

    // Force Firebase sign out without waiting
    try {
      if (auth.currentUser) {
        signOut(auth).catch(console.warn);
      }
    } catch (err) {
      console.warn("Final Firebase cleanup failed:", err);
    }

    // Redirect with logout parameter to bypass middleware
    if (typeof window !== 'undefined') {
      // Method 1: Replace with logout parameter
      window.location.replace('/login?logout=true');
      
      // Method 2: Fallback after short delay
      setTimeout(() => {
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?logout=true';
        }
      }, 200);
    }
  }, [clearAllUserData])

  // Main logout function - COMPLETELY REWRITTEN
  const handleLogout = useCallback(async () => {
    if (logoutState.isLoading) return;

    setLogoutState(prev => ({ ...prev, isLoading: true, error: null }));

    // Force redirect if logout hangs
    logoutTimeoutRef.current = setTimeout(() => {
      console.warn("Logout timeout reached, forcing redirect");
      forceRedirect();
    }, LOGOUT_TIMEOUT);

    try {
      console.log("Starting enhanced logout process...");

      // 🔹 STEP 1: Call backend API FIRST with logout headers
      console.log("Calling backend logout API...");
      const controller = new AbortController();
      const apiTimeoutId = setTimeout(() => controller.abort(), 8000);

      try {
        const response = await fetch("/api/logout", {
          method: "POST",
          credentials: "include",
          headers: { 
            "Content-Type": "application/json",
            "X-Logout-In-Progress": "true", // Signal to middleware
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
          signal: controller.signal,
        });

        clearTimeout(apiTimeoutId);

        if (!response.ok) {
          const errorData = await response.text().catch(() => "Unknown error");
          console.warn(`Logout API failed: ${response.status} - ${errorData}`);
          // Don't throw - continue with client cleanup
        } else {
          console.log("Logout API successful");
        }
      } catch (apiError) {
        clearTimeout(apiTimeoutId);
        console.warn("API call failed, continuing with client cleanup:", apiError);
      }

      // 🔹 STEP 2: Clear client storage BEFORE Firebase operations
      clearAllUserData();

      // 🔹 STEP 3: Firebase cleanup with proper persistence handling
      if (auth.currentUser) {
        console.log("Cleaning up Firebase session...");
        
        try {
          // First, disable persistence completely
          await setPersistence(auth, inMemoryPersistence);
          console.log("Firebase persistence disabled");
          
          // Then sign out
          await signOut(auth);
          console.log("Firebase signOut completed");

          // Wait for auth state to actually clear (critical!)
          await new Promise((resolve) => {
            const unsubscribe = auth.onAuthStateChanged((user) => {
              if (!user) {
                console.log("Auth state confirmed cleared");
                unsubscribe();
                resolve(void 0);
              }
            });
            
            // Timeout fallback - don't wait forever
            setTimeout(() => {
              console.log("Auth state timeout reached");
              unsubscribe();
              resolve(void 0);
            }, 3000);
          });

        } catch (firebaseError) {
          console.warn("Firebase cleanup failed:", firebaseError);
          // Continue anyway
        }
      }

      // 🔹 STEP 4: Final cleanup and redirect
      clearAllUserData(); // Clear again after Firebase operations
      
      // Clear timeout and redirect
      if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
      console.log("Logout process completed, redirecting...");
      forceRedirect();

    } catch (err) {
      console.error("Logout failed:", err);
      if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);

      const newRetryCount = logoutState.retryCount + 1;
      if (newRetryCount >= MAX_RETRY_ATTEMPTS) {
        console.warn("Max retries reached, forcing redirect");
        forceRedirect();
        return;
      }

      setLogoutState({
        isLoading: false,
        error: err instanceof Error ? err.message : "Logout failed",
        retryCount: newRetryCount
      });
    }
  }, [logoutState.isLoading, logoutState.retryCount, forceRedirect, clearAllUserData]);

  // Force logout (nuclear option)
  const handleForceLogout = useCallback(() => {
    console.log("Force logout initiated")
    forceRedirect()
  }, [forceRedirect])

  // Handle dropdown state changes
  const handleDropdownOpenChange = useCallback((open: boolean) => {
    setDropdownOpen(open)
    if (open && logoutState.error) {
      // Reset error when reopening dropdown
      setLogoutState(prev => ({ ...prev, error: null }))
    }
  }, [logoutState.error])

  // Other handlers
  const handleNotificationClick = useCallback(() => {
    setNotificationCount(0)
    setBellShaking(false)
  }, [])

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (searchValue.trim()) {
      console.log("Searching for:", searchValue)
      // Implement search logic
    }
  }, [searchValue])

  const clearSearch = useCallback(() => {
    setSearchValue("")
    searchRef.current?.focus()
  }, [])

  return (
    <header className="flex h-16 items-center justify-end border-b border-gray-100 bg-white px-8 transition-all duration-200">
      {/* Search Section */}

      {/* Actions Section */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        {/* <Button 
          variant="ghost" 
          size="icon" 
          className={`relative hover:bg-gray-100 transition-all duration-200 hover:scale-105 ${
            bellShaking ? 'animate-bounce' : ''
          }`}
          onClick={handleNotificationClick}
          disabled={logoutState.isLoading}
        >
          <Bell className="h-5 w-5 text-gray-600 transition-colors duration-200 hover:text-gray-800" />
          {notificationCount > 0 && (
            <>
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
              <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium animate-in zoom-in duration-200">
                {notificationCount}
              </span>
            </>
          )}
        </Button> */}

        {/* User Menu */}
        <DropdownMenu open={dropdownOpen} onOpenChange={handleDropdownOpenChange}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={`relative h-8 w-8 rounded-full hover:ring-2 hover:ring-gray-200 transition-all duration-200 ${dropdownOpen ? 'ring-2 ring-gray-300 scale-105' : 'hover:scale-105'
                } ${logoutState.isLoading ? 'opacity-75' : ''}`}
              disabled={logoutState.isLoading}
            >
              <Avatar className="h-8 w-8 transition-all duration-200">
                <AvatarFallback className="bg-gray-900 text-white text-xs font-semibold transition-all duration-200 hover:bg-gray-800">
                  NS
                </AvatarFallback>
              </Avatar>
              {logoutState.isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-full">
                  <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-64 animate-in fade-in slide-in-from-top-2 duration-200"
            align="end"
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">Noorsaray Admin</p>
                <p className="text-xs text-muted-foreground">admin@noorsaray.com</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Regular Menu Items */}

            <DropdownMenuSeparator />

            {/* Error Display */}
            {logoutState.error && (
              <>
                <div className="px-2 py-2 bg-red-50 border border-red-200 rounded mx-2 mb-2">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-red-700">Logout Failed</p>
                      <p className="text-xs text-red-600 mt-1">{logoutState.error}</p>
                      {logoutState.retryCount > 0 && (
                        <p className="text-xs text-red-500 mt-1">
                          Attempt {logoutState.retryCount}/{MAX_RETRY_ATTEMPTS}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Logout Options */}
            {logoutState.error && logoutState.retryCount < MAX_RETRY_ATTEMPTS ? (
              <>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="hover:bg-orange-50 hover:text-orange-600 transition-all duration-150 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Retry Logout ({MAX_RETRY_ATTEMPTS - logoutState.retryCount} left)</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleForceLogout}
                  className="hover:bg-red-50 hover:text-red-600 transition-all duration-150 cursor-pointer"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  <span>Force Logout</span>
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={logoutState.isLoading}
                className={`transition-all duration-150 cursor-pointer ${logoutState.isLoading
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-red-50 hover:text-red-600'
                  }`}
              >
                {logoutState.isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-blue-500" />
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}
                <span>
                  {logoutState.isLoading ? 'Logging out...' : 'Sign Out'}
                </span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}