"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Building2,
  MapPin,
  Calendar,
  Users,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeveloperFormModal } from "./developer-form-modal"
import { DeveloperViewModal } from "./developer-view-modal"
import { DeleteConfirmationModal } from "./delete-confirmation-modal"

interface Developer {
  _id: string
  name: string
  slug: string
  logo: string
  description: string
  location: string
  establishedYear: number
  totalProjects: number
  activeProjects: number
  completedProjects: number
  website: string
  email: string
  phone: string
  specialization: string[]
  rating: number
  verified: boolean
}

function DeveloperCard({
  developer,
  onView,
  onEdit,
  onDelete,
}: {
  developer: Developer
  onView: (developer: Developer) => void
  onEdit: (developer: Developer) => void
  onDelete: (developer: Developer) => void
}) {
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={developer?.logo || "/placeholder.svg"}
              alt={developer.name}
              className="w-12 h-12 object-cover rounded-lg border"
            />
            <div>
              <CardTitle className="text-lg">{developer.name}</CardTitle>
              <div className="flex items-center space-x-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3 mr-1" />
                  {developer.location}
                </div>
                {developer.verified && (
                  <Badge variant="default" className="text-xs">
                    Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(developer)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(developer)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Developer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(developer)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Developer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">{developer.description}</p>

        <div className="flex flex-wrap gap-1">
          {developer.specialization.map((spec, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {spec}
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="text-center">
            <div className="font-semibold text-blue-600">{developer.totalProjects}</div>
            <div className="text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-orange-600">{developer.activeProjects}</div>
            <div className="text-muted-foreground">Active</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-green-600">{developer.completedProjects}</div>
            <div className="text-muted-foreground">Completed</div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>Est. {developer.establishedYear}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>⭐ {developer.rating}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function DevelopersPage() {
  const searchParams = useSearchParams()
  const action = searchParams.get("action")

  const [developers, setDevelopers] = useState<Developer[]>([])
  const [loading, setLoading] = useState(true)

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedDeveloper, setSelectedDeveloper] = useState<Developer | null>(null)

  // Fetch all developers
  const fetchDevelopers = async () => {
    try {
      const res = await fetch("/api/developers/fetch")
      const json = await res.json()
      if (json.success) {
        setDevelopers(json.data)
        console.log(json.data)
      } else {
        console.error("Failed to fetch developers:", json.message)
      }
    } catch (err) {
      console.error("Error fetching developers:", err)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {

    fetchDevelopers()
  }, [])

  // Handle modal trigger from URL
  useEffect(() => {
    if (action === "new") {
      setIsAddModalOpen(true)
    }
  }, [action])

  const handleView = (developer: Developer) => {
    setSelectedDeveloper(developer)
    setIsViewModalOpen(true)
  }

  const handleEdit = (developer: Developer) => {
    setSelectedDeveloper(developer)
    setIsEditModalOpen(true)
  }

  const handleDelete = (developer: Developer) => {
    setSelectedDeveloper(developer)
    setIsDeleteModalOpen(true)
  }

  const handleSaveDeveloper = (developerData: Developer) => {
    if (selectedDeveloper) {
      setDevelopers((prev) =>
        prev.map((d) => (d._id === selectedDeveloper._id ? { ...developerData, _id: selectedDeveloper._id } : d)),
      )
    } else {
      const newDeveloper = { ...developerData, _id: Date.now().toString() }
      setDevelopers((prev) => [...prev, newDeveloper])
    }
  }

    const handleConfirmDelete = async () => {
    if (selectedDeveloper) {
      try {
        // You'll need to implement DELETE endpoint
        const response = await fetch(`/api/blog/delete/${selectedDeveloper.slug }`, {
          method: 'DELETE',
        })

        if (response.ok) {
          // Refresh projects list
          await fetchDevelopers()
        }
      } catch (error) {
        console.error('Error deleting project:', error)
        // You might want to show an error toast here
      }
    }
    setIsDeleteModalOpen(false)
    setSelectedDeveloper(null)
  }

  const developerStats = [
    {
      title: "Total Developers",
      value: developers.length.toString(),
      icon: Building2,
      color: "text-blue-600",
    },
    {
      title: "Verified Developers",
      value: developers.filter((d) => d.verified).length.toString(),
      icon: Users,
      color: "text-green-600",
    },
    {
      title: "Active Projects",
      value: developers.reduce((sum, d) => sum + d.activeProjects, 0).toString(),
      icon: Building2,
      color: "text-orange-600",
    },
    {
      title: "Avg Rating",
      value: developers.length
        ? (developers.reduce((sum, d) => sum + d.rating, 0) / developers.length).toFixed(1)
        : "0.0",
      icon: Users,
      color: "text-yellow-600",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Developers</h1>
          <p className="text-gray-600">Manage real estate developers and their profiles</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Developer
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {developerStats.map((stat) => (
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

      {/* Developers Grid */}
      {loading ? (
        <p className="text-gray-500">Loading developers...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {developers.map((developer) => (
            <DeveloperCard
              key={developer._id}
              developer={developer}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
      {/* Modals */}
      <DeveloperFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        // onSave={handleSaveDeveloper}
        mode="add"
      />

      <DeveloperFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedDeveloper(null)
        }}
        // onSave={handleSaveDeveloper}
        developer={selectedDeveloper}
        mode="edit"
      />

      <DeveloperViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedDeveloper(null)
        }}
        developer={selectedDeveloper}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedDeveloper(null)
        }}
        onConfirm={handleConfirmDelete}
        itemName={selectedDeveloper?.name || ""}
        itemType="Developer"
      />
    </div>
  )
}
