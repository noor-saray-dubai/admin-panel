//components/plot-tabs.tsx
"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  MapPin, 
  Building, 
  Factory, 
  Plus, 
  Loader2, 
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
import { DataPageLayout } from "@/components/ui/data-page-layout"
import type { StatCard, FilterConfig } from "@/components/ui/data-page-layout"

import type { IPlot, PaginationInfo, FiltersData, PlotTabsProps } from "@/types/plot"

export function PlotTabs({ initialModalOpen = false, onModalClose }: PlotTabsProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const action = searchParams.get("action")

  // URL-based state - read from URL parameters
  const activeTab = searchParams.get("tab") || "all"
  const currentPage = parseInt(searchParams.get("page") || "1")
  const searchTerm = searchParams.get("search") || ""
  const selectedLocation = searchParams.get("location") || "all"
  const selectedDeveloper = searchParams.get("developer") || "all"
  const selectedType = searchParams.get("type") || "all"
  const selectedStatus = searchParams.get("status") || "all"
  const selectedOwnership = searchParams.get("ownership") || "all"
  
  // Local state for search input (for immediate typing feedback)
  const [searchInput, setSearchInput] = useState(searchTerm)

  // Component state (non-URL)
  const [plots, setPlots] = useState<IPlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: currentPage,
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
  
  // Static tab counts (independent of filters)
  const [tabCounts, setTabCounts] = useState({
    all: 0,
    industrial: 0,
    community: 0,
    building: 0,
    available: 0
  })
  const [countsLoading, setCountsLoading] = useState(true)

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(initialModalOpen)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedPlot, setSelectedPlot] = useState<IPlot | null | undefined>(null)

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
    if (selectedLocation && selectedLocation !== "all") params.set("location", selectedLocation)
    if (selectedDeveloper && selectedDeveloper !== "all") params.set("developer", selectedDeveloper)
    if (selectedType && selectedType !== "all") params.set("type", selectedType)
    if (selectedStatus && selectedStatus !== "all") params.set("status", selectedStatus)
    if (selectedOwnership && selectedOwnership !== "all") params.set("ownership", selectedOwnership)
    
    return params.toString()
  }

  // Fetch tab counts (static, independent of filters)
  const fetchTabCounts = async () => {
    setCountsLoading(true)
    try {
      const response = await fetch('/api/plots/counts')
      
      if (!response.ok) {
        // If API doesn't exist yet, use fallback
        if (response.status === 404) {
          setTabCounts({
            all: pagination.totalPlots || 0,
            industrial: 0,
            community: 0,
            building: 0,
            available: 0
          })
          setCountsLoading(false)
          return
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setTabCounts({
          all: data.counts.total || 0,
          industrial: data.counts.industrial || 0,
          community: data.counts.community || 0,
          building: data.counts.building || 0,
          available: data.counts.available || 0
        })
      } else {
        console.warn('Failed to fetch tab counts:', data.message)
      }
    } catch (err: any) {
      console.warn('Tab counts API not available:', err.message)
      // Use current data as fallback
      setTabCounts({
        all: pagination.totalPlots || 0,
        industrial: plots.filter(p => p.type === 'industrial').length,
        community: plots.filter(p => p.type === 'community').length,
        building: plots.filter(p => p.type === 'building').length,
        available: plots.filter(p => p.isAvailable && p.isActive).length
      })
    } finally {
      setCountsLoading(false)
    }
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
    fetchPlots(currentPage, activeTab)
  }, [activeTab, currentPage, searchTerm, selectedLocation, selectedDeveloper, selectedType, selectedStatus, selectedOwnership])

  // Handle URL action parameter
  useEffect(() => {
    if (action === "new") {
      setIsAddModalOpen(true)
    }
  }, [action])

  // Handle tab change
  const handleTabChange = (tab: string) => {
    updateURL({ tab })
  }

  // Handle filter changes
  const handleSearch = () => {
    updateURL({ search: searchTerm })
  }

  const handleClearFilters = () => {
    updateURL({
      search: "",
      location: "all",
      developer: "all",
      type: "all",
      status: "all",
      ownership: "all",
      page: "1"
    })
  }

  // Individual filter handlers
  const handleLocationChange = (value: string) => {
    updateURL({ location: value })
  }

  const handleDeveloperChange = (value: string) => {
    updateURL({ developer: value })
  }

  const handleTypeChange = (value: string) => {
    updateURL({ type: value })
  }

  const handleStatusChange = (value: string) => {
    updateURL({ status: value })
  }

  const handleOwnershipChange = (value: string) => {
    updateURL({ ownership: value })
  }

  const handleSearchTermChange = (value: string) => {
    // For search input, we update URL on Enter or search button click
    // This just updates the local display value temporarily
  }

  // Pagination handlers
  const handlePageChange = (page: number) => {
    updateURL({ page })
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
    if (!selectedPlot || isDeleting) {
      return // Prevent multiple delete attempts
    }
    
    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/plots/delete/${selectedPlot.slug}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchPlots(pagination.currentPage, activeTab)
        console.log('✅ Plot deleted successfully:', selectedPlot.title)
        
        // Close the modal after successful deletion
        setIsDeleteModalOpen(false)
        setSelectedPlot(null)
      } else {
        throw new Error(`Failed to delete plot: ${response.status}`)
      }
    } catch (error: any) {
      console.error('Error deleting plot:', error)
      alert(`Failed to delete plot: ${error.message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAddModalClose = () => {
    setIsAddModalOpen(false)
    if (onModalClose) {
      onModalClose()
    }
  }

  // Get static tab counts (independent of filters)
  const getTabCount = (tab: string) => {
    if (countsLoading) return 0 // Show 0 while loading
    return tabCounts[tab as keyof typeof tabCounts] || 0
  }

  // Configure stats for DataPageLayout
  const plotStats: StatCard[] = [
    {
      title: "Total Plots",
      value: pagination.totalPlots,
      icon: Landmark,
      description: "Across all locations",
      isLoading: loading && plots.length === 0
    },
    {
      title: "Available Plots",
      value: plots.filter(p => p.isAvailable && p.isActive).length,
      icon: CheckCircle,
      description: "Ready for sale",
      isLoading: loading && plots.length === 0
    },
    {
      title: "Verified Plots",
      value: plots.filter(p => p.verified).length,
      icon: TrendingUp,
      description: "Verified properties",
      isLoading: loading && plots.length === 0
    },
    {
      title: "High ROI",
      value: plots.filter(p => p.investment.roi >= 10).length,
      icon: BarChart3,
      description: "10%+ expected return",
      isLoading: loading && plots.length === 0
    }
  ]

  // Configure filters for DataPageLayout
  const plotFilters: FilterConfig[] = [
    {
      label: "Location",
      value: selectedLocation,
      placeholder: "Location",
      options: [
        { value: "all", label: "All Locations" },
        ...filters.locations.map(location => ({ value: location, label: location }))
      ],
      onChange: handleLocationChange
    },
    {
      label: "Type", 
      value: selectedType,
      placeholder: "Type",
      options: [
        { value: "all", label: "All Types" },
        { value: "industrial", label: "Industrial" },
        { value: "community", label: "Community" },
        { value: "building", label: "Building" }
      ],
      onChange: handleTypeChange
    },
    {
      label: "Ownership",
      value: selectedOwnership,
      placeholder: "Ownership",
      options: [
        { value: "all", label: "All Ownership" },
        { value: "freehold", label: "Freehold" },
        { value: "leasehold", label: "Leasehold" }
      ],
      onChange: handleOwnershipChange
    },
    {
      label: "Status",
      value: selectedStatus,
      placeholder: "Status",
      options: [
        { value: "all", label: "All Status" },
        ...filters.statuses.map(status => ({ value: status, label: status }))
      ],
      onChange: handleStatusChange
    }
  ]

  return (
    <>
      <DataPageLayout
        title="Plots"
        subtitle="Manage real estate plots and land investments"
        primaryAction={{
          label: "Add Plot",
          onClick: () => setIsAddModalOpen(true),
          icon: Plus
        }}
        stats={plotStats}
      searchConfig={{
        placeholder: "Search plots by name, location, or plot ID...",
        value: searchInput,
        onChange: setSearchInput,
        onSearch: () => updateURL({ search: searchInput })
      }}
        filters={plotFilters}
        onClearFilters={handleClearFilters}
      >

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Landmark className="h-4 w-4" />
            <span className="hidden sm:inline">All Plots</span>
            <span className="sm:hidden">All</span>
            {getTabCount("all") > 0 && (
              <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                {getTabCount("all")}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="industrial" className="flex items-center gap-2">
            <Factory className="h-4 w-4" />
            <span className="hidden sm:inline">Industrial</span>
            <span className="sm:hidden">Ind.</span>
            {getTabCount("industrial") > 0 && (
              <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                {getTabCount("industrial")}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="community" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Community</span>
            <span className="sm:hidden">Com.</span>
            {getTabCount("community") > 0 && (
              <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                {getTabCount("community")}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="building" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span className="hidden sm:inline">Building</span>
            <span className="sm:hidden">Bld.</span>
            {getTabCount("building") > 0 && (
              <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                {getTabCount("building")}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="available" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Available</span>
            <span className="sm:hidden">Avail.</span>
            {getTabCount("available") > 0 && (
              <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                {getTabCount("available")}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

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
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {plots.map((plot) => (
                  <PlotCard
                    key={plot._id}
                    plot={plot}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isDeleting={isDeleting && selectedPlot?._id === plot._id}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPlots > pagination.limit && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{" "}
                    {Math.min(pagination.currentPage * pagination.limit, pagination.totalPlots)} of{" "}
                    {pagination.totalPlots} plots
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
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {plots.filter(p => p.type === "industrial").map((plot) => (
                  <PlotCard
                    key={plot._id}
                    plot={plot}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isDeleting={isDeleting && selectedPlot?._id === plot._id}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPlots > pagination.limit && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {plots.filter(p => p.type === "industrial").length} industrial plots
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
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {plots.filter(p => p.type === "community").map((plot) => (
                  <PlotCard
                    key={plot._id}
                    plot={plot}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isDeleting={isDeleting && selectedPlot?._id === plot._id}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPlots > pagination.limit && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {plots.filter(p => p.type === "community").length} community plots
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
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {plots.filter(p => p.type === "building").map((plot) => (
                  <PlotCard
                    key={plot._id}
                    plot={plot}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isDeleting={isDeleting && selectedPlot?._id === plot._id}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPlots > pagination.limit && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {plots.filter(p => p.type === "building").length} building plots
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
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {plots.filter(p => p.isAvailable && p.isActive).map((plot) => (
                  <PlotCard
                    key={plot._id}
                    plot={plot}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isDeleting={isDeleting && selectedPlot?._id === plot._id}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPlots > pagination.limit && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {plots.filter(p => p.isAvailable && p.isActive).length} available plots
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
      </Tabs>
      </DataPageLayout>

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
          if (isDeleting) return // Don't close if deletion is in progress
          setIsDeleteModalOpen(false)
          setIsDeleting(false)
          setSelectedPlot(null)
        }}
        onConfirm={handleConfirmDelete}
        itemName={selectedPlot?.title || ""}
        itemType="Plot"
        isDeleting={isDeleting}
      />
    </>
  )
}