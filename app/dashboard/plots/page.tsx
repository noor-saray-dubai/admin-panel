// app/dashboard/plots/page.tsx
import { PlotTabs } from '@/components/plot-tabs'
import React, { Suspense } from 'react'

const page = () => {
  return (
    <div>
     <Suspense fallback={<></>}> <PlotTabs /></Suspense>
    </div>
  )
}

export default page
