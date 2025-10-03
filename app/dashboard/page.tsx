import { LuxuryDashboard } from "@/components/luxury-dashboard";
import { Suspense } from "react";


export default function DashboardPage() {
  return (
   <Suspense fallback={<></>}>
      <LuxuryDashboard />
    </Suspense>
  )
}
