"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, Calendar, Eye, Edit, Trash2, MoreHorizontal, User } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { BlogFormModal } from "./blog-form-modal"
import { BlogViewModal } from "./blog-view-modal"
import { DeleteConfirmationModal } from "./delete-confirmation-modal"

interface Blog {
  id: number
  title: string
  slug: string
  excerpt: string
  content: string
  featuredImage: string[]
  author: string
  category: string
  tags: string[]
  status: "Published" | "Draft" | "Scheduled"
  publishDate: string
  readTime: number
  views: number
  featured: boolean
}

const sampleBlogs: Blog[] = [
  {
    id: 1,
    title: "Top 10 Investment Areas in Dubai 2024",
    slug: "top-10-investment-areas-dubai-2024",
    excerpt:
      "Discover the most promising real estate investment opportunities in Dubai for 2024, from emerging neighborhoods to established luxury districts.",
    content:
      "Dubai's real estate market continues to evolve, offering investors numerous opportunities across different price points and property types. In this comprehensive guide, we explore the top 10 areas that present the best investment potential for 2024...",
    featuredImage: ["/placeholder.svg?height=300&width=500"],
    author: "Sarah Ahmed",
    category: "Investment",
    tags: ["Dubai", "Investment", "Real Estate", "2024"],
    status: "Published",
    publishDate: "2024-01-15T10:00:00.000Z",
    readTime: 8,
    views: 2450,
    featured: true,
  },
  {
    id: 2,
    title: "Dubai Creek Harbour: The Future of Waterfront Living",
    slug: "dubai-creek-harbour-future-waterfront-living",
    excerpt:
      "Explore Dubai Creek Harbour's transformation into a world-class waterfront destination with luxury residences and commercial spaces.",
    content:
      "Dubai Creek Harbour represents the pinnacle of modern urban planning, combining luxury living with sustainable development practices. This mega-development spans over 6 square kilometers...",
    featuredImage: ["/placeholder.svg?height=300&width=500"],
    author: "Ahmed Hassan",
    category: "Development",
    tags: ["Dubai Creek Harbour", "Waterfront", "Luxury", "Development"],
    status: "Published",
    publishDate: "2024-01-12T14:30:00.000Z",
    readTime: 6,
    views: 1890,
    featured: false,
  },
  {
    id: 3,
    title: "Understanding Dubai's New Real Estate Regulations",
    slug: "understanding-dubai-new-real-estate-regulations",
    excerpt:
      "A comprehensive guide to the latest real estate regulations in Dubai and how they affect buyers, sellers, and investors.",
    content:
      "The Dubai real estate market has seen significant regulatory changes in recent years, aimed at protecting investors and ensuring market stability...",
    featuredImage: ["/placeholder.svg?height=300&width=500"],
    author: "Fatima Al-Zahra",
    category: "Legal",
    tags: ["Regulations", "Legal", "Dubai", "Real Estate Law"],
    status: "Draft",
    publishDate: "2024-01-20T09:00:00.000Z",
    readTime: 12,
    views: 0,
    featured: false,
  },
  {
    id: 4,
    title: "Sustainable Living: Green Buildings in Dubai",
    slug: "sustainable-living-green-buildings-dubai",
    excerpt:
      "Discover Dubai's commitment to sustainable architecture and the rise of eco-friendly residential and commercial developments.",
    content:
      "Dubai's vision for a sustainable future is reflected in its growing portfolio of green buildings and eco-friendly developments...",
    featuredImage: ["/placeholder.svg?height=300&width=500"],
    author: "Omar Khalil",
    category: "Sustainability",
    tags: ["Sustainability", "Green Buildings", "Environment", "Dubai"],
    status: "Scheduled",
    publishDate: "2024-01-25T11:00:00.000Z",
    readTime: 10,
    views: 0,
    featured: true,
  },
]

