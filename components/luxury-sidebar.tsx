"use client"

import { cn } from "@/lib/utils"
import { Users, Settings, Home, FileText, MessageSquare, Shield, Briefcase, Building, ShoppingCart, ChevronLeft, Menu, User, Newspaper } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useMemo, useTransition } from "react"
import { useEnhancedAuth } from "@/hooks/useEnhancedAuth"
import { Button } from "@/components/ui/button"
import { Collection } from "@/types/user"

// Navigation items mapped to collections
const navigationMap = {
  dashboard: { name: "Dashboard", href: "/", icon: Home, collection: null },
  [Collection.PROJECTS]: { name: "Projects", href: "/dashboard/projects", icon: FileText, collection: Collection.PROJECTS },
  [Collection.BLOGS]: { name: "Blogs", href: "/dashboard/blogs", icon: MessageSquare, collection: Collection.BLOGS },
  [Collection.NEWS]: { name: "News", href: "/dashboard/news", icon: Newspaper, collection: Collection.NEWS },
  [Collection.COMMUNITIES]: { name: "Communities", href: "/dashboard/communities", icon: Users, collection: Collection.COMMUNITIES },
  [Collection.DEVELOPERS]: { name: "Developers", href: "/dashboard/developers?tab=all&page=1", icon: Shield, collection: Collection.DEVELOPERS },
  [Collection.CAREERS]: { name: "Careers", href: "/dashboard/careers", icon: Briefcase, collection: Collection.CAREERS },
  [Collection.PLOTS]: { name: "Plots", href: "/dashboard/plots?tab=all&page=1", icon: Building, collection: Collection.PLOTS },
  [Collection.MALLS]: { name: "Malls", href: "/dashboard/malls?tab=all&page=1", icon: ShoppingCart, collection: Collection.MALLS },
  [Collection.USERS]: { name: "Users", href: "/dashboard/users", icon: Users, collection: Collection.USERS },
  [Collection.SYSTEM]: { name: "Settings", href: "/dashboard/settings", icon: Settings, collection: Collection.SYSTEM },
}

interface LuxurySidebarProps {
  collapsed?: boolean;
  onToggle?: (collapsed: boolean) => void;
}

