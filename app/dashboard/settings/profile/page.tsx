import React, { Suspense } from 'react'
import ProfilePage from './clientpage'

const page = () => {
  return (
    <div>
      <Suspense fallback={<></>}> <ProfilePage /></Suspense>
    </div>
  )
}

export default page
