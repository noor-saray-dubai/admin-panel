"use client"

import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useState, useEffect, useCallback } from "react"
import { useEnhancedAuth } from "@/hooks/useEnhancedAuth"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogoutButton } from "./logout-button"

export function LuxuryHeader() {
  const { user } = useEnhancedAuth()

  const [notificationCount, setNotificationCount] = useState(3)
  const [bellShaking, setBellShaking] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Notification animation
  useEffect(() => {
    const interval = setInterval(() => {
      setBellShaking(true)
      setTimeout(() => setBellShaking(false), 600)
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const handleNotificationClick = useCallback(() => {
    setNotificationCount(0)
    setBellShaking(false)
  }, [])

  const handleLogoutStart = useCallback(() => {
    setIsLoggingOut(true)
    setDropdownOpen(false) // Close dropdown immediately
  }, [])

  const handleLogoutComplete = useCallback(() => {
    setIsLoggingOut(false)
  }, [])

  return (
    <header className="flex h-16 items-center justify-end border-b border-gray-100 bg-white px-8 transition-all duration-200">
      {/* Actions Section */}
      <div className="flex items-center space-x-4">
        {/* Notifications - Optional, currently commented */}
        {/* <Button 
          variant="ghost" 
          size="icon" 
          className={`relative hover:bg-gray-100 transition-all duration-200 hover:scale-105 ${
            bellShaking ? 'animate-bounce' : ''
          }`}
          onClick={handleNotificationClick}
          disabled={isLoggingOut}
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
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={`relative h-8 w-8 rounded-full hover:ring-2 hover:ring-gray-200 transition-all duration-200 ${
                dropdownOpen ? 'ring-2 ring-gray-300 scale-105' : 'hover:scale-105'
              } ${isLoggingOut ? 'opacity-75 cursor-not-allowed' : ''}`}
              disabled={isLoggingOut}
            >
              <Avatar className="h-8 w-8 transition-all duration-200">
                <AvatarFallback className="bg-gray-900 text-white text-xs font-semibold transition-all duration-200 hover:bg-gray-800">
                  {user?.displayName 
                    ? user.displayName.substring(0, 2).toUpperCase()
                    : user?.email
                      ? user.email.substring(0, 2).toUpperCase()
                      : 'NS'
                  }
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent
            className="w-64 animate-in fade-in slide-in-from-top-2 duration-200"
            align="end"
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">
                  {user?.displayName || 'Admin User'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.email || 'admin@noorsaray.com'}
                </p>
                {user?.fullRole && (
                  <p className="text-xs text-blue-600 font-medium capitalize">
                    {user.fullRole.replace('_', ' ')}
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />

            {/* Logout Component */}
            <LogoutButton 
              onLogoutStart={handleLogoutStart}
              onLogoutComplete={handleLogoutComplete}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}