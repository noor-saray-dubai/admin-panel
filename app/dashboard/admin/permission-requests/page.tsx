import React, { Suspense } from 'react'
import AdminPermissionRequestsPage from './clientpage'

const page = () => {
  return (
 
        <div>
           <Suspense fallback={<></>}>
              <AdminPermissionRequestsPage />
           </Suspense>
         </div>
  )
}

export default page
