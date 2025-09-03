"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  MoreHorizontal, 
  MapPin, 
  Building, 
  Calendar, 
  DollarSign, 
  Eye, 
  Edit, 
  Trash2,
  Users,
  Star,
  Crown,
  Zap
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Use the same interfaces as in the main component
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
      case "launched":
        return "destructive"
      case "ready to move":
        return "outline"
      case "pre-launch":
        return "outline"
      case "sold out":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).getFullYear()
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatPrice = (price: string, priceNumeric: number) => {
    // If price string is already formatted nicely, use it
    if (price.includes('AED') || price.includes('$') || price.includes('€')) {
      return price
    }
    
    // Otherwise format the numeric value
    if (priceNumeric >= 1000000) {
      return `${(priceNumeric / 1000000).toFixed(1)}M AED`
    } else if (priceNumeric >= 1000) {
      return `${(priceNumeric / 1000).toFixed(0)}K AED`
    } else {
      return ` AED ${priceNumeric} `
    }
  }

  const getTotalAmenities = () => {
    return project.amenities?.reduce((total, category) => total + category.items.length, 0) || 0
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="relative">
        <img
          src={project.image || "/placeholder.svg"}
          alt={project.name}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        
        {/* Status Badge - Top Left */}
        <Badge variant={getStatusColor(project.status)} className="absolute top-2 left-2">
          {project.status}
        </Badge>

        {/* Flags Badges - Top Right */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {project.flags?.elite && (
            <Badge className="bg-yellow-500 hover:bg-yellow-600 text-xs">
              <Crown className="h-3 w-3 mr-1" />
              Elite
            </Badge>
          )}
          {project.flags?.featured && (
            <Badge className="bg-blue-500 hover:bg-blue-600 text-xs">
              <Star className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
          {project.flags?.exclusive && (
            <Badge className="bg-purple-500 hover:bg-purple-600 text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Exclusive
            </Badge>
          )}
        </div>

        {/* Registration Status */}
        {project.registrationOpen && (
          <Badge className="absolute bottom-2 left-2 bg-green-500 hover:bg-green-600">
            Registration Open
          </Badge>
        )}
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <CardTitle className="text-lg line-clamp-2">{project.name}</CardTitle>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1" />
              {project.location}
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Building className="h-4 w-4 mr-1" />
              {project.developer}
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
          <Badge variant="outline" className="mr-2">{project.type}</Badge>
          {project.categories?.slice(0, 2).map((category, index) => (
            <Badge key={index} variant="outline" className="text-xs mr-1">
              {category}
            </Badge>
          ))}
          {project.categories && project.categories.length > 2 && (
            <span className="text-xs text-muted-foreground">+{project.categories.length - 2} more</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>{project.totalUnits} units</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(project.completionDate)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 text-lg font-semibold text-green-600">
            {/* <DollarSign className="h-4 w-4" /> */}
            <span>{formatPrice(project.price, project.priceNumeric)}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {getTotalAmenities()} amenities
          </div>
        </div>

        {/* Unit Types Preview */}
        {project.unitTypes && project.unitTypes.length > 0 && (
          <div className="border-t pt-3">
            <div className="text-xs text-muted-foreground mb-1">Unit Types:</div>
            <div className="flex flex-wrap gap-1">
              {project.unitTypes.slice(0, 3).map((unit, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {unit.type}
                </Badge>
              ))}
              {project.unitTypes.length > 3 && (
                <span className="text-xs text-muted-foreground">+{project.unitTypes.length - 3} more</span>
              )}
            </div>
          </div>
        )}

        {/* Audit Info */}
        {project.createdBy && project.updatedBy && (
          <div className="border-t pt-3 space-y-1">
            <div className="text-xs text-muted-foreground">
              <div>Created: {formatDateTime(project.createdAt)} by {project.createdBy.email.split('@')[0]}</div>
              <div>Updated: {formatDateTime(project.updatedAt)} by {project.updatedBy.email.split('@')[0]}</div>
              <div className="flex items-center justify-between">
                <span>Version: {project.version}</span>
                {!project.isActive && (
                  <Badge variant="outline" className="text-xs text-red-500">
                    Inactive
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Launch Date Info */}
        {project.launchDate && new Date(project.launchDate) > new Date() && (
          <div className="border-t pt-3">
            <div className="text-xs text-muted-foreground">
              Launch Date: {formatDateTime(project.launchDate)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}