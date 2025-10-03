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
  Zap,
  CheckCircle,
  AlertTriangle,
  TrendingUp
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { IProject } from "@/types/projects"

interface ProjectCardProps {
  project: IProject
  onView: (project: IProject) => void
  onEdit: (project: IProject) => void
  onDelete: (project: IProject) => void
  isDeleting?: boolean
}

export function ProjectCard({ project, onView, onEdit, onDelete, isDeleting = false }: ProjectCardProps) {
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

  const formatPrice = (project: IProject) => {
    // Use the formatted price string if available
    if (project.price?.total) {
      return project.price.total
    }
    
    // Otherwise format the numeric value
    const priceNumeric = project.priceNumeric || project.price?.totalNumeric || 0
    if (priceNumeric >= 1000000) {
      return `${(priceNumeric / 1000000).toFixed(1)}M AED`
    } else if (priceNumeric >= 1000) {
      return `${(priceNumeric / 1000).toFixed(0)}K AED`
    } else {
      return `AED ${priceNumeric}`
    }
  }

  const getTotalAmenities = () => {
    return project.amenities?.reduce((total, category) => total + category.items.length, 0) || 0
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
              <Badge className="bg-white/90 text-gray-900 font-mono text-xs border">
                {project.id}
              </Badge>
            </div>
            
            {/* Location Info */}
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="truncate">{project.location}</span>
              {project.developer && (
                <>
                  <span className="mx-1">•</span>
                  <span className="truncate">{project.developer}</span>
                </>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" disabled={isDeleting}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(project)} disabled={isDeleting}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(project)} disabled={isDeleting}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Project
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(project)} 
                className="text-red-600"
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Delete Project'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Price Information */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 text-lg font-semibold text-green-600">
            <DollarSign className="h-4 w-4" />
            <span>{formatPrice(project)}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {project.type}
          </div>
        </div>

        {/* Status and Flag Badges */}
        <div className="flex gap-2 flex-wrap">
          <Badge className={`text-xs ${getStatusColor(project.status)}`}>
            <Building className="h-3 w-3 mr-1" />
            {project.status}
          </Badge>
          
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
          
          {project.registrationOpen && (
            <Badge className="bg-green-500 hover:bg-green-600 text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Registration Open
            </Badge>
          )}
          
          {!project.isActive && (
            <Badge className="bg-red-500 hover:bg-red-600 text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Inactive
            </Badge>
          )}
        </div>

        {/* Basic Project Info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>{project.totalUnits} units</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(project.completionDate)}</span>
          </div>
        </div>

        {/* Additional Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <TrendingUp className="h-3 w-3" />
            <span>{getTotalAmenities()} amenities</span>
          </div>
          {project.launchDate && new Date(project.launchDate) > new Date() && (
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>Launch: {formatDateTime(project.launchDate)}</span>
            </div>
          )}
        </div>

        {/* Project Type Badge */}
        <div className="flex justify-end">
          <Badge className={`text-xs text-blue-600 bg-blue-100`}>
            {project.type}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}