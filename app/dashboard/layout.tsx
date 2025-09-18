"use client";

import type React from "react";
import { useState } from "react";
import "../globals.css";
import { LuxurySidebar } from "@/components/luxury-sidebar";
import { LuxuryHeader } from "@/components/luxury-header";
import { ToastProvider } from "@/components/ui/toast-system";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <ToastProvider>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Luxury Sidebar - Responsive Width */}
        <div className={`flex-shrink-0 transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}>
          <LuxurySidebar 
            collapsed={sidebarCollapsed}
            onToggle={setSidebarCollapsed}
          />
        </div>
  
        {/* Main Content Area - Expands when sidebar collapses */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <LuxuryHeader />
          <main className="flex-1 overflow-y-auto p-8">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
