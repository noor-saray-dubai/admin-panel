import React, { Suspense } from 'react'
import TestUploadPage from './clientpage'

const page = () => {
  return (
    <div>
      <Suspense fallback={<></>}><TestUploadPage /></Suspense>
    </div>
  )
}

export default page
