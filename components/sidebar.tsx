"use client"

import { cn } from "@/lib/utils"
import { Users, Settings, Home, FileText, MessageSquare, Shield } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home, key: "dashboard" },
  { name: "Projects", href: "/projects", icon: FileText, key: "projects" },
  { name: "Blogs", href: "/blogs?tab=all&page=1", icon: MessageSquare, key: "blogs" },
  { name: "Communities", href: "/communities", icon: Users, key: "communities" },
  { name: "Developers", href: "/developers", icon: Shield, key: "developers" },
  { name: "Settings", href: "/settings", icon: Settings, key: "settings" },
]

interface SidebarProps {
  currentPage: string
  onNavigate: (page: string) => void
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <div className="flex h-full w-full flex-col bg-white border-r border-gray-200">
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = currentPage === item.key
          return (
            <button
              key={item.name}
              onClick={() => onNavigate(item.key)}
              className={cn(
                "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-left",
                isActive
                  ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
              {item.name}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
