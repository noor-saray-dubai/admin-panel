"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  MapPin, 
  Building, 
  Ruler, 
  DollarSign, 
  Factory,
  Home,
  Hotel,
  Layers,
  Shield,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  BarChart3
} from "lucide-react"
import type { IPlot, PlotViewModalProps } from "@/types/plot"

export function PlotViewModal({ isOpen, onClose, plot }: PlotViewModalProps) {
  if (!plot) return null

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "industrial":
        return Factory
      case "community":
        return MapPin
      case "building":
        return Building
      default:
        return Building
    }
  }

  const getSubtypeIcon = (subtype?: string) => {
    switch (subtype) {
      case "hotel":
        return Hotel
      case "residential":
        return Home
      case "mixuse":
        return Layers
      default:
        return Building
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatPrice = (price: { total: string; totalNumeric: number; currency: string }) => {
    return price.total || `${price.totalNumeric.toLocaleString()} ${price.currency}`
  }

  const formatSize = (size: { sqft: number; sqm: number; acres: number }) => {
    return {
      sqft: size.sqft.toLocaleString(),
      sqm: size.sqm.toLocaleString(),
      acres: size.acres.toFixed(2)
    }
  }

  const getROIColor = (roi: number) => {
    if (roi >= 15) return "text-green-600"
    if (roi >= 10) return "text-yellow-600"
    return "text-red-600"
  }

  const TypeIcon = getTypeIcon(plot.type)
  const SubtypeIcon = getSubtypeIcon(plot.subtype)
  const sizeFormatted = formatSize(plot.size)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <DialogTitle className="text-2xl">{plot.title}</DialogTitle>
              <Badge className="bg-white/90 text-gray-900 font-mono text-xs">
                {plot.plotId}
              </Badge>
              {plot.verified && (
                <Badge className="bg-blue-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{plot.subtitle}</p>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{plot.location}, {plot.subLocation}</span>
              </div>
              <div className="flex items-center space-x-1">
                <TypeIcon className="h-4 w-4" />
                <span>{plot.type}</span>
                {plot.subtype && (
                  <>
                    <span>•</span>
                    <SubtypeIcon className="h-4 w-4" />
                    <span>{plot.subtype}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Main Image */}
          {plot.image && (
            <img 
              src={plot.image} 
              alt={plot.title}
              className="w-full h-64 object-cover rounded-lg"
            />
          )}

          {/* Status and Ownership */}
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">{plot.status}</Badge>
            <Badge className="text-green-600 bg-green-100">
              <Shield className="h-3 w-3 mr-1" />
              {plot.ownership}
            </Badge>
            {plot.isAvailable && plot.isActive && (
              <Badge className="bg-green-500">Available</Badge>
            )}
            {!plot.isActive && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Inactive
              </Badge>
            )}
          </div>

          {/* Price and Size Information */}
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-green-600">
                    {formatPrice(plot.price)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {plot.price.currency} {plot.price.perSqft.toLocaleString()}/sqft
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Ruler className="h-5 w-5 text-blue-600" />
                  Size
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-lg font-semibold">
                    {sizeFormatted.sqft} sqft
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {sizeFormatted.sqm} sqm • {sizeFormatted.acres} acres
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Investment Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Investment Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className={`text-2xl font-bold ${getROIColor(plot.investment.roi)}`}>
                    {plot.investment.roi}%
                  </div>
                  <div className="text-sm text-muted-foreground">ROI</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {plot.investment.appreciation}%
                  </div>
                  <div className="text-sm text-muted-foreground">Appreciation</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {plot.investment.payback}y
                  </div>
                  <div className="text-sm text-muted-foreground">Payback Period</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Development Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="h-5 w-5 text-orange-600" />
                Development Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-medium">Floor Permissions</div>
                  <div className="text-muted-foreground">{plot.permissions.floors}</div>
                </div>
                <div>
                  <div className="font-medium">Usage Type</div>
                  <div className="text-muted-foreground">{plot.permissions.usage}</div>
                </div>
                <div>
                  <div className="font-medium">Floor Area Ratio</div>
                  <div className="text-muted-foreground">{plot.permissions.far}</div>
                </div>
                <div>
                  <div className="font-medium">Coverage</div>
                  <div className="text-muted-foreground">{plot.permissions.coverage}%</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          {plot.features && plot.features.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {plot.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Developer */}
          {plot.developer && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Developer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground">{plot.developer}</div>
              </CardContent>
            </Card>
          )}

          {/* Location Details */}
          {plot.locationDetails && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-600" />
                  Location Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {plot.locationDetails.description && (
                  <p className="text-muted-foreground">{plot.locationDetails.description}</p>
                )}
                
                {plot.locationDetails.coordinates && 
                 (plot.locationDetails.coordinates.latitude !== 0 || plot.locationDetails.coordinates.longitude !== 0) && (
                  <div>
                    <div className="font-medium mb-2">Coordinates</div>
                    <div className="text-sm text-muted-foreground">
                      Lat: {plot.locationDetails.coordinates.latitude}, 
                      Lng: {plot.locationDetails.coordinates.longitude}
                    </div>
                  </div>
                )}

                {plot.locationDetails.accessibility && plot.locationDetails.accessibility.length > 0 && (
                  <div>
                    <div className="font-medium mb-2">Accessibility</div>
                    <div className="flex flex-wrap gap-2">
                      {plot.locationDetails.accessibility.map((item, index) => (
                        <Badge key={index} variant="outline">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Gallery */}
          {plot.gallery && plot.gallery.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {plot.gallery.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">Created</div>
                  <div className="text-muted-foreground">{formatDateTime(plot.createdAt)}</div>
                </div>
                <div>
                  <div className="font-medium">Last Updated</div>
                  <div className="text-muted-foreground">{formatDateTime(plot.updatedAt)}</div>
                </div>
                {plot.createdBy && (
                  <div>
                    <div className="font-medium">Created By</div>
                    <div className="text-muted-foreground">{plot.createdBy}</div>
                  </div>
                )}
                {plot.updatedBy && (
                  <div>
                    <div className="font-medium">Updated By</div>
                    <div className="text-muted-foreground">{plot.updatedBy}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
