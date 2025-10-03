"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  MapPin, 
  Building2, 
  Star,
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
  Accessibility,
  Crown,
  Utensils,
  Bed
} from "lucide-react"
import type { IHotel, IRoomSuite, IDiningVenue } from "@/types/hotels"
import { ReactElement, JSXElementConstructor, ReactNode, ReactPortal, Key } from "react"

interface HotelViewModalProps {
  isOpen: boolean
  onClose: () => void
  hotel: IHotel | null
}

export function HotelViewModal({ isOpen, onClose, hotel }: HotelViewModalProps) {
  if (!hotel) return null

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
      case "operational":
        return "text-green-600 bg-green-100"
      case "under construction":
        return "text-blue-600 bg-blue-100"
      case "planned":
        return "text-purple-600 bg-purple-100"
      case "renovation":
        return "text-orange-600 bg-orange-100"
      case "luxury":
      case "ultra luxury":
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
      case "resort":
        return "text-blue-600 bg-blue-100"
      case "business":
        return "text-purple-600 bg-purple-100"
      case "boutique":
        return "text-orange-600 bg-orange-100"
      case "luxury":
        return "text-yellow-600 bg-yellow-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const amenityIcons: Record<string, any> = {
    spa: Cpu,
    gym: Cpu,
    pool: Droplet,
    infinityPool: Droplet,
    privateBeach: Trees,
    businessCenter: Cpu,
    concierge: Users,
    roomService: Utensils,
    valet: Car,
    butler: Users,
    helipad: Zap,
    marina: Droplet,
    golf: Trees,
    tennis: Users,
    kidClub: Baby,
    petFriendly: Dog,
    airportTransfer: Car,
    wheelchairAccessible: Accessibility,
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <DialogTitle className="text-2xl">{hotel.name}</DialogTitle>
              <Badge className="bg-white/90 text-gray-900 font-mono text-xs">
                {hotel.hotelId}
              </Badge>
              {hotel.verified && (
                <Badge className="bg-blue-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            {hotel.subtitle && (
              <p className="text-muted-foreground">{hotel.subtitle}</p>
            )}
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{hotel.location}{hotel.subLocation ? `, ${hotel.subLocation}` : ''}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Building2 className="h-4 w-4" />
                <span>{hotel.type}</span>
              </div>
              {hotel.rating && (
                <div className="flex items-center space-x-1">
                  {Array.from({ length: hotel.rating }, (_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                  <span>{hotel.rating}-Star</span>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Main Image */}
          {hotel.mainImage && (
            <img 
              src={hotel.mainImage} 
              alt={hotel.name}
              className="w-full h-64 object-cover rounded-lg"
            />
          )}

          {/* Status and Basic Info */}
          <div className="flex items-center space-x-2 flex-wrap">
            <Badge className={`${getStatusColor(hotel.status)}`}>
              {hotel.status}
            </Badge>
            <Badge className={`${getCategoryColor(hotel.type)}`}>
              {hotel.type}
            </Badge>
            {hotel.legalDetails?.ownership && (
              <Badge className="text-green-600 bg-green-100">
                <Shield className="h-3 w-3 mr-1" />
                {hotel.legalDetails.ownership}
              </Badge>
            )}
            {hotel.saleInformation?.saleStatus === 'available' && (
              <Badge variant="outline">
                For Sale - {hotel.saleInformation.saleStatus}
              </Badge>
            )}
            {!hotel.isActive && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Inactive
              </Badge>
            )}
          </div>

          {/* Description */}
          {hotel.description && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">{hotel.description}</p>
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
                    {hotel.price.total}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {hotel.price.totalNumeric.toLocaleString()} {hotel.price.currency}
                  </div>
                  {hotel.saleInformation?.askingPrice && (
                    <div className="text-sm text-purple-600">
                      Asking: {hotel.saleInformation.askingPrice}
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
                    {hotel.dimensions?.floors} Floors
                  </div>
                  {hotel.dimensions?.height && (
                    <div className="text-sm text-muted-foreground">
                      Height: {hotel.dimensions.height}
                    </div>
                  )}
                  {hotel.dimensions?.totalArea && (
                    <div className="text-sm text-muted-foreground">
                      Total Area: {hotel.dimensions.totalArea.toLocaleString()} sqm
                    </div>
                  )}
                  {hotel.totalRooms && (
                    <div className="text-sm text-muted-foreground">
                      Total Rooms: {hotel.totalRooms}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rooms/Suites Information */}
          {hotel.roomsSuites && hotel.roomsSuites.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bed className="h-5 w-5 text-purple-600" />
                  Rooms & Suites
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {hotel.roomsSuites.map((room: IRoomSuite, index: number) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{room.name}</span>
                        {room.count && (
                          <Badge variant="outline">{room.count} rooms</Badge>
                        )}
                      </div>
                      {room.size && (
                        <div className="text-sm text-muted-foreground">
                          Size: {room.size}
                        </div>
                      )}
                      {room.description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {room.description}
                        </div>
                      )}
                      {room.features && room.features.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {room.features.map((feature: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined, fIndex: Key | null | undefined) => (
                            <Badge key={fIndex} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dining Venues */}
          {hotel.dining && hotel.dining.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-orange-600" />
                  Dining Venues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {hotel.dining.map((venue: IDiningVenue, index: number) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{venue.name}</span>
                        <Badge variant="outline">{venue.type}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Location: {venue.location}
                      </div>
                      {venue.capacity && (
                        <div className="text-sm text-muted-foreground">
                          Capacity: {venue.capacity} guests
                        </div>
                      )}
                      {venue.description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {venue.description}
                        </div>
                      )}
                      {venue.cuisine && venue.cuisine.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {venue.cuisine.map((cuisineType: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined, cIndex: Key | null | undefined) => (
                            <Badge key={cIndex} variant="outline" className="text-xs">
                              {cuisineType}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Financial Metrics */}
        

          {/* Legal Details */}
          {hotel.legalDetails && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Legal Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {hotel.legalDetails.zoning && (
                    <div>
                      <div className="font-medium">Zoning</div>
                      <div className="text-muted-foreground">{hotel.legalDetails.zoning}</div>
                    </div>
                  )}
                  <div>
                    <div className="font-medium">Ownership</div>
                    <div className="text-muted-foreground capitalize">{hotel.legalDetails.ownership}</div>
                  </div>
                  {hotel.legalDetails.titleDeedNumber && (
                    <div>
                      <div className="font-medium">Title Deed Number</div>
                      <div className="text-muted-foreground">{hotel.legalDetails.titleDeedNumber}</div>
                    </div>
                  )}
                  {hotel.legalDetails.reraNumber && (
                    <div>
                      <div className="font-medium">RERA Number</div>
                      <div className="text-muted-foreground">{hotel.legalDetails.reraNumber}</div>
                    </div>
                  )}
                  {hotel.legalDetails.leaseholdExpiry && (
                    <div>
                      <div className="font-medium">Leasehold Expiry</div>
                      <div className="text-muted-foreground">
                        {new Date(hotel.legalDetails.leaseholdExpiry).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>

                {hotel.legalDetails.mortgageDetails && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="font-medium mb-2">Mortgage Details</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium">Lender</div>
                        <div className="text-muted-foreground">{hotel.legalDetails.mortgageDetails.lender}</div>
                      </div>
                      <div>
                        <div className="font-medium">Outstanding Amount</div>
                        <div className="text-muted-foreground">
                          {hotel.legalDetails.mortgageDetails.outstandingAmount.toLocaleString()} {hotel.price.currency}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">Maturity Date</div>
                        <div className="text-muted-foreground">
                          {new Date(hotel.legalDetails.mortgageDetails.maturityDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Developer & Owner */}
          {(hotel.developer || hotel.currentOwner) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {hotel.developer && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-purple-600" />
                      Developer
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="font-semibold">{hotel.developer.name}</div>
                      {hotel.developer.established && (
                        <div className="text-sm text-muted-foreground">
                          Established: {hotel.developer.established}
                        </div>
                      )}
                      {hotel.developer.headquarters && (
                        <div className="text-sm text-muted-foreground">
                          HQ: {hotel.developer.headquarters}
                        </div>
                      )}
                      {hotel.developer.portfolio && hotel.developer.portfolio.length > 0 && (
                        <div>
                          <div className="text-sm font-medium mb-1">Portfolio</div>
                          <div className="text-xs text-muted-foreground">
                            {hotel.developer.portfolio.join(", ")}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {hotel.currentOwner && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-600" />
                      Owner
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="font-semibold">{hotel.currentOwner}</div>
                      {hotel.architecture && (
                        <div>
                          <div className="font-medium">Architecture Style</div>
                          <div className="text-muted-foreground">{hotel.architecture}</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Amenities */}
          {hotel.amenities && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(hotel.amenities)
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

          {/* Features & Facts */}
          {((hotel.features && hotel.features.length > 0) || (hotel.facts && hotel.facts.length > 0)) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {hotel.features && hotel.features.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {hotel.features.map((feature: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined, index: Key | null | undefined) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {hotel.facts && hotel.facts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Facts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {hotel.facts.map((fact: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined, index: Key | null | undefined) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Award className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                          <span className="text-sm">{fact}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Location & Connectivity */}
          {hotel.locationDetails && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-red-600" />
                  Location & Connectivity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {hotel.locationDetails.description && (
                    <p className="text-sm text-muted-foreground">
                      {hotel.locationDetails.description}
                    </p>
                  )}

                  {hotel.locationDetails.connectivity && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {hotel.locationDetails.connectivity.airport && (
                        <div>
                          <div className="font-medium">Airport</div>
                          <div className="text-muted-foreground">
                            {hotel.locationDetails.connectivity.airport} ({hotel.locationDetails.connectivity.airportDistance}km)
                          </div>
                        </div>
                      )}
                      {hotel.locationDetails.connectivity.metroStation && (
                        <div>
                          <div className="font-medium">Nearest Metro</div>
                          <div className="text-muted-foreground">
                            {hotel.locationDetails.connectivity.metroStation} ({hotel.locationDetails.connectivity.metroDistance}km)
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {hotel.locationDetails.nearbyAttractions && hotel.locationDetails.nearbyAttractions.length > 0 && (
                    <div>
                      <div className="font-medium mb-2">Nearby Attractions</div>
                      <div className="flex flex-wrap gap-2">
                        {hotel.locationDetails.nearbyAttractions.map((attraction, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {attraction}
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
          {hotel.gallery && hotel.gallery.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {hotel.gallery.map((image: string | Blob | undefined, index: number) => (
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
                  <div className="font-medium">Year</div>
                  <div className="text-muted-foreground">{hotel.year}</div>
                </div>
                {hotel.rating && (
                  <div>
                    <div className="font-medium">Star Rating</div>
                    <div className="text-muted-foreground">{hotel.rating}-Star</div>
                  </div>
                )}
                {hotel.createdAt && (
                  <div>
                    <div className="font-medium">Created</div>
                    <div className="text-muted-foreground">{formatDateTime(hotel.createdAt)}</div>
                  </div>
                )}
                {hotel.updatedAt && (
                  <div>
                    <div className="font-medium">Last Updated</div>
                    <div className="text-muted-foreground">{formatDateTime(hotel.updatedAt)}</div>
                  </div>
                )}
                {hotel.createdBy && (
                  <div>
                    <div className="font-medium">Created By</div>
                    <div className="text-muted-foreground">{hotel.createdBy}</div>
                  </div>
                )}
                {hotel.updatedBy && (
                  <div>
                    <div className="font-medium">Updated By</div>
                    <div className="text-muted-foreground">{hotel.updatedBy}</div>
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