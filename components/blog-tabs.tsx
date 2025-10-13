// components/blog-tabs.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useToast } from "@/components/ui/toast-system"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  FileText,
  Eye,
  Calendar,
  Star,
  Plus, 
  Loader2, 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Edit2,
  User,
  Tag
} from "lucide-react"

import type { Blog } from "@/types/blog"
import { BlogFormModal } from "./blog-form-modal"
import { DeleteConfirmationModal } from "./delete-confirmation-modal"
import { BlogCard } from "./blog-card"
import { BlogViewModal } from "./blog-view-modal"
import { DataPageLayout } from "@/components/ui/data-page-layout"
import type { StatCard, FilterConfig } from "@/components/ui/data-page-layout"

// Basic interfaces for blog management
interface BlogPaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface BlogFiltersData {
  categories: string[];
  authors: string[];
}

export function BlogTabs() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { success, error: showError } = useToast()
  const pathname = usePathname()
  const action = searchParams.get("action")

  // URL-based state - read from URL parameters
  const activeTab = searchParams.get("tab") || "all"
  const currentPage = parseInt(searchParams.get("page") || "1")
  const searchTerm = searchParams.get("search") || ""
  const selectedCategory = searchParams.get("category") || "all"
  const selectedAuthor = searchParams.get("author") || "all"
  const selectedStatus = searchParams.get("status") || "all"
  
  // Local state for search input (for immediate typing feedback)
  const [searchInput, setSearchInput] = useState(searchTerm)
  
  // Component state (non-URL)
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [pagination, setPagination] = useState<BlogPaginationInfo>({
    currentPage: currentPage,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
    hasNextPage: false,
    hasPrevPage: false,
  })
  const [filters, setFilters] = useState<BlogFiltersData>({
    categories: [],
    authors: [],
  })
  
  // Static tab counts (independent of filters)
  const [tabCounts, setTabCounts] = useState({
    all: 0,
    published: 0,
    draft: 0,
    featured: 0,
    popular: 0
  })
  const [countsLoading, setCountsLoading] = useState(true)

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null)

  // Update URL with new parameters
  const updateURL = (newParams: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams)
    
    // Update or set new parameters
    Object.entries(newParams).forEach(([key, value]) => {
      if (value && value !== "all" && value !== "") {
        params.set(key, value.toString())
      } else {
        params.delete(key)
      }
    })
    
    // Always ensure tab is set
    if (!params.get("tab")) {
      params.set("tab", "all")
    }
    
    // Reset page to 1 when filters change (except when explicitly setting page)
    if (!newParams.hasOwnProperty("page") && Object.keys(newParams).some(key => key !== "page")) {
      params.set("page", "1")
    }
    
    router.push(`${pathname}?${params.toString()}`)
  }

  // Build query parameters for API calls
  const buildQueryParams = (page: number = currentPage, tab: string = activeTab) => {
    const params = new URLSearchParams()
    params.set("page", page.toString())
    params.set("limit", "20")
    params.set("tab", tab)
    
    if (searchTerm) params.set("search", searchTerm)
    if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory)
    if (selectedAuthor && selectedAuthor !== "all") params.set("author", selectedAuthor)
    if (selectedStatus && selectedStatus !== "all") params.set("status", selectedStatus)
    
    return params.toString()
  }

  // Fetch tab counts (static, independent of filters)
  const fetchTabCounts = async () => {
    setCountsLoading(true)
    try {
      const response = await fetch('/api/blog/counts')
      
      if (!response.ok) {
        // If API doesn't exist yet, use fallback
        if (response.status === 404) {
        setTabCounts({
          all: pagination.totalCount || 0,
          published: 0,
          draft: 0,
          featured: 0,
          popular: 0
        })
          setCountsLoading(false)
          return
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setTabCounts({
          all: data.counts.all || 0,
          published: data.counts.published || 0,
          draft: data.counts.draft || 0,
          featured: data.counts.featured || 0,
          popular: data.counts.popular || 0
        })
      } else {
        console.warn('Failed to fetch tab counts:', data.message)
      }
    } catch (err: any) {
      console.warn('Tab counts API not available:', err.message)
      // Use current data as fallback
      setTabCounts({
        all: pagination.totalCount || 0,
        published: 0,
        draft: 0,
        featured: 0,
        popular: 0
      })
    } finally {
      setCountsLoading(false)
    }
  }

  // Fetch blogs with filters and pagination
  const fetchBlogs = async (page: number = 1, tab: string = activeTab) => {
    setLoading(true)
    setErrorMessage(null)
    try {
      const queryParams = buildQueryParams(page, tab)
      const response = await fetch(`/api/blog/fetch?${queryParams}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setBlogs([])
          setPagination({
            currentPage: 1,
            totalPages: 1,
            totalCount: 0,
            limit: 20,
            hasNextPage: false,
            hasPrevPage: false,
          })
          setErrorMessage('API endpoint not implemented yet')
          return
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setBlogs(result.data.blogs || [])
        setPagination(result.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalCount: 0,
          limit: 20,
          hasNextPage: false,
          hasPrevPage: false,
        })
        // Set filters from response if available
        if (result.data.filters?.filterOptions) {
          setFilters({
            categories: result.data.filters.filterOptions.categories || [],
            authors: result.data.filters.filterOptions.authors || []
          })
        }
      } else {
        setBlogs([])
        setErrorMessage(result.message || 'No blogs found')
      }
    } catch (err: any) {
      console.warn('Blogs API not available:', err.message)
      setBlogs([])
      setErrorMessage(`Unable to fetch blogs: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Fetch tab counts once on mount (independent of filters)
  useEffect(() => {
    fetchTabCounts()
  }, [])

  // Sync search input with URL changes (for external navigation)
  useEffect(() => {
    setSearchInput(searchTerm)
  }, [searchTerm])

  // Fetch data when URL parameters change
  useEffect(() => {
    fetchBlogs(currentPage, activeTab)
  }, [activeTab, currentPage, searchTerm, selectedCategory, selectedAuthor, selectedStatus])

  // Handle URL action parameter
  useEffect(() => {
    if (action === "new") {
      setIsAddModalOpen(true)
    } else if (action === "edit") {
      // Check if there's a blog slug in the URL to edit
      const blogSlug = searchParams.get("slug")
      if (blogSlug && blogs.length > 0) {
        const blogToEdit = blogs.find(b => b.slug === blogSlug)
        if (blogToEdit) {
          setSelectedBlog(blogToEdit)
          setIsEditModalOpen(true)
        }
      }
    }
  }, [action, searchParams, blogs])

  // Handle tab change
  const handleTabChange = (tab: string) => {
    updateURL({ tab })
  }

  // Handle filter changes
  const handleSearch = () => {
    updateURL({ search: searchInput })
  }

  const handleClearFilters = () => {
    updateURL({
      search: "",
      category: "all",
      author: "all",
      status: "all",
      page: "1"
    })
  }

  // Individual filter handlers
  const handleCategoryChange = (value: string) => {
    updateURL({ category: value })
  }

  const handleAuthorChange = (value: string) => {
    updateURL({ author: value })
  }

  const handleStatusChange = (value: string) => {
    updateURL({ status: value })
  }

  // Pagination handlers
  const handlePageChange = (page: number) => {
    updateURL({ page })
  }

  const handleAddBlog = () => {
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set("action", "new")
    router.push(currentUrl.toString())
  }

  const closeModal = () => {
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.delete("action")
    router.replace(currentUrl.toString())
    setIsAddModalOpen(false)
  }

  const closeEditModal = () => {
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.delete("action")
    currentUrl.searchParams.delete("slug")
    router.replace(currentUrl.toString())
    setIsEditModalOpen(false)
    setSelectedBlog(null)
  }

  const closeViewModal = () => {
    setIsViewModalOpen(false)
    setSelectedBlog(null)
  }

  const closeDeleteModal = () => {
    if (isDeleting) return // Don't close if deletion is in progress
    setIsDeleteModalOpen(false)
    setIsDeleting(false)
    setSelectedBlog(null)
  }

  const handleViewBlog = (blog: Blog) => {
    setSelectedBlog(blog)
    setIsViewModalOpen(true)
  }

  const handleEditBlog = (blog: Blog) => {
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set("action", "edit")
    currentUrl.searchParams.set("slug", blog.slug || blog._id || '')
    router.push(currentUrl.toString())
  }

  const handleDeleteBlog = (blog: Blog) => {
    setSelectedBlog(blog)
    setIsDeleteModalOpen(true)
  }

  // API functions for blog operations
  const deleteBlog = async (slug: string): Promise<void> => {
    console.log('🗑️ Deleting blog with slug:', slug)
    
    const response = await fetch(`/api/blog/delete/${slug}`, {
      method: 'DELETE',
    })

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete blog')
    }
    
    console.log('✅ Blog deleted successfully:', result)
  }

  const handleConfirmDelete = async () => {
    if (!selectedBlog || isDeleting) return
    
    setIsDeleting(true)
    try {
      await deleteBlog(selectedBlog.slug || selectedBlog._id || '')
      success('Blog deleted successfully')
      
      // Refresh the data
      await Promise.all([
        fetchBlogs(currentPage, activeTab),
        fetchTabCounts()
      ])
      
      closeDeleteModal()
    } catch (error: any) {
      console.error('Delete error:', error)
      showError(error.message || 'Failed to delete blog')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBlogSuccess = async () => {
    // Refresh data after successful add/edit
    await Promise.all([
      fetchBlogs(currentPage, activeTab),
      fetchTabCounts()
    ])
  }

  // Tab data configuration with static counts
  const tabs = [
    { id: "all", label: "All Blogs", icon: FileText, count: countsLoading ? 0 : tabCounts.all },
    { id: "published", label: "Published", icon: Eye, count: countsLoading ? 0 : tabCounts.published },
    { id: "draft", label: "Draft", icon: Edit2, count: countsLoading ? 0 : tabCounts.draft },
    { id: "featured", label: "Featured", icon: Star, count: countsLoading ? 0 : tabCounts.featured },
    { id: "popular", label: "Popular", icon: TrendingUp, count: countsLoading ? 0 : tabCounts.popular },
  ]

  // Configure stats for DataPageLayout
  const blogStats: StatCard[] = [
    {
      title: "Total Blogs",
      value: pagination.totalCount,
      icon: FileText,
      description: "Across all categories",
      isLoading: loading && blogs.length === 0
    },
    {
      title: "Published",
      value: tabCounts.published,
      icon: Eye,
      description: "Live blog posts",
      isLoading: countsLoading
    },
    {
      title: "Featured",
      value: tabCounts.featured,
      icon: Star,
      description: "Highlighted posts",
      isLoading: countsLoading
    },
    {
      title: "Total Views",
      value: blogs.reduce((total, blog) => total + blog.views, 0).toLocaleString(),
      icon: TrendingUp,
      description: "Across all posts",
      isLoading: loading && blogs.length === 0
    }
  ]

  // Configure filters for DataPageLayout
  const blogFilters: FilterConfig[] = [
    {
      label: "Category",
      value: selectedCategory,
      placeholder: "Category",
      options: [
        { value: "all", label: "All Categories" },
        ...filters.categories.map(category => ({ value: category, label: category }))
      ],
      onChange: handleCategoryChange
    },
    {
      label: "Author",
      value: selectedAuthor,
      placeholder: "Author",
      options: [
        { value: "all", label: "All Authors" },
        ...filters.authors.map(author => ({ value: author, label: author }))
      ],
      onChange: handleAuthorChange
    },
    {
      label: "Status",
      value: selectedStatus,
      placeholder: "Status",
      options: [
        { value: "all", label: "All Status" },
        { value: "Published", label: "Published" },
        { value: "Draft", label: "Draft" }
      ],
      onChange: handleStatusChange
    }
  ]

  return (
    <>
      <DataPageLayout
        title="Blogs"
        subtitle="Manage blog posts and articles"
        primaryAction={{
          label: "Add Blog",
          onClick: handleAddBlog,
          icon: Plus
        }}
        stats={blogStats}
        searchConfig={{
          placeholder: "Search blogs by title, author, or category...",
          value: searchInput,
          onChange: setSearchInput,
          onSearch: handleSearch
        }}
        filters={blogFilters}
        onClearFilters={handleClearFilters}
      >

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          {tabs.map((tab) => {
            const IconComponent = tab.icon
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <IconComponent className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                {tab.count > 0 && (
                  <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                    {tab.count}
                  </span>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading blogs...</span>
              </div>
            ) : errorMessage ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{errorMessage}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => fetchBlogs()}
                >
                  Try Again
                </Button>
              </div>
            ) : blogs.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No blogs found</h3>
                <p className="text-muted-foreground mb-4">
                  {tab.id === "all" 
                    ? "Start by adding your first blog to the system."
                    : `No blogs match the ${tab.label.toLowerCase()} criteria.`
                  }
                </p>
                {tab.id === "all" && (
                  <Button onClick={handleAddBlog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Blog
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Blog Grid using BlogCard component */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {blogs.map((blog) => (
                    <BlogCard
                      key={blog._id || blog.slug}
                      blog={blog}
                      onView={handleViewBlog}
                      onEdit={handleEditBlog}
                      onDelete={handleDeleteBlog}
                      isDeleting={isDeleting && selectedBlog?._id === blog._id}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{" "}
                      {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{" "}
                      {pagination.totalCount} blogs
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={!pagination.hasPrevPage}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={!pagination.hasNextPage}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>

      </DataPageLayout>

      {/* Modals */}
      {/* Add Blog Modal - Only render when open */}
      {isAddModalOpen && (
        <BlogFormModal
          isOpen={isAddModalOpen}
          mode="add"
          onClose={closeModal}
          onSuccess={handleBlogSuccess}
        />
      )}

      {/* Edit Blog Modal - Only render when open */}
      {isEditModalOpen && selectedBlog && (
        <BlogFormModal
          isOpen={isEditModalOpen}
          mode="edit"
          blog={selectedBlog}
          onClose={closeEditModal}
          onSuccess={handleBlogSuccess}
        />
      )}

      {/* View Blog Modal */}
      {isViewModalOpen && selectedBlog && (
        <BlogViewModal
          isOpen={isViewModalOpen}
          blog={selectedBlog}
          onClose={closeViewModal}
          onEdit={() => {
            closeViewModal()
            handleEditBlog(selectedBlog)
          }}
          onDelete={() => {
            closeViewModal()
            handleDeleteBlog(selectedBlog)
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedBlog && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          onConfirm={handleConfirmDelete}
          itemName={selectedBlog.title}
          itemType="Blog"
          isDeleting={isDeleting}
        />
      )}
    </>
  )
}