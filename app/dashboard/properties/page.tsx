import { PropertiesPage } from "@/components/properties-page";
import { Suspense } from "react";

export default function Properties() {
  return (
   <Suspense fallback={<div>Loading...</div>}> 
      <PropertiesPage />
    </Suspense>
  )
}
