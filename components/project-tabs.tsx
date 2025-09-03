"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Star, 
  Rocket, 
  FileText, 
  Plus, 
  Loader2, 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Building
} from "lucide-react"
import { ProjectCard } from "./project-card"
import { ProjectFormModal } from "./project-form-modal"
import { ProjectViewModal } from "./project-view-modal"
import { DeleteConfirmationModal } from "./delete-confirmation-modal"

// Define types based on your schema
interface PaymentMilestone {
  milestone: string;
  percentage: string;
}

interface PaymentPlan {
  booking: string;
  construction: PaymentMilestone[];
  handover: string;
}

interface NearbyPlace {
  name: string;
  distance: string;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface LocationDetails {
  description: string;
  nearby: NearbyPlace[];
  coordinates: Coordinates;
}

interface AmenityCategory {
  category: string;
  items: string[];
}

interface UnitType {
  type: string;
  size: string;
  price: string;
}

interface IAuditInfo {
  email: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

interface IProject {
  _id: string;
  id: string;
  slug: string;
  name: string;
  location: string;
  locationSlug: string;
  type: string;
  status: string;
  statusSlug: string;
  developer: string;
  developerSlug: string;
  price: string;
  priceNumeric: number;
  image: string;
  description: string;
  overview: string;
  completionDate: string;
  totalUnits: number;
  amenities: AmenityCategory[];
  unitTypes: UnitType[];
  gallery: string[];
  paymentPlan: PaymentPlan;
  locationDetails: LocationDetails;
  categories: string[];
  featured: boolean;
  launchDate: string;
  registrationOpen: boolean;
  flags: {
    elite: boolean;
    exclusive: boolean;
    featured: boolean;
    highValue: boolean;
  };
  createdBy: IAuditInfo;
  updatedBy: IAuditInfo;
  version: number;
  isActive: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalProjects: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface FiltersData {
  locations: string[];
  developers: string[];
  types: string[];
  statuses: string[];
}

interface ProjectTabsProps {
  initialModalOpen?: boolean
  onModalClose?: () => void
}

export function ProjectTabs({ initialModalOpen = false, onModalClose }: ProjectTabsProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const action = searchParams.get("action")

  const [activeTab, setActiveTab] = useState("all")
  const [projects, setProjects] = useState<IProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalProjects: 0,
    limit: 20,
    hasNextPage: false,
    hasPrevPage: false,
  })
  const [filters, setFilters] = useState<FiltersData>({
    locations: [],
    developers: [],
    types: [],
    statuses: [],
  })

  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("all")
  const [selectedDeveloper, setSelectedDeveloper] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(initialModalOpen)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<IProject | null>(null)

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
    
    return params.toString()
  }

