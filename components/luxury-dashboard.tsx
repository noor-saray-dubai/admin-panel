"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, FileText, MessageSquare, Users, Plus, ArrowRight, Calendar, MapPin, User, Loader2, Home } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

// Interfaces for API data
interface DashboardStats {
  projects: number
  blogs: number
  developers: number
  properties: number
}

interface RecentProject {
  id: string
  name: string
  location: string
  status: string
  image?: string
}

interface RecentBlog {
  _id: string
  title: string
  author: string
  publishDate: string
  status: string
}

interface RecentProperty {
  _id: string
  title: string
  location: string
  status: string
  price: string
  type: string
}

export function LuxuryDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({ projects: 0, blogs: 0, developers: 0, properties: 0 })
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([])
  const [recentBlogs, setRecentBlogs] = useState<RecentBlog[]>([])
  const [recentProperties, setRecentProperties] = useState<RecentProperty[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch dashboard data on mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Fetch all counts and recent data in parallel
        const [projectsRes, blogsRes, propertiesRes] = await Promise.all([
          fetch('/api/projects/fetch?limit=3'),
          fetch('/api/blog/fetch?limit=3'),
          fetch('/api/properties/fetch?limit=3')
        ])

        // Fetch counts
        const [projectCountsRes, blogCountsRes, propertyCountsRes, developerCountsRes] = await Promise.all([
          fetch('/api/projects/counts').catch(() => null),
          fetch('/api/blog/counts').catch(() => null),
          fetch('/api/properties/counts').catch(() => null),
          fetch('/api/developers/counts').catch(() => null)
        ])

        // Process projects data
        if (projectsRes.ok) {
          const projectsData = await projectsRes.json()
          if (projectsData.success && projectsData.data?.projects) {
            setRecentProjects(projectsData.data.projects.slice(0, 3).map((p: any) => ({
              id: p.id || p.slug,
              name: p.name,
              location: p.location,
              status: p.status,
              image: p.image
            })))
          }
        }

        // Process blogs data  
        if (blogsRes.ok) {
          const blogsData = await blogsRes.json()
          if (blogsData.success && blogsData.data?.blogs) {
            setRecentBlogs(blogsData.data.blogs.slice(0, 3))
          }
        }

        // Process properties data
        if (propertiesRes.ok) {
          const propertiesData = await propertiesRes.json()
          if (propertiesData.success && propertiesData.properties) {
            setRecentProperties(propertiesData.properties.slice(0, 3).map((p: any) => ({
              _id: p.id || p._id,
              title: p.name,
              location: p.location?.area || p.location?.address || 'Unknown Location',
              status: p.availabilityStatus || p.propertyStatus || 'Unknown',
              price: p.price || 'Price on Request',
              type: p.propertyType || 'Property'
            })))
          }
        }

        // Process counts
        const newStats = { projects: 0, blogs: 0, developers: 0, properties: 0 }
        
        if (projectCountsRes && projectCountsRes.ok) {
          const projectCounts = await projectCountsRes.json()
          if (projectCounts.success) {
            newStats.projects = projectCounts.counts?.total || 0
          }
        }
        
        if (blogCountsRes && blogCountsRes.ok) {
          const blogCounts = await blogCountsRes.json()
          if (blogCounts.success) {
            newStats.blogs = blogCounts.counts?.total || 0
          }
        }
        
        if (propertyCountsRes && propertyCountsRes.ok) {
          const propertyCounts = await propertyCountsRes.json()
          if (propertyCounts.success) {
            newStats.properties = propertyCounts.counts?.total || propertyCounts.summary?.total || 0
          }
        }
        
        if (developerCountsRes && developerCountsRes.ok) {
          const developerCounts = await developerCountsRes.json()
          if (developerCounts.success) {
            newStats.developers = developerCounts.counts?.total || 0
          }
        }

        setStats(newStats)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const handleQuickAction = (path: string, action?: string) => {
    if (action) {
      router.push(`/dashboard${path}?tab=all&page=1&action=${action}`)
    } else {
      router.push(`/dashboard${path}?tab=all&page=1`)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
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
            <div className="text-2xl font-semibold text-gray-900">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.projects}
            </div>
            <p className="text-xs text-gray-500 mt-1">Active projects</p>
          </CardContent>
        </Card>

        <Card className="border-gray-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Blog Posts</CardTitle>
            <MessageSquare className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-900">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.blogs}
            </div>
            <p className="text-xs text-gray-500 mt-1">Published articles</p>
          </CardContent>
        </Card>

        <Card className="border-gray-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Properties</CardTitle>
            <Home className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-900">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.properties}
            </div>
            <p className="text-xs text-gray-500 mt-1">Listed properties</p>
          </CardContent>
        </Card>

        <Card className="border-gray-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Developers</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-900">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.developers}
            </div>
            <p className="text-xs text-gray-500 mt-1">Verified partners</p>
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
              onClick={() => handleQuickAction("/properties", "new")}
              variant="outline"
              className="h-12 border-gray-200 hover:bg-gray-50 bg-transparent"
            >
              <Home className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Projects */}
        <Card className="border-gray-100">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium text-gray-900">Recent Projects</CardTitle>
            <Link href="/dashboard/projects?tab=all&page=1">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : recentProjects.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No projects found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div key={project.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{project.name}</p>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" />
                        <span>{project.location}</span>
                      </div>
                    </div>
                    <Badge variant={project.status === "Launched" ? "default" : "secondary"} className="text-xs">
                      {project.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Blogs */}
        <Card className="border-gray-100">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium text-gray-900">Recent Blogs</CardTitle>
            <Link href="/dashboard/blogs?tab=all&page=1">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : recentBlogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No blogs found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentBlogs.map((blog) => (
                  <div key={blog._id} className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <p className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">{blog.title}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{blog.author}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(blog.publishDate)}</span>
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
            )}
          </CardContent>
        </Card>

        {/* Recent Properties */}
        <Card className="border-gray-100">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium text-gray-900">Recent Properties</CardTitle>
            <Link href="/dashboard/properties?tab=all&page=1">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : recentProperties.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Home className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No properties found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentProperties.map((property) => (
                  <div key={property._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Home className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate">{property.title}</p>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <MapPin className="h-3 w-3" />
                          <span>{property.location}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{property.price}</p>
                      <Badge variant={property.status === "Available" ? "default" : "secondary"} className="text-xs mt-1">
                        {property.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
