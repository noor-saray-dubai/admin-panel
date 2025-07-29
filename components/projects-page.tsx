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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
        <p className="text-gray-600">Manage and track all your projects</p>
      </div>

      {/* Project Stats */}
 

      {/* Project Tabs */}
      <ProjectTabs initialModalOpen={action === "new"} />
    </div>
  )
}
