// components/building-tabs.tsx
"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Building2, 
  Home, 
  Briefcase,
  Plus, 
  Loader2, 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  TrendingUp,
  BarChart3,
  CheckCircle,
  Edit2,
  Layers
} from "lucide-react"

import type { IBuilding, BuildingFormData } from "@/types/buildings"
import { BuildingFormModal } from "@/components/building-form-modal"
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal"
import { BuildingCard } from "@/components/building-card"
import { BuildingViewModal } from "@/components/building-view-modal"
import { DataPageLayout } from "@/components/ui/data-page-layout"
import type { StatCard, FilterConfig } from "@/components/ui/data-page-layout"

// Basic interfaces for now - we'll expand these later
interface BuildingPaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface BuildingFiltersData {
  locations: string[];
  categories: string[];
  statuses: string[];
  ownershipTypes: string[];
  saleStatuses: string[];
}

export function BuildingTabs() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const action = searchParams.get("action")

  // URL-based state - read from URL parameters
  const activeTab = searchParams.get("tab") || "all"
  const currentPage = parseInt(searchParams.get("page") || "1")
  const searchTerm = searchParams.get("search") || ""
  const selectedLocation = searchParams.get("location") || "all"
  const selectedCategory = searchParams.get("category") || "all"
  const selectedStatus = searchParams.get("status") || "all"
  const selectedOwnership = searchParams.get("ownership") || "all"
  const selectedSaleStatus = searchParams.get("saleStatus") || "all"
  
  // Local state for search input (for immediate typing feedback)
  const [searchInput, setSearchInput] = useState(searchTerm)
  
  // Component state (non-URL)
  const [buildings, setBuildings] = useState<IBuilding[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<BuildingPaginationInfo>({
    currentPage: currentPage,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
    hasNextPage: false,
    hasPrevPage: false,
  })
  const [filters, setFilters] = useState<BuildingFiltersData>({
    locations: [],
    categories: [],
    statuses: [],
    ownershipTypes: [],
    saleStatuses: [],
  })
  
  // Static tab counts (independent of filters)
  const [tabCounts, setTabCounts] = useState({
    all: 0,
    residential: 0,
    commercial: 0,
    mixed: 0,
    forSale: 0,
    verified: 0
  })
  const [countsLoading, setCountsLoading] = useState(true)

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedBuilding, setSelectedBuilding] = useState<IBuilding | null>(null)

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
    if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory)
    if (selectedStatus && selectedStatus !== "all") params.set("status", selectedStatus)
    if (selectedOwnership && selectedOwnership !== "all") params.set("ownership", selectedOwnership)
    if (selectedSaleStatus && selectedSaleStatus !== "all") params.set("saleStatus", selectedSaleStatus)
    
    return params.toString()
  }

  // Fetch tab counts (static, independent of filters)
  const fetchTabCounts = async () => {
    setCountsLoading(true)
    try {
      const response = await fetch('/api/buildings/counts')
      
      if (!response.ok) {
        // If API doesn't exist yet, use fallback
        if (response.status === 404) {
          setTabCounts({
            all: pagination.totalCount || 0,
            residential: 0,
            commercial: 0,
            mixed: 0,
            forSale: 0,
            verified: 0
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
          residential: data.counts.residential || 0,
          commercial: data.counts.commercial || 0,
          mixed: data.counts.mixed || 0,
          forSale: data.counts.forSale || 0,
          verified: data.counts.verified || 0
        })
      } else {
        console.warn('Failed to fetch tab counts:', data.message)
      }
    } catch (err: any) {
      console.warn('Tab counts API not available:', err.message)
      // Use current data as fallback
      setTabCounts({
        all: pagination.totalCount || 0,
        residential: 0,
        commercial: 0,
        mixed: 0,
        forSale: 0,
        verified: 0
      })
    } finally {
      setCountsLoading(false)
    }
  }

  // Fetch buildings with filters and pagination
  const fetchBuildings = async (page: number = 1, tab: string = activeTab) => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = buildQueryParams(page, tab)
      const response = await fetch(`/api/buildings/fetch?${queryParams}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setBuildings([])
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
        setBuildings(result.data.buildings || [])
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
        setBuildings([])
        setError(result.message || 'No buildings found')
      }
    } catch (err: any) {
      console.warn('Buildings API not available:', err.message)
      setBuildings([])
      setError(`Unable to fetch buildings: ${err.message}`)
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
    fetchBuildings(currentPage, activeTab)
  }, [activeTab, currentPage, searchTerm, selectedLocation, selectedCategory, selectedStatus, selectedOwnership, selectedSaleStatus])

  // Handle URL action parameter
  useEffect(() => {
    if (action === "new") {
      setIsAddModalOpen(true)
    } else if (action === "edit") {
      // Check if there's a building slug in the URL to edit
      const buildingSlug = searchParams.get("slug")
      if (buildingSlug && buildings.length > 0) {
        const buildingToEdit = buildings.find(b => b.slug === buildingSlug)
        if (buildingToEdit) {
          setSelectedBuilding(buildingToEdit)
          setIsEditModalOpen(true)
        }
      }
    }
  }, [action, searchParams, buildings])

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
      location: "all",
      category: "all",
      status: "all",
      ownership: "all",
      saleStatus: "all",
      page: "1"
    })
  }

  // Individual filter handlers
  const handleLocationChange = (value: string) => {
    updateURL({ location: value })
  }

  const handleCategoryChange = (value: string) => {
    updateURL({ category: value })
  }

  const handleStatusChange = (value: string) => {
    updateURL({ status: value })
  }

  const handleOwnershipChange = (value: string) => {
    updateURL({ ownership: value })
  }

  const handleSaleStatusChange = (value: string) => {
    updateURL({ saleStatus: value })
  }

  // Pagination handlers
  const handlePageChange = (page: number) => {
    updateURL({ page })
  }

  const handleAddBuilding = () => {
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
    setSelectedBuilding(null)
  }

  const closeViewModal = () => {
    setIsViewModalOpen(false)
    setSelectedBuilding(null)
  }

  const closeDeleteModal = () => {
    if (isDeleting) return // Don't close if deletion is in progress
    setIsDeleteModalOpen(false)
    setIsDeleting(false)
    setSelectedBuilding(null)
  }

  const handleViewBuilding = (building: IBuilding) => {
    setSelectedBuilding(building)
    setIsViewModalOpen(true)
  }

  const handleEditBuilding = (building: IBuilding) => {
    setSelectedBuilding(building)
    setIsEditModalOpen(true)
  }

  const handleDeleteBuilding = (building: IBuilding) => {
    setSelectedBuilding(building)
    setIsDeleteModalOpen(true)
  }

  // API functions for building operations
  const createBuilding = async (buildingData: BuildingFormData): Promise<IBuilding> => {
    const response = await fetch('/api/buildings/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildingData)
    })

    const result = await response.json()
    
    if (!response.ok) {
      // Create detailed error message based on error type
      let errorMessage = result.message || `Failed to create building: ${response.status}`
      
      // Handle specific error types with detailed messages
      if (result.error === 'VALIDATION_ERROR' && result.errors) {
        if (typeof result.errors === 'object' && !Array.isArray(result.errors)) {
          const fieldErrors = Object.entries(result.errors)
            .map(([field, error]) => `${field}: ${error}`)
            .join(', ')
          errorMessage = `Validation Error: ${fieldErrors}`
        } else {
          errorMessage = `Validation Error: ${Array.isArray(result.errors) ? result.errors.join(', ') : result.errors}`
        }
      } else if (result.error === 'DB_VALIDATION_ERROR' && result.errors) {
        const dbErrors = Array.isArray(result.errors) 
          ? result.errors.join(', ') 
          : result.errors
        errorMessage = `Database Validation Error: ${dbErrors}`
      } else if (result.error === 'DUPLICATE_ENTRY') {
        errorMessage = result.message || 'A building with this name already exists'
      } else if (result.error === 'RATE_LIMITED') {
        errorMessage = 'Too many requests. Please try again later.'
      } else if (result.error === 'EMPTY_DATA') {
        errorMessage = 'No building data provided. Please fill out the form.'
      }
      
      const error = new Error(errorMessage)
      // Attach additional error details for form handling
      if (result.errors) {
        (error as any).fieldErrors = result.errors
      }
      (error as any).errorType = result.error
      throw error
    }
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to create building')
    }
    
    return result.building
  }

  const updateBuilding = async (slug: string, buildingData: Partial<BuildingFormData>): Promise<IBuilding> => {
    const response = await fetch(`/api/buildings/update/${slug}`, {
      method: 'PUT', 
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildingData)
    })

    const result = await response.json()
    
    if (!response.ok) {
      // Create detailed error message based on error type
      let errorMessage = result.message || `Failed to update building: ${response.status}`
      
      // Handle specific error types with detailed messages
      if (result.error === 'VALIDATION_ERROR' && result.errors) {
        if (typeof result.errors === 'object' && !Array.isArray(result.errors)) {
          const fieldErrors = Object.entries(result.errors)
            .map(([field, error]) => `${field}: ${error}`)
            .join(', ')
          errorMessage = `Validation Error: ${fieldErrors}`
        } else {
          errorMessage = `Validation Error: ${Array.isArray(result.errors) ? result.errors.join(', ') : result.errors}`
        }
      } else if (result.error === 'DB_VALIDATION_ERROR' && result.errors) {
        const dbErrors = Array.isArray(result.errors) 
          ? result.errors.join(', ') 
          : result.errors
        errorMessage = `Database Validation Error: ${dbErrors}`
      } else if (result.error === 'DUPLICATE_ENTRY') {
        errorMessage = result.message || 'A building with this name already exists'
      } else if (result.error === 'NOT_FOUND') {
        errorMessage = 'Building not found or has been deleted'
      } else if (result.error === 'RATE_LIMITED') {
        errorMessage = 'Too many requests. Please try again later.'
      }
      
      const error = new Error(errorMessage)
      // Attach additional error details for form handling
      if (result.errors) {
        (error as any).fieldErrors = result.errors
      }
      (error as any).errorType = result.error
      throw error
    }
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to update building')
    }
    
    return result.building
  }

  const deleteBuilding = async (slug: string): Promise<void> => {
    const response = await fetch(`/api/buildings/delete/${slug}`, {
      method: 'DELETE',
    })

    const result = await response.json()
    
    if (!response.ok) {
      let errorMessage = result.message || `Failed to delete building: ${response.status}`
      
      if (result.error === 'NOT_FOUND') {
        errorMessage = 'Building not found or has already been deleted'
      } else if (result.error === 'DATABASE_CONNECTION_ERROR') {
        errorMessage = 'Database connection failed. Please try again.'
      }
      
      const error = new Error(errorMessage)
      ;(error as any).errorType = result.error
      throw error
    }
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to delete building')
    }
  }

  // Handle add modal success
  const handleAddBuildingSuccess = async (buildingData: BuildingFormData): Promise<void> => {
    try {
      const newBuilding = await createBuilding(buildingData)
      // Refresh the buildings list to show new data
      await fetchBuildings(pagination.currentPage, activeTab)
      // Show success message
      console.log('✅ Building created successfully:', newBuilding.name)
      // Close the modal
      closeModal()
    } catch (error: any) {
      console.error('Error creating building:', error)
      throw error // Re-throw so the form can handle it
    }
  }

  // Handle edit modal success  
  const handleEditBuildingSuccess = async (buildingData: BuildingFormData): Promise<void> => {
    if (!selectedBuilding) {
      throw new Error('No building selected for editing')
    }
    
    try {
      const updatedBuilding = await updateBuilding(selectedBuilding.slug, buildingData)
      // Refresh the buildings list to show updated data
      await fetchBuildings(pagination.currentPage, activeTab)
      // Show success message
      console.log('✅ Building updated successfully:', updatedBuilding.name)
      // Close the modal
      closeEditModal()
    } catch (error: any) {
      console.error('Error updating building:', error)
      throw error // Re-throw so the form can handle it
    }
  }

  // Handle confirm delete
  const handleConfirmDelete = async (): Promise<void> => {
    if (!selectedBuilding || isDeleting) {
      return // Prevent multiple delete attempts
    }
    
    setIsDeleting(true)
    
    try {
      await deleteBuilding(selectedBuilding.slug)
      // Refresh the buildings list to show updated data
      await fetchBuildings(pagination.currentPage, activeTab)
      // Show success message
      console.log('✅ Building deleted successfully:', selectedBuilding.name)
      
      // Close the modal after successful deletion
      setIsDeleteModalOpen(false)
      setSelectedBuilding(null)
    } catch (error: any) {
      console.error('Error deleting building:', error)
      // You can add toast notification here if you have a toast system
      alert(`Failed to delete building: ${error.message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  // Tab data configuration with static counts
  const tabs = [
    { id: "all", label: "All Buildings", icon: Building2, count: countsLoading ? 0 : tabCounts.all },
    { id: "residential", label: "Residential", icon: Home, count: countsLoading ? 0 : tabCounts.residential },
    { id: "commercial", label: "Commercial", icon: Briefcase, count: countsLoading ? 0 : tabCounts.commercial },
    { id: "mixed", label: "Mixed Use", icon: Layers, count: countsLoading ? 0 : tabCounts.mixed },
    { id: "forSale", label: "For Sale", icon: ShoppingBag, count: countsLoading ? 0 : tabCounts.forSale },
    { id: "verified", label: "Verified", icon: CheckCircle, count: countsLoading ? 0 : tabCounts.verified }
  ]

  // Configure stats for DataPageLayout
  const buildingStats: StatCard[] = [
    {
      title: "Total Buildings",
      value: pagination.totalCount,
      icon: Building2,
      description: "Across all categories",
      isLoading: loading && buildings.length === 0
    },
    {
      title: "Residential",
      value: tabCounts.residential,
      icon: Home,
      description: "Residential properties",
      isLoading: countsLoading
    },
    {
      title: "Commercial",
      value: tabCounts.commercial,
      icon: Briefcase,
      description: "Commercial properties",
      isLoading: countsLoading
    },
    {
      title: "Portfolio Value",
      value: "AED 0",
      icon: TrendingUp,
      description: "Total estimated value",
      isLoading: loading && buildings.length === 0
    }
  ]

  // Configure filters for DataPageLayout
  const buildingFilters: FilterConfig[] = [
    {
      label: "Location",
      value: selectedLocation,
      placeholder: "Location",
      options: [
        { value: "all", label: "All Locations" }
        // We'll populate these from API data later
      ],
      onChange: handleLocationChange
    },
    {
      label: "Category",
      value: selectedCategory,
      placeholder: "Category",
      options: [
        { value: "all", label: "All Categories" },
        { value: "residential", label: "Residential" },
        { value: "commercial", label: "Commercial" },
        { value: "mixed", label: "Mixed Use" }
      ],
      onChange: handleCategoryChange
    },
    {
      label: "Status",
      value: selectedStatus,
      placeholder: "Status",
      options: [
        { value: "all", label: "All Statuses" },
        { value: "Completed", label: "Completed" },
        { value: "Under Construction", label: "Under Construction" },
        { value: "Planned", label: "Planned" },
        { value: "Renovation", label: "Renovation" },
        { value: "Iconic", label: "Iconic" },
        { value: "Premium", label: "Premium" },
        { value: "Exclusive", label: "Exclusive" }
      ],
      onChange: handleStatusChange
    },
    {
      label: "Ownership",
      value: selectedOwnership,
      placeholder: "Ownership",
      options: [
        { value: "all", label: "All Types" },
        { value: "freehold", label: "Freehold" },
        { value: "leasehold", label: "Leasehold" }
      ],
      onChange: handleOwnershipChange
    }
  ]

  return (
    <>
      <DataPageLayout
        title="Buildings"
        subtitle="Manage residential, commercial, and mixed-use properties"
        primaryAction={{
          label: "Add Building",
          onClick: handleAddBuilding,
          icon: Plus
        }}
        stats={buildingStats}
        searchConfig={{
          placeholder: "Search buildings by name, location, or building ID...",
          value: searchInput,
          onChange: setSearchInput,
          onSearch: handleSearch
        }}
        filters={buildingFilters}
        onClearFilters={handleClearFilters}
      >

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
                <span className="ml-2">Loading buildings...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{error}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => fetchBuildings()}
                >
                  Try Again
                </Button>
              </div>
            ) : buildings.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No buildings found</h3>
                <p className="text-muted-foreground mb-4">
                  {tab.id === "all" 
                    ? "Start by adding your first building to the system."
                    : `No buildings match the ${tab.label.toLowerCase()} criteria.`
                  }
                </p>
                {tab.id === "all" && (
                  <Button onClick={handleAddBuilding}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Building
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Building Grid using BuildingCard component */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {buildings.map((building) => (
                    <BuildingCard
                      key={building.buildingId}
                      building={building}
                      onView={handleViewBuilding}
                      onEdit={handleEditBuilding}
                      onDelete={handleDeleteBuilding}
                      isDeleting={isDeleting && selectedBuilding?.buildingId === building.buildingId}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{" "}
                      {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{" "}
                      {pagination.totalCount} buildings
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
      {/* Add Building Modal - Only render when open */}
      {isAddModalOpen && (
        <BuildingFormModal 
          isOpen={isAddModalOpen} 
          onClose={closeModal} 
          mode="add"
          onSuccess={handleAddBuildingSuccess}
        />
      )}

      {/* Edit Building Modal - Only render when open */}
      {isEditModalOpen && selectedBuilding && (
        <BuildingFormModal 
          isOpen={isEditModalOpen} 
          onClose={closeEditModal} 
          mode="edit"
          building={selectedBuilding}
          onSuccess={handleEditBuildingSuccess}
        />
      )}

      {/* View Building Modal */}
      {isViewModalOpen && selectedBuilding && (
        <BuildingViewModal
          isOpen={isViewModalOpen}
          onClose={closeViewModal}
          building={selectedBuilding}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedBuilding && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          onConfirm={handleConfirmDelete}
          itemName={selectedBuilding.name}
          itemType="Building"
          isDeleting={isDeleting}
        />
      )}
    </>
  )
}