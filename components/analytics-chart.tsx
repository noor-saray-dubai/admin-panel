"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function AnalyticsChart() {
  // Mock data for the chart
  const data = [
    { month: "Jan", users: 400, orders: 240 },
    { month: "Feb", users: 300, orders: 139 },
    { month: "Mar", users: 200, orders: 980 },
    { month: "Apr", users: 278, orders: 390 },
    { month: "May", users: 189, orders: 480 },
    { month: "Jun", users: 239, orders: 380 },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <div className="flex h-full items-end justify-between space-x-2">
            {data.map((item, index) => (
              <div key={index} className="flex flex-col items-center space-y-2">
                <div className="flex space-x-1">
                  <div className="w-4 bg-blue-500 rounded-t" style={{ height: `${(item.users / 500) * 200}px` }} />
                  <div className="w-4 bg-green-500 rounded-t" style={{ height: `${(item.orders / 1000) * 200}px` }} />
                </div>
                <span className="text-xs text-muted-foreground">{item.month}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 bg-blue-500 rounded" />
              <span className="text-sm">Users</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 bg-green-500 rounded" />
              <span className="text-sm">Orders</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
