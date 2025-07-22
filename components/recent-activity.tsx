import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const activities = [
  {
    user: "John Doe",
    action: "Created new account",
    time: "2 minutes ago",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    user: "Jane Smith",
    action: "Updated profile information",
    time: "5 minutes ago",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    user: "Mike Johnson",
    action: "Placed order #1234",
    time: "10 minutes ago",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    user: "Sarah Wilson",
    action: "Left a review",
    time: "15 minutes ago",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    user: "Tom Brown",
    action: "Cancelled subscription",
    time: "20 minutes ago",
    avatar: "/placeholder.svg?height=32&width=32",
  },
]

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-center space-x-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src={activity.avatar || "/placeholder.svg"} alt={activity.user} />
                <AvatarFallback>
                  {activity.user
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">{activity.user}</p>
                <p className="text-sm text-muted-foreground">{activity.action}</p>
              </div>
              <div className="text-sm text-muted-foreground">{activity.time}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
