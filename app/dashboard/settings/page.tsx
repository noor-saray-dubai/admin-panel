"use client";

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { 
  User, 
  Key, 
  Bell, 
  Shield, 
  Palette, 
  Database,
  FileText,
  ChevronRight,
  Settings as SettingsIcon 
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SettingItem {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
  available: boolean;
  badge?: string;
}

export default function SettingsPage() {
  const { user, loading, isSystemAdmin, isSuperAdmin } = useAuth();

  // Define all settings with conditional availability
  const settingItems: SettingItem[] = [
    {
      icon: User,
      title: "Profile",
      description: "Manage your personal information and account details",
      href: "/dashboard/settings/profile",
      available: true, // Always available
    },
    {
      icon: Key,
      title: "Request Permissions",
      description: "Request access to additional collections and features",
      href: "/dashboard/settings/permission-requests",
      available: true, // Temporarily available to all for testing
      badge: isSuperAdmin() ? "Testing" : undefined
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Configure email and system notifications",
      href: "/dashboard/settings/notifications",
      available: false, // Coming soon
      badge: "Soon"
    },
    {
      icon: Shield,
      title: "Security",
      description: "Password, two-factor authentication, and security logs",
      href: "/dashboard/settings/security",
      available: false, // Coming soon
      badge: "Soon"
    },
    {
      icon: Palette,
      title: "Appearance",
      description: "Customize dashboard theme and layout preferences",
      href: "/dashboard/settings/appearance",
      available: false, // Coming soon
      badge: "Soon"
    },
    {
      icon: Database,
      title: "System Settings",
      description: "Manage system-wide configurations and preferences",
      href: "/dashboard/settings/system",
      available: isSystemAdmin(), // Only for system admins
      badge: isSystemAdmin() ? "Admin" : undefined
    },
    {
      icon: FileText,
      title: "Audit Trail",
      description: "View system activity logs and user action history",
      href: "/dashboard/settings/audit-trail",
      available: isSuperAdmin(), // Only for super admins
      badge: isSuperAdmin() ? "Super Admin" : undefined
    },
  ];

  // Filter items based on availability
  const availableItems = settingItems.filter(item => 
    item.available || item.badge === "Soon"
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
          <SettingsIcon className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account and preferences</p>
        </div>
      </div>

      {/* User Info Card */}
      <Card className="border-gray-200">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {user?.displayName ? user.displayName.substring(0, 2).toUpperCase() : 'U'}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {user?.displayName || 'User'}
              </h3>
              <p className="text-sm text-gray-600">{user?.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                  {user?.fullRole?.replace('_', ' ') || 'User'}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings List */}
      <div className="space-y-2">
        {availableItems.map((item, index) => (
          <Card key={index} className="border-gray-200 hover:border-gray-300 transition-colors">
            <CardContent className="p-0">
              {item.available ? (
                <Link 
                  href={item.href}
                  className="flex items-center p-6 hover:bg-gray-50 transition-colors rounded-lg"
                >
                  <div className="flex items-center flex-1 space-x-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">{item.title}</h3>
                        {item.badge && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            item.badge === 'Super Admin'
                              ? 'bg-red-100 text-red-800'
                              : item.badge === 'Admin' 
                              ? 'bg-purple-100 text-purple-800'
                              : item.badge === 'Soon'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
              ) : (
                <div className="flex items-center p-6 opacity-50 cursor-not-allowed rounded-lg">
                  <div className="flex items-center flex-1 space-x-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-500">{item.title}</h3>
                        {item.badge && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer Note */}
      <div className="text-center pt-8">
        <p className="text-sm text-gray-500">
          Need help with settings? Contact your administrator.
        </p>
      </div>
    </div>
  );
}
