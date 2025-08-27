"use client"

import { useState, useEffect, useCallback, useMemo, memo } from "react"
import { useSearchParams } from "next/navigation"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  Building2,
  MapPin,
  Calendar,
  Users,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeveloperFormModal } from "./developer-form-modal"
import { DeveloperViewModal } from "./developer-view-modal"
import { DeleteConfirmationModal } from "./delete-confirmation-modal"

interface IDescriptionSection {
  title?: string
  description: string
}

interface IAward {
  name: string
  year: number
}

interface Developer {
  _id?: string
  name: string
  slug?: string
  logo: string
  coverImage: string
  description: IDescriptionSection[]
  overview: string
  location: string
  establishedYear: number
  website: string
  email: string
  phone: string
  specialization: string[]
  awards: IAward[]
  verified: boolean
  createdAt: string
  updatedAt: string
}

interface PaginationData {
  currentPage: number
  totalPages: number
  totalDevelopers: number
  hasNextPage: boolean
  hasPrevPage: boolean
  limit: number
}

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Memoized DeveloperCard component
const DeveloperCard = memo(function DeveloperCard({
  developer,
  onView,
  onEdit,
  onDelete,
}: {
  developer: Developer
  onView: (developer: Developer) => void
  onEdit: (developer: Developer) => void
  onDelete: (developer: Developer) => void
}) {
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }, [])

  const getTimeAgo = useCallback((dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return '1 day ago'
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    return formatDate(dateString)
  }, [formatDate])

  const handleView = useCallback(() => onView(developer), [onView, developer])
  const handleEdit = useCallback(() => onEdit(developer), [onEdit, developer])
  const handleDelete = useCallback(() => onDelete(developer), [onDelete, developer])

  // Memoize specialization badges
  const specializationBadges = useMemo(() => {
    const visibleSpecs = developer.specialization.slice(0, 3)
    const remainingCount = developer.specialization.length - 3

    return (
      <div className="flex flex-wrap gap-1">
        {visibleSpecs.map((spec, index) => (
          <Badge key={`${spec}-${index}`} variant="outline" className="text-xs">
            {spec}
          </Badge>
        ))}
        {remainingCount > 0 && (
          <Badge variant="outline" className="text-xs">
            +{remainingCount} more
          </Badge>
        )}
      </div>
    )
  }, [developer.specialization])

  const createdTime = useMemo(() => getTimeAgo(developer.createdAt), [getTimeAgo, developer.createdAt])
  const updatedTime = useMemo(() => getTimeAgo(developer.updatedAt), [getTimeAgo, developer.updatedAt])

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={developer?.logo || "/placeholder.svg"}
              alt={developer.name}
              className="w-12 h-12 object-cover rounded-lg border"
              loading="lazy"
            />
            <div>
              <CardTitle className="text-lg">{developer.name}</CardTitle>
              <div className="flex items-center space-x-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3 mr-1" />
                  {developer.location}
                </div>
                {developer.verified && (
                  <Badge variant="default" className="text-xs">
                    Verified
                  </Badge>
                )}
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
              <DropdownMenuItem onClick={handleView}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Developer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Developer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {specializationBadges}

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>Est. {developer.establishedYear}</span>
          </div>
        </div>

        <div className="space-y-2 text-xs text-muted-foreground">
          <div>Created: {createdTime}</div>
          <div>Updated: {updatedTime}</div>
        </div>
      </CardContent>
    </Card>
  )
})

// Memoized LoadingCard component
const LoadingCard = memo(function LoadingCard() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-200 rounded-lg" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="h-3 bg-gray-200 rounded w-24" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="h-6 bg-gray-200 rounded w-16" />
            <div className="h-6 bg-gray-200 rounded w-20" />
          </div>
          <div className="h-4 bg-gray-200 rounded w-24" />
        </div>
      </CardContent>
    </Card>
  )
})

