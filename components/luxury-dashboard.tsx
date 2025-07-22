"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, FileText, MessageSquare, Users, Plus, ArrowRight, Calendar, MapPin, User } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

// Sample data for recent items
const recentProjects = [
  {
    id: 1,
    name: "Noorsaray Marina Residences",
    location: "Dubai Marina",
    status: "Active",
    image: "/placeholder.svg?height=60&width=60",
  },
  {
    id: 2,
    name: "Noorsaray Business Hub",
    location: "Business Bay",
    status: "Planning",
    image: "/placeholder.svg?height=60&width=60",
  },
  {
    id: 3,
    name: "Noorsaray Garden Villas",
    location: "Dubai Hills",
    status: "Active",
    image: "/placeholder.svg?height=60&width=60",
  },
]

const recentBlogs = [
  {
    id: 1,
    title: "Investment Opportunities in Dubai 2024",
    author: "Sarah Ahmed",
    date: "Jan 15, 2024",
    status: "Published",
  },
  {
    id: 2,
    title: "Sustainable Living in Modern Communities",
    author: "Ahmed Hassan",
    date: "Jan 12, 2024",
    status: "Draft",
  },
  {
    id: 3,
    title: "Understanding Real Estate Regulations",
    author: "Fatima Al-Zahra",
    date: "Jan 10, 2024",
    status: "Published",
  },
]

const recentDevelopers = [
  {
    id: 1,
    name: "Emaar Properties",
    projects: 25,
    verified: true,
  },
  {
    id: 2,
    name: "Danube Properties",
    projects: 12,
    verified: true,
  },
  {
    id: 3,
    name: "Sobha Realty",
    projects: 18,
    verified: true,
  },
]

export function LuxuryDashboard() {
  const router = useRouter()

  const handleQuickAction = (path: string, action?: string) => {
    if (action) {
      router.push(`${path}?action=${action}`)
    } else {
      router.push(`dashboard/${path}`)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back to Noorsaray Admin Panel</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-gray-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Projects</CardTitle>
            <Building2 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-900">24</div>
            <p className="text-xs text-gray-500 mt-1">Active projects</p>
          </CardContent>
        </Card>

        <Card className="border-gray-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Blog Posts</CardTitle>
            <MessageSquare className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-900">18</div>
            <p className="text-xs text-gray-500 mt-1">Published articles</p>
          </CardContent>
        </Card>

        <Card className="border-gray-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Developers</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-900">12</div>
            <p className="text-xs text-gray-500 mt-1">Verified partners</p>
          </CardContent>
        </Card>

        <Card className="border-gray-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Communities</CardTitle>
            <Building2 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-900">8</div>
            <p className="text-xs text-gray-500 mt-1">Active communities</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-900">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button
              onClick={() => handleQuickAction("/projects", "new")}
              className="h-12 bg-gray-900 hover:bg-gray-800 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
            <Button
              onClick={() => handleQuickAction("/blogs", "new")}
              variant="outline"
              className="h-12 border-gray-200 hover:bg-gray-50 bg-transparent"
            >
              <FileText className="h-4 w-4 mr-2" />
              Create Blog
            </Button>
            <Button
              onClick={() => handleQuickAction("/developers", "new")}
              variant="outline"
              className="h-12 border-gray-200 hover:bg-gray-50 bg-transparent"
            >
              <Users className="h-4 w-4 mr-2" />
              Add Developer
            </Button>
            <Button
              onClick={() => handleQuickAction("/communities")}
              variant="outline"
              className="h-12 border-gray-200 hover:bg-gray-50 bg-transparent"
            >
              <Building2 className="h-4 w-4 mr-2" />
              New Community
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Projects */}
        <Card className="border-gray-100">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium text-gray-900">Recent Projects</CardTitle>
            <Link href="/projects">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div key={project.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                  <img
                    src={project.image || "/placeholder.svg"}
                    alt={project.name}
                    className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{project.name}</p>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" />
                      <span>{project.location}</span>
                    </div>
                  </div>
                  <Badge variant={project.status === "Active" ? "default" : "secondary"} className="text-xs">
                    {project.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Blogs */}
        <Card className="border-gray-100">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium text-gray-900">Recent Blogs</CardTitle>
            <Link href="/blogs">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBlogs.map((blog) => (
                <div key={blog.id} className="p-3 hover:bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">{blog.title}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span>{blog.author}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-3 w-3" />
                      <span>{blog.date}</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Badge variant={blog.status === "Published" ? "default" : "secondary"} className="text-xs">
                      {blog.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Developers */}
        <Card className="border-gray-100">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium text-gray-900">Developers</CardTitle>
            <Link href="/developers">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDevelopers.map((developer) => (
                <div key={developer.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{developer.name}</p>
                      <p className="text-xs text-gray-500">{developer.projects} projects</p>
                    </div>
                  </div>
                  {developer.verified && (
                    <Badge variant="default" className="text-xs">
                      Verified
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
