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

// Types matching your schema
interface ITextFormatting {
  bold: boolean
  italic: boolean
  color: string
}

interface ITextSegment extends ITextFormatting {
  type: "text"
  content: string
}

interface ILinkSegment extends ITextFormatting {
  type: "link"
  content: string
  url: string
}

type IContentSegment = ITextSegment | ILinkSegment

interface IListItem {
  text: string
  subItems?: string[]
}

interface IParagraphBlock {
  type: "paragraph"
  order: number
  content: IContentSegment[]
}

interface IHeadingBlock extends ITextFormatting {
  type: "heading"
  order: number
  level: 1 | 2 | 3 | 4 | 5 | 6
  content: string
}

interface IImageBlock {
  type: "image"
  order: number
  url: string
  alt: string
  caption?: string
  file?: File // For new uploads
}

interface ILinkBlock extends ITextFormatting {
  type: "link"
  order: number
  url: string
  coverText: string
}

interface IQuoteBlock {
  type: "quote"
  order: number
  content: IContentSegment[]
  author?: string
  source?: string
}

interface IListBlock extends ITextFormatting {
  type: "list"
  order: number
  listType: "ordered" | "unordered"
  title: string
  items: IListItem[]
}

type IContentBlock = IParagraphBlock | IHeadingBlock | IImageBlock | ILinkBlock | IQuoteBlock | IListBlock

interface Blog {
  _id?: string
  title: string
  slug?: string
  excerpt: string
  contentBlocks: IContentBlock[]
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
  // Determine actual status based on publish date
  const getActualStatus = (publishDate: string) => {
    const now = new Date()
    const pubDate = new Date(publishDate)
    
    if (pubDate <= now) {
      return "Published"
    } else {
      return "Scheduled"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Published":
        return "default"
      case "Scheduled":
        return "outline"
      default:
        return "secondary"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const actualStatus = getActualStatus(blog.publishDate)

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="relative">
        <img
          src={blog.featuredImage[0] || "/placeholder.svg"}
          alt={blog.title}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        {blog.featured && <Badge className="absolute top-2 left-2 bg-yellow-500">Featured</Badge>}
        <Badge variant={getStatusColor(actualStatus)} className="absolute top-2 right-2">
          {actualStatus}
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

  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null)

  // Fetch all blogs
  const fetchBlogs = async () => {
    try {
      const res = await fetch("/api/blog/fetch")
      const json = await res.json()
      if (json.success) {
        setBlogs(json.blogs)
        console.log(json.blogs)
      } else {
        console.error("Failed to fetch blogs:", json.message)
      }
    } catch (err) {
      console.error("Error fetching blogs:", err)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {

    // fetchBlogs()
  }, [])

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
      setBlogs((prev) =>
        prev.map((b) => (b._id === selectedBlog._id ? { ...blogData, _id: selectedBlog._id } : b))
      )
    } else {
      const newBlog = { ...blogData, _id: Date.now().toString() }
      setBlogs((prev) => [...prev, newBlog])
    }
  }


    const handleConfirmDelete = async () => {
    if (selectedBlog) {
      try {
        // You'll need to implement DELETE endpoint
        const response = await fetch(`/api/blog/delete/${selectedBlog.slug }`, {
          method: 'DELETE',
        })

        if (response.ok) {
          // Refresh projects list
          await fetchBlogs()
        }
      } catch (error) {
        console.error('Error deleting project:', error)
        // You might want to show an error toast here
      }
    }
    setIsDeleteModalOpen(false)
    setSelectedBlog(null)
  }


  // Calculate stats based on actual publish dates
  const getPublishedBlogs = () => {
    const now = new Date()
    return blogs.filter(blog => new Date(blog.publishDate) <= now)
  }

  const getScheduledBlogs = () => {
    const now = new Date()
    return blogs.filter(blog => new Date(blog.publishDate) > now)
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
      value: getPublishedBlogs().length.toString(),
      icon: Eye,
      color: "text-green-600",
    },
    {
      title: "Scheduled",
      value: getScheduledBlogs().length.toString(),
      icon: Calendar,
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
      {/* {loading ? (
        <p className="text-gray-500">Loading blogs...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {blogs.map((blog) => (
            <BlogCard key={blog._id} blog={blog} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )} */}

      {/* Modals */}
      <BlogFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        // onSave={handleSaveBlog}
        mode="add"
      />

      <BlogFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedBlog(null)
        }}
        // onSave={handleSaveBlog}
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