  // Fetch projects with filters and pagination
  const fetchProjects = async (page: number = 1, tab: string = activeTab) => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = buildQueryParams(page, tab)
      const response = await fetch(`/api/projects/fetch?${queryParams}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch projects')
      }

      if (data.success) {
        setProjects(data.projects)
        setPagination(data.pagination)
        if (data.filters) {
          setFilters(data.filters)
        }
      } else {
        throw new Error(data.message || 'API returned unsuccessful response')
      }
    } catch (err: any) {
      console.error('Error fetching projects:', err)
      setError(err.message || 'Failed to fetch projects')
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchProjects()
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
    fetchProjects(1, tab) // Reset to page 1 when changing tabs
  }

  // Handle filter changes
  const handleSearch = () => {
    fetchProjects(1, activeTab) // Reset to page 1 when searching
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setSelectedLocation("all")
    setSelectedDeveloper("all")
    setSelectedType("all")
    setSelectedStatus("all")
    fetchProjects(1, activeTab)
  }

  // Pagination handlers
  const handlePageChange = (page: number) => {
    fetchProjects(page, activeTab)
  }

  // Modal handlers
  const handleView = (project: IProject) => {
    setSelectedProject(project)
    setIsViewModalOpen(true)
  }

  const handleEdit = (project: IProject) => {
    setSelectedProject(project)
    setIsEditModalOpen(true)
  }

  const handleDelete = (project: IProject) => {
    setSelectedProject(project)
    setIsDeleteModalOpen(true)
  }

  const handleSaveProject = async (projectData: any) => {
    fetchProjects(pagination.currentPage, activeTab) // Refresh current page
  }

  const handleConfirmDelete = async () => {
    if (selectedProject) {
      try {
        const response = await fetch(`/api/projects/delete/${selectedProject.slug}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          fetchProjects(pagination.currentPage, activeTab)
        }
      } catch (error) {
        console.error('Error deleting project:', error)
      }
    }
    setIsDeleteModalOpen(false)
    setSelectedProject(null)
  }

  const handleAddModalClose = () => {
    setIsAddModalOpen(false)
    if (onModalClose) {
      onModalClose()
    }
  }

  // Calculate stats for current filtered results
  const getTabCount = (tab: string) => {
    // This would ideally come from the API, but for now we'll use the current data
    if (tab === "all") return pagination.totalProjects
    if (tab === "elite") return projects.filter((p) => p.flags.elite).length
    if (tab === "new-launch") return projects.filter((p) => p.status === "Launching Soon").length
    return 0
  }

  // Calculate stats
  const projectStats = [
    {
      title: "Total Projects",
      value: pagination.totalProjects.toString(),
      icon: FileText,
      color: "text-blue-600",
    },
    {
      title: "Active Projects",
      value: projects.filter(p => p.isActive).length.toString(),
      icon: Building,
      color: "text-green-600",
    },
    {
      title: "Elite Projects",
      value: projects.filter(p => p.flags.elite).length.toString(),
      icon: Star,
      color: "text-yellow-600",
    },
    {
      title: "Featured",
      value: projects.filter(p => p.featured).length.toString(),
      icon: Rocket,
      color: "text-purple-600",
    },
  ]

  // Loading state
  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading projects...</span>
      </div>
    )
  }

  // Error state
  if (error && projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-red-500 mb-4">Error: {error}</p>
        <Button onClick={() => fetchProjects(1, activeTab)}>
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">Manage real estate projects and listings</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {projectStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
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

            <Select value={selectedDeveloper} onValueChange={setSelectedDeveloper}>
              <SelectTrigger>
                <SelectValue placeholder="Developer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Developers</SelectItem>
                {filters.developers.map((developer) => (
                  <SelectItem key={developer} value={developer}>
                    {developer}
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
                {filters.types.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
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
          <TabsList className="grid w-fit grid-cols-3">
            <TabsTrigger value="all" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>All Projects ({getTabCount("all")})</span>
            </TabsTrigger>
            <TabsTrigger value="elite" className="flex items-center space-x-2">
              <Star className="h-4 w-4" />
              <span>Elite ({getTabCount("elite")})</span>
            </TabsTrigger>
            <TabsTrigger value="new-launch" className="flex items-center space-x-2">
              <Rocket className="h-4 w-4" />
              <span>New Launch ({getTabCount("new-launch")})</span>
            </TabsTrigger>
          </TabsList>

          {/* Results Summary */}
          <div className="text-sm text-muted-foreground">
            Showing {projects.length} of {pagination.totalProjects} projects
            {searchTerm && ` for "${searchTerm}"`}
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
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
          ) : projects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No projects found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm || selectedLocation !== "all" || selectedDeveloper !== "all" || selectedType !== "all"
                    ? "Try adjusting your search or filters"
                    : "Get started by creating your first project"}
                </p>
                <Button onClick={() => setIsAddModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="elite" className="space-y-4">
          {loading ? (
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
          ) : projects.filter(p => p.flags.elite).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Star className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No elite projects found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Try adjusting your filters or create a new elite project
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.filter(p => p.flags.elite).map((project) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="new-launch" className="space-y-4">
          {loading ? (
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
          ) : projects.filter(p => p.status === "Launching Soon").length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Rocket className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No new launch projects found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Try adjusting your filters or create a new launching project
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.filter(p => p.status === "Launching Soon").map((project) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Pagination - Only show if more than 20 projects */}
      {pagination.totalProjects > 20 && (
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
      {pagination.totalProjects > 20 && (
        <div className="text-center text-sm text-muted-foreground">
          Page {pagination.currentPage} of {pagination.totalPages} 
          ({pagination.totalProjects} total projects)
        </div>
      )}

      {/* Modals */}
      <ProjectFormModal
        isOpen={isAddModalOpen}
        onClose={handleAddModalClose}
        onSave={handleSaveProject}
        mode="add"
      />

      <ProjectFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedProject(null)
        }}
        onSave={handleSaveProject}
        project={selectedProject}
        mode="edit"
      />

      <ProjectViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedProject(null)
        }}
        project={selectedProject}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedProject(null)
        }}
        onConfirm={handleConfirmDelete}
        itemName={selectedProject?.name || ""}
        itemType="Project"
      />
    </div>
  )
}