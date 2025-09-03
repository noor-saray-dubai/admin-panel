"use client"
import { useSearchParams } from "next/navigation"
import { ProjectTabs } from "./project-tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Clock, CheckCircle, AlertCircle } from "lucide-react"



export function ProjectsPage() {
  const searchParams = useSearchParams()
  const action = searchParams.get("action")

  return (
    <div className="space-y-6">
    

      {/* Project Stats */}
 

      {/* Project Tabs */}
      <ProjectTabs initialModalOpen={action === "new"} />
    </div>
  )
}
