import React, { Suspense } from 'react'
import PermissionRequestPage from './clientpage'

const page = () => {
  return (
    <div>
      <Suspense fallback={<></>}><PermissionRequestPage /></Suspense>
    </div>
  )
}

export default page
