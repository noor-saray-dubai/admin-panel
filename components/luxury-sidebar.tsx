"use client"

import { cn } from "@/lib/utils"
import { Users, Settings, Home, FileText, MessageSquare, Shield } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home, key: "dashboard" },
  { name: "Projects", href: "/dashboard/projects", icon: FileText, key: "projects" },
  { name: "Blogs", href: "/dashboard/blogs", icon: MessageSquare, key: "blogs" },
  { name: "Communities", href: "/dashboard/communities", icon: Users, key: "communities" },
  { name: "Developers", href: "/dashboard/developers", icon: Shield, key: "developers" },
  { name: "Settings", href: "/dashboard/settings", icon: Settings, key: "settings" },
]

export function LuxurySidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="flex h-full w-full flex-col bg-white border-r border-gray-100">
      {/* Logo Section */}
      <div className="flex h-20 items-center px-8 border-b border-gray-100">
        <Link href="/" className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Noorsaray</h1>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-6 py-8 space-y-2">
        {navigation.map((item) => {
          const active = isActive(item.href)

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                active ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-6 border-t border-gray-100">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
              <span className="text-xs font-semibold text-white">NS</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Noorsaray</p>
              <p className="text-xs text-gray-500">Premium</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
