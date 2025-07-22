"use client"

import { Bell, Search, User, LogOut, Settings, Moon, Sun, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"

interface PremiumHeaderProps {
  onSignOut?: () => void
}

export function PremiumHeader({ onSignOut }: PremiumHeaderProps) {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [notifications] = useState([
    { id: 1, title: "New project submitted", time: "2 min ago", type: "info" },
    { id: 2, title: "Developer profile updated", time: "5 min ago", type: "success" },
    { id: 3, title: "Blog post published", time: "10 min ago", type: "warning" },
  ])

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-xl px-6 shadow-sm">
      <div className="flex items-center space-x-6">
        {/* Search */}
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search projects, developers, blogs..."
            className="pl-10 bg-slate-50/50 border-slate-200 focus:bg-white transition-colors"
          />
        </div>

        {/* Quick Stats */}
        <div className="hidden lg:flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-full">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-blue-700">24 Active</span>
          </div>
          <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-700">12 Published</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={() => setIsDarkMode(!isDarkMode)} className="hover:bg-slate-100">
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {/* Fullscreen */}
        <Button variant="ghost" size="icon" className="hover:bg-slate-100">
          <Maximize2 className="h-5 w-5" />
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative hover:bg-slate-100">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-red-500 hover:bg-red-500">
                {notifications.length}
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80" align="end">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              <Badge variant="secondary">{notifications.length} new</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.map((notification) => (
              <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-4">
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">{notification.title}</span>
                  <span className="text-xs text-muted-foreground">{notification.time}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-slate-100">
              <Avatar className="h-10 w-10 border-2 border-slate-200">
                <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Admin" />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                  NS
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium leading-none">Noorsaray Admin</p>
                  <Badge className="text-xs bg-gradient-to-r from-blue-500 to-purple-600">Pro</Badge>
                </div>
                <p className="text-xs leading-none text-muted-foreground">admin@noorsaray.com</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Preferences</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSignOut} className="cursor-pointer text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
