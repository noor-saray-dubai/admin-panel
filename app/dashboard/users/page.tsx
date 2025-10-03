import React, { Suspense } from 'react'
import UserManagementPage from './clientpage'

const page = () => {
  return (
    <div>
      <Suspense fallback={<></>}> <UserManagementPage/></Suspense>
    </div>
  )
}

export default page
