import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  MapPin, 
  Building, 
  Calendar, 
  DollarSign, 
  Users, 
  Home,
  Bed,
  Bath,
  Square,
  Compass,
  Crown,
  Star,
  Zap,
  CheckCircle,
  Building2,
  Phone,
  Mail,
  User,
  Eye,
  Layers,
  Tag
} from "lucide-react"
import type { IProperty } from "@/types/properties"

interface PropertyViewModalProps {
  isOpen: boolean
  onClose: () => void
  property: IProperty | null
}

export function PropertyViewModal({ isOpen, onClose, property }: PropertyViewModalProps) {
  if (!property) return null

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric", 
      year: "numeric",
    })
  }

  const getAvailabilityColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "ready":
        return "bg-green-500"
      case "offplan": 
        return "bg-blue-500"
      case "available":
        return "bg-green-500"
      case "reserved":
        return "bg-yellow-500"
      case "sold":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getOwnershipColor = (ownershipType: string) => {
    switch (ownershipType.toLowerCase()) {
      case "primary":
        return "bg-blue-500"
      case "secondary":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatPrice = (property: IProperty) => {
    if (property.price) {
      return property.price
    }
    
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            {property.name}
            <Badge variant="outline" className="font-mono text-xs">
              {property.id}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cover Image with Flags */}
          <div className="relative">
            <img
              src={property.coverImage || "/placeholder.svg"}
              alt={property.name}
              className="w-full h-64 object-cover rounded-lg"
            />
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              {property.flags?.elite && (
                <Badge className="bg-yellow-500 text-white">
                  <Crown className="h-3 w-3 mr-1" />
                  Elite
                </Badge>
              )}
              {property.flags?.featured && (
                <Badge className="bg-blue-500 text-white">
                  <Star className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              )}
              {property.flags?.exclusive && (
                <Badge className="bg-purple-500 text-white">
                  <Zap className="h-3 w-3 mr-1" />
                  Exclusive
                </Badge>
              )}
              {property.flags?.highValue && (
                <Badge className="bg-green-500 text-white">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  High Value
                </Badge>
              )}
            </div>
            
            <div className="absolute bottom-4 right-4 flex gap-2">
              <Badge className={`text-white ${getAvailabilityColor(property.availabilityStatus)}`}>
                {property.availabilityStatus}
              </Badge>
              <Badge className={`text-white ${getOwnershipColor(property.ownershipType)}`}>
                {property.ownershipType}
              </Badge>
            </div>
          </div>

          {/* Main Property Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Info */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Property Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Type:</span>
                    <span className="font-medium">{property.propertyType}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Bedrooms:</span>
                    <div className="flex items-center gap-1">
                      <Bed className="h-4 w-4" />
                      <span className="font-medium">{property.bedrooms}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Bathrooms:</span>
                    <div className="flex items-center gap-1">
                      <Bath className="h-4 w-4" />
                      <span className="font-medium">{property.bathrooms}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Built-up Area:</span>
                    <div className="flex items-center gap-1">
                      <Square className="h-4 w-4" />
                      <span className="font-medium">{property.builtUpArea}</span>
                    </div>
                  </div>
                  
                  {property.carpetArea && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Carpet Area:</span>
                      <span className="font-medium">{property.carpetArea}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Facing:</span>
                    <div className="flex items-center gap-1">
                      <Compass className="h-4 w-4" />
                      <span className="font-medium">{property.facingDirection}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Floor:</span>
                    <div className="flex items-center gap-1">
                      <Layers className="h-4 w-4" />
                      <span className="font-medium">{property.floorLevel}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Furnishing:</span>
                    <span className="font-medium">{property.furnishingStatus}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Location Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <p className="font-medium">{property.location.address}</p>
                    <p className="text-sm text-muted-foreground">
                      {property.location.area}, {property.location.city}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {property.location.country}
                    </p>
                  </div>
                  
                  {property.location.coordinates && (
                    <div className="text-xs text-muted-foreground">
                      Coordinates: {property.location.coordinates.latitude.toFixed(6)}, {property.location.coordinates.longitude.toFixed(6)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Pricing & Links */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-2xl font-bold text-green-600">
                    {formatPrice(property)}
                  </div>
                  
                  {property.pricePerSqFt && (
                    <div className="text-sm text-muted-foreground">
                      AED {property.pricePerSqFt}/sq ft
                    </div>
                  )}
                  
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="font-medium">{property.propertyStatus}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Links */}
              {(property.project || property.developer || property.community) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Associated
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {property.project && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Project:</span>
                        <Badge variant="outline" className="text-blue-600 bg-blue-50">
                          {property.project.projectName}
                        </Badge>
                      </div>
                    )}
                    
                    {property.developer && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Developer:</span>
                        <Badge variant="outline" className="text-green-600 bg-green-50">
                          {property.developer.developerName}
                        </Badge>
                      </div>
                    )}
                    
                    {property.community && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Community:</span>
                        <Badge variant="outline" className="text-purple-600 bg-purple-50">
                          {property.community.communityName}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Agent Information */}
              {property.agent && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Agent Contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Name:</span>
                      <span className="font-medium">{property.agent.agentName}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">ID:</span>
                      <span className="font-mono text-sm">{property.agent.agentId}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Phone:</span>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span className="font-medium">{property.agent.phoneNumber}</span>
                      </div>
                    </div>
                    
                    {property.agent.email && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Email:</span>
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="font-medium text-sm">{property.agent.email}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed mb-4">{property.description}</p>
              {property.overview && property.overview !== property.description && (
                <>
                  <h4 className="font-medium mb-2">Overview</h4>
                  <p className="text-muted-foreground leading-relaxed">{property.overview}</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Amenities ({getTotalAmenities()})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {property.amenities.map((category, index) => (
                    <div key={index} className="space-y-2">
                      <h4 className="font-medium text-sm">{category.category}</h4>
                      <div className="flex flex-wrap gap-1">
                        {category.items.map((item, itemIndex) => (
                          <Badge key={itemIndex} variant="outline" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Plan */}
          {property.paymentPlan && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Payment Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 border rounded">
                    <div className="text-lg font-semibold text-blue-600">{property.paymentPlan.booking}</div>
                    <div className="text-sm text-muted-foreground">Booking</div>
                  </div>
                  
                  <div className="text-center p-3 border rounded">
                    <div className="text-lg font-semibold text-orange-600">
                      {property.paymentPlan.construction?.length || 0} Milestones
                    </div>
                    <div className="text-sm text-muted-foreground">Construction</div>
                  </div>
                  
                  <div className="text-center p-3 border rounded">
                    <div className="text-lg font-semibold text-green-600">{property.paymentPlan.handover}</div>
                    <div className="text-sm text-muted-foreground">Handover</div>
                  </div>
                </div>
                
                {property.paymentPlan.construction && property.paymentPlan.construction.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Construction Milestones</h4>
                    <div className="space-y-1">
                      {property.paymentPlan.construction.map((milestone, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{milestone.milestone}</span>
                          <span className="font-medium">{milestone.percentage}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Property ID:</span>
                <span className="font-mono">{property.id}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Version:</span>
                <span>v{property.version}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={property.isActive ? "default" : "destructive"}>
                  {property.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>
                  {formatDate(property.createdAt)}
                  {property.createdBy?.email && ` by ${property.createdBy.email}`}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Updated:</span>
                <span>
                  {formatDate(property.updatedAt)}
                  {property.updatedBy?.email && ` by ${property.updatedBy.email}`}
                </span>
              </div>

              {property.tags && property.tags.length > 0 && (
                <div className="space-y-2">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    Tags:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {property.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gallery */}
          {property.gallery && property.gallery.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Gallery ({property.gallery.length + 1} images)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {property.gallery.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${property.name} - Image ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}