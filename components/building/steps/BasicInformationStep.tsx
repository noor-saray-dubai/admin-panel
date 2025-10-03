// components/building/steps/BasicInformationStep.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle } from "lucide-react"
import { ValidatedInput } from "../ValidatedInput"
import { ValidatedTextarea } from "../ValidatedTextarea"
import type { BuildingFormData } from "@/types/buildings"

interface BasicInformationStepProps {
  formData: BuildingFormData
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  onInputChange: (field: string, value: any) => void
}

export function BasicInformationStep({
  formData,
  errors,
  setErrors,
  onInputChange
}: BasicInformationStepProps) {
  const categoryOptions = ["residential", "commercial", "mixed"]
  const statusOptions = [
    "Completed", "Under Construction", "Planned", "Renovation", 
    "Iconic", "New", "Premium", "Exclusive", "Landmark", "Elite", "Historic", "Modern"
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Building Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ValidatedInput
            label="Building Name"
            field="name"
            value={formData.name ?? ""}
            onChange={(value) => onInputChange("name", value)}
            formData={formData}
            errors={errors}
            setErrors={setErrors}
            placeholder="Enter building name"
            required
            maxLength={100}
          />

          <ValidatedInput
            label="Subtitle"
            field="subtitle"
            value={formData.subtitle ?? ""}
            onChange={(value) => onInputChange("subtitle", value)}
            formData={formData}
            errors={errors}
            setErrors={setErrors}
            placeholder="Enter building subtitle (optional)"
            maxLength={200}
            description="A short descriptive subtitle for the building"
          />

          <div className="grid grid-cols-2 gap-4">
            <ValidatedInput
              label="Location"
              field="location"
              value={formData.location ?? ""}
              onChange={(value) => onInputChange("location", value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              placeholder="e.g., Downtown Dubai"
              required
              maxLength={100}
            />

            <ValidatedInput
              label="Sub Location"
              field="subLocation"
              value={formData.subLocation ?? ""}
              onChange={(value) => onInputChange("subLocation", value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              placeholder="e.g., Sheikh Mohammed Boulevard"
              maxLength={100}
            />
          </div>

          <ValidatedTextarea
            label="Description"
            field="description"
            value={formData.description ?? ""}
            onChange={(value) => onInputChange("description", value)}
            errors={errors}
            setErrors={setErrors}
            placeholder="Describe the building, its features, and key characteristics..."
            required
            maxLength={2000}
            rows={4}
            description="Provide a comprehensive description of the building (minimum 10 characters)"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Building Classification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.category ?? ""}
                onValueChange={(value) => onInputChange("category", value)}
              >
                <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.category}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">
                Status <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.status ?? ""}
                onValueChange={(value) => onInputChange("status", value)}
              >
                <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(status => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && (
                <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.status}
                </div>
              )}
            </div>
          </div>

          <ValidatedInput
            label="Building Type"
            field="type"
            value={formData.type ?? ""}
            onChange={(value) => onInputChange("type", value)}
            formData={formData}
            errors={errors}
            setErrors={setErrors}
            placeholder="e.g., Ultra-Luxury Tower, Business District, Mixed-Use Complex"
            required
            maxLength={50}
            description="Specific type or classification of the building"
          />

          <div className="grid grid-cols-2 gap-4">
            <ValidatedInput
              label="Year Completed"
              field="year"
              value={formData.year ?? new Date().getFullYear()}
              onChange={(value) => onInputChange("year", value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              type="number"
              required
              min={1800}
              max={new Date().getFullYear() + 10}
            />

            <ValidatedInput
              label="Year Built"
              field="yearBuilt"
              value={formData.yearBuilt ?? ""}
              onChange={(value) => onInputChange("yearBuilt", value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              type="number"
              placeholder="If different from completion year"
              min={1800}
              max={new Date().getFullYear() + 10}
              description="Leave empty if same as completion year"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <ValidatedInput
              label="Rating"
              field="rating"
              value={formData.rating ?? ""}
              onChange={(value) => onInputChange("rating", value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              placeholder="e.g., Premium, Exclusive, Iconic"
              maxLength={50}
              description="Overall rating or classification"
            />

            <ValidatedInput
              label="Sustainability Rating"
              field="sustainabilityRating"
              value={formData.sustainabilityRating ?? ""}
              onChange={(value) => onInputChange("sustainabilityRating", value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              placeholder="e.g., LEED Gold, BREEAM Excellent"
              maxLength={50}
              description="Environmental certification if applicable"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ValidatedInput
              label="Architect"
              field="architect"
              value={formData.architect ?? ""}
              onChange={(value) => onInputChange("architect", value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              placeholder="Name of the architect"
              maxLength={100}
            />

            <ValidatedInput
              label="Current Owner"
              field="currentOwner"
              value={formData.currentOwner ?? ""}
              onChange={(value) => onInputChange("currentOwner", value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              placeholder="Current building owner"
              maxLength={100}
            />
          </div>

          <ValidatedTextarea
            label="Architecture Description"
            field="architecture"
            value={formData.architecture ?? ""}
            onChange={(value) => onInputChange("architecture", value)}
            errors={errors}
            setErrors={setErrors}
            placeholder="Describe the architectural style, design features, and unique elements..."
            maxLength={500}
            rows={3}
            description="Architectural style and design details"
          />
        </CardContent>
      </Card>
    </div>
  )
}