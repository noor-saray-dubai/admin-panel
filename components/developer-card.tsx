"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  MoreHorizontal, 
  MapPin, 
  Building2, 
  Calendar,
  Award,
  Eye, 
  Edit, 
  Trash2,
  CheckCircle,
  AlertTriangle,
  Star,
  Globe,
  Mail,
  Phone,
  Building,
  Users,
  TrendingUp
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import type { IDeveloper } from "@/types/developer"

interface DeveloperCardProps {
  developer: IDeveloper;
  onView: (developer: IDeveloper) => void;
  onEdit?: (developer: IDeveloper) => void;
  onDelete?: (developer: IDeveloper) => void;
  isDeleting?: boolean;
}

export function DeveloperCard({ developer, onView, onEdit, onDelete, isDeleting = false }: DeveloperCardProps) {
  const getSpecializationIcon = (specialization: string) => {
    const spec = specialization.toLowerCase()
    switch (true) {
      case spec.includes("residential"):
        return Building2
      case spec.includes("commercial"):
        return Building
      case spec.includes("industrial"):
        return Building
      case spec.includes("luxury"):
        return Star
      default:
        return Building2
    }
  }

  const getSpecializationColor = (specialization: string) => {
    const spec = specialization.toLowerCase()
    switch (true) {
      case spec.includes("residential"):
        return "text-blue-600 bg-blue-100"
      case spec.includes("commercial"):
        return "text-purple-600 bg-purple-100"
      case spec.includes("industrial"):
        return "text-orange-600 bg-orange-100"
      case spec.includes("luxury"):
        return "text-yellow-600 bg-yellow-100"
      case spec.includes("affordable"):
        return "text-green-600 bg-green-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return '1 day ago'
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    return formatDateTime(dateString)
  }

  const getYearsInBusiness = () => {
    const currentYear = new Date().getFullYear()
    return currentYear - developer.establishedYear
  }

  // Get primary specialization for badge
  const primarySpecialization = developer.specialization[0] || "General"
  const SpecIcon = getSpecializationIcon(primarySpecialization)

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3">
              <img
                src={developer?.logo || "/placeholder.svg"}
                alt={developer.name}
                className="w-10 h-10 object-cover rounded-lg border"
                loading="lazy"
              />
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg line-clamp-1">{developer.name}</CardTitle>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="truncate">{developer.location}</span>
                </div>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" disabled={isDeleting}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(developer)} disabled={isDeleting}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(developer)} disabled={isDeleting}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Developer
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete(developer)} 
                  className="text-red-600"
                  disabled={isDeleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? 'Deleting...' : 'Delete Developer'}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Established Year and Experience */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 text-sm font-medium text-blue-600">
            <Calendar className="h-4 w-4" />
            <span>Est. {developer.establishedYear}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {getYearsInBusiness()} years experience
          </div>
        </div>

        {/* Status and Verification Badges */}
        <div className="flex gap-2 flex-wrap">
          <Badge className={`text-xs ${getSpecializationColor(primarySpecialization)}`}>
            <SpecIcon className="h-3 w-3 mr-1" />
            {primarySpecialization}
            {developer.specialization.length > 1 && ` +${developer.specialization.length - 1}`}
          </Badge>
          
          {developer.verified && (
            <Badge className="bg-blue-500 hover:bg-blue-600 text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
          
          {developer.featured && (
            <Badge className="bg-yellow-500 hover:bg-yellow-600 text-xs">
              <Star className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
          
          {developer.isActive ? (
            <Badge className="bg-green-500 hover:bg-green-600 text-xs">
              Active
            </Badge>
          ) : (
            <Badge className="bg-red-500 hover:bg-red-600 text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Inactive
            </Badge>
          )}
        </div>

        {/* Project Stats (if available) */}
        {(developer.totalProjects || developer.completedProjects || developer.ongoingProjects) && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            {developer.totalProjects && (
              <div className="flex items-center space-x-1">
                <Building className="h-4 w-4" />
                <span>{developer.totalProjects} total</span>
              </div>
            )}
            {developer.completedProjects && (
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4" />
                <span>{developer.completedProjects} done</span>
              </div>
            )}
            {developer.ongoingProjects && (
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-4 w-4" />
                <span>{developer.ongoingProjects} ongoing</span>
              </div>
            )}
          </div>
        )}

        {/* Awards (if any) */}
        {developer.awards && developer.awards.length > 0 && (
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Award className="h-4 w-4" />
            <span>{developer.awards.length} award{developer.awards.length !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Contact Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center space-x-2">
            {developer.website && (
              <div className="flex items-center space-x-1">
                <Globe className="h-3 w-3" />
                <span>Website</span>
              </div>
            )}
            {developer.email && (
              <div className="flex items-center space-x-1">
                <Mail className="h-3 w-3" />
                <span>Email</span>
              </div>
            )}
            {developer.phone && (
              <div className="flex items-center space-x-1">
                <Phone className="h-3 w-3" />
                <span>Phone</span>
              </div>
            )}
          </div>
          <div>
            Updated {getTimeAgo(developer.updatedAt)}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}