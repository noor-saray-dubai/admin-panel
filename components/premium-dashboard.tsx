import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Building2,
  TrendingUp,
  MapPin,
  DollarSign,
  Construction,
  Users,
  FileText,
  MessageSquare,
  ArrowUpRight,
  Activity,
  Zap,
  Target,
} from "lucide-react"

const dashboardStats = [
  {
    title: "Total Revenue",
    value: "$2.4M",
    change: "+23.5%",
    changeType: "positive",
    icon: DollarSign,
    color: "from-emerald-500 to-teal-600",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
  },
  {
    title: "Active Projects",
    value: "342",
    change: "+12.3%",
    changeType: "positive",
    icon: Building2,
    color: "from-blue-500 to-cyan-600",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
  },
  {
    title: "Total Users",
    value: "12,847",
    change: "+8.2%",
    changeType: "positive",
    icon: Users,
    color: "from-purple-500 to-pink-600",
    bgColor: "bg-purple-50",
    textColor: "text-purple-700",
  },
  {
    title: "Conversion Rate",
    value: "24.8%",
    change: "+4.1%",
    changeType: "positive",
    icon: Target,
    color: "from-orange-500 to-red-600",
    bgColor: "bg-orange-50",
    textColor: "text-orange-700",
  },
]

const recentActivities = [
  {
    action: "New project launched",
    project: "Noorsaray Heights Premium",
    time: "2 hours ago",
    type: "launch",
    icon: Zap,
    color: "text-blue-500",
  },
  {
    action: "Developer onboarded",
    project: "Elite Properties Group",
    time: "4 hours ago",
    type: "developer",
    icon: Users,
    color: "text-green-500",
  },
  {
    action: "Blog post published",
    project: "Investment Guide 2024",
    time: "6 hours ago",
    type: "content",
    icon: FileText,
    color: "text-purple-500",
  },
  {
    action: "Milestone achieved",
    project: "50% completion - Tower A",
    time: "1 day ago",
    type: "construction",
    icon: Construction,
    color: "text-orange-500",
  },
]

const topProjects = [
  {
    name: "Noorsaray Marina Residences",
    location: "Dubai Marina",
    progress: 85,
    revenue: "$45.2M",
    status: "On Track",
    image: "/placeholder.svg?height=60&width=60",
  },
  {
    name: "Noorsaray Business Hub",
    location: "Business Bay",
    progress: 92,
    revenue: "$38.7M",
    status: "Ahead",
    image: "/placeholder.svg?height=60&width=60",
  },
  {
    name: "Noorsaray Garden Villas",
    location: "Dubai Hills",
    progress: 67,
    revenue: "$52.1M",
    status: "On Track",
    image: "/placeholder.svg?height=60&width=60",
  },
]

export function PremiumDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Welcome back to Noorsaray
          </h1>
          <p className="text-slate-600 mt-2">Here's what's happening with your business today.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg">
            <Activity className="h-4 w-4 mr-2" />
            View Analytics
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat, index) => (
          <Card
            key={stat.title}
            className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity`}
            />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">{stat.title}</CardTitle>
              <div className={`p-2 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.textColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</div>
              <div className="flex items-center space-x-1">
                <ArrowUpRight className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-600">{stat.change}</span>
                <span className="text-sm text-slate-500">vs last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Projects */}
        <Card className="lg:col-span-2 border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <span>Top Performing Projects</span>
              </CardTitle>
              <Button variant="ghost" size="sm">
                View All
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProjects.map((project, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <img
                    src={project.image || "/placeholder.svg"}
                    alt={project.name}
                    className="w-12 h-12 rounded-lg object-cover border-2 border-white shadow-sm"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">{project.name}</h4>
                    <div className="flex items-center space-x-2 text-sm text-slate-500">
                      <MapPin className="h-3 w-3" />
                      <span>{project.location}</span>
                    </div>
                    <div className="mt-2 flex items-center space-x-4">
                      <div className="flex-1 bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-600">{project.progress}%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-slate-900">{project.revenue}</div>
                    <Badge variant={project.status === "Ahead" ? "default" : "secondary"} className="text-xs">
                      {project.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-green-500" />
              <span>Recent Activities</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 group">
                  <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                    <activity.icon className={`h-4 w-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                    <p className="text-sm text-slate-600">{activity.project}</p>
                    <p className="text-xs text-slate-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Ready to take action?</h3>
              <p className="text-slate-600">Manage your projects, developers, and content from here.</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" className="border-blue-200 hover:bg-blue-50 bg-transparent">
                <Building2 className="h-4 w-4 mr-2" />
                New Project
              </Button>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                <MessageSquare className="h-4 w-4 mr-2" />
                Create Blog
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
