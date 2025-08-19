import { CareersPage } from "@/components/careers-page";
import { Suspense } from "react";



export default function Careers() {
  return (
    <Suspense fallback={<div>Loading...</div>}> <CareersPage /></Suspense>
     
 
  )
}
