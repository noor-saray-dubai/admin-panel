"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Briefcase,
  MapPin,
  Calendar,
  Users,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Clock,
  DollarSign,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CareerFormModal } from "./career-form-modal"
import { CareerViewModal } from "./career-view-modal"
import { DeleteConfirmationModal } from "./delete-confirmation-modal"

interface Career {
  _id: string
  slug: string
  title: string
  department: string
  location: string
  type: "Full-time" | "Part-time" | "Contract" | "Internship"
  level: "Entry" | "Mid" | "Senior" | "Executive"
  salary: string
  description: string
  requirements: string[]
  responsibilities: string[]
  benefits: string[]
  status: "Active" | "Paused" | "Closed"
  postedDate: string
  applicationDeadline: string
  applicationsCount: number
  featured: boolean
}

function CareerCard({
  career,
  onView,
  onEdit,
  onDelete,
}: {
  career: Career
  onView: (career: Career) => void
  onEdit: (career: Career) => void
  onDelete: (career: Career) => void
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "default"
      case "Paused":
        return "secondary"
      case "Closed":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Full-time":
        return "bg-blue-100 text-blue-800"
      case "Part-time":
        return "bg-green-100 text-green-800"
      case "Contract":
        return "bg-orange-100 text-orange-800"
      case "Internship":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString()

  const getDaysRemaining = (deadline: string) => {
    const today = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysRemaining = getDaysRemaining(career.applicationDeadline)

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center space-x-2">
              <CardTitle className="text-lg">{career.title}</CardTitle>
              {career.featured && <Badge className="bg-yellow-500 text-white text-xs">Featured</Badge>}
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Briefcase className="h-3 w-3" />
                <span>{career.department}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin className="h-3 w-3" />
                <span>{career.location}</span>
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
              <DropdownMenuItem onClick={() => onView(career)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(career)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Career
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(career)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Career
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">{career.description}</p>

        <div className="flex items-center space-x-2">
          <Badge variant={getStatusColor(career.status)}>{career.status}</Badge>
          <Badge className={`text-xs ${getTypeColor(career.type)}`}>{career.type}</Badge>
          <Badge variant="outline" className="text-xs">
            {career.level}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-1">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="font-medium">{career.salary}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4 text-blue-600" />
            <span>{career.applicationsCount} applications</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>Posted {formatDate(career.postedDate)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span className={daysRemaining <= 7 ? "text-red-600 font-medium" : ""}>
              {daysRemaining > 0 ? `${daysRemaining} days left` : "Expired"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function CareersPage() {
  const searchParams = useSearchParams()
  const action = searchParams.get("action")

  const [careers, setCareers] = useState<Career[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedCareer, setSelectedCareer] = useState<Career | null>(null)

  // Fetch careers from API
  const fetchCareers = async () => {
    try {
      const res = await fetch("/api/careers/fetch")
      const json = await res.json()
      if (json.success) {
        setCareers(json.careers)
      } else {
        console.error("Failed to fetch careers:", json.message)
      }
    } catch (err) {
      console.error("Error fetching careers:", err)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    fetchCareers()
  }, [])

  // Handle URL action parameter
  useEffect(() => {
    if (action === "new") {
      setIsAddModalOpen(true)
    }
  }, [action])

  const handleView = (career: Career) => {
    setSelectedCareer(career)
    setIsViewModalOpen(true)
  }

  const handleEdit = (career: Career) => {
    setSelectedCareer(career)
    setIsEditModalOpen(true)
  }

  const handleDelete = (career: Career) => {
    setSelectedCareer(career)
    setIsDeleteModalOpen(true)
  }

  const handleSaveCareer = (careerData: Career) => {
    if (selectedCareer) {
      setCareers((prev) =>
        prev.map((c) => (c._id === selectedCareer._id ? { ...careerData, _id: selectedCareer._id } : c))
      )
    } else {
      const newCareer = { ...careerData, _id: Date.now().toString(), applicationsCount: 0 }
      setCareers((prev) => [...prev, newCareer])
    }
  }

 
  const handleConfirmDelete = async () => {
    if (selectedCareer) {
      try {
        // You'll need to implement DELETE endpoint
        const response = await fetch(`/api/careers/delete/${selectedCareer.slug }`, {
          method: 'DELETE',
        })

        if (response.ok) {
          // Refresh projects list
          await fetchCareers()
        }
      } catch (error) {
        console.error('Error deleting project:', error)
        // You might want to show an error toast here
      }
    }
    setIsDeleteModalOpen(false)
    setSelectedCareer(null)
  }


  const careerStats = [
    { title: "Total Positions", value: careers.length.toString(), icon: Briefcase, color: "text-blue-600" },
    { title: "Active Listings", value: careers.filter((c) => c.status === "Active").length.toString(), icon: Eye, color: "text-green-600" },
    { title: "Total Applications", value: careers.reduce((sum, c) => sum + c.applicationsCount, 0).toString(), icon: Users, color: "text-purple-600" },
    { title: "Featured Jobs", value: careers.filter((c) => c.featured).length.toString(), icon: Briefcase, color: "text-yellow-600" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Careers</h1>
          <p className="text-gray-600">Manage job listings and career opportunities</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Career
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {careerStats.map((stat) => (
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

      {/* Careers Grid */}
      {loading ? (
        <p className="text-gray-500">Loading careers...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {careers.map((career) => (
            <CareerCard key={career._id} career={career} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Modals */}
      <CareerFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveCareer}
        mode="add"
      />
      <CareerFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedCareer(null)
        }}
        onSave={handleSaveCareer}
        career={selectedCareer}
        mode="edit"
      />
      <CareerViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedCareer(null)
        }}
        career={selectedCareer}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedCareer(null)
        }}
        onConfirm={handleConfirmDelete}
        itemName={selectedCareer?.title || ""}
        itemType="Career"
      />
    </div>
  )
}
