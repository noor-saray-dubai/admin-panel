"use client"

import { cn } from "@/lib/utils"
import { Users, Settings, Home, FileText, MessageSquare, Shield, ChevronRight, Sparkles, Building2 } from "lucide-react"
import { useState } from "react"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home, key: "dashboard", color: "text-blue-500" },
  { name: "Projects", href: "/projects", icon: FileText, key: "projects", color: "text-green-500" },
  { name: "Properties", href: "/properties", icon: Building2, key: "properties", color: "text-emerald-500" },
  { name: "Blogs", href: "/blogs", icon: MessageSquare, key: "blogs", color: "text-purple-500" },
  { name: "Communities", href: "/communities", icon: Users, key: "communities", color: "text-orange-500" },
  { name: "Developers", href: "/developers", icon: Shield, key: "developers", color: "text-indigo-500" },
  { name: "Settings", href: "/settings", icon: Settings, key: "settings", color: "text-gray-500" },
]

interface SidebarProps {
  currentPage: string
  onNavigate: (page: string) => void
}

export function EnhancedSidebar({ currentPage, onNavigate }: SidebarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700 shadow-2xl">
      {/* Logo Section */}
      <div className="flex h-20 items-center px-6 border-b border-slate-700/50">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-slate-900 animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Noorsaray
            </h1>
            <p className="text-xs text-slate-400">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = currentPage === item.key
          const isHovered = hoveredItem === item.key

          return (
            <button
              key={item.name}
              onClick={() => onNavigate(item.key)}
              onMouseEnter={() => setHoveredItem(item.key)}
              onMouseLeave={() => setHoveredItem(null)}
              className={cn(
                "group w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 relative overflow-hidden",
                isActive
                  ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white shadow-lg border border-blue-500/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/50",
              )}
            >
              {/* Background Animation */}
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 transition-opacity duration-300",
                  isHovered && !isActive ? "opacity-100" : "opacity-0",
                )}
              />

              {/* Active Indicator */}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-purple-500 rounded-r-full" />
              )}

              <div className="relative flex items-center space-x-3 flex-1">
                <div
                  className={cn(
                    "p-2 rounded-lg transition-all duration-300",
                    isActive
                      ? "bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg"
                      : "bg-slate-700/50 group-hover:bg-slate-600/50",
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive ? "text-white" : item.color)} />
                </div>
                <span className="font-medium">{item.name}</span>
              </div>

              {/* Arrow Indicator */}
              <ChevronRight
                className={cn(
                  "h-4 w-4 transition-all duration-300",
                  isActive ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 group-hover:opacity-50",
                )}
              />
            </button>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-slate-700/50">
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-slate-600/30">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">NS</span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">Noorsaray Pro</p>
              <p className="text-xs text-slate-400">Premium Edition</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
