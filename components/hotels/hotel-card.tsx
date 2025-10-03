// components/hotels/hotel-card.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  MoreHorizontal, 
  MapPin, 
  Building2, 
  Star,
  DollarSign, 
  Eye, 
  Edit, 
  Trash2,
  CheckCircle,
  AlertTriangle,
  Users,
  TrendingUp,
  Award,
  Layers,
  Crown,
  Bed
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import type { IHotel } from "@/types/hotels"

interface HotelCardProps {
  hotel: IHotel
  onView: (hotel: IHotel) => void
  onEdit: (hotel: IHotel) => void
  onDelete: (hotel: IHotel) => void
  isDeleting?: boolean
}

export function HotelCard({ hotel, onView, onEdit, onDelete, isDeleting = false }: HotelCardProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "operational":
        return "text-green-600 bg-green-100"
      case "under construction":
        return "text-blue-600 bg-blue-100"
      case "planned":
        return "text-purple-600 bg-purple-100"
      case "renovation":
        return "text-orange-600 bg-orange-100"
      case "temporarily closed":
        return "text-red-600 bg-red-100"
      case "luxury":
      case "ultra luxury":
        return "text-yellow-600 bg-yellow-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "resort":
        return "text-blue-600 bg-blue-100"
      case "city hotel":
        return "text-purple-600 bg-purple-100"
      case "boutique":
        return "text-orange-600 bg-orange-100"
      case "luxury":
      case "ultra luxury":
        return "text-yellow-600 bg-yellow-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatPrice = (price: { total: string; totalNumeric: number; currency: string }) => {
    return price.total || `${price.totalNumeric.toLocaleString()} ${price.currency}`
  }

  const formatOccupancy = () => {
    if (!hotel.totalRooms) return "N/A"
    const occupancyRate = hotel.occupancyRate || 0
    return `${hotel.totalRooms} rooms (${occupancyRate}% avg occupancy)`
  }

  const renderStars = (rating: number) => {
    if (!rating) return null
    return (
      <div className="flex items-center space-x-0.5">
        {Array.from({ length: rating }, (_, i) => (
          <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
    )
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg line-clamp-1">{hotel.name}</CardTitle>
              <Badge className="bg-white/90 text-gray-900 font-mono text-xs border">
                {hotel.hotelId}
              </Badge>
            </div>
            
            {/* Subtitle */}
            {hotel.subtitle && (
              <p className="text-sm text-muted-foreground line-clamp-1">{hotel.subtitle}</p>
            )}
            
            {/* Location Info */}
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="truncate">{hotel.location}</span>
              {hotel.subLocation && (
                <>
                  <span className="mx-1">•</span>
                  <span className="truncate">{hotel.subLocation}</span>
                </>
              )}
            </div>
            
            {/* Star Rating */}
            {hotel.rating && hotel.rating > 0 && (
              <div className="flex items-center space-x-1">
                {renderStars(hotel.rating)}
              </div>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" disabled={isDeleting}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(hotel)} disabled={isDeleting}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(hotel)} disabled={isDeleting}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Hotel
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(hotel)} 
                className="text-red-600"
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Delete Hotel'}
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
            <span>{formatPrice(hotel.price)}</span>
          </div>
          {hotel.dimensions?.totalArea && (
            <div className="text-sm text-muted-foreground">
              {hotel.dimensions.totalArea.toLocaleString()} sqm
            </div>
          )}
        </div>

        {/* Status, Type and Other Badges */}
        <div className="flex gap-2 flex-wrap">
          <Badge className={`text-xs ${getStatusColor(hotel.status)}`}>
            <Building2 className="h-3 w-3 mr-1" />
            {hotel.status}
          </Badge>
          
          <Badge className={`text-xs ${getTypeColor(hotel.type)}`}>
            {hotel.type.toLowerCase().includes('luxury') ? 
              <Crown className="h-3 w-3 mr-1" /> : 
              <Building2 className="h-3 w-3 mr-1" />
            }
            {hotel.type}
          </Badge>
          
          {hotel.verified && (
            <Badge className="bg-blue-500 hover:bg-blue-600 text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
          
    
          {!hotel.isActive && (
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
            <span>{hotel.dimensions?.floors} floors</span>
          </div>
          <div className="flex items-center space-x-1">
            <Bed className="h-4 w-4" />
            <span>{hotel.totalRooms} rooms</span>
          </div>
        </div>

        {/* Financial Information */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Users className="h-3 w-3" />
            <span>{formatOccupancy()}</span>
          </div>
          
        </div>

        {/* Year and Additional Info */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Year: {hotel.year}
          </div>
          {hotel.legalDetails?.ownership && (
            <Badge className="text-xs text-green-600 bg-green-100">
              {hotel.legalDetails.ownership}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
