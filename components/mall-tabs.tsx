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
  Edit2
} from "lucide-react"

import type { IMall, MallFormData } from "@/types/mall"
import { MallFormModal } from "@/components/mall"
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal"
import { MallCard } from "@/components/mall-card"
import { MallViewModal } from "@/components/mall-view-modal"
import { DataPageLayout } from "@/components/ui/data-page-layout"
import type { StatCard, FilterConfig } from "@/components/ui/data-page-layout"

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

  // URL-based state - read from URL parameters
  const activeTab = searchParams.get("tab") || "all"
  const currentPage = parseInt(searchParams.get("page") || "1")
  const searchTerm = searchParams.get("search") || ""
  const selectedLocation = searchParams.get("location") || "all"
  const selectedStatus = searchParams.get("status") || "all"
  const selectedSaleStatus = searchParams.get("saleStatus") || "all"
  const selectedOwnership = searchParams.get("ownership") || "all"
  
  // Local state for search input (for immediate typing feedback)
  const [searchInput, setSearchInput] = useState(searchTerm)
  
  // Component state (non-URL)
  const [malls, setMalls] = useState<IMall[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<MallPaginationInfo>({
    currentPage: currentPage,
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
  
  // Static tab counts (independent of filters)
  const [tabCounts, setTabCounts] = useState({
    all: 0,
    available: 0,
    operational: 0,
    sold: 0,
    verified: 0,
    draft: 0
  })
  const [countsLoading, setCountsLoading] = useState(true)

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedMall, setSelectedMall] = useState<IMall | null>(null)

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
    if (selectedStatus && selectedStatus !== "all") params.set("status", selectedStatus)
    if (selectedSaleStatus && selectedSaleStatus !== "all") params.set("saleStatus", selectedSaleStatus)
    if (selectedOwnership && selectedOwnership !== "all") params.set("ownership", selectedOwnership)
    
    return params.toString()
  }

  // Fetch tab counts (static, independent of filters)
  const fetchTabCounts = async () => {
    setCountsLoading(true)
    try {
      const response = await fetch('/api/malls/counts')
      
      if (!response.ok) {
        // If API doesn't exist yet, use fallback
        if (response.status === 404) {
          setTabCounts({
            all: pagination.totalCount || 0,
            available: 0,
            operational: 0,
            sold: 0,
            verified: 0,
            draft: 0
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
          available: data.counts.available || 0,
          operational: data.counts.operational || 0,
          sold: data.counts.sold || 0,
          verified: data.counts.verified || 0,
          draft: data.counts.draft || 0
        })
      } else {
        console.warn('Failed to fetch tab counts:', data.message)
      }
    } catch (err: any) {
      console.warn('Tab counts API not available:', err.message)
      // Use current data as fallback
      setTabCounts({
        all: pagination.totalCount || 0,
        available: 0, // We'd need to calculate these based on status
        operational: 0,
        sold: 0,
        verified: 0,
        draft: 0
      })
    } finally {
      setCountsLoading(false)
    }
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
    fetchMalls(currentPage, activeTab)
  }, [activeTab, currentPage, searchTerm, selectedLocation, selectedStatus, selectedSaleStatus, selectedOwnership])

  // Handle URL action parameter
  useEffect(() => {
    if (action === "new") {
      setIsAddModalOpen(true)
    } else if (action === "edit") {
      // Check if there's a mall slug in the URL to edit
      const mallSlug = searchParams.get("slug")
      if (mallSlug && malls.length > 0) {
        const mallToEdit = malls.find(m => m.slug === mallSlug)
        if (mallToEdit) {
          setSelectedMall(mallToEdit)
          setIsEditModalOpen(true)
        }
      }
    }
  }, [action, searchParams, malls])

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
      status: "all",
      saleStatus: "all",
      ownership: "all",
      page: "1"
    })
  }

  // Individual filter handlers
  const handleLocationChange = (value: string) => {
    updateURL({ location: value })
  }

  const handleStatusChange = (value: string) => {
    updateURL({ status: value })
  }

  const handleSaleStatusChange = (value: string) => {
    updateURL({ saleStatus: value })
  }

  const handleOwnershipChange = (value: string) => {
    updateURL({ ownership: value })
  }

  // Pagination handlers
  const handlePageChange = (page: number) => {
    updateURL({ page })
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

  const closeViewModal = () => {
    setIsViewModalOpen(false)
    setSelectedMall(null)
  }

  const closeDeleteModal = () => {
    if (isDeleting) return // Don't close if deletion is in progress
    setIsDeleteModalOpen(false)
    setIsDeleting(false)
    setSelectedMall(null)
  }

  const handleViewMall = (mall: IMall) => {
    setSelectedMall(mall)
    setIsViewModalOpen(true)
  }

  const handleEditMall = (mall: IMall) => {
    setSelectedMall(mall)
    setIsEditModalOpen(true)
  }

  const handleDeleteMall = (mall: IMall) => {
    setSelectedMall(mall)
    setIsDeleteModalOpen(true)
  }

  // API functions for mall operations
  const createMall = async (mallData: MallFormData): Promise<IMall> => {
    const response = await fetch('/api/malls/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mallData)
    })

    const result = await response.json()
    
    if (!response.ok) {
      // Create detailed error message based on error type
      let errorMessage = result.message || `Failed to create mall: ${response.status}`
      
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
        errorMessage = result.message || 'A mall with this name already exists'
      } else if (result.error === 'RATE_LIMITED') {
        errorMessage = 'Too many requests. Please try again later.'
      } else if (result.error === 'EMPTY_DATA') {
        errorMessage = 'No mall data provided. Please fill out the form.'
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
      throw new Error(result.message || 'Failed to create mall')
    }
    
    return result.mall
  }

  const updateMall = async (slug: string, mallData: Partial<MallFormData>): Promise<IMall> => {
    const response = await fetch(`/api/malls/update/${slug}`, {
      method: 'PUT', 
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mallData)
    })

    const result = await response.json()
    
    if (!response.ok) {
      // Create detailed error message based on error type
      let errorMessage = result.message || `Failed to update mall: ${response.status}`
      
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
        errorMessage = result.message || 'A mall with this name already exists'
      } else if (result.error === 'NOT_FOUND') {
        errorMessage = 'Mall not found or has been deleted'
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
      throw new Error(result.message || 'Failed to update mall')
    }
    
    return result.mall
  }

  const deleteMall = async (slug: string): Promise<void> => {
    const response = await fetch(`/api/malls/delete/${slug}`, {
      method: 'DELETE',
    })

    const result = await response.json()
    
    if (!response.ok) {
      let errorMessage = result.message || `Failed to delete mall: ${response.status}`
      
      if (result.error === 'NOT_FOUND') {
        errorMessage = 'Mall not found or has already been deleted'
      } else if (result.error === 'DATABASE_CONNECTION_ERROR') {
        errorMessage = 'Database connection failed. Please try again.'
      }
      
      const error = new Error(errorMessage)
      ;(error as any).errorType = result.error
      throw error
    }
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to delete mall')
    }
  }

  // Handle add modal success
  const handleAddMallSuccess = async (mallData: MallFormData): Promise<void> => {
    try {
      const newMall = await createMall(mallData)
      // Refresh the malls list to show new data
      await fetchMalls(pagination.currentPage, activeTab)
      // Show success message
      console.log('✅ Mall created successfully:', newMall.name)
      // Close the modal
      closeModal()
    } catch (error: any) {
      console.error('Error creating mall:', error)
      throw error // Re-throw so the form can handle it
    }
  }

  // Handle edit modal success  
  const handleEditMallSuccess = async (mallData: MallFormData): Promise<void> => {
    if (!selectedMall) {
      throw new Error('No mall selected for editing')
    }
    
    try {
      const updatedMall = await updateMall(selectedMall.slug, mallData)
      // Refresh the malls list to show updated data
      await fetchMalls(pagination.currentPage, activeTab)
      // Show success message
      console.log('✅ Mall updated successfully:', updatedMall.name)
      // Close the modal
      closeEditModal()
    } catch (error: any) {
      console.error('Error updating mall:', error)
      throw error // Re-throw so the form can handle it
    }
  }

  // Handle confirm delete
  const handleConfirmDelete = async (): Promise<void> => {
    if (!selectedMall || isDeleting) {
      return // Prevent multiple delete attempts
    }
    
    setIsDeleting(true)
    
    try {
      await deleteMall(selectedMall.slug)
      // Refresh the malls list to show updated data
      await fetchMalls(pagination.currentPage, activeTab)
      // Show success message
      console.log('✅ Mall deleted successfully:', selectedMall.name)
      
      // Close the modal after successful deletion
      setIsDeleteModalOpen(false)
      setSelectedMall(null)
    } catch (error: any) {
      console.error('Error deleting mall:', error)
      // You can add toast notification here if you have a toast system
      alert(`Failed to delete mall: ${error.message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  // Tab data configuration with static counts
  const tabs = [
    { id: "all", label: "All Malls", icon: Building, count: countsLoading ? 0 : tabCounts.all },
    { id: "available", label: "Available", icon: Store, count: countsLoading ? 0 : tabCounts.available },
    { id: "operational", label: "Operational", icon: ShoppingCart, count: countsLoading ? 0 : tabCounts.operational },
    { id: "sold", label: "Sold", icon: CheckCircle, count: countsLoading ? 0 : tabCounts.sold },
    { id: "verified", label: "Verified", icon: CheckCircle, count: countsLoading ? 0 : tabCounts.verified },
    { id: "draft", label: "Draft", icon: Filter, count: countsLoading ? 0 : tabCounts.draft }
  ]

  // Configure stats for DataPageLayout
  const mallStats: StatCard[] = [
    {
      title: "Total Malls",
      value: pagination.totalCount,
      icon: Building,
      description: "Across all locations",
      isLoading: loading && malls.length === 0
    },
    {
      title: "Available",
      value: 0,
      icon: Store,
      description: "For sale or investment",
      isLoading: loading && malls.length === 0
    },
    {
      title: "Operational",
      value: 0,
      icon: ShoppingCart,
      description: "Currently operating",
      isLoading: loading && malls.length === 0
    },
    {
      title: "Portfolio Value",
      value: "AED 0",
      icon: TrendingUp,
      description: "Total estimated value",
      isLoading: loading && malls.length === 0
    }
  ]

  // Configure filters for DataPageLayout
  const mallFilters: FilterConfig[] = [
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
      label: "Status",
      value: selectedStatus,
      placeholder: "Status",
      options: [
        { value: "all", label: "All Statuses" },
        { value: "Operational", label: "Operational" },
        { value: "Under Construction", label: "Under Construction" },
        { value: "Planned", label: "Planned" },
        { value: "For Sale", label: "For Sale" }
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
        title="Malls"
        subtitle="Manage shopping malls and commercial properties"
        primaryAction={{
          label: "Add Mall",
          onClick: handleAddMall,
          icon: Plus
        }}
        stats={mallStats}
      searchConfig={{
        placeholder: "Search malls by name, location, or mall ID...",
        value: searchInput,
        onChange: setSearchInput,
        onSearch: handleSearch
      }}
        filters={mallFilters}
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
                {/* Mall Grid using MallCard component */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {malls.map((mall) => (
                    <MallCard
                      key={mall.mallId}
                      mall={mall}
                      onView={handleViewMall}
                      onEdit={handleEditMall}
                      onDelete={handleDeleteMall}
                      isDeleting={isDeleting && selectedMall?.mallId === mall.mallId}
                    />
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

      </DataPageLayout>

      {/* Modals */}
      {/* Add Mall Modal - Only render when open */}
      {isAddModalOpen && (
        <MallFormModal 
          isOpen={isAddModalOpen} 
          onClose={closeModal} 
          mode="add"
          onSuccess={handleAddMallSuccess}
        />
      )}

      {/* Edit Mall Modal - Only render when open */}
      {isEditModalOpen && selectedMall && (
        <MallFormModal 
          isOpen={isEditModalOpen} 
          onClose={closeEditModal} 
          mode="edit"
          mall={selectedMall}
          onSuccess={handleEditMallSuccess}
        />
      )}

      {/* View Mall Modal */}
      {isViewModalOpen && selectedMall && (
        <MallViewModal
          isOpen={isViewModalOpen}
          onClose={closeViewModal}
          mall={selectedMall}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedMall && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          onConfirm={handleConfirmDelete}
          itemName={selectedMall.name}
          itemType="Mall"
          isDeleting={isDeleting}
        />
      )}
    </>
  )
}
