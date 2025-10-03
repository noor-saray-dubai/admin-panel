// app/dashboard/malls/page.tsx
import { MallTabs } from '@/components/mall-tabs'
import React, { Suspense } from 'react'

const page = () => {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <MallTabs />
      </Suspense>
    </div>
  )
}

export default page
