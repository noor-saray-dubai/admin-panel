"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  MoreHorizontal, 
  MapPin, 
  Building, 
  Store,
  DollarSign, 
  Eye, 
  Edit, 
  Trash2,
  CheckCircle,
  AlertTriangle,
  ShoppingCart,
  Users,
  TrendingUp
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import type { IMall } from "@/types/mall"

interface MallCardProps {
  mall: IMall
  onView: (mall: IMall) => void
  onEdit: (mall: IMall) => void
  onDelete: (mall: IMall) => void
  isDeleting?: boolean
}

export function MallCard({ mall, onView, onEdit, onDelete, isDeleting = false }: MallCardProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "operational":
        return "text-green-600 bg-green-100"
      case "under construction":
        return "text-blue-600 bg-blue-100"
      case "planned":
        return "text-purple-600 bg-purple-100"
      case "for sale":
        return "text-orange-600 bg-orange-100"
      case "sold":
        return "text-red-600 bg-red-100"
      case "reserved":
        return "text-yellow-600 bg-yellow-100"
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatPrice = (price: { total: string; totalNumeric: number; currency: string }) => {
    return price.total || `${price.totalNumeric.toLocaleString()} ${price.currency}`
  }

  const formatSize = (size: { totalArea: number; floors: number }) => {
    return {
      totalArea: size.totalArea.toLocaleString(),
      floors: size.floors
    }
  }

  const formatOccupancy = (rentalDetails: any) => {
    if (!rentalDetails) return "N/A"
    const occupied = rentalDetails.totalStores || 0
    const total = rentalDetails.maxStores || 0
    const percentage = rentalDetails.currentOccupancy || 0
    return `${occupied}/${total} stores (${percentage}%)`
  }

  const sizeFormatted = formatSize(mall.size)

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg line-clamp-1">{mall.name}</CardTitle>
              <Badge className="bg-white/90 text-gray-900 font-mono text-xs border">
                {mall.mallId}
              </Badge>
            </div>
            
            {/* Subtitle */}
            <p className="text-sm text-muted-foreground line-clamp-1">{mall.subtitle}</p>
            
            {/* Location Info */}
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="truncate">{mall.location}</span>
              {mall.subLocation && (
                <>
                  <span className="mx-1">•</span>
                  <span className="truncate">{mall.subLocation}</span>
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
              <DropdownMenuItem onClick={() => onView(mall)} disabled={isDeleting}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(mall)} disabled={isDeleting}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Mall
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(mall)} 
                className="text-red-600"
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Delete Mall'}
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
            <span>{formatPrice(mall.price)}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {mall.price.perSqft.toLocaleString()} /{mall.price.currency}/sqft
          </div>
        </div>

        {/* Status and Sale Status Badges */}
        <div className="flex gap-2 flex-wrap">
          <Badge className={`text-xs ${getStatusColor(mall.status)}`}>
            <Building className="h-3 w-3 mr-1" />
            {mall.status}
          </Badge>
          
          {mall.saleInformation?.saleStatus && (
            <Badge className={`text-xs ${getSaleStatusColor(mall.saleInformation.saleStatus)}`}>
              <Store className="h-3 w-3 mr-1" />
              {mall.saleInformation.saleStatus}
            </Badge>
          )}
          
          {mall.verified && (
            <Badge className="bg-blue-500 hover:bg-blue-600 text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
          
          {mall.isOperational && (
            <Badge className="bg-green-500 hover:bg-green-600 text-xs">
              <ShoppingCart className="h-3 w-3 mr-1" />
              Operational
            </Badge>
          )}
          
          {!mall.isActive && (
            <Badge className="bg-red-500 hover:bg-red-600 text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Inactive
            </Badge>
          )}
        </div>

        {/* Basic Size and Floor Info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Building className="h-4 w-4" />
            <span>{sizeFormatted.totalArea} sqft</span>
          </div>
          <div className="flex items-center space-x-1">
            <Store className="h-4 w-4" />
            <span>{sizeFormatted.floors} floors</span>
          </div>
        </div>

        {/* Rental Information */}
        {mall.rentalDetails && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>{formatOccupancy(mall.rentalDetails)}</span>
            </div>
            {mall.financials?.capRate && (
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-3 w-3" />
                <span>{mall.financials.capRate}% Cap Rate</span>
              </div>
            )}
          </div>
        )}

        {/* Ownership Badge */}
        <div className="flex justify-end">
          <Badge className={`text-xs ${getOwnershipColor(mall.ownership)}`}>
            {mall.ownership}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}