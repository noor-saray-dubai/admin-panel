import React, { Suspense } from 'react'
import SettingsPage from './clientpage'

const page = () => {
  return (
    <div>
      <Suspense fallback={<></>}>
      <SettingsPage />
      </Suspense>
    </div>
  )
}

export default page
