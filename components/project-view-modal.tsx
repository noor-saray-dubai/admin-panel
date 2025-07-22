import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { MapPin, Building, Calendar, DollarSign, Users } from "lucide-react"

interface Project {
  id: number
  name: string
  location: string
  type: string
  status: string
  developer: string
  price: string
  image: string
  description: string
  completionDate: string
  totalUnits: number
  flags: {
    elite: boolean
    exclusive: boolean
    featured: boolean
    highValue: boolean
  }
}

interface ProjectViewModalProps {
  isOpen: boolean
  onClose: () => void
  project: Project | null
}

export function ProjectViewModal({ isOpen, onClose, project }: ProjectViewModalProps) {
  if (!project) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "under construction":
        return "secondary"
      case "completed":
        return "default"
      case "launching soon":
        return "destructive"
      case "ready to move":
        return "outline"
      default:
        return "secondary"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{project.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="relative">
            <img
              src={project.image || "/placeholder.svg"}
              alt={project.name}
              className="w-full h-64 object-cover rounded-lg"
            />
            <div className="absolute top-4 left-4 flex space-x-2">
              {project.flags.elite && <Badge className="bg-yellow-500">Elite</Badge>}
              {project.flags.featured && <Badge className="bg-blue-500">Featured</Badge>}
              {project.flags.exclusive && <Badge className="bg-purple-500">Exclusive</Badge>}
              {project.flags.highValue && <Badge className="bg-green-500">High Value</Badge>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Location:</span>
                <span>{project.location}</span>
              </div>

              <div className="flex items-center space-x-2">
                <Building className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Developer:</span>
                <span>{project.developer}</span>
              </div>

              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Completion:</span>
                <span>{formatDate(project.completionDate)}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Price:</span>
                <span className="text-green-600 font-semibold">{project.price}</span>
              </div>

              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Total Units:</span>
                <span>{project.totalUnits}</span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="font-medium">Status:</span>
                <Badge variant={getStatusColor(project.status)}>{project.status}</Badge>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Property Type</h3>
            <p className="text-muted-foreground">{project.type}</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Description</h3>
            <p className="text-muted-foreground leading-relaxed">{project.description}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
