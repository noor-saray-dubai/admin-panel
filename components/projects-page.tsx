"use client"
import { useSearchParams } from "next/navigation"
import { ProjectTabs } from "./project-tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Clock, CheckCircle, AlertCircle } from "lucide-react"

const projectStats = [
  {
    title: "Total Projects",
    value: "24",
    change: "+3 this month",
    icon: BarChart3,
    color: "text-blue-600",
  },
  {
    title: "In Progress",
    value: "8",
    change: "2 due this week",
    icon: Clock,
    color: "text-yellow-600",
  },
  {
    title: "Completed",
    value: "12",
    change: "+2 this month",
    icon: CheckCircle,
    color: "text-green-600",
  },
  {
    title: "Overdue",
    value: "4",
    change: "Need attention",
    icon: AlertCircle,
    color: "text-red-600",
  },
]

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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {projectStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Project Tabs */}
      <ProjectTabs initialModalOpen={action === "new"} />
    </div>
  )
}
