import { BuildingTabs } from '@/components/buildings.tabs'
import React, { Suspense } from 'react'

const page = () => {
  return (
 
       <div>
          <Suspense fallback={<></>}>
             <BuildingTabs />
          </Suspense>
        </div>
  )
}

export default page
