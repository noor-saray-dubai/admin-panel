"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  MapPin, 
  Building2, 
  Home,
  DollarSign, 
  Users,
  Shield,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Calendar,
  FileText,
  Briefcase,
  Award,
  Cpu,
  Wifi,
  Zap,
  Droplet,
  Wind,
  Car,
  Trees,
  Baby,
  Dog,
  Accessibility
} from "lucide-react"
import type { IBuilding, IUnit } from "@/types/buildings"
import { ReactElement, JSXElementConstructor, ReactNode, ReactPortal, Key } from "react"

interface BuildingViewModalProps {
  isOpen: boolean
  onClose: () => void
  building: IBuilding | null
}

export function BuildingViewModal({ isOpen, onClose, building }: BuildingViewModalProps) {
  if (!building) return null

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "operational":
        return "text-green-600 bg-green-100"
      case "under construction":
        return "text-blue-600 bg-blue-100"
      case "planned":
        return "text-purple-600 bg-purple-100"
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

  const amenityIcons: Record<string, any> = {
    gym: Cpu,
    spa: Cpu,
    parking: Car,
    security247: Shield,
    smartHome: Wifi,
    highSpeedElevators: Zap,
    landscapedGardens: Trees,
    childrenPlayArea: Baby,
    petFriendly: Dog,
    wheelchairAccessible: Accessibility,
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <DialogTitle className="text-2xl">{building.name}</DialogTitle>
              <Badge className="bg-white/90 text-gray-900 font-mono text-xs">
                {building.buildingId}
              </Badge>
              {building.verified && (
                <Badge className="bg-blue-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            {building.subtitle && (
              <p className="text-muted-foreground">{building.subtitle}</p>
            )}
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{building.location}{building.subLocation ? `, ${building.subLocation}` : ''}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Building2 className="h-4 w-4" />
                <span>{building.type}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Main Image */}
          {building.mainImage && (
            <img 
              src={building.mainImage} 
              alt={building.name}
              className="w-full h-64 object-cover rounded-lg"
            />
          )}

          {/* Status and Basic Info */}
          <div className="flex items-center space-x-2 flex-wrap">
            <Badge className={`${getStatusColor(building.status)}`}>
              {building.status}
            </Badge>
            <Badge className={`${getCategoryColor(building.category)}`}>
              {building.category}
            </Badge>
            {building.legalDetails?.ownership && (
              <Badge className="text-green-600 bg-green-100">
                <Shield className="h-3 w-3 mr-1" />
                {building.legalDetails.ownership}
              </Badge>
            )}
            {building.saleInformation?.isForSale && (
              <Badge variant="outline">
                For Sale - {building.saleInformation.saleStatus}
              </Badge>
            )}
            {building.isFeatured && (
              <Badge className="bg-yellow-500">
                <Award className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
            {!building.isActive && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Inactive
              </Badge>
            )}
          </div>

          {/* Description */}
          {building.description && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">{building.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Price and Dimensions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    {building.price.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {building.price.valueNumeric.toLocaleString()} {building.price.currency}
                  </div>
                  {building.priceRange && (
                    <div className="text-sm text-blue-600">
                      Range: {building.priceRange.display}
                    </div>
                  )}
                  {building.saleInformation?.askingPrice && (
                    <div className="text-sm text-purple-600">
                      Asking: {building.saleInformation.askingPrice}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Dimensions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-lg font-semibold">
                    {building.dimensions.floors} Floors
                  </div>
                  {building.dimensions.height && (
                    <div className="text-sm text-muted-foreground">
                      Height: {building.dimensions.height}
                    </div>
                  )}
                  {building.dimensions.totalArea && (
                    <div className="text-sm text-muted-foreground">
                      Total Area: {building.dimensions.totalArea.toLocaleString()} sqm
                    </div>
                  )}
                  {building.dimensions.floorPlateSize && (
                    <div className="text-xs text-muted-foreground">
                      Floor Plate: {building.dimensions.floorPlateSize.toLocaleString()} sqm
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Units Information */}
          {building.units && building.units.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Home className="h-5 w-5 text-purple-600" />
                  Units
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <div className="font-medium">Total Units</div>
                      <div className="text-muted-foreground">{building.totalUnits}</div>
                    </div>
                    {building.availableUnits !== undefined && (
                      <div>
                        <div className="font-medium">Available Units</div>
                        <div className="text-muted-foreground">{building.availableUnits}</div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    {building.units.map((unit: IUnit, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{unit.type}</span>
                          {unit.count && (
                            <Badge variant="outline">{unit.count} units</Badge>
                          )}
                        </div>
                        {unit.sizeRange && (
                          <div className="text-sm text-muted-foreground">
                            {unit.sizeRange.min} - {unit.sizeRange.max} {unit.sizeRange.unit}
                          </div>
                        )}
                        {unit.priceRange && (
                          <div className="text-sm text-green-600">
                            {unit.priceRange.display}
                          </div>
                        )}
                        {unit.features && unit.features.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {unit.features.map((feature: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined, fIndex: Key | null | undefined) => (
                              <Badge key={fIndex} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Financial Metrics */}
          {building.financials && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Financial Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {building.financials.capRate && (
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-xl font-bold text-blue-600">
                        {building.financials.capRate}%
                      </div>
                      <div className="text-xs text-muted-foreground">Cap Rate</div>
                    </div>
                  )}
                  {building.financials.roi && (
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-xl font-bold text-green-600">
                        {building.financials.roi}%
                      </div>
                      <div className="text-xs text-muted-foreground">ROI</div>
                    </div>
                  )}
                  {building.financials.rentalYield && (
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-xl font-bold text-purple-600">
                        {building.financials.rentalYield}%
                      </div>
                      <div className="text-xs text-muted-foreground">Rental Yield</div>
                    </div>
                  )}
                  {building.financials.occupancyRate && (
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-xl font-bold text-orange-600">
                        {building.financials.occupancyRate}%
                      </div>
                      <div className="text-xs text-muted-foreground">Occupancy</div>
                    </div>
                  )}
                </div>
                {building.financials.annualRevenue && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium">Annual Revenue</div>
                        <div className="text-muted-foreground">
                          {building.financials.annualRevenue.toLocaleString()} {building.price.currency}
                        </div>
                      </div>
                      {building.financials.noi && (
                        <div>
                          <div className="font-medium">NOI</div>
                          <div className="text-muted-foreground">
                            {building.financials.noi.toLocaleString()} {building.price.currency}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Legal Details */}
          {building.legalDetails && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Legal Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Zoning</div>
                    <div className="text-muted-foreground">{building.legalDetails.zoning}</div>
                  </div>
                  <div>
                    <div className="font-medium">Ownership</div>
                    <div className="text-muted-foreground capitalize">{building.legalDetails.ownership}</div>
                  </div>
                  {building.legalDetails.titleDeedNumber && (
                    <div>
                      <div className="font-medium">Title Deed Number</div>
                      <div className="text-muted-foreground">{building.legalDetails.titleDeedNumber}</div>
                    </div>
                  )}
                  {building.legalDetails.reraNumber && (
                    <div>
                      <div className="font-medium">RERA Number</div>
                      <div className="text-muted-foreground">{building.legalDetails.reraNumber}</div>
                    </div>
                  )}
                  {building.legalDetails.leaseholdExpiry && (
                    <div>
                      <div className="font-medium">Leasehold Expiry</div>
                      <div className="text-muted-foreground">
                        {new Date(building.legalDetails.leaseholdExpiry).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>

                {building.legalDetails.mortgageDetails && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="font-medium mb-2">Mortgage Details</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium">Lender</div>
                        <div className="text-muted-foreground">{building.legalDetails.mortgageDetails.lender}</div>
                      </div>
                      <div>
                        <div className="font-medium">Outstanding Amount</div>
                        <div className="text-muted-foreground">
                          {building.legalDetails.mortgageDetails.outstandingAmount.toLocaleString()} {building.price.currency}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">Maturity Date</div>
                        <div className="text-muted-foreground">
                          {new Date(building.legalDetails.mortgageDetails.maturityDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Developer & Architect */}
          {(building.developer || building.architect) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {building.developer && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-purple-600" />
                      Developer
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="font-semibold">{building.developer.name}</div>
                      {building.developer.established && (
                        <div className="text-sm text-muted-foreground">
                          Established: {building.developer.established}
                        </div>
                      )}
                      {building.developer.headquarters && (
                        <div className="text-sm text-muted-foreground">
                          HQ: {building.developer.headquarters}
                        </div>
                      )}
                      {building.developer.portfolio && building.developer.portfolio.length > 0 && (
                        <div>
                          <div className="text-sm font-medium mb-1">Portfolio</div>
                          <div className="text-xs text-muted-foreground">
                            {building.developer.portfolio.join(", ")}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {building.architect && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      Architecture
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <div className="font-medium">Architect</div>
                        <div className="text-muted-foreground">{building.architect}</div>
                      </div>
                      {building.architecture && (
                        <div>
                          <div className="font-medium">Style</div>
                          <div className="text-muted-foreground">{building.architecture}</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Amenities */}
          {building.amenities && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(building.amenities)
                    .filter(([key, value]) => value === true)
                    .map(([key, value]) => {
                      const Icon = amenityIcons[key] || CheckCircle
                      return (
                        <div key={key} className="flex items-center space-x-2">
                          <Icon className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Features & Highlights */}
          {((building.features && building.features.length > 0) || (building.highlights && building.highlights.length > 0)) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {building.features && building.features.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {building.features.map((feature: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined, index: Key | null | undefined) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {building.highlights && building.highlights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Highlights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {building.highlights.map((highlight: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined, index: Key | null | undefined) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Award className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                          <span className="text-sm">{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Location & Connectivity */}
         {/* Location & Connectivity */}
          {building.locationDetails && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-red-600" />
                  Location & Connectivity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {building.locationDetails.description && (
                    <p className="text-sm text-muted-foreground">
                      {building.locationDetails.description}
                    </p>
                  )}

                  {building.locationDetails.connectivity && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {building.locationDetails.connectivity.metro && (
                        <div>
                          <div className="font-medium">Nearest Metro</div>
                          <div className="text-muted-foreground">
                            {building.locationDetails.connectivity.metro.station} ({building.locationDetails.connectivity.metro.distance}km)
                          </div>
                        </div>
                      )}
                      {building.locationDetails.connectivity.airport && (
                        <div>
                          <div className="font-medium">Airport</div>
                          <div className="text-muted-foreground">
                            {building.locationDetails.connectivity.airport.name} ({building.locationDetails.connectivity.airport.distance}km)
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {building.locationDetails.connectivity?.landmarks && building.locationDetails.connectivity.landmarks.length > 0 && (
                    <div>
                      <div className="font-medium mb-2">Nearby Landmarks</div>
                      <div className="flex flex-wrap gap-2">
                        {building.locationDetails.connectivity.landmarks.map((landmark, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {landmark.name} ({landmark.distance}km)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gallery */}
          {building.gallery && building.gallery.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {building.gallery.map((image: string | Blob | undefined, index: number) => (
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
                  <div className="font-medium">Year Completed</div>
                  <div className="text-muted-foreground">{building.year}</div>
                </div>
                {building.yearBuilt && building.yearBuilt !== building.year && (
                  <div>
                    <div className="font-medium">Year Built</div>
                    <div className="text-muted-foreground">{building.yearBuilt}</div>
                  </div>
                )}
                {building.rating && (
                  <div>
                    <div className="font-medium">Rating</div>
                    <div className="text-muted-foreground">{building.rating}</div>
                  </div>
                )}
                {building.sustainabilityRating && (
                  <div>
                    <div className="font-medium">Sustainability</div>
                    <div className="text-muted-foreground">{building.sustainabilityRating}</div>
                  </div>
                )}
                {building.createdAt && (
                  <div>
                    <div className="font-medium">Created</div>
                    <div className="text-muted-foreground">{formatDateTime(building.createdAt)}</div>
                  </div>
                )}
                {building.updatedAt && (
                  <div>
                    <div className="font-medium">Last Updated</div>
                    <div className="text-muted-foreground">{formatDateTime(building.updatedAt)}</div>
                  </div>
                )}
                {building.createdBy && (
                  <div>
                    <div className="font-medium">Created By</div>
                    <div className="text-muted-foreground">{building.createdBy}</div>
                  </div>
                )}
                {building.updatedBy && (
                  <div>
                    <div className="font-medium">Updated By</div>
                    <div className="text-muted-foreground">{building.updatedBy}</div>
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