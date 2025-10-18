"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  MoreHorizontal, 
  MapPin, 
  Home, 
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
  Bed,
  Bath,
  Square,
  Compass,
  Building2,
  Copy
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { IProperty } from "@/types/properties"

interface PropertyCardProps {
  property: IProperty
  onView: (property: IProperty) => void
  onEdit: (property: IProperty) => void
  onDuplicate: (property: IProperty) => void
  onDelete: (property: IProperty) => void
  isDeleting?: boolean
}

export function PropertyCard({ property, onView, onEdit, onDuplicate, onDelete, isDeleting = false }: PropertyCardProps) {
  const getAvailabilityColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "ready":
        return "bg-green-500 hover:bg-green-600"
      case "offplan":
        return "bg-blue-500 hover:bg-blue-600"
      // Legacy support
      case "available":
        return "bg-green-500 hover:bg-green-600"
      case "reserved":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "sold":
        return "bg-red-500 hover:bg-red-600"
      default:
        return "secondary"
    }
  }

  const getOwnershipColor = (ownershipType: string) => {
    switch (ownershipType.toLowerCase()) {
      case "primary":
        return "bg-blue-500 hover:bg-blue-600"
      case "secondary":
        return "bg-gray-500 hover:bg-gray-600"
      default:
        return "secondary"
    }
  }

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatPrice = (property: IProperty) => {
    // Use the formatted price string if available
    if (property.price) {
      return property.price
    }
    
    // Otherwise format the numeric value
    const priceNumeric = property.priceNumeric || 0
    if (priceNumeric >= 1000000) {
      return `AED ${(priceNumeric / 1000000).toFixed(1)}M`
    } else if (priceNumeric >= 1000) {
      return `AED ${(priceNumeric / 1000).toFixed(0)}K`
    } else {
      return `AED ${priceNumeric.toLocaleString()}`
    }
  }

  const getTotalAmenities = () => {
    return property.amenities?.reduce((total, category) => total + category.items.length, 0) || 0
  }

  const formatFloorLevel = (floorLevel: any): string => {
    if (!floorLevel) return 'N/A'
    
    if (typeof floorLevel === 'object') {
      if (floorLevel.type === 'single') {
        const value = floorLevel.value
        if (value < 0) {
          return `B${Math.abs(value)}`
        } else if (value === 0) {
          return 'G'
        } else if (value >= 2000) {
          return `R${value - 2000}`
        } else if (value >= 1000) {
          return `M${value - 1000}`
        } else {
          return `${value}`
        }
      } else if (floorLevel.type === 'complex') {
        const parts = []
        if (floorLevel.basements > 0) parts.push(`${floorLevel.basements}B`)
        if (floorLevel.hasGroundFloor) parts.push('G')
        if (floorLevel.floors > 0) parts.push(`${floorLevel.floors}F`)
        if (floorLevel.mezzanines > 0) parts.push(`${floorLevel.mezzanines}M`)
        if (floorLevel.hasRooftop) parts.push('R')
        return parts.join('+')
      }
    }
    
    // Fallback for old numeric format
    return floorLevel.toString()
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg line-clamp-1">{property.name}</CardTitle>
              <Badge className="bg-white/90 text-gray-900 font-mono text-xs border">
                {property.id}
              </Badge>
            </div>
            
            {/* Location Info */}
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="truncate">{property.location.area}, {property.location.city}</span>
            </div>
            
            {/* Property Type and Specifications */}
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                <span>{property.propertyType}</span>
              </div>
              <div className="flex items-center gap-1">
                <Bed className="h-4 w-4" />
                <span>{property.bedrooms}</span>
              </div>
              <div className="flex items-center gap-1">
                <Bath className="h-4 w-4" />
                <span>{property.bathrooms}</span>
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
              <DropdownMenuItem onClick={() => onView(property)} disabled={isDeleting}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(property)} disabled={isDeleting}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Property
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(property)} disabled={isDeleting}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate Property
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(property)} 
                className="text-red-600"
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting 
                  ? (property.isActive ? 'Deactivating...' : 'Deleting...')
                  : (property.isActive ? 'Deactivate Property' : 'Delete Permanently')
                }
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
            <span>{formatPrice(property)}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Square className="h-4 w-4 mr-1" />
            <span>{property.builtUpArea || property.totalArea || 'N/A'} sq ft</span>
          </div>
        </div>

        {/* Availability and Ownership Status */}
        <div className="flex gap-2 flex-wrap">
          <Badge className={`text-xs text-white ${getAvailabilityColor(property.availabilityStatus)}`}>
            <CheckCircle className="h-3 w-3 mr-1" />
            {property.availabilityStatus}
          </Badge>
          
          <Badge className={`text-xs text-white ${getOwnershipColor(property.ownershipType)}`}>
            <Building2 className="h-3 w-3 mr-1" />
            {property.ownershipType}
          </Badge>
          
          {property.flags?.elite && (
            <Badge className="bg-yellow-500 hover:bg-yellow-600 text-xs">
              <Crown className="h-3 w-3 mr-1" />
              Elite
            </Badge>
          )}
          
          {property.flags?.featured && (
            <Badge className="bg-blue-500 hover:bg-blue-600 text-xs">
              <Star className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
          
          {property.flags?.exclusive && (
            <Badge className="bg-purple-500 hover:bg-purple-600 text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Exclusive
            </Badge>
          )}
          
          {!property.isActive && (
            <Badge className="bg-red-500 hover:bg-red-600 text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Inactive
            </Badge>
          )}
        </div>

        {/* Property Details */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Compass className="h-4 w-4" />
            <span>{property.facingDirection} Facing</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>Floor {formatFloorLevel(property.floorLevel)}</span>
          </div>
        </div>

        {/* Furnishing Status */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Home className="h-3 w-3" />
            <span>{property.furnishingStatus}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>{getTotalAmenities()} amenities</span>
          </div>
        </div>

        {/* Project & Developer Links */}
        {(property.project || property.developer) && (
          <div className="flex flex-wrap gap-1 text-xs">
            {property.project && (
              <Badge variant="outline" className="text-blue-600 bg-blue-50">
                Project: {property.project.projectName}
              </Badge>
            )}
            {property.developer && (
              <Badge variant="outline" className="text-green-600 bg-green-50">
                Dev: {property.developer.developerName}
              </Badge>
            )}
          </div>
        )}

        {/* Price per sq ft if available */}
        {property.pricePerSqFt && (
          <div className="flex justify-end">
            <Badge variant="outline" className="text-xs text-gray-600">
              AED {property.pricePerSqFt}/sq ft
            </Badge>
          </div>
        )}

        {/* Created Date */}
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>Added: {formatDate(property.createdAt)}</span>
          </div>
          <div>v{property.version}</div>
        </div>
      </CardContent>
    </Card>
  )
}