function BlogCard({
  blog,
  onView,
  onEdit,
  onDelete,
}: {
  blog: Blog
  onView: (blog: Blog) => void
  onEdit: (blog: Blog) => void
  onDelete: (blog: Blog) => void
}) {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="relative">
        <img
          src={blog.featuredImage[0] || "/placeholder.svg"}
          alt={blog.title}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        {blog.featured && <Badge className="absolute top-2 left-2 bg-yellow-500">Featured</Badge>}
        <Badge variant={getStatusColor(blog.status)} className="absolute top-2 right-2">
          {blog.status}
        </Badge>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg line-clamp-2">{blog.title}</CardTitle>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <User className="h-3 w-3" />
              <span>{blog.author}</span>
              <span>•</span>
              <Calendar className="h-3 w-3" />
              <span>{formatDate(blog.publishDate)}</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(blog)}>
                <Eye className="mr-2 h-4 w-4" />
                View Blog
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(blog)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Blog
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(blog)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Blog
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3">{blog.excerpt}</p>

        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            {blog.category}
          </Badge>
          {blog.tags.slice(0, 2).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {blog.tags.length > 2 && <span className="text-xs text-muted-foreground">+{blog.tags.length - 2} more</span>}
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{blog.readTime} min read</span>
          <span>{blog.views} views</span>
        </div>
      </CardContent>
    </Card>
  )
}

export function BlogsPage() {
  const searchParams = useSearchParams()
  const action = searchParams.get("action")

  const [blogs, setBlogs] = useState(sampleBlogs)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null)

  // Handle URL action parameter
  useEffect(() => {
    if (action === "new") {
      setIsAddModalOpen(true)
    }
  }, [action])

  const handleView = (blog: Blog) => {
    setSelectedBlog(blog)
    setIsViewModalOpen(true)
  }

  const handleEdit = (blog: Blog) => {
    setSelectedBlog(blog)
    setIsEditModalOpen(true)
  }

  const handleDelete = (blog: Blog) => {
    setSelectedBlog(blog)
    setIsDeleteModalOpen(true)
  }

  const handleSaveBlog = (blogData: Blog) => {
    if (selectedBlog) {
      setBlogs((prev) => prev.map((b) => (b.id === selectedBlog.id ? { ...blogData, id: selectedBlog.id } : b)))
    } else {
      const newBlog = { ...blogData, id: Date.now(), views: 0 }
      setBlogs((prev) => [...prev, newBlog])
    }
  }

  const handleConfirmDelete = () => {
    if (selectedBlog) {
      setBlogs((prev) => prev.filter((b) => b.id !== selectedBlog.id))
    }
    setIsDeleteModalOpen(false)
    setSelectedBlog(null)
  }

  const blogStats = [
    {
      title: "Total Blogs",
      value: blogs.length.toString(),
      icon: FileText,
      color: "text-blue-600",
    },
    {
      title: "Published",
      value: blogs.filter((b) => b.status === "Published").length.toString(),
      icon: Eye,
      color: "text-green-600",
    },
    {
      title: "Drafts",
      value: blogs.filter((b) => b.status === "Draft").length.toString(),
      icon: Edit,
      color: "text-orange-600",
    },
    {
      title: "Total Views",
      value: blogs.reduce((sum, b) => sum + b.views, 0).toLocaleString(),
      icon: Eye,
      color: "text-purple-600",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Blogs</h1>
          <p className="text-gray-600">Manage blog posts and content</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Blog Post
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {blogStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Blogs Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {blogs.map((blog) => (
          <BlogCard key={blog.id} blog={blog} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} />
        ))}
      </div>

      {/* Modals */}
      <BlogFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveBlog}
        mode="add"
      />

      <BlogFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedBlog(null)
        }}
        onSave={handleSaveBlog}
        blog={selectedBlog}
        mode="edit"
      />

      <BlogViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedBlog(null)
        }}
        blog={selectedBlog}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedBlog(null)
        }}
        onConfirm={handleConfirmDelete}
        itemName={selectedBlog?.title || ""}
        itemType="Blog Post"
      />
    </div>
  )
}
