"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  MoreHorizontal, 
  MapPin, 
  Building2, 
  Home,
  DollarSign, 
  Eye, 
  Edit, 
  Trash2,
  CheckCircle,
  AlertTriangle,
  Users,
  TrendingUp,
  Award,
  Layers
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import type { IBuilding } from "@/types/buildings"

interface BuildingCardProps {
  building: IBuilding
  onView: (building: IBuilding) => void
  onEdit: (building: IBuilding) => void
  onDelete: (building: IBuilding) => void
  isDeleting?: boolean
}

export function BuildingCard({ building, onView, onEdit, onDelete, isDeleting = false }: BuildingCardProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "operational":
        return "text-green-600 bg-green-100"
      case "under construction":
        return "text-blue-600 bg-blue-100"
      case "planned":
        return "text-purple-600 bg-purple-100"
      case "renovation":
        return "text-orange-600 bg-orange-100"
      case "iconic":
      case "landmark":
        return "text-yellow-600 bg-yellow-100"
      case "premium":
      case "elite":
        return "text-indigo-600 bg-indigo-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "residential":
        return "text-blue-600 bg-blue-100"
      case "commercial":
        return "text-purple-600 bg-purple-100"
      case "mixed":
        return "text-orange-600 bg-orange-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const getOwnershipColor = (ownership: string) => {
    switch (ownership) {
      case "freehold":
        return "text-green-600 bg-green-100"
      case "leasehold":
        return "text-blue-600 bg-blue-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const getSaleStatusColor = (saleStatus: string) => {
    switch (saleStatus?.toLowerCase()) {
      case "available":
        return "text-green-600 bg-green-100"
      case "undernegotiation":
        return "text-yellow-600 bg-yellow-100"
      case "sold":
        return "text-red-600 bg-red-100"
      case "offmarket":
        return "text-gray-600 bg-gray-100"
      default:
        return "text-blue-600 bg-blue-100"
    }
  }

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatPrice = (price: { value: string; valueNumeric: number; currency: string }) => {
    return price.value || `${price.valueNumeric.toLocaleString()} ${price.currency}`
  }

  const formatOccupancy = () => {
    if (!building.totalUnits) return "N/A"
    const available = building.availableUnits || 0
    const occupied = building.totalUnits - available
    const percentage = building.financials?.occupancyRate || 
      Math.round((occupied / building.totalUnits) * 100)
    return `${occupied}/${building.totalUnits} units (${percentage}%)`
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg line-clamp-1">{building.name}</CardTitle>
              <Badge className="bg-white/90 text-gray-900 font-mono text-xs border">
                {building.buildingId}
              </Badge>
            </div>
            
            {/* Subtitle */}
            {building.subtitle && (
              <p className="text-sm text-muted-foreground line-clamp-1">{building.subtitle}</p>
            )}
            
            {/* Location Info */}
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="truncate">{building.location}</span>
              {building.subLocation && (
                <>
                  <span className="mx-1">•</span>
                  <span className="truncate">{building.subLocation}</span>
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
              <DropdownMenuItem onClick={() => onView(building)} disabled={isDeleting}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(building)} disabled={isDeleting}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Building
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(building)} 
                className="text-red-600"
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Delete Building'}
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
            <span>{formatPrice(building.price)}</span>
          </div>
          {building.priceRange && (
            <div className="text-sm text-muted-foreground">
              {building.priceRange.min.toLocaleString()} - {building.priceRange.max.toLocaleString()}
            </div>
          )}
        </div>

        {/* Status, Category and Sale Status Badges */}
        <div className="flex gap-2 flex-wrap">
          <Badge className={`text-xs ${getStatusColor(building.status)}`}>
            <Building2 className="h-3 w-3 mr-1" />
            {building.status}
          </Badge>
          
          <Badge className={`text-xs ${getCategoryColor(building.category)}`}>
            <Home className="h-3 w-3 mr-1" />
            {building.category}
          </Badge>
          
          {building.saleInformation?.isForSale && (
            <Badge className={`text-xs ${getSaleStatusColor(building.saleInformation.saleStatus)}`}>
              <DollarSign className="h-3 w-3 mr-1" />
              {building.saleInformation.saleStatus}
            </Badge>
          )}
          
          {building.verified && (
            <Badge className="bg-blue-500 hover:bg-blue-600 text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
          
          {building.isFeatured && (
            <Badge className="bg-yellow-500 hover:bg-yellow-600 text-xs">
              <Award className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
          
          {!building.isActive && (
            <Badge className="bg-red-500 hover:bg-red-600 text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Inactive
            </Badge>
          )}
        </div>

        {/* Basic Dimensions Info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Layers className="h-4 w-4" />
            <span>{building.dimensions.floors} floors</span>
          </div>
          {building.dimensions.totalArea && (
            <div className="flex items-center space-x-1">
              <Building2 className="h-4 w-4" />
              <span>{building.dimensions.totalArea.toLocaleString()} sqm</span>
            </div>
          )}
        </div>

        {/* Units and Financial Information */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Users className="h-3 w-3" />
            <span>{formatOccupancy()}</span>
          </div>
          {building.financials?.capRate && (
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-3 w-3" />
              <span>{building.financials.capRate}% Cap Rate</span>
            </div>
          )}
        </div>

        {/* Year and Ownership */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Year: {building.year}
          </div>
          {building.legalDetails?.ownership && (
            <Badge className={`text-xs ${getOwnershipColor(building.legalDetails.ownership)}`}>
              {building.legalDetails.ownership}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}