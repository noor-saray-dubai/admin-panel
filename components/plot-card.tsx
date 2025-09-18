"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  MoreHorizontal, 
  MapPin, 
  Building, 
  Ruler, 
  DollarSign, 
  Eye, 
  Edit, 
  Trash2,
  TrendingUp,
  Shield,
  CheckCircle,
  AlertTriangle,
  Factory,
  Home,
  Landmark,
  BarChart3
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import type { IPlot, IPrice, ISize, PlotCardProps } from "@/types/plot"

export function PlotCard({ plot, onView, onEdit, onDelete, isDeleting = false }: PlotCardProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "industrial":
        return Factory
      case "community":
        return MapPin
      case "building":
        return Building
      default:
        return Landmark
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "industrial":
        return "text-orange-600 bg-orange-100"
      case "community":
        return "text-green-600 bg-green-100"
      case "building":
        return "text-blue-600 bg-blue-100"
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "ready for development":
      case "infrastructure complete":
        return "text-green-600 bg-green-100"
      case "under development":
        return "text-blue-600 bg-blue-100"
      case "sold":
        return "text-red-600 bg-red-100"
      case "reserved":
        return "text-yellow-600 bg-yellow-100"
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

  const formatPrice = (price: IPrice) => {
    return price.total || `${price.totalNumeric.toLocaleString()} ${price.currency}`
  }

  const formatSize = (size: ISize) => {
    return {
      sqft: size.sqft.toLocaleString(),
      acres: size.acres.toFixed(2)
    }
  }

  const getROIColor = (roi: number) => {
    if (roi >= 15) return "text-green-600"
    if (roi >= 10) return "text-yellow-600"
    return "text-red-600"
  }

  const TypeIcon = getTypeIcon(plot.type)
  const sizeFormatted = formatSize(plot.size)

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg line-clamp-1">{plot.title}</CardTitle>
              <Badge className="bg-white/90 text-gray-900 font-mono text-xs border">
                {plot.plotId}
              </Badge>
            </div>
            
            {/* Location Info */}
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="truncate">{plot.location}</span>
              {plot.subLocation && (
                <>
                  <span className="mx-1">•</span>
                  <span className="truncate">{plot.subLocation}</span>
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
              <DropdownMenuItem onClick={() => onView(plot)} disabled={isDeleting}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(plot)} disabled={isDeleting}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Plot
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(plot)} 
                className="text-red-600"
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Delete Plot'}
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
            <span>{formatPrice(plot.price)}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {plot.price.perSqft.toLocaleString()} /{plot.price.currency}/sqft
          </div>
        </div>

        {/* Type and Status Badges */}
        <div className="flex gap-2 flex-wrap">
          <Badge className={`text-xs ${getTypeColor(plot.type)}`}>
            <TypeIcon className="h-3 w-3 mr-1" />
            {plot.type}
            {plot.subtype && ` • ${plot.subtype}`}
          </Badge>
          
          <Badge className={`text-xs ${getStatusColor(plot.status)}`}>
            {plot.status}
          </Badge>
          
          {plot.verified && (
            <Badge className="bg-blue-500 hover:bg-blue-600 text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
          
          {plot.isAvailable && plot.isActive ? (
            <Badge className="bg-green-500 hover:bg-green-600 text-xs">
              Available
            </Badge>
          ) : (
            <Badge className="bg-red-500 hover:bg-red-600 text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {!plot.isActive ? 'Inactive' : 'Unavailable'}
            </Badge>
          )}
        </div>

        {/* Basic Size Info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Ruler className="h-4 w-4" />
            <span>{sizeFormatted.sqft} sqft</span>
          </div>
          <div className="flex items-center space-x-1">
            <Landmark className="h-4 w-4" />
            <span>{sizeFormatted.acres} acres</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}