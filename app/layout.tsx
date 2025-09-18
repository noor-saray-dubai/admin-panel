import type React from "react"
import "./globals.css"
import { LuxurySidebar } from "@/components/luxury-sidebar";
import { LuxuryHeader } from "@/components/luxury-header";
import { ToastProvider } from "@/components/ui/toast-system";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'afzal'
    };
