// components/project-tabs.tsx
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
  Star,
  Plus, 
  Loader2, 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Rocket,
  FileText,
  TrendingUp,
  CheckCircle,
  Edit2
} from "lucide-react"

import type { IProject, ProjectFormData } from "@/types/projects"
import { ProjectFormModal } from "./project"
import { DeleteConfirmationModal } from "./delete-confirmation-modal"
import { ProjectCard } from "./project-card"
import { ProjectViewModal } from "./project-view-modal"
import { DataPageLayout } from "@/components/ui/data-page-layout"
import type { StatCard, FilterConfig } from "@/components/ui/data-page-layout"

// Basic interfaces for project management
interface ProjectPaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ProjectFiltersData {
  locations: string[];
  developers: string[];
  types: string[];
  statuses: string[];
}

export function ProjectTabs() {
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
  
  // Local state for search input (for immediate typing feedback)
  const [searchInput, setSearchInput] = useState(searchTerm)
  
  // Component state (non-URL)
  const [projects, setProjects] = useState<IProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<ProjectPaginationInfo>({
    currentPage: currentPage,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
    hasNextPage: false,
    hasPrevPage: false,
  })
  const [filters, setFilters] = useState<ProjectFiltersData>({
    locations: [],
    developers: [],
    types: [],
    statuses: [],
  })
  
  // Static tab counts (independent of filters)
  const [tabCounts, setTabCounts] = useState({
    all: 0,
    elite: 0,
    featured: 0,
    launched: 0,
    completed: 0,
    draft: 0
  })
  const [countsLoading, setCountsLoading] = useState(true)

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedProject, setSelectedProject] = useState<IProject | null>(null)

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
    
    return params.toString()
  }

  // Fetch tab counts (static, independent of filters)
  const fetchTabCounts = async () => {
    setCountsLoading(true)
    try {
      const response = await fetch('/api/projects/counts')
      
      if (!response.ok) {
        // If API doesn't exist yet, use fallback
        if (response.status === 404) {
          setTabCounts({
            all: pagination.totalCount || 0,
            elite: 0,
            featured: 0,
            launched: 0,
            completed: 0,
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
          elite: data.counts.elite || 0,
          featured: data.counts.featured || 0,
          launched: data.counts.launched || 0,
          completed: data.counts.completed || 0,
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
        elite: 0,
        featured: 0,
        launched: 0,
        completed: 0,
        draft: 0
      })
    } finally {
      setCountsLoading(false)
    }
  }

  // Fetch projects with filters and pagination
  const fetchProjects = async (page: number = 1, tab: string = activeTab) => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = buildQueryParams(page, tab)
      const response = await fetch(`/api/projects/fetch?${queryParams}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setProjects([])
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
        setProjects(result.data.projects || [])
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
            locations: result.data.filters.filterOptions.locations || [],
            developers: result.data.filters.filterOptions.developers || [],
            types: result.data.filters.filterOptions.types || [],
            statuses: result.data.filters.filterOptions.statuses || []
          })
        }
      } else {
        setProjects([])
        setError(result.message || 'No projects found')
      }
    } catch (err: any) {
      console.warn('Projects API not available:', err.message)
      setProjects([])
      setError(`Unable to fetch projects: ${err.message}`)
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
    fetchProjects(currentPage, activeTab)
  }, [activeTab, currentPage, searchTerm, selectedLocation, selectedDeveloper, selectedType, selectedStatus])

  // Handle URL action parameter
  useEffect(() => {
    if (action === "new") {
      setIsAddModalOpen(true)
    } else if (action === "edit") {
      // Check if there's a project slug in the URL to edit
      const projectSlug = searchParams.get("slug")
      if (projectSlug && projects.length > 0) {
        const projectToEdit = projects.find(p => p.slug === projectSlug)
        if (projectToEdit) {
          setSelectedProject(projectToEdit)
          setIsEditModalOpen(true)
        }
      }
    }
  }, [action, searchParams, projects])

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
      developer: "all",
      type: "all",
      status: "all",
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

  // Pagination handlers
  const handlePageChange = (page: number) => {
    updateURL({ page })
  }

  const handleAddProject = () => {
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
    setSelectedProject(null)
  }

  const closeViewModal = () => {
    setIsViewModalOpen(false)
    setSelectedProject(null)
  }

  const closeDeleteModal = () => {
    if (isDeleting) return // Don't close if deletion is in progress
    setIsDeleteModalOpen(false)
    setIsDeleting(false)
    setSelectedProject(null)
  }

  const handleViewProject = (project: IProject) => {
    setSelectedProject(project)
    setIsViewModalOpen(true)
  }

  const handleEditProject = (project: IProject) => {
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set("action", "edit")
    currentUrl.searchParams.set("slug", project.slug)
    router.push(currentUrl.toString())
  }

  const handleDeleteProject = (project: IProject) => {
    setSelectedProject(project)
    setIsDeleteModalOpen(true)
  }

  // API functions for project operations
  const createProject = async (projectData: ProjectFormData): Promise<IProject> => {
    const response = await fetch('/api/projects/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData)
    })

    const result = await response.json()
    
    if (!response.ok) {
      // Create detailed error message based on error type
      let errorMessage = result.message || `Failed to create project: ${response.status}`
      
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
        errorMessage = result.message || 'A project with this name already exists'
      } else if (result.error === 'RATE_LIMITED') {
        errorMessage = 'Too many requests. Please try again later.'
      } else if (result.error === 'EMPTY_DATA') {
        errorMessage = 'No project data provided. Please fill out the form.'
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
      throw new Error(result.message || 'Failed to create project')
    }
    
    return result.project
  }

  const updateProject = async (slug: string, projectData: Partial<ProjectFormData>): Promise<IProject> => {
    const response = await fetch(`/api/projects/update/${slug}`, {
      method: 'PUT', 
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData)
    })

    const result = await response.json()
    
    if (!response.ok) {
      // Create detailed error message based on error type
      let errorMessage = result.message || `Failed to update project: ${response.status}`
      
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
        errorMessage = result.message || 'A project with this name already exists'
      } else if (result.error === 'NOT_FOUND') {
        errorMessage = 'Project not found or has been deleted'
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
      throw new Error(result.message || 'Failed to update project')
    }
    
    return result.project
  }

  const deleteProject = async (slug: string): Promise<void> => {
    const response = await fetch(`/api/projects/delete/${slug}`, {
      method: 'DELETE',
    })

    const result = await response.json()
    
    if (!response.ok) {
      let errorMessage = result.message || `Failed to delete project: ${response.status}`
      
      if (result.error === 'NOT_FOUND') {
        errorMessage = 'Project not found or has already been deleted'
      } else if (result.error === 'DATABASE_CONNECTION_ERROR') {
        errorMessage = 'Database connection failed. Please try again.'
      }
      
      const error = new Error(errorMessage)
      ;(error as any).errorType = result.error
      throw error
    }
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to delete project')
    }
  }

  // Handle add modal success
  const handleAddProjectSuccess = async (projectData: ProjectFormData): Promise<void> => {
    try {
      const newProject = await createProject(projectData)
      // Refresh the projects list to show new data
      await fetchProjects(pagination.currentPage, activeTab)
      // Show success message
      console.log('✅ Project created successfully:', newProject.name)
      // Close the modal
      closeModal()
    } catch (error: any) {
      console.error('Error creating project:', error)
      throw error // Re-throw so the form can handle it
    }
  }

  // Handle edit modal success  
  const handleEditProjectSuccess = async (projectData: ProjectFormData): Promise<void> => {
    if (!selectedProject) {
      throw new Error('No project selected for editing')
    }
    
    try {
      const updatedProject = await updateProject(selectedProject.slug, projectData)
      // Refresh the projects list to show updated data
      await fetchProjects(pagination.currentPage, activeTab)
      // Show success message
      console.log('✅ Project updated successfully:', updatedProject.name)
      // Close the modal
      closeEditModal()
    } catch (error: any) {
      console.error('Error updating project:', error)
      throw error // Re-throw so the form can handle it
    }
  }

  // Handle confirm delete
  const handleConfirmDelete = async (): Promise<void> => {
    if (!selectedProject || isDeleting) {
      return // Prevent multiple delete attempts
    }
    
    setIsDeleting(true)
    
    try {
      await deleteProject(selectedProject.slug)
      // Refresh the projects list to show updated data
      await fetchProjects(pagination.currentPage, activeTab)
      // Show success message
      console.log('✅ Project deleted successfully:', selectedProject.name)
      
      // Close the modal after successful deletion
      setIsDeleteModalOpen(false)
      setSelectedProject(null)
    } catch (error: any) {
      console.error('Error deleting project:', error)
      // You can add toast notification here if you have a toast system
      alert(`Failed to delete project: ${error.message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  // Tab data configuration with static counts
  const tabs = [
    { id: "all", label: "All Projects", icon: Building, count: countsLoading ? 0 : tabCounts.all },
    { id: "elite", label: "Elite", icon: Star, count: countsLoading ? 0 : tabCounts.elite },
    { id: "featured", label: "Featured", icon: Rocket, count: countsLoading ? 0 : tabCounts.featured },
    { id: "launched", label: "Launched", icon: CheckCircle, count: countsLoading ? 0 : tabCounts.launched },
    { id: "completed", label: "Completed", icon: CheckCircle, count: countsLoading ? 0 : tabCounts.completed },
    { id: "draft", label: "Draft", icon: Filter, count: countsLoading ? 0 : tabCounts.draft }
  ]

  // Configure stats for DataPageLayout
  const projectStats: StatCard[] = [
    {
      title: "Total Projects",
      value: pagination.totalCount,
      icon: Building,
      description: "Across all locations",
      isLoading: loading && projects.length === 0
    },
    {
      title: "Elite",
      value: 0,
      icon: Star,
      description: "Premium projects",
      isLoading: loading && projects.length === 0
    },
    {
      title: "Featured",
      value: 0,
      icon: Rocket,
      description: "Highlighted projects",
      isLoading: loading && projects.length === 0
    },
    {
      title: "Portfolio Value",
      value: "AED 0",
      icon: TrendingUp,
      description: "Total estimated value",
      isLoading: loading && projects.length === 0
    }
  ]

  // Configure filters for DataPageLayout
  const projectFilters: FilterConfig[] = [
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
      label: "Developer",
      value: selectedDeveloper,
      placeholder: "Developer",
      options: [
        { value: "all", label: "All Developers" },
        ...filters.developers.map(developer => ({ value: developer, label: developer }))
      ],
      onChange: handleDeveloperChange
    },
    {
      label: "Type",
      value: selectedType,
      placeholder: "Type",
      options: [
        { value: "all", label: "All Types" },
        ...filters.types.map(type => ({ value: type, label: type }))
      ],
      onChange: handleTypeChange
    },
    {
      label: "Status",
      value: selectedStatus,
      placeholder: "Status",
      options: [
        { value: "all", label: "All Statuses" },
        ...filters.statuses.map(status => ({ value: status, label: status }))
      ],
      onChange: handleStatusChange
    }
  ]

  return (
    <>
      <DataPageLayout
        title="Projects"
        subtitle="Manage real estate projects and listings"
        primaryAction={{
          label: "Add Project",
          onClick: handleAddProject,
          icon: Plus
        }}
        stats={projectStats}
        searchConfig={{
          placeholder: "Search projects by name, location, or developer...",
          value: searchInput,
          onChange: setSearchInput,
          onSearch: handleSearch
        }}
        filters={projectFilters}
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
                <span className="ml-2">Loading projects...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{error}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => fetchProjects()}
                >
                  Try Again
                </Button>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12">
                <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No projects found</h3>
                <p className="text-muted-foreground mb-4">
                  {tab.id === "all" 
                    ? "Start by adding your first project to the system."
                    : `No projects match the ${tab.label.toLowerCase()} criteria.`
                  }
                </p>
                {tab.id === "all" && (
                  <Button onClick={handleAddProject}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Project
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Project Grid using ProjectCard component */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {projects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onView={handleViewProject}
                      onEdit={handleEditProject}
                      onDelete={handleDeleteProject}
                      isDeleting={isDeleting && selectedProject?.id === project.id}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{" "}
                      {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{" "}
                      {pagination.totalCount} projects
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
      {/* Add Project Modal - Only render when open */}
      {isAddModalOpen && (
        <ProjectFormModal 
          isOpen={isAddModalOpen} 
          onClose={closeModal} 
          mode="add"
          onSuccess={handleAddProjectSuccess}
        />
      )}

      {/* Edit Project Modal - Only render when open */}
      {isEditModalOpen && selectedProject && (
        <ProjectFormModal 
          isOpen={isEditModalOpen} 
          onClose={closeEditModal} 
          mode="edit"
          project={selectedProject}
          onSuccess={handleEditProjectSuccess}
        />
      )}

      {/* View Project Modal */}
      {isViewModalOpen && selectedProject && (
        <ProjectViewModal
          isOpen={isViewModalOpen}
          onClose={closeViewModal}
          project={selectedProject}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedProject && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          onConfirm={handleConfirmDelete}
          itemName={selectedProject.name}
          itemType="Project"
          isDeleting={isDeleting}
        />
      )}
    </>
  )
}