// components/mall-tabs.tsx
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
  ShoppingCart,
  Plus, 
  Loader2, 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Store,
  TrendingUp,
  BarChart3,
  CheckCircle,
  Edit2,
  Eye
} from "lucide-react"

import type { IMall } from "@/types/mall"
import { MallFormModal } from "@/components/mall-form-modal"

// Basic interfaces for now - we'll expand these later
interface MallPaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface MallFiltersData {
  locations: string[];
  statuses: string[];
  saleStatuses: string[];
  ownershipTypes: string[];
}

export function MallTabs() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const action = searchParams.get("action")

  const [activeTab, setActiveTab] = useState("all")
  const [malls, setMalls] = useState<IMall[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<MallPaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
    hasNextPage: false,
    hasPrevPage: false,
  })
  const [filters, setFilters] = useState<MallFiltersData>({
    locations: [],
    statuses: [],
    saleStatuses: [],
    ownershipTypes: [],
  })

  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedSaleStatus, setSelectedSaleStatus] = useState("all")
  const [selectedOwnership, setSelectedOwnership] = useState("all")

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedMall, setSelectedMall] = useState<IMall | null>(null)

  // Build query parameters
  const buildQueryParams = (page: number = pagination.currentPage, tab: string = activeTab) => {
    const params = new URLSearchParams()
    params.set("page", page.toString())
    params.set("limit", "20")
    params.set("tab", tab)
    
    if (searchTerm) params.set("search", searchTerm)
    if (selectedLocation && selectedLocation !== "all") params.set("location", selectedLocation)
    if (selectedStatus && selectedStatus !== "all") params.set("status", selectedStatus)
    if (selectedSaleStatus && selectedSaleStatus !== "all") params.set("saleStatus", selectedSaleStatus)
    if (selectedOwnership && selectedOwnership !== "all") params.set("ownership", selectedOwnership)
    
    return params.toString()
  }

  // Fetch malls with filters and pagination
  const fetchMalls = async (page: number = 1, tab: string = activeTab) => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = buildQueryParams(page, tab)
      const response = await fetch(`/api/malls/fetch?${queryParams}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setMalls([])
          setPagination({
            currentPage: 1,
            totalPages: 1,
            totalCount: 0,
            limit: 20,
            hasNextPage: false,
            hasPrevPage: false,
          })
          setError('API endpoint not implemented yet')
          return
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setMalls(result.data.malls || [])
        setPagination(result.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalCount: 0,
          limit: 20,
          hasNextPage: false,
          hasPrevPage: false,
        })
        // Set filters from response if available
        if (result.data.filters) {
          // We'll implement this when we have more complete filter data
        }
      } else {
        setMalls([])
        setError(result.message || 'No malls found')
      }
    } catch (err: any) {
      console.warn('Malls API not available:', err.message)
      setMalls([])
      setError(`Unable to fetch malls: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchMalls()
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
    fetchMalls(1, tab) // Reset to page 1 when changing tabs
  }

  // Handle filter changes
  const handleSearch = () => {
    fetchMalls(1, activeTab) // Reset to page 1 when searching
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setSelectedLocation("all")
    setSelectedStatus("all")
    setSelectedSaleStatus("all")
    setSelectedOwnership("all")
    fetchMalls(1, activeTab)
  }

  // Pagination handlers
  const handlePageChange = (page: number) => {
    fetchMalls(page, activeTab)
  }

  const handleAddMall = () => {
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
    setIsEditModalOpen(false)
    setSelectedMall(null)
  }

  const handleEditMall = (mall: IMall) => {
    setSelectedMall(mall)
    setIsEditModalOpen(true)
  }

  const handleMallSuccess = (mall: IMall) => {
    // Refresh the malls list to show updated data
    fetchMalls(pagination.currentPage, activeTab)
  }

  // Tab data configuration
  const tabs = [
    { id: "all", label: "All Malls", icon: Building, count: pagination.totalCount },
    { id: "available", label: "Available", icon: Store, count: 0 },
    { id: "operational", label: "Operational", icon: ShoppingCart, count: 0 },
    { id: "sold", label: "Sold", icon: CheckCircle, count: 0 },
    { id: "verified", label: "Verified", icon: CheckCircle, count: 0 },
    { id: "draft", label: "Draft", icon: Filter, count: 0 }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Malls</h1>
          <p className="text-muted-foreground mt-2">
            Manage shopping malls and commercial properties
          </p>
        </div>
        <Button onClick={handleAddMall} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Add Mall
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Malls</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.totalCount}</div>
            <p className="text-xs text-muted-foreground">
              Across all locations
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              For sale or investment
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operational</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Currently operating
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AED 0</div>
            <p className="text-xs text-muted-foreground">
              Total estimated value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search malls by name, location, or mall ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Filter Selects */}
            <div className="flex gap-2">
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {/* We'll populate these from API data later */}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Operational">Operational</SelectItem>
                  <SelectItem value="Under Construction">Under Construction</SelectItem>
                  <SelectItem value="Planned">Planned</SelectItem>
                  <SelectItem value="For Sale">For Sale</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedOwnership} onValueChange={setSelectedOwnership}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Ownership" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="freehold">Freehold</SelectItem>
                  <SelectItem value="leasehold">Leasehold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button variant="outline" onClick={handleClearFilters}>
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
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
                <span className="ml-2">Loading malls...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{error}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => fetchMalls()}
                >
                  Try Again
                </Button>
              </div>
            ) : malls.length === 0 ? (
              <div className="text-center py-12">
                <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No malls found</h3>
                <p className="text-muted-foreground mb-4">
                  {tab.id === "all" 
                    ? "Start by adding your first mall to the system."
                    : `No malls match the ${tab.label.toLowerCase()} criteria.`
                  }
                </p>
                {tab.id === "all" && (
                  <Button onClick={handleAddMall}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Mall
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Mall Grid - We'll implement MallCard component later */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {malls.map((mall) => (
                    <Card key={mall.mallId} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{mall.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{mall.subtitle}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditMall(mall)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 mr-1" />
                            {mall.location}, {mall.subLocation}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-lg text-green-600">
                              {mall.price.total}
                            </span>
                            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {mall.status}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {mall.size.totalArea.toLocaleString()} sqft • {mall.size.floors} floors
                          </div>
                          {mall.rentalDetails?.totalStores > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {mall.rentalDetails.totalStores} stores • {mall.rentalDetails.currentOccupancy}% occupied
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{" "}
                      {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{" "}
                      {pagination.totalCount} malls
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

      {/* Add Mall Modal */}
      <MallFormModal 
        isOpen={isAddModalOpen} 
        onClose={closeModal} 
        mode="add"
        onSuccess={handleMallSuccess}
      />

      {/* Edit Mall Modal */}
      <MallFormModal 
        isOpen={isEditModalOpen} 
        onClose={closeEditModal} 
        mode="edit"
        mall={selectedMall}
        onSuccess={handleMallSuccess}
      />
    </div>
  )
}