export function LuxurySidebar({ 
  collapsed: externalCollapsed, 
  onToggle 
}: LuxurySidebarProps = {}) {
  const pathname = usePathname()
  const router = useRouter()
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const [isPending, startTransition] = useTransition()
  
  // Use external collapsed state if provided, otherwise use internal
  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed
  
  const handleToggle = () => {
    if (onToggle) {
      onToggle(!isCollapsed)
    } else {
      setInternalCollapsed(!internalCollapsed)
    }
  }
  
  const { 
    user, 
    loading, 
    getAccessibleCollections,
    getUserSubRoleForCollection,
    isActive: isUserActive,
    isAdmin,
    isSuperAdmin 
  } = useEnhancedAuth()

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    // Extract just the pathname from href (remove query params for comparison)
    const hrefPath = href.split('?')[0]
    return pathname.startsWith(hrefPath)
  }

  // Memoize navigation items to prevent recalculation
  const accessibleNavItems = useMemo(() => {
    if (!user || loading) return []
    
    const accessibleCollections = getAccessibleCollections()
    const navItems = []
    
    // Always add dashboard
    navItems.push({ ...navigationMap.dashboard, key: 'dashboard' })
    
    // Add navigation items for collections user has access to
    Object.entries(navigationMap).forEach(([key, item]) => {
      if (item.collection && accessibleCollections.includes(item.collection)) {
        navItems.push({ ...item, key })
      }
    })
    
    // Add admin-specific navigation items
    if (isAdmin() || isSuperAdmin()) {
      navItems.push({
        name: "Permission Requests",
        href: "/dashboard/admin/permission-requests",
        icon: Shield,
        collection: null,
        key: 'admin-permission-requests',
        adminOnly: true
      })
    }
    
    return navItems
  }, [user, loading, getAccessibleCollections, isAdmin, isSuperAdmin])

  // Optimized click handler with prefetch and immediate UI feedback
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    
    // Immediate navigation with transition
    startTransition(() => {
      router.push(href)
    })
  }

  return (
    <div className="flex h-full flex-col bg-white border-r border-gray-100 relative">
      {/* Toggle button */}
      <button
        onClick={handleToggle}
        className="absolute -right-3 top-8 z-10 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
      >
        <ChevronLeft className={cn(
          "h-3 w-3 text-gray-600 transition-transform duration-300",
          isCollapsed && "rotate-180"
        )} />
      </button>

      {/* Logo Section */}
      <div className="flex h-20 items-center px-4 border-b border-gray-100">
        <Link 
          href="/" 
          onClick={(e) => handleNavClick(e, "/")}
          className={cn(
            "flex items-center transition-all duration-300",
            isCollapsed ? "justify-center" : "space-x-3"
          )}
        >
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-xl font-semibold text-gray-900 whitespace-nowrap">Noorsaray</h1>
              <p className="text-xs text-gray-500 whitespace-nowrap">Admin Panel</p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation - With Internal Scrolling */}
      <nav className={cn(
        "flex-1 py-8 space-y-2 transition-all duration-300 overflow-y-auto",
        isCollapsed ? "px-2" : "px-6"
      )}>
        {loading ? (
          // Loading skeleton for navigation
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={cn(
                "animate-pulse bg-gray-200 rounded-lg",
                isCollapsed ? "h-10 w-10 mx-auto" : "h-10 w-full"
              )} />
            ))}
          </div>
        ) : (
          accessibleNavItems.map((item) => {
            const active = isActive(item.href)
            const subRole = item.collection ? getUserSubRoleForCollection(item.collection) : null

            return (
              <div key={item.key} className="relative group/tooltip">
                <Link
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  prefetch={true}
                  className={cn(
                    "group relative w-full flex items-center rounded-lg transition-all duration-200 transform hover:scale-[1.02]",
                    isCollapsed ? "justify-center px-2 py-3" : "px-4 py-3",
                    "text-sm font-medium",
                    active 
                      ? "bg-gradient-to-r from-gray-900 to-gray-700 text-white shadow-lg shadow-gray-900/25" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:shadow-md",
                    isPending && "opacity-70 pointer-events-none"
                  )}
                >
                  {/* Active indicator bar */}
                  {active && (
                    <div className="absolute left-0 top-0 h-full w-1 bg-white rounded-r-full" />
                  )}
                  
                  <item.icon className={cn(
                    "h-5 w-5 transition-all duration-200 flex-shrink-0",
                    !isCollapsed && "mr-3",
                    active ? "text-white drop-shadow-sm" : "text-gray-500 group-hover:text-gray-700"
                  )} />
                  
                  {!isCollapsed && (
                    <div className="flex flex-col">
                      <span className={cn(
                        "font-medium transition-all duration-200",
                        active ? "text-white font-semibold" : "group-hover:font-medium"
                      )}>
                        {item.name}
                      </span>
                      {subRole && (
                        <span className={cn(
                          "text-xs transition-all duration-200 capitalize",
                          active ? "text-white/70" : "text-gray-400"
                        )}>
                          {subRole.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Subtle glow effect on active */}
                  {active && (
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-900/50 to-transparent rounded-lg blur-sm -z-10" />
                  )}
                </Link>
                
                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                    <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                      {item.name}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </nav>

      {/* Bottom Section - Always visible */}
      <div className={cn(
        "border-t border-gray-100 transition-all duration-300 flex-shrink-0",
        isCollapsed ? "p-2" : "p-6"
      )}>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className={cn(
            "flex items-center justify-between transition-all duration-300",
            isCollapsed && "justify-center"
          )}>
            <div className={cn(
              "flex items-center transition-all duration-300",
              isCollapsed ? "justify-center" : "space-x-3"
            )}>
              <div className="relative">
                <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-white">
                    {user?.displayName ? user.displayName.substring(0, 2).toUpperCase() : 'U'}
                  </span>
                </div>
                {isCollapsed && user && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                    {getAccessibleCollections().length}
                  </div>
                )}
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-gray-900 whitespace-nowrap">
                    {user?.displayName || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 whitespace-nowrap capitalize">
                    {user?.fullRole?.replace('_', ' ') || 'User'} {!isUserActive() && '(Inactive)'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}