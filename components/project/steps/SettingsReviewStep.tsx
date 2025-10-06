// components/project/steps/SettingsReviewStep.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { 
  Settings, CheckCircle, AlertCircle, Eye, EyeOff, Award, 
  Building, DollarSign, MapPin, FileText, Calendar, Users,
  Star, Crown, Zap, Camera
} from "lucide-react"
import type { ProjectFormData } from "@/types/projects"
import type { StepValidationStatus } from "../ProjectFormStepNavigation"

interface SettingsReviewStepProps {
  formData: ProjectFormData
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  onInputChange: (field: string, value: any) => void
  validationStatus: StepValidationStatus
}

export function SettingsReviewStep({ 
  formData, 
  errors, 
  setErrors, 
  onInputChange,
  validationStatus 
}: SettingsReviewStepProps) {
  
  // Helper function to make field names more user-friendly
  const formatFieldName = (fieldName: string): string => {
    const fieldMap: Record<string, string> = {
      'name': 'Project Name',
      'location': 'Location',
      'developer': 'Developer',
      'description': 'Description',
      'overview': 'Overview',
      'price': 'Price',
      'priceNumeric': 'Price (Numeric)',
      'image': 'Cover Image',
      'gallery': 'Gallery Images',
      'totalUnits': 'Total Units',
      'completionDate': 'Completion Date',
      'launchDate': 'Launch Date',
      'type': 'Project Type',
      'status': 'Project Status',
      'amenities': 'Amenities',
      'unitTypes': 'Unit Types',
      'categories': 'Categories',
      'locationDetails.description': 'Location Description',
      'locationDetails.nearby': 'Nearby Places',
      'locationDetails.coordinates': 'Coordinates',
      'paymentPlan.booking': 'Booking Payment',
      'paymentPlan.handover': 'Handover Payment',
      'paymentPlan.construction': 'Construction Milestones',
      'flags.elite': 'Elite Project Flag',
      'flags.exclusive': 'Exclusive Flag',
      'flags.featured': 'Featured Flag',
      'flags.highValue': 'High Value Flag',
      'registrationOpen': 'Registration Status',
      // MongoDB-specific field names
      'id': 'Project ID',
      'slug': 'Project Slug',
      'locationSlug': 'Location Slug',
      'statusSlug': 'Status Slug',
      'developerSlug': 'Developer Slug',
      'createdBy': 'Created By',
      'updatedBy': 'Updated By',
      'version': 'Version',
      'isActive': 'Active Status',
      'tags': 'Tags',
      // Nested paths that MongoDB might return
      'paymentPlan.booking': 'Booking Payment Plan',
      'paymentPlan.construction.0.milestone': 'First Construction Milestone',
      'paymentPlan.construction.0.percentage': 'First Construction Percentage',
      'locationDetails.coordinates.latitude': 'Latitude',
      'locationDetails.coordinates.longitude': 'Longitude',
      'flags.elite': 'Elite Flag',
      'flags.exclusive': 'Exclusive Flag',
      'flags.highValue': 'High Value Flag',
      // Audit fields
      'createdBy': 'Created By (User Info)',
      'updatedBy': 'Updated By (User Info)',
      'createdBy.email': 'Creator Email',
      'updatedBy.email': 'Updater Email',
      'createdBy.timestamp': 'Creation Time',
      'updatedBy.timestamp': 'Update Time'
    }
    
    return fieldMap[fieldName] || fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
  }
  
  const steps = [
    { id: 'basic', title: 'Basic Information', icon: Building },
    { id: 'pricing', title: 'Pricing & Payment', icon: DollarSign },
    { id: 'details', title: 'Details & Overview', icon: FileText },
    { id: 'units', title: 'Units & Amenities', icon: Users },
    { id: 'location', title: 'Location Details', icon: MapPin },
    { id: 'marketing', title: 'Marketing & Media', icon: Eye },
    { id: 'legal', title: 'Legal & Financial', icon: FileText },
  ]

  const getStepStatus = (index: number) => {
    return validationStatus[index] || 'incomplete'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'invalid':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-amber-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'invalid':
        return 'bg-red-50 border-red-200 text-red-800'
      default:
        return 'bg-amber-50 border-amber-200 text-amber-800'
    }
  }

  const validSteps = Object.values(validationStatus).filter(s => s === 'valid').length
  const totalSteps = steps.length
  const completionPercentage = Math.round((validSteps / totalSteps) * 100)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-4">
        <Settings className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Settings & Review</h2>
      </div>

      {/* Error Summary */}
      {(errors.submit || Object.keys(errors).filter(key => key !== 'submit').length > 0) && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              Validation Errors
              <Badge variant="destructive" className="ml-auto">
                {Object.keys(errors).filter(key => key !== 'submit').length} Field Errors
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {errors.submit && (
              <div className="p-3 bg-red-100 border border-red-200 rounded-lg">
                <div className="font-medium text-red-800">General Error:</div>
                <div className="text-sm text-red-700 mt-1">{errors.submit}</div>
              </div>
            )}
            
            {Object.keys(errors).filter(key => key !== 'submit').length > 0 && (
              <div>
                <div className="font-medium text-red-800 mb-3">Field-Specific Errors:</div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {Object.entries(errors)
                    .filter(([key]) => key !== 'submit')
                    .map(([field, error]) => (
                      <div key={field} className="flex items-start gap-2 p-2 bg-red-100 border border-red-200 rounded">
                        <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-red-800 text-sm">{formatFieldName(field)}</div>
                          <div className="text-xs text-red-700">{error}</div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-800">
                <strong>💡 Tip:</strong> Navigate back to the relevant steps to fix these errors, then return here to submit.
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Form Progress Review */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Form Progress Review
            <Badge variant={completionPercentage === 100 ? "default" : "secondary"} className="ml-auto">
              {completionPercentage}% Complete
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {steps.map((step, index) => {
              const status = getStepStatus(index)
              const IconComponent = step.icon
              
              return (
                <div 
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${getStatusColor(status)}`}
                >
                  <IconComponent className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium flex-1">{step.title}</span>
                  {getStatusIcon(status)}
                  <Badge 
                    variant={status === 'valid' ? 'default' : status === 'invalid' ? 'destructive' : 'secondary'}
                    className="capitalize"
                  >
                    {status === 'valid' ? 'Complete' : status === 'invalid' ? 'Issues' : 'Incomplete'}
                  </Badge>
                </div>
              )
            })}
          </div>
          
          {completionPercentage < 100 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-amber-800">Incomplete Sections</div>
                  <div className="text-sm text-amber-700 mt-1">
                    Please complete all required sections before submitting. 
                    You can navigate back to any step to fix missing information.
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Project Name</Label>
                <p className="font-semibold">{formData.name || 'Not specified'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                <p>{formData.location || 'Not specified'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Developer</Label>
                <p>{formData.developer || 'Not specified'}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Type & Status</Label>
                <div className="flex gap-2">
                  {formData.type && (
                    <Badge variant="outline">{formData.type}</Badge>
                  )}
                  {formData.status && (
                    <Badge variant="secondary">{formData.status}</Badge>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Price</Label>
                <p className="font-semibold text-green-600">{formData.price.total || 'Not specified'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Total Units</Label>
                <p>{formData.totalUnits > 0 ? formData.totalUnits.toLocaleString() : 'Not specified'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Project Images
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Cover Image Preview */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-2 block">Cover Image</Label>
            {formData.image ? (
              <div className="relative w-full max-w-md">
                <img
                  src={formData.image}
                  alt="Cover Image Preview"
                  className="w-full h-48 object-cover rounded-lg border"
                />
                <Badge className="absolute top-2 left-2 bg-green-500">
                  ✓ Uploaded
                </Badge>
              </div>
            ) : (
              <div className="w-full max-w-md h-48 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Camera className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No cover image uploaded</p>
                </div>
              </div>
            )}
          </div>

          {/* Gallery Images Preview */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-2 block">
              Gallery Images ({formData.gallery.length})
            </Label>
            {formData.gallery.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {formData.gallery.slice(0, 8).map((imageUrl, index) => (
                  <div key={index} className="relative">
                    <img
                      src={imageUrl}
                      alt={`Gallery Image ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                    <Badge className="absolute top-1 right-1 bg-green-500 text-xs px-1 py-0">
                      {index + 1}
                    </Badge>
                  </div>
                ))}
                {formData.gallery.length > 8 && (
                  <div className="w-full h-24 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <span className="text-sm text-gray-600">+{formData.gallery.length - 8} more</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-24 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Camera className="h-6 w-6 mx-auto mb-1" />
                  <p className="text-xs">No gallery images uploaded</p>
                </div>
              </div>
            )}
          </div>

          {/* Image Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="font-medium text-blue-800">Image Status:</span>
                <span className={`ml-2 ${formData.image && formData.gallery.length > 0 ? 'text-green-600' : 'text-amber-600'}`}>
                  {formData.image && formData.gallery.length > 0 
                    ? `✓ Complete (Cover + ${formData.gallery.length} gallery images)`
                    : formData.image 
                      ? '⚠ Cover image only - add gallery images'
                      : formData.gallery.length > 0
                        ? '⚠ Gallery images only - add cover image'
                        : '✗ No images uploaded'
                  }
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Details Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building className="h-5 w-5" />
            Project Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Description & Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Description</Label>
              <div className="p-3 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
                <p className="text-sm text-gray-700">
                  {formData.description || 'No description provided'}
                </p>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Overview</Label>
              <div className="p-3 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
                <p className="text-sm text-gray-700">
                  {formData.overview || 'No overview provided'}
                </p>
              </div>
            </div>
          </div>

          {/* Unit Types */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-2 block">
              Unit Types ({formData.unitTypes.length})
            </Label>
            {formData.unitTypes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {formData.unitTypes.map((unit, index) => (
                  <div key={index} className="p-3 border rounded-lg bg-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{unit.type || 'Unit type not specified'}</p>
                        <p className="text-xs text-gray-600">Size: {unit.size || 'Not specified'}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {unit.price || 'Price TBA'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
                <p className="text-sm">No unit types defined</p>
              </div>
            )}
          </div>

          {/* Amenities */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-2 block">
              Amenities ({formData.amenities.length} categories)
            </Label>
            {formData.amenities.length > 0 && formData.amenities.some(a => a.category) ? (
              <div className="space-y-3">
                {formData.amenities.filter(amenity => amenity.category && amenity.items.length > 0).map((amenity, index) => (
                  <div key={index} className="p-3 border rounded-lg bg-white">
                    <h4 className="font-medium text-sm mb-2">{amenity.category}</h4>
                    <div className="flex flex-wrap gap-1">
                      {amenity.items.map((item, itemIndex) => (
                        <Badge key={itemIndex} variant="secondary" className="text-xs">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
                <p className="text-sm">No amenities defined</p>
              </div>
            )}
          </div>

          {/* Payment Plan Summary */}
          {(formData.paymentPlan.booking || formData.paymentPlan.handover || formData.paymentPlan.construction.some(m => m.milestone)) && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Payment Plan</Label>
              <div className="p-3 border rounded-lg bg-white space-y-2">
                {formData.paymentPlan.booking && (
                  <div className="text-sm">
                    <span className="font-medium">Booking:</span> {formData.paymentPlan.booking}
                  </div>
                )}
                {formData.paymentPlan.construction.filter(m => m.milestone && m.percentage).map((milestone, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium">{milestone.milestone}:</span> {milestone.percentage}
                  </div>
                ))}
                {formData.paymentPlan.handover && (
                  <div className="text-sm">
                    <span className="font-medium">Handover:</span> {formData.paymentPlan.handover}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug Panel - Only in development */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
              <FileText className="h-5 w-5" />
              Debug: Submit Data Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-blue-700 mb-2 block">Data that will be sent to API:</Label>
                <div className="p-3 bg-white border border-blue-200 rounded-lg overflow-x-auto">
                  <pre className="text-xs text-gray-700">
                    {JSON.stringify({
                      ...formData,
                      price: formData.price.total,
                      priceNumeric: formData.price.totalNumeric,
                      slug: formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                      locationSlug: formData.location.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                      statusSlug: formData.status.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                      developerSlug: formData.developer.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                    }, null, 2)}
                  </pre>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-blue-700 mb-2 block">Quick Validation Check:</Label>
                <div className="space-y-1 text-xs">
                  <div className={`flex items-center gap-1 ${formData.name ? 'text-green-600' : 'text-red-600'}`}>
                    {formData.name ? '✓' : '✗'} Name: {formData.name || 'Missing'}
                  </div>
                  <div className={`flex items-center gap-1 ${formData.image ? 'text-green-600' : 'text-red-600'}`}>
                    {formData.image ? '✓' : '✗'} Cover Image: {formData.image ? 'Present' : 'Missing'}
                  </div>
                  <div className={`flex items-center gap-1 ${formData.gallery.length > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formData.gallery.length > 0 ? '✓' : '✗'} Gallery: {formData.gallery.length} images
                  </div>
                  <div className={`flex items-center gap-1 ${formData.amenities.length > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formData.amenities.length > 0 ? '✓' : '✗'} Amenities: {formData.amenities.length} categories
                  </div>
                  <div className={`flex items-center gap-1 ${formData.unitTypes.length > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formData.unitTypes.length > 0 ? '✓' : '✗'} Unit Types: {formData.unitTypes.length} types
                  </div>
                  <div className={`flex items-center gap-1 ${formData.categories.length > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formData.categories.length > 0 ? '✓' : '✗'} Categories: {formData.categories.length} items
                  </div>
                  <div className={`flex items-center gap-1 ${formData.locationDetails.nearby.length > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formData.locationDetails.nearby.length > 0 ? '✓' : '✗'} Nearby Places: {formData.locationDetails.nearby.length} places
                  </div>
                  <div className="text-green-600">
                    ✓ Audit Fields: Will be auto-generated on submit
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-blue-600">
                <strong>💡 Debug Tip:</strong> Check the browser console for detailed request/response logs when submitting.
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Project Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Project Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Settings - matching old form */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Basic Settings</Label>
            
            <div className="grid gap-4">
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id="registrationOpen"
                  checked={formData.registrationOpen}
                  onCheckedChange={(checked) => onInputChange('registrationOpen', checked)}
                />
                <div className="flex items-center gap-2 flex-1">
                  <Users className="h-4 w-4 text-purple-600" />
                  <Label htmlFor="registrationOpen" className="font-medium cursor-pointer">
                    Registration Open
                  </Label>
                </div>
                <Badge variant={formData.registrationOpen ? "default" : "outline"}>
                  {formData.registrationOpen ? "Open" : "Closed"}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => onInputChange('featured', checked)}
                />
                <div className="flex items-center gap-2 flex-1">
                  <Star className="h-4 w-4 text-yellow-600" />
                  <Label htmlFor="featured" className="font-medium cursor-pointer">
                    Featured Project
                  </Label>
                </div>
                <Badge variant={formData.featured ? "default" : "outline"}>
                  {formData.featured ? "Featured" : "Standard"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Feature Flags - matching old form exactly */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Feature Flags</Label>
            
            <div className="grid gap-4">
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id="flags.elite"
                  checked={formData.flags.elite}
                  onCheckedChange={(checked) => onInputChange('flags.elite', checked)}
                />
                <div className="flex items-center gap-2 flex-1">
                  <Crown className="h-4 w-4 text-purple-600" />
                  <Label htmlFor="flags.elite" className="font-medium cursor-pointer">
                    Elite Project
                  </Label>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id="flags.exclusive"
                  checked={formData.flags.exclusive}
                  onCheckedChange={(checked) => onInputChange('flags.exclusive', checked)}
                />
                <div className="flex items-center gap-2 flex-1">
                  <Zap className="h-4 w-4 text-orange-600" />
                  <Label htmlFor="flags.exclusive" className="font-medium cursor-pointer">
                    Exclusive Access
                  </Label>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id="flags.highValue"
                  checked={formData.flags.highValue}
                  onCheckedChange={(checked) => onInputChange('flags.highValue', checked)}
                />
                <div className="flex items-center gap-2 flex-1">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <Label htmlFor="flags.highValue" className="font-medium cursor-pointer">
                    High Value Investment
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Final Submission */}
      {Object.keys(errors).filter(key => key !== 'submit').length > 0 ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-800">Fix Validation Errors</h3>
                <p className="text-sm text-red-700">
                  Please fix the validation errors shown above before submitting.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : completionPercentage === 100 ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800">Ready to Submit</h3>
                <p className="text-sm text-green-700">
                  All required information has been completed. You can now create this project.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-amber-600" />
              <div>
                <h3 className="font-semibold text-amber-800">
                  {totalSteps - validSteps} Step{totalSteps - validSteps !== 1 ? 's' : ''} Remaining
                </h3>
                <p className="text-sm text-amber-700">
                  Please complete the missing information in the highlighted steps above.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}