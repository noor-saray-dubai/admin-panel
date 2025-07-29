"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, MapPin, Building, Calendar, DollarSign, Eye, Edit, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Use the same interfaces as in the main component
interface IPaymentMilestone {
  milestone: string;
  percentage: string;
}

interface IPaymentPlan {
  booking: string;
  construction: IPaymentMilestone[];
  handover: string;
}

interface INearbyPlace {
  name: string;
  distance: string;
}

interface ICoordinates {
  latitude: number;
  longitude: number;
}

interface ILocationDetails {
  description: string;
  nearby: INearbyPlace[];
  coordinates: ICoordinates;
}

interface IAmenityCategory {
  category: string;
  items: string[];
}

interface IUnitType {
  type: string;
  size: string;
  price: string;
}

interface IFlags {
  elite: boolean;
  exclusive: boolean;
  featured: boolean;
  highValue: boolean;
}

interface IProject {
  _id: string;
  id: number;
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
  amenities: IAmenityCategory[];
  unitTypes: IUnitType[];
  gallery: string[];
  paymentPlan: IPaymentPlan;
  locationDetails: ILocationDetails;
  categories: string[];
  featured: boolean;
  launchDate: string;
  registrationOpen: boolean;
  flags: IFlags;
  createdAt: string;
  updatedAt: string;
}

interface ProjectCardProps {
  project: IProject
  onView: (project: IProject) => void
  onEdit: (project: IProject) => void
  onDelete: (project: IProject) => void
}

export function ProjectCard({ project, onView, onEdit, onDelete }: ProjectCardProps) {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).getFullYear()
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="relative">
        <img
          src={project.image || "/placeholder.svg"}
          alt={project.name}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        {project.flags.elite && <Badge className="absolute top-2 left-2 bg-yellow-500">Elite</Badge>}
        {project.flags.featured && <Badge className="absolute top-2 right-2 bg-blue-500">Featured</Badge>}
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{project.name}</CardTitle>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1" />
              {project.location}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(project)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(project)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Project
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(project)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>

        <div className="space-y-2">
          <Badge variant={getStatusColor(project.status)}>{project.status}</Badge>
          <div className="text-sm text-muted-foreground">{project.type}</div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-1">
            <Building className="h-4 w-4" />
            <span>{project.developer}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(project.completionDate)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 text-lg font-semibold text-green-600">
            <DollarSign className="h-4 w-4" />
            <span>{project.price}</span>
          </div>
          <div className="text-sm text-muted-foreground">{project.totalUnits} units</div>
        </div>
      </CardContent>
    </Card>
  )
}