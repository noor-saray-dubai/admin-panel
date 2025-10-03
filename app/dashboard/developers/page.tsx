// app/dashboard/developers/page.tsx
import { DeveloperTabs } from '@/components/developer-tabs'
import React, { Suspense } from 'react'

function DevelopersLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-sm text-gray-600">Loading developers...</p>
      </div>
    </div>
  )
}

const page = () => {
  return (
    <div>
      <Suspense fallback={<DevelopersLoading />}>
        <DeveloperTabs />
      </Suspense>
    </div>
  )
}

export default page
