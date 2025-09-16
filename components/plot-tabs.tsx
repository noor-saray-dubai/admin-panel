//components/plot-tabs.tsx
"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  MapPin, 
  Building, 
  Factory, 
  Plus, 
  Loader2, 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Landmark,
  TrendingUp,
  BarChart3,
  CheckCircle
} from "lucide-react"
import { PlotCard } from "./plot-card"
import { PlotFormModal } from "./plot-form-modal"
import { PlotViewModal } from "./plot-view-modal"
import { DeleteConfirmationModal } from "./delete-confirmation-modal"

import type { IPlot, PaginationInfo, FiltersData, PlotTabsProps } from "@/types/plot"

export function PlotTabs({ initialModalOpen = false, onModalClose }: PlotTabsProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const action = searchParams.get("action")

  const [activeTab, setActiveTab] = useState("all")
  const [plots, setPlots] = useState<IPlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalPlots: 0,
    limit: 20,
    hasNextPage: false,
    hasPrevPage: false,
  })
  const [filters, setFilters] = useState<FiltersData>({
    locations: [],
    developers: [],
    types: [],
    statuses: [],
    subtypes: [],
    ownershipTypes: [],
  })

  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("all")
  const [selectedDeveloper, setSelectedDeveloper] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedOwnership, setSelectedOwnership] = useState("all")

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(initialModalOpen)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedPlot, setSelectedPlot] = useState<IPlot | null | undefined>(null)

  // Build query parameters
  const buildQueryParams = (page: number = pagination.currentPage, tab: string = activeTab) => {
    const params = new URLSearchParams()
    params.set("page", page.toString())
    params.set("limit", "20")
    params.set("tab", tab)
    
    if (searchTerm) params.set("search", searchTerm)
    if (selectedLocation && selectedLocation !== "all") params.set("location", selectedLocation)
    if (selectedDeveloper && selectedDeveloper !== "all") params.set("developer", selectedDeveloper)
    if (selectedType && selectedType !== "all") params.set("type", selectedType)
    if (selectedStatus && selectedStatus !== "all") params.set("status", selectedStatus)
    if (selectedOwnership && selectedOwnership !== "all") params.set("ownership", selectedOwnership)
    
    return params.toString()
  }

  // Fetch plots with filters and pagination
  const fetchPlots = async (page: number = 1, tab: string = activeTab) => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = buildQueryParams(page, tab)
      const response = await fetch(`/api/plots/fetch?${queryParams}`)
      
      // Check if the response is ok
      if (!response.ok) {
        if (response.status === 404) {
          // API endpoint doesn't exist yet
          setPlots([])
          setPagination({
            currentPage: 1,
            totalPages: 1,
            totalPlots: 0,
            limit: 20,
            hasNextPage: false,
            hasPrevPage: false,
          })
          setError('API endpoint not implemented yet')
          return
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setPlots(data.plots || [])
        setPagination(data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalPlots: 0,
          limit: 20,
          hasNextPage: false,
          hasPrevPage: false,
        })
        if (data.filters) {
          setFilters(data.filters)
        }
      } else {
        setPlots([])
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalPlots: 0,
          limit: 20,
          hasNextPage: false,
          hasPrevPage: false,
        })
        setError(data.message || 'No plots found')
      }
    } catch (err: any) {
      console.warn('Plots API not available:', err.message)
      // Set empty state instead of throwing error
      setPlots([])
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalPlots: 0,
        limit: 20,
        hasNextPage: false,
        hasPrevPage: false,
      })
      setError(`Unable to fetch plots: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchPlots()
  }, [])

  // Handle URL action parameter
  useEffect(() => {
    if (action === "new") {
      setIsAddModalOpen(true)
    }
  }, [action])

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    fetchPlots(1, tab) // Reset to page 1 when changing tabs
  }

  // Handle filter changes
  const handleSearch = () => {
    fetchPlots(1, activeTab) // Reset to page 1 when searching
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setSelectedLocation("all")
    setSelectedDeveloper("all")
    setSelectedType("all")
    setSelectedStatus("all")
    setSelectedOwnership("all")
    fetchPlots(1, activeTab)
  }

  // Pagination handlers
  const handlePageChange = (page: number) => {
    fetchPlots(page, activeTab)
  }

  // Modal handlers
  const handleView = (plot: IPlot) => {
    setSelectedPlot(plot)
    setIsViewModalOpen(true)
  }

  const handleEdit = (plot: IPlot) => {
    setSelectedPlot(plot)
    setIsEditModalOpen(true)
  }

  const handleDelete = (plot: IPlot) => {
    setSelectedPlot(plot)
    setIsDeleteModalOpen(true)
  }

  const handleSavePlot = async (plotData: any) => {
    fetchPlots(pagination.currentPage, activeTab) // Refresh current page
  }

  const handleConfirmDelete = async () => {
    if (selectedPlot) {
      try {
        const response = await fetch(`/api/plots/delete/${selectedPlot.slug}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          fetchPlots(pagination.currentPage, activeTab)
        }
      } catch (error) {
        console.error('Error deleting plot:', error)
      }
    }
    setIsDeleteModalOpen(false)
    setSelectedPlot(null)
  }

  const handleAddModalClose = () => {
    setIsAddModalOpen(false)
    if (onModalClose) {
      onModalClose()
    }
  }

  // Calculate stats for current filtered results
  const getTabCount = (tab: string) => {
    if (tab === "all") return pagination.totalPlots
    if (tab === "industrial") return plots.filter((p) => p.type === "industrial").length
    if (tab === "community") return plots.filter((p) => p.type === "community").length
    if (tab === "building") return plots.filter((p) => p.type === "building").length
    if (tab === "available") return plots.filter((p) => p.isAvailable && p.isActive).length
    return 0
  }

  // Calculate stats
  const plotStats = [
    {
      title: "Total Plots",
      value: pagination.totalPlots.toString(),
      icon: Landmark,
      color: "text-blue-600",
    },
    {
      title: "Available Plots",
      value: plots.filter(p => p.isAvailable && p.isActive).length.toString(),
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Verified Plots",
      value: plots.filter(p => p.verified).length.toString(),
      icon: TrendingUp,
      color: "text-purple-600",
    },
    {
      title: "High ROI",
      value: plots.filter(p => p.investment.roi >= 10).length.toString(),
      icon: BarChart3,
      color: "text-orange-600",
    },
  ]

  // Remove the blocking loading and error states - we'll handle them in the content area

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Plots</h1>
          <p className="text-gray-600">Manage real estate plots and land investments</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Plot
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {plotStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading && plots.length === 0 ? (
                  <div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
                ) : (
                  stat.value
                )}
              </div>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search plots..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
            </div>
            
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {filters.locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="industrial">Industrial</SelectItem>
                <SelectItem value="community">Community</SelectItem>
                <SelectItem value="building">Building</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedOwnership} onValueChange={setSelectedOwnership}>
              <SelectTrigger>
                <SelectValue placeholder="Ownership" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ownership</SelectItem>
                <SelectItem value="freehold">Freehold</SelectItem>
                <SelectItem value="leasehold">Leasehold</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {filters.statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
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

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-fit grid-cols-5">
            <TabsTrigger value="all" className="flex items-center space-x-2">
              <Landmark className="h-4 w-4" />
              <span>All Plots ({getTabCount("all")})</span>
            </TabsTrigger>
            <TabsTrigger value="industrial" className="flex items-center space-x-2">
              <Factory className="h-4 w-4" />
              <span>Industrial ({getTabCount("industrial")})</span>
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>Community ({getTabCount("community")})</span>
            </TabsTrigger>
            <TabsTrigger value="building" className="flex items-center space-x-2">
              <Building className="h-4 w-4" />
              <span>Building ({getTabCount("building")})</span>
            </TabsTrigger>
            <TabsTrigger value="available" className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>Available ({getTabCount("available")})</span>
            </TabsTrigger>
          </TabsList>

          {/* Results Summary */}
          <div className="text-sm text-muted-foreground">
            Showing {plots.length} of {pagination.totalPlots} plots
            {searchTerm && ` for "${searchTerm}"`}
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          {loading && plots.length === 0 ? (
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
          ) : plots.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Landmark className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No plots found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {error ? (
                    <span className="text-red-500">{error}</span>
                  ) : searchTerm || selectedLocation !== "all" || selectedType !== "all" || selectedStatus !== "all" ? (
                    "Try adjusting your search or filters"
                  ) : (
                    "Get started by creating your first plot"
                  )}
                </p>
                {error && (
                  <Button onClick={() => fetchPlots(1, activeTab)} variant="outline" className="mb-2">
                    <Loader2 className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Try Again
                  </Button>
                )}
                <Button onClick={() => setIsAddModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Plot
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plots.map((plot) => (
                <PlotCard
                  key={plot._id}
                  plot={plot}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="industrial" className="space-y-4">
          {loading && plots.length === 0 ? (
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
          ) : plots.filter(p => p.type === "industrial").length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Factory className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No industrial plots found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {error ? (
                    <span className="text-red-500">{error}</span>
                  ) : (
                    "Try adjusting your filters or create a new industrial plot"
                  )}
                </p>
                {error && (
                  <Button onClick={() => fetchPlots(1, activeTab)} variant="outline" className="mb-2">
                    <Loader2 className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Try Again
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plots.filter(p => p.type === "industrial").map((plot) => (
                <PlotCard
                  key={plot._id}
                  plot={plot}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="community" className="space-y-4">
          {loading && plots.length === 0 ? (
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
          ) : plots.filter(p => p.type === "community").length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No community plots found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {error ? (
                    <span className="text-red-500">{error}</span>
                  ) : (
                    "Try adjusting your filters or create a new community plot"
                  )}
                </p>
                {error && (
                  <Button onClick={() => fetchPlots(1, activeTab)} variant="outline" className="mb-2">
                    <Loader2 className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Try Again
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plots.filter(p => p.type === "community").map((plot) => (
                <PlotCard
                  key={plot._id}
                  plot={plot}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="building" className="space-y-4">
          {loading && plots.length === 0 ? (
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
          ) : plots.filter(p => p.type === "building").length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No building plots found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {error ? (
                    <span className="text-red-500">{error}</span>
                  ) : (
                    "Try adjusting your filters or create a new building plot"
                  )}
                </p>
                {error && (
                  <Button onClick={() => fetchPlots(1, activeTab)} variant="outline" className="mb-2">
                    <Loader2 className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Try Again
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plots.filter(p => p.type === "building").map((plot) => (
                <PlotCard
                  key={plot._id}
                  plot={plot}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          {loading && plots.length === 0 ? (
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
          ) : plots.filter(p => p.isAvailable && p.isActive).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No available plots found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {error ? (
                    <span className="text-red-500">{error}</span>
                  ) : (
                    "Try adjusting your filters or create a new available plot"
                  )}
                </p>
                {error && (
                  <Button onClick={() => fetchPlots(1, activeTab)} variant="outline" className="mb-2">
                    <Loader2 className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Try Again
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plots.filter(p => p.isAvailable && p.isActive).map((plot) => (
                <PlotCard
                  key={plot._id}
                  plot={plot}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Pagination - Only show if more than 20 plots */}
      {pagination.totalPlots > 20 && (
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

      {/* Page Info - Only show if pagination is displayed */}
      {pagination.totalPlots > 20 && (
        <div className="text-center text-sm text-muted-foreground">
          Page {pagination.currentPage} of {pagination.totalPages} 
          ({pagination.totalPlots} total plots)
        </div>
      )}

      {/* Modals */}
      <PlotFormModal
        isOpen={isAddModalOpen}
        onClose={handleAddModalClose}
        // onSave={handleSavePlot}
        mode="add"
      />

      <PlotFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedPlot(null)
        }}
        // onSave={handleSavePlot}
        plot={selectedPlot}
        mode="edit"
      />

      <PlotViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedPlot(null)
        }}
        plot={selectedPlot}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedPlot(null)
        }}
        onConfirm={handleConfirmDelete}
        itemName={selectedPlot?.title || ""}
        itemType="Plot"
      />
    </div>
  )
}