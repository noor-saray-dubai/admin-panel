// components/hotel-tabs.tsx

"use client"

import React, { useState, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { DataPageLayout } from "@/components/ui/data-page-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Hotel,
  Building2,
  Star,
  Crown,
  ShoppingCart,
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import type { IHotel, HotelPaginationInfo, HotelFiltersData, HotelStatsData, HotelTabConfig, HotelFormData } from "@/types/hotels"
import { HotelFormModal } from "@/components/hotels/HotelFormModal"
import { HotelViewModal } from "@/components/hotel-view-modal"
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal"
import { HotelCard } from "@/components/hotels/hotel-card"

// Tab configuration
const tabs: HotelTabConfig[] = [
  {
    id: "all",
    label: "All Hotels",
    count: 0,
    icon: Hotel,
    description: "All active hotels in the system"
  },
  {
    id: "operational",
    label: "Operational",
    count: 0,
    icon: Building2,
    description: "Currently operational hotels"
  },
  {
    id: "luxury",
    label: "Luxury",
    count: 0,
    icon: Star,
    description: "5+ star luxury hotels"
  },
  {
    id: "ultraLuxury",
    label: "Ultra Luxury",
    count: 0,
    icon: Crown,
    description: "6+ star ultra luxury hotels"
  },
  {
    id: "forSale",
    label: "For Sale",
    count: 0,
    icon: ShoppingCart,
    description: "Hotels available for investment"
  },
  {
    id: "verified",
    label: "Verified",
    count: 0,
    icon: CheckCircle,
    description: "Verified hotel listings"
  }
]

export function HotelTabs() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const action = searchParams.get("action")
  const hotelSlug = searchParams.get("slug")

  // URL-based state
  const activeTab = searchParams.get("tab") || "all"
  const currentPage = parseInt(searchParams.get("page") || "1")
  const searchTerm = searchParams.get("search") || ""

  // Local state
  const [searchInput, setSearchInput] = useState(searchTerm)
  const [hotels, setHotels] = useState<IHotel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<HotelPaginationInfo>({
    currentPage: currentPage,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
    hasNextPage: false,
    hasPrevPage: false,
  })
  const [tabCounts, setTabCounts] = useState({
    all: 0,
    operational: 0,
    luxury: 0,
    ultraLuxury: 0,
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
  const [selectedHotel, setSelectedHotel] = useState<IHotel | null>(null)

  // Update URL with new parameters
  const updateURL = (newParams: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams)

    Object.entries(newParams).forEach(([key, value]) => {
      if (value && value !== "all" && value !== "") {
        params.set(key, value.toString())
      } else {
        params.delete(key)
      }
    })

    if (!params.get("tab")) {
      params.set("tab", "all")
    }

    if (!newParams.hasOwnProperty("page") && Object.keys(newParams).some(key => key !== "page")) {
      params.set("page", "1")
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  // Fetch hotel counts
  const fetchTabCounts = async () => {
    setCountsLoading(true)
    try {
      const response = await fetch('/api/hotels/counts')

      if (!response.ok) {
        if (response.status === 404) {
          setTabCounts({
            all: pagination.totalCount || 0,
            operational: 0,
            luxury: 0,
            ultraLuxury: 0,
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
          operational: data.counts.operational || 0,
          luxury: data.counts.luxury || 0,
          ultraLuxury: data.counts.ultraLuxury || 0,
          forSale: data.counts.forSale || 0,
          verified: data.counts.verified || 0
        })
      }
    } catch (err: any) {
      console.warn('Hotel counts API not available:', err.message)
    } finally {
      setCountsLoading(false)
    }
  }

  // Fetch hotels
  const fetchHotels = async (page: number = 1, tab: string = activeTab) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set("page", page.toString())
      params.set("limit", "20")
      params.set("tab", tab)

      if (searchTerm) params.set("search", searchTerm)

      const response = await fetch(`/api/hotels/fetch?${params.toString()}`)

      if (!response.ok) {
        if (response.status === 404) {
          setHotels([])
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
        setHotels(result.data.hotels || [])
        setPagination(result.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalCount: 0,
          limit: 20,
          hasNextPage: false,
          hasPrevPage: false,
        })
      } else {
        setHotels([])
        setError(result.message || 'No hotels found')
      }
    } catch (err: any) {
      console.warn('Hotels API not available:', err.message)
      setHotels([])
      setError(`Unable to fetch hotels: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Effects
  useEffect(() => {
    fetchTabCounts()
  }, [])

  // Handle URL action parameters for modals
  useEffect(() => {
    console.log('🔍 Hotel URL params changed - action:', action, 'slug:', hotelSlug)

    if (action === 'new') {
      console.log('📝 Opening add modal')
      setSelectedHotel(null)
      setIsAddModalOpen(true)
    } else if (action === 'edit' && hotelSlug) {
      console.log('✏️ Opening edit modal for hotel:', hotelSlug)
      // Find hotel by slug or fetch it
      const hotel = hotels.find(h => h.slug === hotelSlug)
      if (hotel) {
        setSelectedHotel(hotel)
        setIsEditModalOpen(true)
      } else {
        console.warn('⚠️ Hotel not found for slug:', hotelSlug)
        // TODO: Fetch hotel by slug from API if not in current list
      }
    } else if (action === 'view' && hotelSlug) {
      console.log('👁️ Opening view modal for hotel:', hotelSlug)
      const hotel = hotels.find(h => h.slug === hotelSlug)
      if (hotel) {
        setSelectedHotel(hotel)
        setIsViewModalOpen(true)
      }
    } else {
      // No action or invalid action - close all modals
      setIsAddModalOpen(false)
      setIsEditModalOpen(false)
      setIsViewModalOpen(false)
    }
  }, [action, hotelSlug, hotels])

  useEffect(() => {
    setSearchInput(searchTerm)
  }, [searchTerm])

  useEffect(() => {
    fetchHotels(currentPage, activeTab)
  }, [activeTab, currentPage, searchTerm])

  // Handlers
  const handleTabChange = (tab: string) => {
    updateURL({ tab })
  }

  const handleSearch = () => {
    updateURL({ search: searchInput })
  }

  const handleClearFilters = () => {
    updateURL({ search: "", page: "1" })
  }

  const handleAddHotel = () => {
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set("action", "new")
    router.push(currentUrl.toString())
  }

  // Modal management functions
  const closeModal = () => {
    console.log('❌ Closing hotel modal')
    const params = new URLSearchParams(searchParams)
    params.delete('action')
    params.delete('slug')
    router.push(`${pathname}?${params.toString()}`)
  }

  const closeEditModal = () => {
    console.log('❌ Closing hotel edit modal')
    setIsEditModalOpen(false)
    setSelectedHotel(null)
    const params = new URLSearchParams(searchParams)
    params.delete('action')
    params.delete('slug')
    router.push(`${pathname}?${params.toString()}`)
  }

  const closeDeleteModal = () => {
    if (isDeleting) return // Don't close if deletion is in progress
    setIsDeleteModalOpen(false)
    setIsDeleting(false)
    setSelectedHotel(null)
  }

  const handleViewHotel = (hotel: IHotel) => {
    setSelectedHotel(hotel)
    setIsViewModalOpen(true)
  }

  const handleEditHotel = (hotel: IHotel) => {
    console.log('🔧 Edit button clicked for hotel:', hotel.name, hotel.hotelId)
    console.log('🔧 Updating URL with action=edit and slug parameter...')
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set("action", "edit")
    currentUrl.searchParams.set("slug", hotel.slug || hotel.hotelId)
    router.push(currentUrl.toString())
    console.log('🔧 URL updated - modal should open via useEffect')
  }

  const handleDeleteHotel = (hotel: IHotel) => {
    setSelectedHotel(hotel)
    setIsDeleteModalOpen(true)
  }

  // API functions for hotel operations
  const createHotel = async (hotelData: HotelFormData): Promise<IHotel> => {
    const response = await fetch('/api/hotels/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(hotelData)
    })

    const result = await response.json()

    if (!response.ok) {
      let errorMessage = result.message || `Failed to create hotel: ${response.status}`

      if (result.error === 'VALIDATION_ERROR' && result.errors) {
        if (typeof result.errors === 'object' && !Array.isArray(result.errors)) {
          const fieldErrors = Object.entries(result.errors)
            .map(([field, error]) => `${field}: ${error}`)
            .join(', ')
          errorMessage = `Validation Error: ${fieldErrors}`
        } else {
          errorMessage = `Validation Error: ${Array.isArray(result.errors) ? result.errors.join(', ') : result.errors}`
        }
      } else if (result.error === 'DUPLICATE_ENTRY') {
        errorMessage = result.message || 'A hotel with this name already exists'
      } else if (result.error === 'RATE_LIMITED') {
        errorMessage = 'Too many requests. Please try again later.'
      }

      const error = new Error(errorMessage)
      if (result.errors) {
        (error as any).fieldErrors = result.errors
      }
      (error as any).errorType = result.error
      throw error
    }

    if (!result.success) {
      throw new Error(result.message || 'Failed to create hotel')
    }

    return result.hotel
  }

  const updateHotel = async (slug: string, hotelData: Partial<HotelFormData>): Promise<IHotel> => {
    const response = await fetch(`/api/hotels/update/${slug}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(hotelData)
    })

    const result = await response.json()

    if (!response.ok) {
      let errorMessage = result.message || `Failed to update hotel: ${response.status}`

      if (result.error === 'VALIDATION_ERROR' && result.errors) {
        if (typeof result.errors === 'object' && !Array.isArray(result.errors)) {
          const fieldErrors = Object.entries(result.errors)
            .map(([field, error]) => `${field}: ${error}`)
            .join(', ')
          errorMessage = `Validation Error: ${fieldErrors}`
        } else {
          errorMessage = `Validation Error: ${Array.isArray(result.errors) ? result.errors.join(', ') : result.errors}`
        }
      } else if (result.error === 'NOT_FOUND') {
        errorMessage = 'Hotel not found or has been deleted'
      } else if (result.error === 'RATE_LIMITED') {
        errorMessage = 'Too many requests. Please try again later.'
      }

      const error = new Error(errorMessage)
      if (result.errors) {
        (error as any).fieldErrors = result.errors
      }
      (error as any).errorType = result.error
      throw error
    }

    if (!result.success) {
      throw new Error(result.message || 'Failed to update hotel')
    }

    return result.hotel
  }

  const deleteHotel = async (slug: string): Promise<void> => {
    const response = await fetch(`/api/hotels/delete/${slug}`, {
      method: 'DELETE',
    })

    const result = await response.json()

    if (!response.ok) {
      let errorMessage = result.message || `Failed to delete hotel: ${response.status}`

      if (result.error === 'NOT_FOUND') {
        errorMessage = 'Hotel not found or has already been deleted'
      }

      const error = new Error(errorMessage)
        ; (error as any).errorType = result.error
      throw error
    }

    if (!result.success) {
      throw new Error(result.message || 'Failed to delete hotel')
    }
  }

  // Handle modal success functions
  const handleAddHotelSuccess = async (hotelData: HotelFormData): Promise<void> => {
    try {
      const newHotel = await createHotel(hotelData)
      await fetchHotels(pagination.currentPage, activeTab)
      console.log('✅ Hotel created successfully:', newHotel.name)
      closeModal()
    } catch (error: any) {
      console.error('Error creating hotel:', error)
      throw error
    }
  }

  const handleEditHotelSuccess = async (hotelData: HotelFormData): Promise<void> => {
    if (!selectedHotel) {
      throw new Error('No hotel selected for editing')
    }

    try {
      const updatedHotel = await updateHotel(selectedHotel.slug || selectedHotel.hotelId, hotelData)
      await fetchHotels(pagination.currentPage, activeTab)
      console.log('✅ Hotel updated successfully:', updatedHotel.name)
      closeEditModal()
    } catch (error: any) {
      console.error('Error updating hotel:', error)
      throw error
    }
  }

  const handleConfirmDelete = async (): Promise<void> => {
    if (!selectedHotel || isDeleting) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteHotel(selectedHotel.slug || selectedHotel.hotelId)
      await fetchHotels(pagination.currentPage, activeTab)
      console.log('✅ Hotel deleted successfully:', selectedHotel.name)
      closeDeleteModal()
    } catch (error: any) {
      console.error('Error deleting hotel:', error)
      // Handle error - could show toast or error message
    } finally {
      setIsDeleting(false)
    }
  }

  const handlePageChange = (page: number) => {
    updateURL({ page })
  }

  // Update tabs with counts
  const tabsWithCounts = tabs.map(tab => ({
    ...tab,
    count: tabCounts[tab.id as keyof typeof tabCounts]
  }))

  // Build hotel stats
  const hotelStats = [
    {
      title: "Total Hotels",
      value: tabCounts.all,
      icon: Hotel,
      description: "All registered hotels",
      isLoading: countsLoading
    },
    {
      title: "Operational",
      value: tabCounts.operational,
      icon: Building2,
      description: "Currently active hotels",
      isLoading: countsLoading
    },
    {
      title: "Luxury & Ultra",
      value: tabCounts.luxury + tabCounts.ultraLuxury,
      icon: Star,
      description: "Premium hotels (5+ stars)",
      isLoading: countsLoading
    },
    {
      title: "For Sale",
      value: tabCounts.forSale,
      icon: ShoppingCart,
      description: "Investment opportunities",
      isLoading: countsLoading
    }
  ]

  return (
    <>
      <DataPageLayout
        title="Hotels"
        subtitle="Manage luxury hotels, resorts, and hospitality properties"
        primaryAction={{
          label: "Add Hotel",
          onClick: handleAddHotel,
          icon: Plus
        }}
        stats={hotelStats}
        searchConfig={{
          placeholder: "Search hotels by name, location, or hotel ID...",
          value: searchInput,
          onChange: setSearchInput,
          onSearch: handleSearch
        }}
        filters={[]}
        onClearFilters={handleClearFilters}
      >
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            {tabsWithCounts.map((tab) => {
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

          {tabsWithCounts.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading hotels...</span>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">{error}</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => fetchHotels()}
                  >
                    Try Again
                  </Button>
                </div>
              ) : hotels.length === 0 ? (
                <div className="text-center py-12">
                  <Hotel className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No hotels found</h3>
                  <p className="text-muted-foreground mb-4">
                    {tab.id === "all"
                      ? "Start by adding your first hotel to the system."
                      : `No hotels match the ${tab.label.toLowerCase()} criteria.`
                    }
                  </p>
                  {tab.id === "all" && (
                    <Button onClick={handleAddHotel}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Your First Hotel
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {/* Hotel Grid */}
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {hotels.map((hotel) => (
                      <HotelCard
                        key={hotel.hotelId}
                        hotel={hotel}
                        onView={handleViewHotel}
                        onEdit={handleEditHotel}
                        onDelete={handleDeleteHotel}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{" "}
                        {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{" "}
                        {pagination.totalCount} hotels
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
      <HotelFormModal
        isOpen={isAddModalOpen}
        onClose={closeModal}
        onSuccess={handleAddHotelSuccess}
        mode="add"
      />

      <HotelFormModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSuccess={handleEditHotelSuccess}
        hotel={selectedHotel}
        mode="edit"
      />

      <HotelViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        hotel={selectedHotel}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        itemType="hotel"
        itemName={selectedHotel?.name || ""}
        isDeleting={isDeleting}
      />
    </>
  )
}
