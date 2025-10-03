import React, { Suspense } from 'react'
import ForbiddenPage from './client'

const page = () => {
  return (
   
      <div>
          <Suspense fallback={<></>}>
            <ForbiddenPage />
          </Suspense>
        </div>
  )
}

export default page
