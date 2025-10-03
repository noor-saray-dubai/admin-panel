import React, { Suspense } from 'react'
import { HotelTabs } from '@/components/hotel-tabs'

const HotelsPage = () => {
  return <Suspense fallback={<></>}><HotelTabs /></Suspense>
}

export default HotelsPage
