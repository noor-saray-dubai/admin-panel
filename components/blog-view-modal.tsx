import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar, User, Clock, Eye } from "lucide-react"

interface Blog {
  _id?: string
  title: string
  slug?: string
  excerpt: string
  content: string
  featuredImage: string
  author: string
  category: string
  tags: string[]
  status: "Published" | "Draft" | "Scheduled"
  publishDate: string
  readTime: number
  views: number
  featured: boolean
}


interface BlogViewModalProps {
  isOpen: boolean
  onClose: () => void
  blog: Blog | null
}

export function BlogViewModal({ isOpen, onClose, blog }: BlogViewModalProps) {
  if (!blog) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Published":
        return "default"
      case "Draft":
        return "secondary"
      case "Scheduled":
        return "outline"
      default:
        return "secondary"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <DialogTitle className="text-2xl">{blog.title}</DialogTitle>
              {blog.featured && <Badge className="bg-yellow-500">Featured</Badge>}
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>{blog.author}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(blog.publishDate)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{blog.readTime} min read</span>
              </div>
              <div className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span>{blog.views} views</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {blog.featuredImage[0] && (
            <div className="relative">
              <img
                src={blog.featuredImage[0] || "/placeholder.svg"}
                alt={blog.title}
                className="w-full h-64 object-cover rounded-lg"
              />
              <Badge variant={getStatusColor(blog.status)} className="absolute top-4 right-4">
                {blog.status}
              </Badge>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold">Category</h3>
              <Badge variant="outline">{blog.category}</Badge>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Slug</h3>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">{blog.slug}</code>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Excerpt</h3>
            <p className="text-muted-foreground leading-relaxed">{blog.excerpt}</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Content</h3>
            <div className="prose max-w-none">
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{blog.content}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {blog.tags.map((tag, index) => (
                <Badge key={index} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
