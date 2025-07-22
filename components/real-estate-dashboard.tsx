import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, TrendingUp, MapPin, Calendar, DollarSign, Home, Construction } from "lucide-react"

const dashboardStats = [
  {
    title: "Total Properties",
    value: "1,247",
    change: "+12%",
    changeType: "positive",
    icon: Building2,
    color: "text-blue-600",
  },
  {
    title: "Active Listings",
    value: "342",
    change: "+8%",
    changeType: "positive",
    icon: Home,
    color: "text-green-600",
  },
  {
    title: "Under Construction",
    value: "89",
    change: "+15%",
    changeType: "positive",
    icon: Construction,
    color: "text-orange-600",
  },
  {
    title: "Total Revenue",
    value: "AED 2.4B",
    change: "+23%",
    changeType: "positive",
    icon: DollarSign,
    color: "text-emerald-600",
  },
]

const topProjects = [
  {
    name: "Danube Aspirz",
    location: "Dubai Sports City",
    units: 506,
    sold: 342,
    revenue: "AED 289M",
    status: "Under Construction",
  },
  {
    name: "Emaar Creek Beach",
    location: "Dubai Creek Harbour",
    units: 320,
    sold: 298,
    revenue: "AED 357M",
    status: "Launching Soon",
  },
  {
    name: "Sobha Hartland Villas",
    location: "Mohammed Bin Rashid City",
    units: 150,
    sold: 150,
    revenue: "AED 525M",
    status: "Completed",
  },
]

const recentActivities = [
  {
    action: "New project launched",
    project: "Marina Heights Tower",
    time: "2 hours ago",
    type: "launch",
  },
  {
    action: "Unit sold",
    project: "Danube Aspirz - Unit 2304",
    time: "4 hours ago",
    type: "sale",
  },
  {
    action: "Construction milestone",
    project: "Creek Beach - 50% completion",
    time: "1 day ago",
    type: "construction",
  },
  {
    action: "New developer onboarded",
    project: "Nakheel Properties",
    time: "2 days ago",
    type: "developer",
  },
]

const locationStats = [
  { location: "Dubai Marina", projects: 45, value: "AED 1.2B" },
  { location: "Downtown Dubai", projects: 32, value: "AED 980M" },
  { location: "Dubai Hills", projects: 28, value: "AED 750M" },
  { location: "Business Bay", projects: 38, value: "AED 650M" },
]

export function RealEstateDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Real Estate Dashboard</h1>
        <p className="text-gray-600">Overview of your property portfolio and market performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{stat.change}</span> from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Performing Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Top Performing Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProjects.map((project, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="space-y-1">
                    <h4 className="font-medium">{project.name}</h4>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-1" />
                      {project.location}
                    </div>
                    <div className="text-sm">
                      {project.sold}/{project.units} units sold
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="font-semibold text-green-600">{project.revenue}</div>
                    <Badge variant="outline" className="text-xs">
                      {project.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === "launch"
                        ? "bg-blue-500"
                        : activity.type === "sale"
                          ? "bg-green-500"
                          : activity.type === "construction"
                            ? "bg-orange-500"
                            : "bg-purple-500"
                    }`}
                  />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.project}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Location Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="mr-2 h-5 w-5" />
            Performance by Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {locationStats.map((location, index) => (
              <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                <h4 className="font-semibold text-gray-900">{location.location}</h4>
                <div className="mt-2 space-y-1">
                  <div className="text-sm text-muted-foreground">{location.projects} projects</div>
                  <div className="text-lg font-bold text-blue-600">{location.value}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
