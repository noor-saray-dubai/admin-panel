"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Star, Rocket, FileText, Plus } from "lucide-react"
import { ProjectCard } from "./project-card"
import { ProjectFormModal } from "./project-form-modal"
import { ProjectViewModal } from "./project-view-modal"
import { DeleteConfirmationModal } from "./delete-confirmation-modal"

// Sample real estate projects data
const realEstateProjects = [
  {
    id: 105,
    slug: "danube-aspirz",
    name: "Danube Aspirz",
    location: "Dubai",
    type: "Convertible Hotel Apartments and Offices",
    status: "Under Construction",
    developer: "Danube Properties",
    price: "Starting from AED 850K",
    priceNumeric: 850000,
    image: "https://res.cloudinary.com/dvrvydbzl/image/upload/v1752125662/cover_n2wyka.png",
    description:
      "Danube Aspirz offers modern convertible hotel apartments and office units in a prime Dubai location. The project features premium amenities, flexible living and working spaces, and excellent connectivity.",
    completionDate: "2028-12-31T00:00:00.000Z",
    totalUnits: 506,
    featured: false,
    flags: {
      elite: true,
      exclusive: false,
      featured: false,
      highValue: true,
    },
  },
  {
    id: 106,
    slug: "emaar-creek-beach",
    name: "Emaar Creek Beach",
    location: "Dubai Creek Harbour",
    type: "Luxury Apartments",
    status: "Launching Soon",
    developer: "Emaar Properties",
    price: "Starting from AED 1.2M",
    priceNumeric: 1200000,
    image: "/placeholder.svg?height=300&width=400",
    description:
      "Premium waterfront living with stunning creek views and world-class amenities in Dubai Creek Harbour.",
    completionDate: "2027-06-30T00:00:00.000Z",
    totalUnits: 320,
    featured: true,
    flags: {
      elite: false,
      exclusive: true,
      featured: true,
      highValue: true,
    },
  },
  {
    id: 107,
    slug: "sobha-hartland-villas",
    name: "Sobha Hartland Villas",
    location: "Mohammed Bin Rashid City",
    type: "Luxury Villas",
    status: "Ready to Move",
    developer: "Sobha Realty",
    price: "Starting from AED 3.5M",
    priceNumeric: 3500000,
    image: "/placeholder.svg?height=300&width=400",
    description:
      "Exclusive collection of luxury villas with private gardens and premium finishes in a gated community.",
    completionDate: "2024-12-31T00:00:00.000Z",
    totalUnits: 150,
    featured: false,
    flags: {
      elite: true,
      exclusive: true,
      featured: false,
      highValue: true,
    },
  },
]

interface ProjectTabsProps {
  initialModalOpen?: boolean
  onModalClose?: () => void
}

export function ProjectTabs({ initialModalOpen = false, onModalClose }: ProjectTabsProps) {
  const [activeTab, setActiveTab] = useState("all")
  const [projects, setProjects] = useState(realEstateProjects)
  const [isAddModalOpen, setIsAddModalOpen] = useState(initialModalOpen)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)

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

  const handleView = (project) => {
    setSelectedProject(project)
    setIsViewModalOpen(true)
  }

  const handleEdit = (project) => {
    setSelectedProject(project)
    setIsEditModalOpen(true)
  }

  const handleDelete = (project) => {
    setSelectedProject(project)
    setIsDeleteModalOpen(true)
  }

  const handleSaveProject = (projectData) => {
    if (selectedProject) {
      // Edit existing project
      setProjects((prev) =>
        prev.map((p) => (p.id === selectedProject.id ? { ...projectData, id: selectedProject.id } : p)),
      )
    } else {
      // Add new project
      const newProject = { ...projectData, id: Date.now() }
      setProjects((prev) => [...prev, newProject])
    }
  }

  const handleConfirmDelete = () => {
    if (selectedProject) {
      setProjects((prev) => prev.filter((p) => p.id !== selectedProject.id))
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

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-fit grid-cols-3">
            <TabsTrigger value="all" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>All Projects</span>
            </TabsTrigger>
            <TabsTrigger value="elite" className="flex items-center space-x-2">
              <Star className="h-4 w-4" />
              <span>Elite</span>
            </TabsTrigger>
            <TabsTrigger value="new-launch" className="flex items-center space-x-2">
              <Rocket className="h-4 w-4" />
              <span>New Launch</span>
            </TabsTrigger>
          </TabsList>

          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filterProjects("all").map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="elite" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filterProjects("elite").map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="new-launch" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filterProjects("new-launch").map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ProjectFormModal isOpen={isAddModalOpen} onClose={handleAddModalClose} onSave={handleSaveProject} mode="add" />

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
