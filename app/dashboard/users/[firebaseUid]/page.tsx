import React, { Suspense } from 'react'
import UserDetailPage from './clientpage'

const page = () => {
  return (
    <div>
      <Suspense fallback={<></>}> <UserDetailPage/></Suspense>
    </div>
  )
}

export default page
