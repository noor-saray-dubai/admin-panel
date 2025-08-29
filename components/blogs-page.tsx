"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Plus, 
  FileText, 
  Calendar, 
  Eye, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  User, 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Star
} from "lucide-react"
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
  file?: File
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

interface IAuditInfo {
  email: string
  timestamp: string
  ipAddress?: string
  userAgent?: string
}

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
  createdBy: IAuditInfo
  updatedBy: IAuditInfo
  version: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalBlogs: number
  limit: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface FiltersData {
  categories: string[]
  authors: string[]
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
  const getActualStatus = (publishDate: string, status: string) => {
    const now = new Date()
    const pubDate = new Date(publishDate)
    
    if (status === "Draft") return "Draft"
    if (pubDate <= now) return "Published"
    return "Scheduled"
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
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const actualStatus = getActualStatus(blog.publishDate, blog.status)

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="relative">
        <img
          src={blog.featuredImage || "/placeholder.svg"}
          alt={blog.title}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        {blog.featured && (
          <Badge className="absolute top-2 left-2 bg-yellow-500 hover:bg-yellow-600">
            <Star className="h-3 w-3 mr-1" />
            Featured
          </Badge>
        )}
        <Badge variant={getStatusColor(actualStatus)} className="absolute top-2 right-2">
          {actualStatus}
        </Badge>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <CardTitle className="text-lg line-clamp-2">{blog.title}</CardTitle>
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <User className="h-3 w-3" />
                <span>{blog.author}</span>
                <span>•</span>
                <Calendar className="h-3 w-3" />
                <span>{formatDate(blog.publishDate)}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span>Updated: {formatDateTime(blog.updatedAt)}</span>
                <span>•</span>
                <span>v{blog.version}</span>
              </div>
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

        <div className="flex items-center space-x-2 flex-wrap gap-1">
          <Badge variant="outline" className="text-xs">
            {blog.category}
          </Badge>
          {blog.tags.slice(0, 2).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {blog.tags.length > 2 && (
            <span className="text-xs text-muted-foreground">+{blog.tags.length - 2} more</span>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{blog.readTime} min read</span>
          <span>{blog.views} views</span>
        </div>

        {/* Audit Info */}
        <div className="border-t pt-3 space-y-1">
          <div className="text-xs text-muted-foreground">
            <div>Created by: {blog.createdBy.email}</div>
            <div>Last updated by: {blog.updatedBy.email}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function BlogsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const action = searchParams.get("action")

  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalBlogs: 0,
    limit: 20,
    hasNextPage: false,
    hasPrevPage: false,
  })
  const [filters, setFilters] = useState<FiltersData>({
    categories: [],
    authors: [],
  })

  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedAuthor, setSelectedAuthor] = useState("all")
  const [selectedFeatured, setSelectedFeatured] = useState("all")

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null)

  // Build query parameters
  const buildQueryParams = (page: number = pagination.currentPage) => {
    const params = new URLSearchParams()
    params.set("page", page.toString())
    params.set("limit", "20")
    
    if (searchTerm) params.set("search", searchTerm)
    if (selectedStatus && selectedStatus !== "all") params.set("status", selectedStatus)
    if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory)
    if (selectedAuthor && selectedAuthor !== "all") params.set("author", selectedAuthor)
    if (selectedFeatured && selectedFeatured !== "all") params.set("featured", selectedFeatured)
    
    return params.toString()
  }

  // Fetch blogs with filters and pagination
  const fetchBlogs = async (page: number = 1) => {
    setLoading(true)
    try {
      const queryParams = buildQueryParams(page)
      const res = await fetch(`/api/blog/fetch?${queryParams}`)
      const json = await res.json()
      
      if (json.success) {
        setBlogs(json.blogs)
        setPagination(json.pagination)
        setFilters(json.filters)
      } else {
        console.error("Failed to fetch blogs:", json.message)
      }
    } catch (err) {
      console.error("Error fetching blogs:", err)
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchBlogs()
  }, [])

  // Handle URL action parameter
  useEffect(() => {
    if (action === "new") {
      setIsAddModalOpen(true)
    }
  }, [action])

  // Handle filter changes
  const handleSearch = () => {
    fetchBlogs(1) // Reset to page 1 when searching
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setSelectedStatus("all")
    setSelectedCategory("all")
    setSelectedAuthor("all")
    setSelectedFeatured("all")
    fetchBlogs(1)
  }

  // Pagination handlers
  const handlePageChange = (page: number) => {
    fetchBlogs(page)
  }

  // Modal handlers
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

  const handleSaveBlog = () => {
    fetchBlogs(pagination.currentPage) // Refresh current page
  }

  const handleConfirmDelete = async () => {
    if (selectedBlog) {
      try {
        const response = await fetch(`/api/blog/delete/${selectedBlog.slug}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          fetchBlogs(pagination.currentPage)
        }
      } catch (error) {
        console.error('Error deleting blog:', error)
      }
    }
    setIsDeleteModalOpen(false)
    setSelectedBlog(null)
  }

  // Calculate stats
  const blogStats = [
    {
      title: "Total Blogs",
      value: pagination.totalBlogs.toString(),
      icon: FileText,
      color: "text-blue-600",
    },
    {
      title: "Published",
      value: blogs.filter(b => {
        const actualStatus = new Date(b.publishDate) <= new Date() && b.status !== "Draft" ? "Published" : b.status
        return actualStatus === "Published"
      }).length.toString(),
      icon: Eye,
      color: "text-green-600",
    },
    {
      title: "Drafts",
      value: blogs.filter(b => b.status === "Draft").length.toString(),
      icon: Edit,
      color: "text-gray-600",
    },
    {
      title: "Featured",
      value: blogs.filter(b => b.featured).length.toString(),
      icon: Star,
      color: "text-yellow-600",
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

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search blogs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
            </div>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Published">Published</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {filters.categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
              <SelectTrigger>
                <SelectValue placeholder="Author" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Authors</SelectItem>
                {filters.authors.map((author) => (
                  <SelectItem key={author} value={author}>
                    {author}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button onClick={handleSearch} className="flex-1">
                Search
              </Button>
              <Button variant="outline" onClick={handleClearFilters}>
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {blogs.length} of {pagination.totalBlogs} blogs
          {searchTerm && ` for "${searchTerm}"`}
        </div>
        <div className="text-sm text-muted-foreground">
          Sorted by last updated
        </div>
      </div>

      {/* Blogs Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg" />
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No blogs found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || selectedStatus !== "all" || selectedCategory !== "all" || selectedAuthor !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by creating your first blog post"}
            </p>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Blog Post
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {blogs.map((blog) => (
            <BlogCard 
              key={blog._id} 
              blog={blog} 
              onView={handleView} 
              onEdit={handleEdit} 
              onDelete={handleDelete} 
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum: number
              
              if (pagination.totalPages <= 5) {
                pageNum = i + 1
              } else if (pagination.currentPage <= 3) {
                pageNum = i + 1
              } else if (pagination.currentPage >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i
              } else {
                pageNum = pagination.currentPage - 2 + i
              }

              return (
                <Button
                  key={pageNum}
                  variant={pageNum === pagination.currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className="w-10"
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Page Info */}
      {pagination.totalBlogs > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Page {pagination.currentPage} of {pagination.totalPages} 
          ({pagination.totalBlogs} total blogs)
        </div>
      )}

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