// components/mall/steps/BasicInfoStep.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle } from "lucide-react"
import { ValidatedInput } from "../ValidatedInput"
import type { MallFormData } from "@/types/mall"

interface BasicInfoStepProps {
  formData: MallFormData
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  onInputChange: (field: string, value: any) => void
}

export function BasicInfoStep({ formData, errors, setErrors, onInputChange }: BasicInfoStepProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mall Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <ValidatedInput
              label="Mall Name"
              field="name"
              value={formData.name}
              onChange={(value) => onInputChange("name", value)}
              placeholder="Enter mall name"
              required
              maxLength={100}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
            />
            <ValidatedInput
              label="Subtitle"
              field="subtitle"
              value={formData.subtitle}
              onChange={(value) => onInputChange("subtitle", value)}
              placeholder="Mall subtitle or tagline"
              required
              maxLength={200}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">
                Status <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => onInputChange("status", value)}
              >
                <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Operational">Operational</SelectItem>
                  <SelectItem value="Under Construction">Under Construction</SelectItem>
                  <SelectItem value="Planned">Planned</SelectItem>
                  <SelectItem value="Design Phase">Design Phase</SelectItem>
                  <SelectItem value="Permits Approved">Permits Approved</SelectItem>
                  <SelectItem value="Foundation Ready">Foundation Ready</SelectItem>
                  <SelectItem value="Partially Operational">Partially Operational</SelectItem>
                  <SelectItem value="Renovation">Renovation</SelectItem>
                  <SelectItem value="For Sale">For Sale</SelectItem>
                  <SelectItem value="Sold">Sold</SelectItem>
                  <SelectItem value="Reserved">Reserved</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.status}
                </div>
              )}
            </div>

            <ValidatedInput
              label="Location"
              field="location"
              value={formData.location}
              onChange={(value) => onInputChange("location", value)}
              placeholder="e.g., Dubai Marina"
              required
              maxLength={100}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
            />

            <ValidatedInput
              label="Sub Location"
              field="subLocation"
              value={formData.subLocation}
              onChange={(value) => onInputChange("subLocation", value)}
              placeholder="Specific area"
              required
              maxLength={100}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownership">
              Ownership <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.ownership}
              onValueChange={(value) => onInputChange("ownership", value)}
            >
              <SelectTrigger className={errors.ownership ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select ownership type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="freehold">Freehold</SelectItem>
                <SelectItem value="leasehold">Leasehold</SelectItem>
              </SelectContent>
            </Select>
            {errors.ownership && (
              <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                <AlertCircle className="h-3 w-3" />
                {errors.ownership}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="architecture">
              Architecture Style <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.architecture}
              onValueChange={(value) => onInputChange("architecture", value)}
            >
              <SelectTrigger className={errors.architecture ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select architectural style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Modern Contemporary">Modern Contemporary</SelectItem>
                <SelectItem value="Neo-Classical">Neo-Classical</SelectItem>
                <SelectItem value="Art Deco">Art Deco</SelectItem>
                <SelectItem value="Minimalist">Minimalist</SelectItem>
                <SelectItem value="Futuristic">Futuristic</SelectItem>
                <SelectItem value="Traditional">Traditional</SelectItem>
                <SelectItem value="Industrial">Industrial</SelectItem>
                <SelectItem value="Mediterranean">Mediterranean</SelectItem>
                <SelectItem value="Brutalist">Brutalist</SelectItem>
                <SelectItem value="Postmodern">Postmodern</SelectItem>
                <SelectItem value="High-Tech">High-Tech</SelectItem>
                <SelectItem value="Deconstructivist">Deconstructivist</SelectItem>
                <SelectItem value="Sustainable Green">Sustainable Green</SelectItem>
                <SelectItem value="Mixed Style">Mixed Style</SelectItem>
                <SelectItem value="Regional">Regional</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.architecture && (
              <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                <AlertCircle className="h-3 w-3" />
                {errors.architecture}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
