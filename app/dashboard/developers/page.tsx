import { DevelopersPage } from "@/components/developers-page";
import { Suspense } from "react";


export default function Developers() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DevelopersPage />
   </Suspense>
  )
}
