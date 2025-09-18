// components/mall/steps/SettingsReviewStep.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ValidatedInput } from "../ValidatedInput"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, Clock, Info } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useState } from "react"
import type { MallFormData } from "@/types/mall"

interface SettingsReviewStepProps {
  formData: MallFormData
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
    { name: "Size & Pricing", index: 1 },
    { name: "Rental & Operations", index: 2 },
    { name: "Sale & Legal", index: 3 },
    { name: "Features & Amenities", index: 4 },
    { name: "Location Details", index: 5 },
    { name: "Marketing & Media", index: 6 }
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
          <CardTitle>Mall Settings</CardTitle>
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
                id="isAvailable"
                checked={formData.isAvailable ?? true}
                onCheckedChange={(checked) => onInputChange("isAvailable", checked)}
              />
              <Label htmlFor="isAvailable">Available for Sale</Label>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isOperational"
              checked={formData.isOperational ?? false}
              onCheckedChange={(checked) => onInputChange("isOperational", checked)}
            />
            <Label htmlFor="isOperational">Currently Operational</Label>
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
                <div><span className="font-medium">Status:</span> {formData.status || "Not specified"}</div>
                <div><span className="font-medium">Ownership:</span> {formData.ownership || "Not specified"}</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Size & Pricing</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Total Area:</span> {formData.size?.totalArea?.toLocaleString() || "0"} sqft</div>
                <div><span className="font-medium">Floors:</span> {formData.size?.floors || "Not specified"}</div>
                <div><span className="font-medium">Total Price:</span> {formData.price?.total || "Not specified"}</div>
                <div><span className="font-medium">Price per sqft:</span> AED {formData.price?.perSqft || "0"}</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Rental Details</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Total Stores:</span> {formData.rentalDetails?.totalStores || "0"}</div>
                <div><span className="font-medium">Max Capacity:</span> {formData.rentalDetails?.maxStores || "0"}</div>
                <div><span className="font-medium">Occupancy:</span> {formData.rentalDetails?.currentOccupancy || "0"}%</div>
                <div><span className="font-medium">Avg Rent:</span> AED {formData.rentalDetails?.averageRent || "0"}/sqft/year</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Financial Metrics</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Cap Rate:</span> {formData.financials?.capRate || "0"}%</div>
                <div><span className="font-medium">ROI:</span> {formData.financials?.roi || "0"}%</div>
                <div><span className="font-medium">Annual Revenue:</span> AED {formData.financials?.annualRevenue?.toLocaleString() || "0"}</div>
                <div><span className="font-medium">NOI:</span> AED {formData.financials?.noi?.toLocaleString() || "0"}</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Media Assets</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Main Image:</span> {formData.image ? "Uploaded" : "Not uploaded"}</div>
                <div><span className="font-medium">Gallery:</span> {formData.gallery?.length || "0"} images</div>
                <div><span className="font-medium">Floor Plan:</span> {formData.floorPlan ? "Uploaded" : "Not uploaded"}</div>
                <div><span className="font-medium">Investment Highlights:</span> {formData.marketingMaterials?.investmentHighlights?.length || 0} items</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Additional Info</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Developer:</span> {formData.developer?.name || "Not specified"}</div>
                <div><span className="font-medium">Year Built:</span> {formData.yearBuilt || "Not specified"}</div>
                <div><span className="font-medium">Rating:</span> {formData.rating || "Not specified"}/5</div>
                <div><span className="font-medium">Annual Visitors:</span> {formData.visitorsAnnually?.toLocaleString() || "Not specified"}</div>
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
              All sections are complete! You can now submit the mall information.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}