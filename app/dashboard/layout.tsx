import type React from "react"
import "../globals.css"
import { LuxurySidebar } from "@/components/luxury-sidebar";
import { LuxuryHeader } from "@/components/luxury-header";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body><div className="flex h-screen bg-gray-50">
            {/* Luxury Sidebar */}
            <div className="w-64 flex-shrink-0">
              <LuxurySidebar />
            </div>
      
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
              <LuxuryHeader  />
              <main className="flex-1 overflow-y-auto p-8">{children}</main>
            </div>
          </div></body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.dev'
    };
