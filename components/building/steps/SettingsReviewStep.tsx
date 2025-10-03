// components/building/steps/SettingsReviewStep.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, Clock, Info } from "lucide-react"
import type { BuildingFormData } from "@/types/buildings"

interface SettingsReviewStepProps {
  formData: BuildingFormData
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

  const steps = [
    { name: "Basic Information", index: 0 },
    { name: "Dimensions & Pricing", index: 1 },
    { name: "Units & Amenities", index: 2 },
    { name: "Marketing & Media", index: 3 }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'invalid':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Complete</Badge>
      case 'invalid':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Needs Attention</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Incomplete</Badge>
    }
  }

  const validSteps = steps.filter(step => getStepStatus(step.index) === 'valid').length
  const totalSteps = steps.length
  const completionPercentage = Math.round((validSteps / totalSteps) * 100)

  // Count API validation errors
  const apiErrors = Object.entries(errors).filter(([_, error]) => error?.length > 0)
  const hasApiErrors = apiErrors.length > 0

  return (
    <div className="space-y-6">
      {/* Show API Errors if any */}
      {hasApiErrors && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Validation Errors ({apiErrors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-red-700 text-sm mb-3">
                Please fix the following errors before submitting:
              </p>
              {apiErrors.map(([field, error]) => {
                // Convert field name to user-friendly format
                const friendlyFieldName = field
                  .replace(/([A-Z])/g, ' $1') // Add space before capital letters
                  .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
                  .replace(/\./g, ' ') // Replace dots with spaces
                  .replace(/_/g, ' ') // Replace underscores with spaces
                  .trim()

                return (
                  <div key={field} className="flex items-start gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-red-800">{friendlyFieldName}:</span>{' '}
                      <span className="text-red-700">{error}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Form Completion Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Overall Progress</span>
              <span className="text-sm font-medium">{validSteps} of {totalSteps} steps complete</span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>

            <p className="text-center text-sm text-gray-600">
              {completionPercentage}% Complete
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {steps.map((step) => {
              const status = getStepStatus(step.index)
              return (
                <div key={step.index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(status)}
                    <span className="font-medium">{step.name}</span>
                  </div>
                  {getStatusBadge(status)}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Building Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="verified"
                checked={formData.verified ?? true}
                onCheckedChange={(checked) => onInputChange("verified", checked)}
              />
              <Label htmlFor="verified">Verified Listing</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive ?? true}
                onCheckedChange={(checked) => onInputChange("isActive", checked)}
              />
              <Label htmlFor="isActive">Active Listing</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isFeatured"
                checked={formData.isFeatured ?? false}
                onCheckedChange={(checked) => onInputChange("isFeatured", checked)}
              />
              <Label htmlFor="isFeatured">Featured Building</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key Information Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Basic Details</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Name:</span> {formData.name || "Not specified"}</div>
                <div><span className="font-medium">Location:</span> {formData.location || "Not specified"}</div>
                <div><span className="font-medium">Category:</span> {formData.category || "Not specified"}</div>
                <div><span className="font-medium">Type:</span> {formData.type || "Not specified"}</div>
                <div><span className="font-medium">Status:</span> {formData.status || "Not specified"}</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Dimensions & Pricing</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Floors:</span> {formData.dimensions?.floors || "Not specified"}</div>
                <div><span className="font-medium">Height:</span> {formData.dimensions?.height || "Not specified"}</div>
                <div><span className="font-medium">Total Area:</span> {formData.dimensions?.totalArea?.toLocaleString() || "Not specified"} sqm</div>
                <div><span className="font-medium">Price:</span> {formData.price?.value || "Not specified"}</div>
                <div><span className="font-medium">Year:</span> {formData.year || "Not specified"}</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Units & Occupancy</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Total Units:</span> {formData.totalUnits || "0"}</div>
                <div><span className="font-medium">Available Units:</span> {formData.availableUnits || "Not specified"}</div>
                <div><span className="font-medium">Unit Types:</span> {formData.units?.length || "0"} types defined</div>
                <div><span className="font-medium">Features:</span> {formData.features?.length || "0"} features</div>
                <div><span className="font-medium">Highlights:</span> {formData.highlights?.length || "0"} highlights</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Media Assets</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Main Image:</span> {formData.mainImage ? "Uploaded" : "Not uploaded"}</div>
                <div><span className="font-medium">Gallery:</span> {formData.gallery?.length || "0"} images</div>
                <div><span className="font-medium">Floor Plans:</span> {formData.floorPlans?.length || "0"} files</div>
                <div><span className="font-medium">Investment Highlights:</span> {formData.marketingMaterials?.investmentHighlights?.length || 0} items</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Additional Info</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Developer:</span> {formData.developer?.name || "Not specified"}</div>
                <div><span className="font-medium">Architect:</span> {formData.architect || "Not specified"}</div>
                <div><span className="font-medium">Rating:</span> {formData.rating || "Not specified"}</div>
                <div><span className="font-medium">Sustainability:</span> {formData.sustainabilityRating || "Not specified"}</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Contact & Marketing</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Broker:</span> {formData.investorRelations?.brokerContact?.name || "Not specified"}</div>
                <div><span className="font-medium">Broker Company:</span> {formData.investorRelations?.brokerContact?.company || "Not specified"}</div>
                <div><span className="font-medium">NDA Required:</span> {formData.investorRelations?.ndaRequired ? "Yes" : "No"}</div>
                <div><span className="font-medium">Data Room:</span> {formData.investorRelations?.dataRoomAccessUrl ? "Available" : "Not provided"}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {completionPercentage < 100 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">Incomplete Sections</p>
            </div>
            <p className="text-sm text-amber-700 mt-2">
              Please complete all required sections before submitting the form.
              You can navigate back to any step using the navigation above.
            </p>
          </CardContent>
        </Card>
      )}

      {completionPercentage === 100 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <p className="font-medium">Ready to Submit</p>
            </div>
            <p className="text-sm text-green-700 mt-2">
              All sections are complete! You can now submit the building information.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}