// Memoized StatsCard component
const StatsCard = memo(function StatsCard({
  title,
  value,
  icon: Icon,
  color
}: {
  title: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
})

export function DevelopersPage() {
  const searchParams = useSearchParams()
  const action = searchParams.get("action")

  const [developers, setDevelopers] = useState<Developer[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationData | null>(null)

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState("desc")
  const [currentPage, setCurrentPage] = useState(1)

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedDeveloper, setSelectedDeveloper] = useState<Developer | null>(null)

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  // Memoized fetch function
  const fetchDevelopers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        search: debouncedSearchQuery,
        sortBy: sortBy,
        sortOrder: sortOrder
      })

      const res = await fetch(`/api/developers/fetch?${params}`)
      const json = await res.json()
      
      if (json.success) {
        setDevelopers(json.data)
        setPagination(json.pagination)
      } else {
        console.error("Failed to fetch developers:", json.message)
      }
    } catch (err) {
      console.error("Error fetching developers:", err)
    } finally {
      setLoading(false)
    }
  }, [currentPage, debouncedSearchQuery, sortBy, sortOrder])

  useEffect(() => {
    fetchDevelopers()
  }, [fetchDevelopers])

  // Handle modal trigger from URL
  useEffect(() => {
    if (action === "new") {
      setIsAddModalOpen(true)
    }
  }, [action])

  // Memoized event handlers
  const handleView = useCallback((developer: Developer) => {
    setSelectedDeveloper(developer)
    setIsViewModalOpen(true)
  }, [])

  const handleEdit = useCallback((developer: Developer) => {
    setSelectedDeveloper(developer)
    setIsEditModalOpen(true)
  }, [])

  const handleDelete = useCallback((developer: Developer) => {
    setSelectedDeveloper(developer)
    setIsDeleteModalOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (selectedDeveloper) {
      try {
        const response = await fetch(`/api/developers/delete/${selectedDeveloper.slug}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          await fetchDevelopers()
        }
      } catch (error) {
        console.error('Error deleting developer:', error)
      }
    }
    setIsDeleteModalOpen(false)
    setSelectedDeveloper(null)
  }, [selectedDeveloper, fetchDevelopers])

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value)
    setCurrentPage(1) // Reset to first page when searching
  }, [])

  const handleSortChange = useCallback((value: string) => {
    setSortBy(value)
    setCurrentPage(1)
  }, [])

  const handleSortOrderChange = useCallback((value: string) => {
    setSortOrder(value)
    setCurrentPage(1)
  }, [])

  // Memoized modal close handlers
  const handleAddModalClose = useCallback(() => {
    setIsAddModalOpen(false)
    fetchDevelopers() // Refresh list after add
  }, [fetchDevelopers])

  const handleEditModalClose = useCallback(() => {
    setIsEditModalOpen(false)
    setSelectedDeveloper(null)
    fetchDevelopers() // Refresh list after edit
  }, [fetchDevelopers])

  const handleViewModalClose = useCallback(() => {
    setIsViewModalOpen(false)
    setSelectedDeveloper(null)
  }, [])

  const handleDeleteModalClose = useCallback(() => {
    setIsDeleteModalOpen(false)
    setSelectedDeveloper(null)
  }, [])

  const handleOpenAddModal = useCallback(() => {
    setIsAddModalOpen(true)
  }, [])

  // Memoized stats calculation
  const developerStats = useMemo(() => [
    {
      title: "Total Developers",
      value: pagination?.totalDevelopers.toString() || "0",
      icon: Building2,
      color: "text-blue-600",
    },
    {
      title: "Verified Developers",
      value: developers.filter((d) => d.verified).length.toString(),
      icon: Users,
      color: "text-green-600",
    },
    {
      title: "Current Page",
      value: pagination?.currentPage.toString() || "1",
      icon: Building2,
      color: "text-orange-600",
    },
    {
      title: "Total Pages",
      value: pagination?.totalPages.toString() || "1",
      icon: Users,
      color: "text-yellow-600",
    },
  ], [pagination, developers])

  // Memoized pagination controls
  const paginationNumbers = useMemo(() => {
    if (!pagination) return []
    
    return Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
      let pageNumber;
      if (pagination.totalPages <= 5) {
        pageNumber = i + 1;
      } else if (pagination.currentPage <= 3) {
        pageNumber = i + 1;
      } else if (pagination.currentPage >= pagination.totalPages - 2) {
        pageNumber = pagination.totalPages - 4 + i;
      } else {
        pageNumber = pagination.currentPage - 2 + i;
      }
      return pageNumber;
    })
  }, [pagination])

  const handlePrevPage = useCallback(() => {
    setCurrentPage(currentPage - 1)
  }, [currentPage])

  const handleNextPage = useCallback(() => {
    setCurrentPage(currentPage + 1)
  }, [currentPage])

  const handlePageClick = useCallback((pageNumber: number) => {
    setCurrentPage(pageNumber)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Developers</h1>
          <p className="text-gray-600">Manage real estate developers and their profiles</p>
        </div>
        <Button onClick={handleOpenAddModal}>
          <Plus className="h-4 w-4 mr-2" />
          Add Developer
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {developerStats.map((stat) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search developers by name, location, or specialization..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Date Created</SelectItem>
            <SelectItem value="updatedAt">Date Updated</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="establishedYear">Established Year</SelectItem>
            <SelectItem value="location">Location</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortOrder} onValueChange={handleSortOrderChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Descending</SelectItem>
            <SelectItem value="asc">Ascending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Developers Grid */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, index) => (
            <LoadingCard key={index} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {developers.map((developer) => (
              <DeveloperCard
                key={developer._id}
                developer={developer}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalDevelopers)} of {pagination.totalDevelopers} developers
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={!pagination.hasPrevPage}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {paginationNumbers.map((pageNumber) => (
                    <Button
                      key={pageNumber}
                      variant={pagination.currentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageClick(pageNumber)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNumber}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!pagination.hasNextPage}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {developers.length === 0 && !loading && (
            <div className="text-center py-12">
              <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No developers found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery ? 'Try adjusting your search criteria' : 'Get started by adding your first developer'}
              </p>
              {!searchQuery && (
                <Button onClick={handleOpenAddModal}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Developer
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <DeveloperFormModal
        isOpen={isAddModalOpen}
        onClose={handleAddModalClose}
        mode="add"
      />

      <DeveloperFormModal
        isOpen={isEditModalOpen}
        onClose={handleEditModalClose}
        developer={selectedDeveloper}
        mode="edit"
      />

      <DeveloperViewModal
        isOpen={isViewModalOpen}
        onClose={handleViewModalClose}
        developer={selectedDeveloper}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteModalClose}
        onConfirm={handleConfirmDelete}
        itemName={selectedDeveloper?.name || ""}
        itemType="Developer"
      />
    </div>
  )
}