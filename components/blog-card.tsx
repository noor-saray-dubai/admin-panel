// components/blog-card.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Eye, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Calendar, 
  Clock,
  Star,
  User,
  Tag,
  FileText
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Blog } from "@/types/blog"

interface BlogCardProps {
  blog: Blog
  onView: (blog: Blog) => void
  onEdit: (blog: Blog) => void
  onDelete: (blog: Blog) => void
  isDeleting?: boolean
}

export function BlogCard({ blog, onView, onEdit, onDelete, isDeleting = false }: BlogCardProps) {
  const getActualStatus = (publishDate: string | Date, status: string) => {
    return status // Just return the actual status, no date logic
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Published":
        return "default"
      case "Draft":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).getFullYear()
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const actualStatus = getActualStatus(blog.publishDate, blog.status)

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg line-clamp-1">{blog.title}</CardTitle>
              <Badge className="bg-white/90 text-gray-900 font-mono text-xs border">
                {blog._id?.slice(-8) || blog.slug?.slice(-8) || 'NEW'}
              </Badge>
            </div>
            
            {/* Category and Author Info */}
            <div className="flex items-center text-sm text-muted-foreground">
              <Tag className="h-4 w-4 mr-1" />
              <span className="truncate">{blog.category}</span>
              <span className="mx-1">•</span>
              <User className="h-4 w-4 mr-1" />
              <span className="truncate">{blog.author}</span>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" disabled={isDeleting}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(blog)} disabled={isDeleting}>
                <Eye className="mr-2 h-4 w-4" />
                View Blog
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(blog)} disabled={isDeleting}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Blog
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(blog)} 
                className="text-red-600"
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Delete Blog'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Excerpt */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {blog.excerpt}
        </p>

        {/* Views and Read Time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 text-sm font-medium text-blue-600">
            <Eye className="h-4 w-4" />
            <span>{blog.views.toLocaleString()} views</span>
          </div>
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{blog.readTime} min</span>
          </div>
        </div>

        {/* Status and Feature Badges */}
        <div className="flex gap-2 flex-wrap">
          <Badge className={`text-xs ${getStatusColor(actualStatus)}`}>
            <FileText className="h-3 w-3 mr-1" />
            {actualStatus}
          </Badge>
          
          {blog.featured && (
            <Badge className="bg-yellow-500 hover:bg-yellow-600 text-xs">
              <Star className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
        </div>

        {/* Tags */}
        <div className="flex gap-1 flex-wrap">
          {blog.tags.slice(0, 3).map((tag: string) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {blog.tags.length > 3 && (
            <span className="text-xs text-muted-foreground self-center">
              +{blog.tags.length - 3} more
            </span>
          )}
        </div>

        {/* Date Information */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>
              {actualStatus === "Published" 
                ? `Published ${formatDate(blog.publishDate)}` 
                : "Not published"
              }
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}