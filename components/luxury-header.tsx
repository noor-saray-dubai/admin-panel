"use client"

import { Bell, Search, User, LogOut, Settings, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getAuth, signOut } from "firebase/auth"; 
import {auth} from "../firebase"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useRef, useEffect } from "react"

export function LuxuryHeader() {
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [notificationCount, setNotificationCount] = useState(3)
  const [bellShaking, setBellShaking] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  // Simulate notification pulse effect
  useEffect(() => {
    const interval = setInterval(() => {
      setBellShaking(true)
      setTimeout(() => setBellShaking(false), 600)
    }, 10000) // Shake every 10 seconds

    return () => clearInterval(interval)
  }, [])

 
const onSignOut = async () => {
  setIsSigningOut(true);
 

  try {
    // 1. Sign out from Firebase client SDK
    await signOut(auth);

    // 2. Call backend to clear session cookie
    const res = await fetch("/api/logout");
    if (!res.ok) throw new Error("Failed to clear session cookie");

    // 3. Redirect after a short delay for smooth UX
    setTimeout(() => {
      window.location.href = "/login";
    }, 300);
  } catch (error) {
    console.error("Logout failed:", error);
    setIsSigningOut(false);
  }
};

  const handleNotificationClick = () => {
    setNotificationCount(0)
    setBellShaking(false)
    // Add your notification logic here
  }

  const handleSearchSubmit = (e:any) => {
    e.preventDefault()
    if (searchValue.trim()) {
      console.log("Searching for:", searchValue)
      // Add your search logic here
    }
  }

  const clearSearch = () => {
    setSearchValue("")
    searchRef.current?.focus()
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-100 bg-white px-8 transition-all duration-200">
      <div className="flex items-center space-x-6">
        <div className="relative w-96 group">
          <div onSubmit={handleSearchSubmit}>
            <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-all duration-200 ${
              searchFocused ? 'text-blue-500 scale-110' : 'text-gray-400'
            }`} />
            <Input 
              ref={searchRef}
              placeholder="Search..." 
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
              className={`pl-10 pr-10 border-gray-200 transition-all duration-200 ${
                searchFocused 
                  ? 'border-blue-300 shadow-sm ring-2 ring-blue-100' 
                  : 'hover:border-gray-300'
              }`}
            />
            {searchValue && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-150 rounded-full"
              >
                ×
              </Button>
            )}
          </div>
          
          {/* Search suggestions dropdown */}
          {searchFocused && searchValue && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-2 space-y-1">
                <div className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded cursor-pointer transition-colors duration-150">
                  Search for "{searchValue}"
                </div>
                <div className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded cursor-pointer transition-colors duration-150">
                  Recent: Luxury items
                </div>
                <div className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded cursor-pointer transition-colors duration-150">
                  Recent: Premium collection
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className={`relative hover:bg-gray-100 transition-all duration-200 hover:scale-105 ${
            bellShaking ? 'animate-bounce' : ''
          }`}
          onClick={handleNotificationClick}
        >
          <Bell className="h-5 w-5 text-gray-600 transition-colors duration-200 hover:text-gray-800" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
          )}
          {notificationCount > 0 && (
            <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium animate-in zoom-in duration-200">
              {notificationCount}
            </span>
          )}
        </Button>

        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className={`relative h-8 w-8 rounded-full hover:ring-2 hover:ring-gray-200 transition-all duration-200 ${
                dropdownOpen ? 'ring-2 ring-gray-300 scale-105' : 'hover:scale-105'
              }`}
            >
              <Avatar className="h-8 w-8 transition-all duration-200">
                
                <AvatarFallback className="bg-gray-900 text-white text-xs font-semibold transition-all duration-200 hover:bg-gray-800">
                  NS
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            className="w-56 animate-in fade-in slide-in-from-top-2 duration-200" 
            align="end"
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">Noorsaray Admin</p>
                <p className="text-xs text-muted-foreground">admin@noorsaray.com</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer">
              <User className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer">
              <Settings className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={onSignOut}
              disabled={isSigningOut}
              className={`hover:bg-red-50 hover:text-red-600 transition-all duration-150 cursor-pointer ${
                isSigningOut ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSigningOut ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
              )}
              <span>{isSigningOut ? 'Logging out...' : 'Sign Out'}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}