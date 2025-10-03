// components/hotels/steps/SettingsReviewStep.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  CheckCircle, AlertCircle, Settings, Eye, Hotel, Utensils, 
  Image, Phone, Globe, Bed, Users, Star, Building2, MapPin,
  DollarSign, Calendar, Shield
} from "lucide-react"
import type { HotelFormData } from "@/types/hotels"

interface SettingsReviewStepProps {
  formData: HotelFormData
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  onInputChange: (field: string, value: any) => void
  getStepStatus: (stepIndex: number) => 'valid' | 'invalid' | 'incomplete'
}

export function SettingsReviewStep({
  formData,
  errors,
  setErrors,
  onInputChange,
  getStepStatus
}: SettingsReviewStepProps) {
  const stepStatuses = [
    { index: 0, title: "Basic Information", icon: Hotel },
    { index: 1, title: "Dimensions & Pricing", icon: Building2 },
    { index: 2, title: "Amenities & Services", icon: Star },
    { index: 3, title: "Rooms & Suites", icon: Bed },
    { index: 4, title: "Dining Venues", icon: Utensils },
    { index: 5, title: "Marketing & Media", icon: Image },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'invalid':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-amber-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'bg-green-50 border-green-200'
      case 'invalid':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-amber-50 border-amber-200'
    }
  }

  const allStepsValid = stepStatuses.every(step => getStepStatus(step.index) === 'valid')
  const totalRooms = (formData.roomsSuites || []).reduce((sum, room) => sum + (room.count || 0), 0)
  const totalDiningVenues = (formData.dining || []).length
  const hasMainImage = !!formData.mainImage
  const galleryCount = (formData.gallery || []).length

  return (
    <div className="space-y-6">
      <Tabs defaultValue="review" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="review" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Review
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Review Tab */}
        <TabsContent value="review" className="space-y-6">
          {/* Step Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Form Completion Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stepStatuses.map((step) => {
                  const status = getStepStatus(step.index)
                  const Icon = step.icon
                  
                  return (
                    <div 
                      key={step.index} 
                      className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(status)}`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-gray-600" />
                        <span className="font-medium">{step.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={status === 'valid' ? 'default' : status === 'invalid' ? 'destructive' : 'secondary'}>
                          {status === 'valid' ? 'Complete' : status === 'invalid' ? 'Invalid' : 'Incomplete'}
                        </Badge>
                        {getStatusIcon(status)}
                      </div>
                    </div>
                  )
                })}
              </div>

              {!allStepsValid && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Incomplete Information</span>
                  </div>
                  <p className="text-amber-700 text-sm mt-1">
                    Please complete all required fields in the previous steps before submitting.
                  </p>
                </div>
              )}

              {allStepsValid && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Ready to Submit</span>
                  </div>
                  <p className="text-green-700 text-sm mt-1">
                    All required information has been provided. Your hotel is ready to be saved.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hotel Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hotel className="h-5 w-5" />
                Hotel Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Basic Info */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">Basic Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Name:</span> {formData.name || 'Not provided'}</p>
                    <p><span className="font-medium">Type:</span> {formData.type || 'Not provided'}</p>
                    <p><span className="font-medium">Location:</span> {formData.location || 'Not provided'}</p>
                    <p><span className="font-medium">Status:</span> 
                      <Badge variant="outline" className="ml-1">{formData.status || 'Not provided'}</Badge>
                    </p>
                    <p><span className="font-medium">Rating:</span> 
                      {formData.rating ? (
                        <span className="flex items-center gap-1 ml-1">
                          {formData.rating} <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        </span>
                      ) : 'Not provided'}
                    </p>
                  </div>
                </div>

                {/* Dimensions */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">Property Details</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Floors:</span> {formData.dimensions?.floors || 'Not provided'}</p>
                    <p><span className="font-medium">Height:</span> {formData.dimensions?.height || 'Not provided'}</p>
                    <p><span className="font-medium">Total Area:</span> 
                      {formData.dimensions?.totalArea ? `${formData.dimensions.totalArea} sqm` : 'Not provided'}
                    </p>
                    <p><span className="font-medium">Year:</span> {formData.year || 'Not provided'}</p>
                    <p><span className="font-medium">Price:</span> 
                      {formData.price?.total ? (
                        <span className="font-semibold text-green-600 ml-1">{formData.price.total}</span>
                      ) : 'Not provided'}
                    </p>
                  </div>
                </div>

                {/* Rooms & Services */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">Accommodations</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Total Rooms:</span> {totalRooms || 'Not calculated'}</p>
                    <p><span className="font-medium">Room Types:</span> {(formData.roomsSuites || []).length || 0}</p>
                    <p><span className="font-medium">Dining Venues:</span> {totalDiningVenues || 0}</p>
                    <p><span className="font-medium">Main Image:</span> 
                      {hasMainImage ? (
                        <Badge variant="default" className="ml-1">✓ Added</Badge>
                      ) : (
                        <Badge variant="destructive" className="ml-1">Missing</Badge>
                      )}
                    </p>
                    <p><span className="font-medium">Gallery:</span> {galleryCount} images</p>
                  </div>
                </div>
              </div>

              {/* Description Preview */}
              {formData.description && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold text-sm text-gray-700 uppercase tracking-wide mb-2">Description</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {formData.description.length > 200 
                      ? `${formData.description.substring(0, 200)}...` 
                      : formData.description
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Hotel Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Visibility Settings */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700">Visibility & Status</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isActive"
                      checked={formData.isActive ?? true}
                      onCheckedChange={(checked) => onInputChange('isActive', !!checked)}
                    />
                    <Label htmlFor="isActive" className="flex items-center gap-2 cursor-pointer">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Active (Hotel is visible in listings)
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="verified"
                      checked={formData.verified ?? true}
                      onCheckedChange={(checked) => onInputChange('verified', !!checked)}
                    />
                    <Label htmlFor="verified" className="flex items-center gap-2 cursor-pointer">
                      <Shield className="h-4 w-4 text-blue-600" />
                      Verified (Information has been verified)
                    </Label>
                  </div>
                  
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isAvailable"
                      checked={formData.isAvailable ?? true}
                      onCheckedChange={(checked) => onInputChange('isAvailable', !!checked)}
                    />
                    <Label htmlFor="isAvailable" className="flex items-center gap-2 cursor-pointer">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      Available for Investment
                    </Label>
                  </div>
                </div>
              </div>


              {/* Additional Notes */}
              <div className="pt-4 border-t">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h5 className="font-semibold text-blue-900">Ready to Submit</h5>
                      <p className="text-blue-800 text-sm mt-1">
                        Once you submit this hotel, it will be saved to the database and can be viewed by authorized users. 
                        You can always edit the information later if needed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
