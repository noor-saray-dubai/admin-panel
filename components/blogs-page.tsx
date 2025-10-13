"use client"
import { useSearchParams } from "next/navigation"
import { BlogTabs } from "./blog-tabs"

export function BlogsPage() {
  const searchParams = useSearchParams()
  const action = searchParams.get("action")

  return (
    <div className="space-y-6">
      {/* Blog Tabs */}
      <BlogTabs />
    </div>
  )
}