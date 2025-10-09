// components/property-tabs.tsx
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
  MapPin, 
  Home, 
  Star,
  Plus, 
  Loader2, 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Crown,
  Zap,
  CheckCircle,
  XCircle,
  Building2,
  Eye,
  TrendingUp,
  AlertTriangle
} from "lucide-react"

import type { IProperty, PropertyPaginationInfo, PropertyFilters } from "@/types/properties"
import { PropertyCard } from "./property-card"
import { DeleteConfirmationModal } from "./delete-confirmation-modal"
import { PropertyFormModal } from "./property/PropertyFormModal"
import { PropertyViewModal } from "./property-view-modal"
import { DataPageLayout } from "@/components/ui/data-page-layout"
import type { StatCard, FilterConfig } from "@/components/ui/data-page-layout"

// Basic interfaces for property management
interface PropertyTabCounts {
  all: number;
  ready: number;
  offplan: number;
  primary: number;
  secondary: number;
  featured: number;
  elite: number;
  inactive: number;
}

export function PropertyTabs() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { success, error: showError } = useToast()
  const pathname = usePathname()
  const action = searchParams.get("action")

  // URL-based state - read from URL parameters
  const activeTab = searchParams.get("tab") || "all"
  const currentPage = parseInt(searchParams.get("page") || "1")
  const searchTerm = searchParams.get("search") || ""
  const selectedPropertyType = searchParams.get("propertyType") || "all"
  const selectedBedrooms = searchParams.get("bedrooms") || "all"
  const selectedOwnership = searchParams.get("ownership") || "all"
  const selectedAvailability = searchParams.get("availability") || "all"
  const selectedArea = searchParams.get("area") || "all"
  const selectedPriceRange = searchParams.get("priceRange") || "all"
  
  // Local state for search input (for immediate typing feedback)
  const [searchInput, setSearchInput] = useState(searchTerm)
  
  // Component state (non-URL)
  const [properties, setProperties] = useState<IProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PropertyPaginationInfo>({
    currentPage: currentPage,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
    hasNextPage: false,
    hasPrevPage: false,
  })
  const [filters, setFilters] = useState<PropertyFilters>({
    propertyTypes: [],
    bedrooms: [],
    bathrooms: [],
    furnishingStatuses: [],
    ownershipTypes: [],
    availabilityStatuses: [],
    areas: [],
    cities: [],
    priceRanges: [],
  })
  
  // Static tab counts (independent of filters)
  const [tabCounts, setTabCounts] = useState<PropertyTabCounts>({
    all: 0,
    ready: 0,
    offplan: 0,
    primary: 0,
    secondary: 0,
    featured: 0,
    elite: 0,
    inactive: 0
  })
  const [countsLoading, setCountsLoading] = useState(true)

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<IProperty | null>(null)

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
    if (selectedPropertyType && selectedPropertyType !== "all") params.set("propertyType", selectedPropertyType)
    if (selectedBedrooms && selectedBedrooms !== "all") params.set("bedrooms", selectedBedrooms)
    if (selectedOwnership && selectedOwnership !== "all") params.set("ownership", selectedOwnership)
    if (selectedAvailability && selectedAvailability !== "all") params.set("availability", selectedAvailability)
    if (selectedArea && selectedArea !== "all") params.set("area", selectedArea)
    if (selectedPriceRange && selectedPriceRange !== "all") params.set("priceRange", selectedPriceRange)
    
    return params.toString()
  }

  // Fetch tab counts (static, independent of filters)
  const fetchTabCounts = async () => {
    setCountsLoading(true)
    try {
      const response = await fetch('/api/properties/counts')
      
      if (!response.ok) {
        // If API doesn't exist yet, use fallback
        if (response.status === 404) {
        setTabCounts({
          all: pagination.totalCount || 0,
          ready: 0,
          offplan: 0,
          primary: 0,
          secondary: 0,
          featured: 0,
          elite: 0,
          inactive: 0
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
          ready: data.counts.availability?.ready || 0,
          offplan: data.counts.availability?.offplan || 0,
          primary: data.counts.ownership?.primary || 0,
          secondary: data.counts.ownership?.secondary || 0,
          featured: data.counts.flags?.featured || 0,
          elite: data.counts.flags?.elite || 0,
          inactive: data.counts.inactive || 0
        })
      } else {
        console.warn('Failed to fetch tab counts:', data.message)
      }
    } catch (err: any) {
      console.warn('Tab counts API not available:', err.message)
      // Use current data as fallback
      setTabCounts({
        all: pagination.totalCount || 0,
        ready: 0,
        offplan: 0,
        primary: 0,
        secondary: 0,
        featured: 0,
        elite: 0,
        inactive: 0
      })
    } finally {
      setCountsLoading(false)
    }
  }

  // Fetch properties with filters and pagination
  const fetchProperties = async (page: number = 1, tab: string = activeTab) => {
    setLoading(true)
    setErrorMessage(null)
    try {
      const queryParams = buildQueryParams(page, tab)
      const response = await fetch(`/api/properties/fetch?${queryParams}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setProperties([])
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
        setProperties(result.properties || [])
        setPagination(result.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalCount: 0,
          limit: 20,
          hasNextPage: false,
          hasPrevPage: false,
        })
        // Set filters from response if available
        if (result.filters?.filterOptions) {
          setFilters({
            propertyTypes: result.filters.filterOptions.propertyTypes || [],
            bedrooms: result.filters.filterOptions.bedrooms || [],
            bathrooms: result.filters.filterOptions.bathrooms || [],
            furnishingStatuses: result.filters.filterOptions.furnishingStatuses || [],
            ownershipTypes: result.filters.filterOptions.ownershipTypes || [],
            availabilityStatuses: result.filters.filterOptions.availabilityStatuses || [],
            areas: result.filters.filterOptions.areas || [],
            cities: result.filters.filterOptions.cities || [],
            priceRanges: result.filters.filterOptions.priceRanges || []
          })
        }
      } else {
        setProperties([])
        setErrorMessage(result.message || 'No properties found')
      }
    } catch (err: any) {
      console.warn('Properties API not available:', err.message)
      setProperties([])
      setErrorMessage(`Unable to fetch properties: ${err.message}`)
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
    fetchProperties(currentPage, activeTab)
  }, [activeTab, currentPage, searchTerm, selectedPropertyType, selectedBedrooms, selectedOwnership, selectedAvailability, selectedArea, selectedPriceRange])

  // Handle URL action parameter
  useEffect(() => {
    if (action === "new") {
      setIsAddModalOpen(true)
    } else if (action === "edit") {
      // Check if there's a property slug in the URL to edit
      const propertySlug = searchParams.get("slug")
      if (propertySlug && properties.length > 0) {
        const propertyToEdit = properties.find(p => p.slug === propertySlug)
        if (propertyToEdit) {
          setSelectedProperty(propertyToEdit)
          setIsEditModalOpen(true)
        }
      }
    }
  }, [action, searchParams, properties])

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
      propertyType: "all",
      bedrooms: "all",
      ownership: "all",
      availability: "all",
      area: "all",
      priceRange: "all",
      page: "1"
    })
  }

  // Individual filter handlers
  const handlePropertyTypeChange = (value: string) => {
    updateURL({ propertyType: value })
  }

  const handleBedroomsChange = (value: string) => {
    updateURL({ bedrooms: value })
  }

  const handleOwnershipChange = (value: string) => {
    updateURL({ ownership: value })
  }

  const handleAvailabilityChange = (value: string) => {
    updateURL({ availability: value })
  }

  const handleAreaChange = (value: string) => {
    updateURL({ area: value })
  }

  const handlePriceRangeChange = (value: string) => {
    updateURL({ priceRange: value })
  }

  // Pagination handlers
  const handlePageChange = (page: number) => {
    updateURL({ page })
  }

  const handleAddProperty = () => {
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
    setSelectedProperty(null)
  }

  const closeViewModal = () => {
    setIsViewModalOpen(false)
    setSelectedProperty(null)
  }

  const closeDeleteModal = () => {
    if (isDeleting) return // Don't close if deletion is in progress
    setIsDeleteModalOpen(false)
    setIsDeleting(false)
    setSelectedProperty(null)
  }

  const handleViewProperty = (property: IProperty) => {
    setSelectedProperty(property)
    setIsViewModalOpen(true)
  }

  const handleEditProperty = (property: IProperty) => {
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set("action", "edit")
    currentUrl.searchParams.set("slug", property.slug)
    router.push(currentUrl.toString())
  }

  const handleDeleteProperty = (property: IProperty) => {
    setSelectedProperty(property)
    setIsDeleteModalOpen(true)
  }

  // API functions for property operations
  const deleteProperty = async (slug: string): Promise<{ deletionType: string; message: string }> => {
    console.log('🗑️ Deleting property with slug:', slug)
    
    const response = await fetch(`/api/properties/delete/${slug}`, {
      method: 'DELETE',
    })

    const result = await response.json()
    console.log('📝 Delete response:', result)
    
    if (!response.ok) {
      let errorMessage = result.message || `Failed to delete property: ${response.status}`
      
      if (result.error === 'NOT_FOUND') {
        errorMessage = 'Property not found'
      } else if (result.error === 'DATABASE_CONNECTION_ERROR') {
        errorMessage = 'Database connection failed. Please try again.'
      }
      
      const error = new Error(errorMessage)
      ;(error as any).errorType = result.error
      throw error
    }
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to delete property')
    }
    
    return {
      deletionType: result.deletionType || 'soft_delete',
      message: result.message || 'Property processed successfully'
    }
  }

  // Handle modal success - just refresh data and close modal
  const handleAddPropertySuccess = async (): Promise<void> => {
    // Refresh the properties list to show new data
    await fetchProperties(pagination.currentPage, activeTab)
    // Close the modal
    closeModal()
  }

  // Handle edit modal success
  const handleEditPropertySuccess = async (): Promise<void> => {
    // Refresh the properties list to show updated data
    await fetchProperties(pagination.currentPage, activeTab)
    // Close the modal
    closeEditModal()
  }

  // Handle confirm delete
  const handleConfirmDelete = async (): Promise<void> => {
    if (!selectedProperty || isDeleting) {
      return // Prevent multiple delete attempts
    }
    
    setIsDeleting(true)
    
    try {
      const result = await deleteProperty(selectedProperty.slug)
      
      // Refresh the properties list and tab counts to show updated data
      await fetchProperties(pagination.currentPage, activeTab)
      await fetchTabCounts()
      
      // Show appropriate success message based on deletion type
      if (result.deletionType === 'soft_delete') {
        success('Property Deactivated', `"${selectedProperty.name}" has been deactivated. Delete again to permanently remove it.`)
        console.log('✅ Property soft-deleted (deactivated):', selectedProperty.name)
      } else if (result.deletionType === 'hard_delete') {
        success('Property Permanently Deleted', `"${selectedProperty.name}" has been permanently deleted from the database.`)
        console.log('✅ Property hard-deleted (permanently removed):', selectedProperty.name)
      } else {
        success('Property Processed', result.message)
        console.log('✅ Property deletion processed:', selectedProperty.name)
      }
      
      // Close the modal after successful deletion
      setIsDeleteModalOpen(false)
      setSelectedProperty(null)
    } catch (deleteError: any) {
      console.error('Error deleting property:', deleteError)
      showError('Delete Failed', `Failed to delete property: ${deleteError.message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  // Tab data configuration with static counts
  const tabs = [
    { id: "all", label: "All Properties", icon: Home, count: countsLoading ? 0 : tabCounts.all },
    { id: "ready", label: "Ready to Move", icon: CheckCircle, count: countsLoading ? 0 : tabCounts.ready },
    { id: "offplan", label: "Off-plan", icon: Eye, count: countsLoading ? 0 : tabCounts.offplan },
    { id: "primary", label: "Primary", icon: Building2, count: countsLoading ? 0 : tabCounts.primary },
    { id: "secondary", label: "Secondary", icon: Building2, count: countsLoading ? 0 : tabCounts.secondary },
    { id: "featured", label: "Featured", icon: Star, count: countsLoading ? 0 : tabCounts.featured },
    { id: "elite", label: "Elite", icon: Crown, count: countsLoading ? 0 : tabCounts.elite },
    { id: "inactive", label: "Inactive", icon: AlertTriangle, count: countsLoading ? 0 : tabCounts.inactive }
  ]

  // Configure stats for DataPageLayout
  const propertyStats: StatCard[] = [
    {
      title: "Total Properties",
      value: pagination.totalCount,
      icon: Home,
      description: "Across all locations",
      isLoading: loading && properties.length === 0
    },
    {
      title: "Ready to Move",
      value: tabCounts.ready,
      icon: CheckCircle,
      description: "Ready for sale",
      isLoading: loading && properties.length === 0
    },
    {
      title: "Featured",
      value: tabCounts.featured,
      icon: Star,
      description: "Premium listings",
      isLoading: loading && properties.length === 0
    },
    {
      title: "Portfolio Value",
      value: "AED 0", // TODO: Calculate from API
      icon: TrendingUp,
      description: "Total estimated value",
      isLoading: loading && properties.length === 0
    }
  ]

  // Configure filters for DataPageLayout
  const propertyFilters: FilterConfig[] = [
    {
      label: "Property Type",
      value: selectedPropertyType,
      placeholder: "Property Type",
      options: [
        { value: "all", label: "All Types" },
        ...filters.propertyTypes.map(type => ({ value: type, label: type }))
      ],
      onChange: handlePropertyTypeChange
    },
    {
      label: "Bedrooms",
      value: selectedBedrooms,
      placeholder: "Bedrooms",
      options: [
        { value: "all", label: "All Bedrooms" },
        ...filters.bedrooms.map(bedroom => ({ value: bedroom, label: `${bedroom} BR` }))
      ],
      onChange: handleBedroomsChange
    },
    {
      label: "Ownership",
      value: selectedOwnership,
      placeholder: "Ownership",
      options: [
        { value: "all", label: "All Types" },
        ...filters.ownershipTypes.map(ownership => ({ value: ownership, label: ownership }))
      ],
      onChange: handleOwnershipChange
    },
    {
      label: "Availability",
      value: selectedAvailability,
      placeholder: "Availability",
      options: [
        { value: "all", label: "All Status" },
        ...filters.availabilityStatuses.map(status => ({ value: status, label: status }))
      ],
      onChange: handleAvailabilityChange
    },
    {
      label: "Area",
      value: selectedArea,
      placeholder: "Area",
      options: [
        { value: "all", label: "All Areas" },
        ...filters.areas.map(area => ({ value: area, label: area }))
      ],
      onChange: handleAreaChange
    }
  ]

  return (
    <>
      <DataPageLayout
        title="Properties"
        subtitle="Manage property listings and inventory"
        primaryAction={{
          label: "Add Property",
          onClick: handleAddProperty,
          icon: Plus
        }}
        stats={propertyStats}
        searchConfig={{
          placeholder: "Search properties by name, location, or type...",
          value: searchInput,
          onChange: setSearchInput,
          onSearch: handleSearch
        }}
        filters={propertyFilters}
        onClearFilters={handleClearFilters}
      >

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
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
                <span className="ml-2">Loading properties...</span>
              </div>
            ) : errorMessage ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{errorMessage}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => fetchProperties()}
                >
                  Try Again
                </Button>
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-12">
                <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No properties found</h3>
                <p className="text-muted-foreground mb-4">
                  {tab.id === "all" 
                    ? "Start by adding your first property to the system."
                    : `No properties match the ${tab.label.toLowerCase()} criteria.`
                  }
                </p>
                {tab.id === "all" && (
                  <Button onClick={handleAddProperty}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Property
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Property Grid using PropertyCard component */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {properties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      onView={handleViewProperty}
                      onEdit={handleEditProperty}
                      onDelete={handleDeleteProperty}
                      isDeleting={isDeleting && selectedProperty?.id === property.id}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{" "}
                      {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{" "}
                      {pagination.totalCount} properties
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

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedProperty && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          onConfirm={handleConfirmDelete}
          itemName={selectedProperty.name}
          itemType="Property"
          isDeleting={isDeleting}
          isActive={selectedProperty.isActive}
        />
      )}

      {/* Add Property Modal */}
      <PropertyFormModal
        isOpen={isAddModalOpen}
        onClose={closeModal}
        onSuccess={handleAddPropertySuccess}
        mode="add"
      />

      {/* View Property Modal */}
      <PropertyViewModal
        isOpen={isViewModalOpen}
        onClose={closeViewModal}
        property={selectedProperty}
      />

      {/* Edit Property Modal */}
      <PropertyFormModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSuccess={handleEditPropertySuccess}
        property={selectedProperty || undefined}
        mode="edit"
      />
    </>
  )
}
