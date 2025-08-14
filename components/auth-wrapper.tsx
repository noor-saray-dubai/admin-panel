"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { LuxurySidebar } from "./luxury-sidebar"
import { LuxuryHeader } from "./luxury-header"

export default function AuthWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Check authentication status on mount
  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated")
    const authenticated = authStatus === "true"
    setIsAuthenticated(authenticated)
    setIsLoading(false)

    // Redirect logic
    if (!authenticated && pathname !== "/login") {
      router.push("/login")
    } else if (authenticated && pathname === "/login") {
      router.push("/")
    }
  }, [pathname, router])

  const handleSignOut = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("isAuthenticated")
    router.push("/login")
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show login page
  if (!isAuthenticated || pathname === "/login") {
    return children
  }

  // Show authenticated layout
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Luxury Sidebar */}
      <div className="w-64 flex-shrink-0">
        <LuxurySidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* <LuxuryHeader onSignOut={handleSignOut} /> */}
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  )
}
