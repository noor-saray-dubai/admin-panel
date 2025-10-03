import React, { Suspense } from 'react'
import AuditTrailPage from './clientpage'

const page = () => {
  return (
    <div>
      <Suspense fallback={<></>}> <AuditTrailPage/></Suspense>
    </div>
  )
}

export default page
