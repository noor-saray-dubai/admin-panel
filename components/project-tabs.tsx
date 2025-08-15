"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Star, Rocket, FileText, Plus, Loader2 } from "lucide-react"
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



interface Developer {
  id: string;
  name: string;
  slug?: string;
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
  createdAt: string;
  updatedAt: string;
}

interface ProjectTabsProps {
  initialModalOpen?: boolean
  onModalClose?: () => void
}

export function ProjectTabs({ initialModalOpen = false, onModalClose }: ProjectTabsProps) {
  const [activeTab, setActiveTab] = useState("all")
  const [projects, setProjects] = useState<IProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(initialModalOpen)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<IProject | null>(null)

  // Fetch projects from API
  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/projects/fetch')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch projects')
      }

      if (data.success) {
        setProjects(data.projects)
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

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (initialModalOpen) {
      setIsAddModalOpen(true)
    }
  }, [initialModalOpen])

  const filterProjects = (category: string) => {
    if (category === "all") return projects
    if (category === "elite") return projects.filter((p) => p.flags.elite)
    if (category === "new-launch") return projects.filter((p) => p.status === "Launching Soon")
    return projects
  }

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
    // try {
    //   if (selectedProject) {
    //     // Edit existing project - you'll need to implement PUT/PATCH endpoint
    //     const response = await fetch(`/api/projects/${selectedProject._id}`, {
    //       method: 'PUT',
    //       headers: {
    //         'Content-Type': 'application/json',
    //       },
    //       body: JSON.stringify(projectData),
    //     })

    //     if (response.ok) {
    //       // Refresh projects list
    //       await fetchProjects()
    //     }
    //   } else {
    //     // Add new project - you'll need to implement POST endpoint
    //     const response = await fetch('/api/projects', {
    //       method: 'POST',
    //       headers: {
    //         'Content-Type': 'application/json',
    //       },
    //       body: JSON.stringify(projectData),
    //     })

    //     if (response.ok) {
    //       // Refresh projects list
    //       await fetchProjects()
    //     }
    //   }
    // } catch (error) {
    //   console.error('Error saving project:', error)
    //   // You might want to show an error toast here
    // }
  }

  const handleConfirmDelete = async () => {
    if (selectedProject) {
      try {
        // You'll need to implement DELETE endpoint
        const response = await fetch(`/api/projects/delet/${selectedProject.slug}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          // Refresh projects list
          await fetchProjects()
        }
      } catch (error) {
        console.error('Error deleting project:', error)
        // You might want to show an error toast here
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

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading projects...</span>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-red-500 mb-4">Error: {error}</p>
        <Button onClick={fetchProjects}>
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-fit grid-cols-3">
            <TabsTrigger value="all" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>All Projects ({filterProjects("all").length})</span>
            </TabsTrigger>
            <TabsTrigger value="elite" className="flex items-center space-x-2">
              <Star className="h-4 w-4" />
              <span>Elite ({filterProjects("elite").length})</span>
            </TabsTrigger>
            <TabsTrigger value="new-launch" className="flex items-center space-x-2">
              <Rocket className="h-4 w-4" />
              <span>New Launch ({filterProjects("new-launch").length})</span>
            </TabsTrigger>
          </TabsList>

          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>

        <TabsContent value="all" className="space-y-4">
          {filterProjects("all").length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No projects found</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filterProjects("all").map((project) => (
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
          {filterProjects("elite").length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No elite projects found</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filterProjects("elite").map((project) => (
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
          {filterProjects("new-launch").length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No new launch projects found</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filterProjects("new-launch").map((project) => (
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
    </>
  )
}