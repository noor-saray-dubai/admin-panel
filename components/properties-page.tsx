// components/properties-page.tsx
"use client"

import { PropertyTabs } from "./property-tabs"

export function PropertiesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PropertyTabs />
    </div>
  )
}