//components/developer-tabs.tsx
"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Building2, 
  Users, 
  Star, 
  Plus, 
  Loader2, 
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Shield,
  Award
} from "lucide-react"
import { DeveloperCard } from "./developer-card"
import { DeveloperFormModal } from "./developer-form-modal"
import { DeveloperViewModal } from "./developer-view-modal"
import { DeleteConfirmationModal } from "./delete-confirmation-modal"
import { DataPageLayout } from "@/components/ui/data-page-layout"
import type { StatCard, FilterConfig } from "@/components/ui/data-page-layout"

import type { IDeveloper, PaginationInfo, FiltersData, DeveloperTabsProps } from "@/types/developer"
import { useAuth } from '@/hooks/useAuth'
import { Collection } from '@/types/user'
import { CollectionCapability } from '@/lib/auth'

export function DeveloperTabs({ initialModalOpen = false, onModalClose }: DeveloperTabsProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const action = searchParams.get("action")
  
  // ALL HOOKS AT THE TOP - BEFORE ANY CONDITIONAL RETURNS
  const { 
    hasCollectionCapability, 
    loading: authLoading
  } = useAuth()

  // URL-based state - read from URL parameters
  const activeTab = searchParams.get("tab") || "all"
  const currentPage = parseInt(searchParams.get("page") || "1")
  const searchTerm = searchParams.get("search") || ""
  const selectedLocation = searchParams.get("location") || "all"
  const selectedSpecialization = searchParams.get("specialization") || "all"
  const selectedStatus = searchParams.get("status") || "all"
  const selectedYear = searchParams.get("year") || "all"

  // Local state for search input
  const [searchInput, setSearchInput] = useState(searchTerm)

  // Component state
  const [developers, setDevelopers] = useState<IDeveloper[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: currentPage,
    totalPages: 1,
    totalDevelopers: 0,
    limit: 20,
    hasNextPage: false,
    hasPrevPage: false,
  })
  const [filters, setFilters] = useState<FiltersData>({
    locations: [],
    specializations: [],
    establishedYears: [],
    statuses: [],
  })
  
  // Static tab counts
  const [tabCounts, setTabCounts] = useState({
    all: 0,
    verified: 0,
    active: 0,
    featured: 0,
    residential: 0
  })
  const [countsLoading, setCountsLoading] = useState(true)

  // Modal states - now driven by URL
  const [selectedDeveloper, setSelectedDeveloper] = useState<IDeveloper | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Derived modal states from URL
  const isAddModalOpen = action === "new"
  const isEditModalOpen = action === "edit"
  const isViewModalOpen = action === "view"
  const isDeleteModalOpen = action === "delete"

  // Ensure URL has proper parameters on first load
  useEffect(() => {
    const hasTabParam = searchParams.has("tab")
    const hasPageParam = searchParams.has("page")
    
    if (!hasTabParam || !hasPageParam) {
      const params = new URLSearchParams(searchParams)
      
      if (!hasTabParam) {
        params.set("tab", "all")
      }
      if (!hasPageParam) {
        params.set("page", "1")
      }
      
      router.replace(`${pathname}?${params.toString()}`)
    }
  }, [searchParams, pathname, router])

  // Sync search input with URL changes
  useEffect(() => {
    setSearchInput(searchTerm)
  }, [searchTerm])

  // Handle URL action parameter
  useEffect(() => {
    if (action === "edit" || action === "view" || action === "delete") {
      // Check if there's a developer slug in the URL
      const developerSlug = searchParams.get("slug")
      if (developerSlug && developers.length > 0) {
        const developerToSelect = developers.find(d => d.slug === developerSlug)
        if (developerToSelect) {
          setSelectedDeveloper(developerToSelect)
        }
      }
    } else {
      // Clear selection when no action or action is "new"
      setSelectedDeveloper(null)
    }
  }, [action, searchParams, developers])

  // Handle legacy initialModalOpen prop
  useEffect(() => {
    if (initialModalOpen && !action) {
      handleAddDeveloper()
    }
  }, [initialModalOpen, action])

  // Fetch tab counts once on mount
  useEffect(() => {
    fetchTabCounts()
  }, [])

  // Fetch data when URL parameters change
  useEffect(() => {
    fetchDevelopers(currentPage, activeTab)
  }, [activeTab, currentPage, searchTerm, selectedLocation, selectedSpecialization, selectedStatus, selectedYear])

  // Permission checks
  const canView = hasCollectionCapability(Collection.DEVELOPERS, CollectionCapability.VIEW_COLLECTION)
  const canAdd = hasCollectionCapability(Collection.DEVELOPERS, CollectionCapability.CREATE_CONTENT)
  const canEdit = hasCollectionCapability(Collection.DEVELOPERS, CollectionCapability.EDIT_CONTENT)
  const canDelete = hasCollectionCapability(Collection.DEVELOPERS, CollectionCapability.DELETE_CONTENT)

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

  // Build query parameters for API calls
  const buildQueryParams = (page: number = currentPage, tab: string = activeTab) => {
    const params = new URLSearchParams()
    params.set("page", page.toString())
    params.set("limit", "20")
    params.set("tab", tab)
    
    if (searchTerm) params.set("search", searchTerm)
    if (selectedLocation && selectedLocation !== "all") params.set("location", selectedLocation)
    if (selectedSpecialization && selectedSpecialization !== "all") params.set("specialization", selectedSpecialization)
    if (selectedStatus && selectedStatus !== "all") params.set("status", selectedStatus)
    if (selectedYear && selectedYear !== "all") params.set("year", selectedYear)
    
    return params.toString()
  }

  // Fetch tab counts
  const fetchTabCounts = async () => {
    setCountsLoading(true)
    try {
      const response = await fetch('/api/developers/counts')
      
      if (!response.ok) {
        if (response.status === 404) {
          setTabCounts({
            all: pagination.totalDevelopers || 0,
            verified: 0,
            active: 0,
            featured: 0,
            residential: 0
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
          verified: data.counts.verified || 0,
          active: data.counts.active || 0,
          featured: data.counts.featured || 0,
          residential: data.counts.residential || 0
        })
      }
    } catch (err: any) {
      setTabCounts({
        all: pagination.totalDevelopers || 0,
        verified: developers.filter(d => d.verified).length,
        active: developers.filter(d => d.isActive).length,
        featured: developers.filter(d => d.featured).length,
        residential: developers.filter(d => d.specialization.some(s => s.toLowerCase().includes('residential'))).length
      })
    } finally {
      setCountsLoading(false)
    }
  }

  // Fetch developers with filters and pagination
  const fetchDevelopers = async (page: number = 1, tab: string = activeTab) => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = buildQueryParams(page, tab)
      const response = await fetch(`/api/developers/fetch?${queryParams}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setDevelopers([])
          setPagination({
            currentPage: 1,
            totalPages: 1,
            totalDevelopers: 0,
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
        setDevelopers(data.data || [])
        setPagination(data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalDevelopers: 0,
          limit: 20,
          hasNextPage: false,
          hasPrevPage: false,
        })
        if (data.filters) {
          setFilters(data.filters)
        }
      } else {
        setDevelopers([])
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalDevelopers: 0,
          limit: 20,
          hasNextPage: false,
          hasPrevPage: false,
        })
        setError(data.message || 'No developers found')
      }
    } catch (err: any) {
      setDevelopers([])
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalDevelopers: 0,
        limit: 20,
        hasNextPage: false,
        hasPrevPage: false,
      })
      setError(`Unable to fetch developers: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // URL-driven modal handlers
  const handleAddDeveloper = () => {
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set("action", "new")
    router.push(currentUrl.toString())
  }

  const handleViewDeveloper = (developer: IDeveloper) => {
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set("action", "view")
    
      if (developer.slug) {
        currentUrl.searchParams.set("slug", developer.slug)
      }
    
    router.push(currentUrl.toString())
  }

  const handleEditDeveloper = (developer: IDeveloper) => {
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set("action", "edit")
    if (developer.slug) {
        currentUrl.searchParams.set("slug", developer.slug)
      }
    router.push(currentUrl.toString())
  }

  const handleDeleteDeveloper = (developer: IDeveloper) => {
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set("action", "delete")
     if (developer.slug) {
        currentUrl.searchParams.set("slug", developer.slug)
      }
    router.push(currentUrl.toString())
  }

  // Close modal by removing action from URL
  const closeModal = () => {
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.delete("action")
    currentUrl.searchParams.delete("slug")
    router.replace(currentUrl.toString())
    
    // Call legacy onModalClose if provided
    if (onModalClose) {
      onModalClose()
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedDeveloper || isDeleting) {
      return
    }
    
    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/developers/delete/${selectedDeveloper.slug}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchDevelopers(pagination.currentPage, activeTab)
        closeModal()
      } else {
        throw new Error(`Failed to delete developer: ${response.status}`)
      }
    } catch (error: any) {
      alert(`Failed to delete developer: ${error.message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  // Event handlers
  const handleTabChange = (tab: string) => {
    updateURL({ tab })
  }

  const handleClearFilters = () => {
    updateURL({
      search: "",
      location: "all",
      specialization: "all",
      status: "all",
      year: "all",
      page: "1"
    })
  }

  const handleLocationChange = (value: string) => {
    updateURL({ location: value })
  }

  const handleSpecializationChange = (value: string) => {
    updateURL({ specialization: value })
  }

  const handleStatusChange = (value: string) => {
    updateURL({ status: value })
  }

  const handleYearChange = (value: string) => {
    updateURL({ year: value })
  }

  const handlePageChange = (page: number) => {
    updateURL({ page })
  }

  const getTabCount = (tab: string) => {
    if (countsLoading) return 0
    return tabCounts[tab as keyof typeof tabCounts] || 0
  }

  // NOW CONDITIONAL RETURNS CAN SAFELY BE USED
  
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading authentication...</p>
        </div>
      </div>
    )
  }
  
  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground mb-4">
            You don't have permission to view developers.
          </p>
        </div>
      </div>
    )
  }

  // Configure stats for DataPageLayout
  const developerStats: StatCard[] = [
    {
      title: "Total Developers",
      value: pagination.totalDevelopers,
      icon: Building2,
      description: "Across all locations",
      isLoading: loading && developers.length === 0
    },
    {
      title: "Verified Developers",
      value: developers.filter(d => d.verified).length,
      icon: CheckCircle,
      description: "Verified companies",
      isLoading: loading && developers.length === 0
    },
    {
      title: "Featured Developers",
      value: developers.filter(d => d.featured).length,
      icon: Star,
      description: "Featured partners",
      isLoading: loading && developers.length === 0
    },
    {
      title: "Award Winners",
      value: developers.filter(d => d.awards && d.awards.length > 0).length,
      icon: Award,
      description: "Award-winning companies",
      isLoading: loading && developers.length === 0
    }
  ]

  // Configure filters for DataPageLayout
  const developerFilters: FilterConfig[] = [
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
      label: "Specialization", 
      value: selectedSpecialization,
      placeholder: "Specialization",
      options: [
        { value: "all", label: "All Specializations" },
        { value: "residential", label: "Residential" },
        { value: "commercial", label: "Commercial" },
        { value: "industrial", label: "Industrial" },
        { value: "mixed-use", label: "Mixed Use" },
        { value: "luxury", label: "Luxury" },
        { value: "affordable", label: "Affordable" }
      ],
      onChange: handleSpecializationChange
    },
    {
      label: "Status",
      value: selectedStatus,
      placeholder: "Status",
      options: [
        { value: "all", label: "All Status" },
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
        { value: "verified", label: "Verified" },
        { value: "featured", label: "Featured" }
      ],
      onChange: handleStatusChange
    },
    {
      label: "Established",
      value: selectedYear,
      placeholder: "Year",
      options: [
        { value: "all", label: "All Years" },
        { value: "recent", label: "Last 5 years" },
        { value: "established", label: "10+ years" },
        { value: "veteran", label: "20+ years" }
      ],
      onChange: handleYearChange
    }
  ]

  return (
    <>
      <DataPageLayout
        title="Developers"
        subtitle="Manage real estate developers and construction companies"
        primaryAction={{
          label: "Add Developer",
          onClick: handleAddDeveloper,
          icon: Plus
        }}
        stats={developerStats}
        searchConfig={{
          placeholder: "Search developers by name, location, or specialization...",
          value: searchInput,
          onChange: setSearchInput,
          onSearch: () => updateURL({ search: searchInput })
        }}
        filters={developerFilters}
        onClearFilters={handleClearFilters}
      >
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">All Developers</span>
              <span className="sm:hidden">All</span>
              {getTabCount("all") > 0 && (
                <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                  {getTabCount("all")}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="verified" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Verified</span>
              <span className="sm:hidden">Ver.</span>
              {getTabCount("verified") > 0 && (
                <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                  {getTabCount("verified")}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Active</span>
              <span className="sm:hidden">Act.</span>
              {getTabCount("active") > 0 && (
                <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                  {getTabCount("active")}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="featured" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Featured</span>
              <span className="sm:hidden">Feat.</span>
              {getTabCount("featured") > 0 && (
                <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                  {getTabCount("featured")}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="residential" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Residential</span>
              <span className="sm:hidden">Res.</span>
              {getTabCount("residential") > 0 && (
                <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                  {getTabCount("residential")}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {loading && developers.length === 0 ? (
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
            ) : developers.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No developers found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {error ? (
                      <span className="text-red-500">{error}</span>
                    ) : searchTerm || selectedLocation !== "all" || selectedSpecialization !== "all" || selectedStatus !== "all" ? (
                      "Try adjusting your search or filters"
                    ) : (
                      "Get started by creating your first developer"
                    )}
                  </p>
                  {error && (
                    <Button onClick={() => fetchDevelopers(1, activeTab)} variant="outline" className="mb-2">
                      <Loader2 className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                      Try Again
                    </Button>
                  )}
                  <Button onClick={handleAddDeveloper}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Developer
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {developers.map((developer) => {
                    const enhancedDeveloper = {
                      ...developer,
                      isActive: developer.isActive ?? true,
                      featured: developer.featured ?? false,
                      totalProjects: developer.totalProjects ?? undefined,
                      completedProjects: developer.completedProjects ?? undefined,
                      ongoingProjects: developer.ongoingProjects ?? undefined,
                    }
                    return (
                      <DeveloperCard
                        key={developer._id}
                        developer={enhancedDeveloper}
                        onView={handleViewDeveloper}
                        onEdit={canEdit ? handleEditDeveloper : undefined}
                        onDelete={canDelete ? handleDeleteDeveloper : undefined}
                        isDeleting={isDeleting && selectedDeveloper?._id === developer._id}
                      />
                    )
                  })}
                </div>

                {pagination.totalDevelopers > pagination.limit && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{" "}
                      {Math.min(pagination.currentPage * pagination.limit, pagination.totalDevelopers)} of{" "}
                      {pagination.totalDevelopers} developers
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

          {/* Simplified other tabs */}
          <TabsContent value="verified" className="space-y-4">
            {developers.filter(d => d.verified).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No verified developers found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Try adjusting your filters or create a new verified developer
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {developers.filter(d => d.verified).map((developer) => {
                  const enhancedDeveloper = {
                    ...developer,
                    isActive: developer.isActive ?? true,
                    featured: developer.featured ?? false,
                    totalProjects: developer.totalProjects ?? undefined,
                    completedProjects: developer.completedProjects ?? undefined,
                    ongoingProjects: developer.ongoingProjects ?? undefined,
                  }
                  return (
                    <DeveloperCard
                      key={developer._id}
                      developer={enhancedDeveloper}
                      onView={handleViewDeveloper}
                      onEdit={canEdit ? handleEditDeveloper : undefined}
                      onDelete={canDelete ? handleDeleteDeveloper : undefined}
                      isDeleting={isDeleting && selectedDeveloper?._id === developer._id}
                    />
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            <div className="text-center py-8">Active developers content</div>
          </TabsContent>

          <TabsContent value="featured" className="space-y-4">
            <div className="text-center py-8">Featured developers content</div>
          </TabsContent>

          <TabsContent value="residential" className="space-y-4">
            <div className="text-center py-8">Residential developers content</div>
          </TabsContent>
        </Tabs>
      </DataPageLayout>

      {/* URL-Driven Modals - Only render when open */}
      {isAddModalOpen && (
        <DeveloperFormModal
          isOpen={isAddModalOpen}
          onClose={closeModal}
          mode="add"
        />
      )}

      {isEditModalOpen && selectedDeveloper && (
        <DeveloperFormModal
          isOpen={isEditModalOpen}
          onClose={closeModal}
          developer={selectedDeveloper}
          mode="edit"
        />
      )}

      {isViewModalOpen && selectedDeveloper && (
        <DeveloperViewModal
          isOpen={isViewModalOpen}
          onClose={closeModal}
          developer={selectedDeveloper}
        />
      )}

      {isDeleteModalOpen && selectedDeveloper && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={closeModal}
          onConfirm={handleConfirmDelete}
          itemName={selectedDeveloper?.name || ""}
          itemType="Developer"
          isDeleting={isDeleting}
        />
      )}
    </>
  )
}