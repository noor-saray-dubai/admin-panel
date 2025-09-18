"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  MapPin, 
  Building, 
  Store,
  DollarSign, 
  ShoppingCart,
  Users,
  Shield,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Calendar,
  FileText,
  Briefcase
} from "lucide-react"
import type { IMall } from "@/types/mall"

interface MallViewModalProps {
  isOpen: boolean
  onClose: () => void
  mall: IMall | null
}

export function MallViewModal({ isOpen, onClose, mall }: MallViewModalProps) {
  if (!mall) return null

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

  const formatSize = (size: { totalArea: number; retailArea: number; totalSqm: number; retailSqm: number; floors: number; parkingSpaces?: number }) => {
    return {
      totalArea: size.totalArea.toLocaleString(),
      retailArea: size.retailArea.toLocaleString(),
      totalSqm: size.totalSqm.toLocaleString(),
      retailSqm: size.retailSqm.toLocaleString(),
      floors: size.floors,
      parkingSpaces: size.parkingSpaces || 0
    }
  }

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
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const sizeFormatted = formatSize(mall.size)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <DialogTitle className="text-2xl">{mall.name}</DialogTitle>
              <Badge className="bg-white/90 text-gray-900 font-mono text-xs">
                {mall.mallId}
              </Badge>
              {mall.verified && (
                <Badge className="bg-blue-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{mall.subtitle}</p>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{mall.location}, {mall.subLocation}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Building className="h-4 w-4" />
                <span>{mall.ownership}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Main Image */}
          {mall.image && (
            <img 
              src={mall.image} 
              alt={mall.name}
              className="w-full h-64 object-cover rounded-lg"
            />
          )}

          {/* Status and Basic Info */}
          <div className="flex items-center space-x-2 flex-wrap">
            <Badge className={`${getStatusColor(mall.status)}`}>
              {mall.status}
            </Badge>
            <Badge className="text-green-600 bg-green-100">
              <Shield className="h-3 w-3 mr-1" />
              {mall.ownership}
            </Badge>
            {mall.saleInformation?.saleStatus && (
              <Badge variant="outline">
                {mall.saleInformation.saleStatus}
              </Badge>
            )}
            {mall.isOperational && (
              <Badge className="bg-green-500">
                <ShoppingCart className="h-3 w-3 mr-1" />
                Operational
              </Badge>
            )}
            {!mall.isActive && (
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
                    {formatPrice(mall.price)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {mall.price.currency} {mall.price.perSqft.toLocaleString()}/sqft
                  </div>
                  {mall.saleInformation?.askingPrice && mall.saleInformation.askingPrice !== mall.price.total && (
                    <div className="text-sm text-blue-600">
                      Asking: {mall.saleInformation.askingPrice}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="h-5 w-5 text-blue-600" />
                  Size & Structure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-lg font-semibold">
                    {sizeFormatted.totalArea} sqft total
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {sizeFormatted.retailArea} sqft retail • {sizeFormatted.floors} floors
                  </div>
                  {sizeFormatted.parkingSpaces > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {sizeFormatted.parkingSpaces} parking spaces
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rental and Financial Information */}
          {(mall.rentalDetails || mall.financials) && (
            <div className="grid grid-cols-2 gap-6">
              {mall.rentalDetails && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Store className="h-5 w-5 text-purple-600" />
                      Rental Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium">Total Stores</div>
                          <div className="text-muted-foreground">
                            {mall.rentalDetails.totalStores || 0} / {mall.rentalDetails.maxStores}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">Occupancy</div>
                          <div className="text-muted-foreground">
                            {mall.rentalDetails.currentOccupancy || 0}%
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">Vacant Stores</div>
                          <div className="text-muted-foreground">
                            {mall.rentalDetails.vacantStores || 0}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">Avg Rent</div>
                          <div className="text-muted-foreground">
                            {mall.rentalDetails.averageRent 
                              ? `${mall.rentalDetails.averageRent.toLocaleString()}/sqft` 
                              : 'N/A'
                            }
                          </div>
                        </div>
                      </div>
                      {mall.rentalDetails.anchorTenants && mall.rentalDetails.anchorTenants.length > 0 && (
                        <div>
                          <div className="font-medium mb-2">Anchor Tenants</div>
                          <div className="flex flex-wrap gap-1">
                            {mall.rentalDetails.anchorTenants.map((tenant, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tenant}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {mall.financials && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Financial Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-xl font-bold text-blue-600">
                          {mall.financials.capRate}%
                        </div>
                        <div className="text-muted-foreground">Cap Rate</div>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-xl font-bold text-green-600">
                          {mall.financials.roi}%
                        </div>
                        <div className="text-muted-foreground">ROI</div>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-xl font-bold text-purple-600">
                          {mall.financials.appreciation}%
                        </div>
                        <div className="text-muted-foreground">Appreciation</div>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-xl font-bold text-orange-600">
                          {mall.financials.payback}y
                        </div>
                        <div className="text-muted-foreground">Payback</div>
                      </div>
                    </div>
                    {mall.financials.annualRevenue && (
                      <div className="mt-3 pt-3 border-t text-sm">
                        <div className="font-medium">Annual Revenue</div>
                        <div className="text-muted-foreground">
                          {mall.financials.annualRevenue.toLocaleString()} {mall.price.currency}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Legal Details */}
          {mall.legalDetails && (
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
                    <div className="text-muted-foreground">{mall.legalDetails.zoning}</div>
                  </div>
                  {mall.legalDetails.titleDeedNumber && (
                    <div>
                      <div className="font-medium">Title Deed Number</div>
                      <div className="text-muted-foreground">{mall.legalDetails.titleDeedNumber}</div>
                    </div>
                  )}
                  {mall.legalDetails.reraNumber && (
                    <div>
                      <div className="font-medium">RERA Number</div>
                      <div className="text-muted-foreground">{mall.legalDetails.reraNumber}</div>
                    </div>
                  )}
                  {mall.legalDetails.leaseholdExpiry && (
                    <div>
                      <div className="font-medium">Leasehold Expiry</div>
                      <div className="text-muted-foreground">
                        {new Date(mall.legalDetails.leaseholdExpiry).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Mortgage Details */}
                {mall.legalDetails.mortgageDetails && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="font-medium mb-2">Mortgage Details</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium">Lender</div>
                        <div className="text-muted-foreground">{mall.legalDetails.mortgageDetails.lender}</div>
                      </div>
                      <div>
                        <div className="font-medium">Outstanding Amount</div>
                        <div className="text-muted-foreground">
                          {mall.legalDetails.mortgageDetails.outstandingAmount.toLocaleString()} {mall.price.currency}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">Maturity Date</div>
                        <div className="text-muted-foreground">
                          {new Date(mall.legalDetails.mortgageDetails.maturityDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Developer Information */}
          {mall.developer && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-purple-600" />
                  Developer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="font-semibold">{mall.developer.name}</div>
                  {mall.developer.established && (
                    <div className="text-sm text-muted-foreground">
                      Established: {mall.developer.established}
                    </div>
                  )}
                  {mall.developer.portfolio && mall.developer.portfolio.length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-1">Portfolio</div>
                      <div className="text-xs text-muted-foreground">
                        {mall.developer.portfolio.join(", ")}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Amenities and Features */}
          {(mall.amenities || (mall.features && mall.features.length > 0)) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Amenities & Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mall.amenities && (
                    <div>
                      <div className="font-medium mb-2">Amenities</div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {Object.entries(mall.amenities)
                          .filter(([key, value]) => value === true)
                          .map(([key, value]) => (
                            <div key={key} className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                              <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}

                  {mall.features && mall.features.length > 0 && (
                    <div>
                      <div className="font-medium mb-2">Features</div>
                      <div className="grid grid-cols-2 gap-2">
                        {mall.features.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gallery */}
          {mall.gallery && mall.gallery.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {mall.gallery.map((image, index) => (
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
                  <div className="font-medium">Year Built</div>
                  <div className="text-muted-foreground">{mall.yearBuilt || 'N/A'}</div>
                </div>
                <div>
                  <div className="font-medium">Year Opened</div>
                  <div className="text-muted-foreground">{mall.yearOpened || 'N/A'}</div>
                </div>
                {mall.rating && (
                  <div>
                    <div className="font-medium">Rating</div>
                    <div className="text-muted-foreground">{mall.rating}/5 stars</div>
                  </div>
                )}
                {mall.visitorsAnnually && (
                  <div>
                    <div className="font-medium">Annual Visitors</div>
                    <div className="text-muted-foreground">{mall.visitorsAnnually.toLocaleString()}</div>
                  </div>
                )}
                <div>
                  <div className="font-medium">Created</div>
                  <div className="text-muted-foreground">{formatDateTime(mall.createdAt || '')}</div>
                </div>
                <div>
                  <div className="font-medium">Last Updated</div>
                  <div className="text-muted-foreground">{formatDateTime(mall.updatedAt || '')}</div>
                </div>
                {mall.createdBy && (
                  <div>
                    <div className="font-medium">Created By</div>
                    <div className="text-muted-foreground">{mall.createdBy}</div>
                  </div>
                )}
                {mall.updatedBy && (
                  <div>
                    <div className="font-medium">Updated By</div>
                    <div className="text-muted-foreground">{mall.updatedBy}</div>
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