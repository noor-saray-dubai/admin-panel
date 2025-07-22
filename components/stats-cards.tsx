import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, ShoppingCart, DollarSign, TrendingUp } from "lucide-react"

const stats = [
  {
    title: "Total Users",
    value: "12,345",
    change: "+12%",
    changeType: "positive",
    icon: Users,
  },
  {
    title: "Total Orders",
    value: "8,432",
    change: "+8%",
    changeType: "positive",
    icon: ShoppingCart,
  },
  {
    title: "Revenue",
    value: "$45,231",
    change: "+23%",
    changeType: "positive",
    icon: DollarSign,
  },
  {
    title: "Growth Rate",
    value: "15.3%",
    change: "+5%",
    changeType: "positive",
    icon: TrendingUp,
  },
]

export function StatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
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
  )
}
