// components/property/steps/SpecificationsStep.tsx
"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Home, Bed, Bath, Maximize, ArrowUp } from "lucide-react"
import type { PropertyFormData, PropertyStepProps } from "@/types/properties"

// Furnishing status options - from schema enum
const furnishingStatuses = [
  { value: "Unfurnished", label: "Unfurnished" },
  { value: "Semi-Furnished", label: "Semi-Furnished" },
  { value: "Fully Furnished", label: "Fully Furnished" },
]

// Facing direction options
const facingDirections = [
  { value: "North", label: "North" },
  { value: "North-East", label: "North-East" },
  { value: "East", label: "East" },
  { value: "South-East", label: "South-East" },
  { value: "South", label: "South" },
  { value: "South-West", label: "South-West" },
  { value: "West", label: "West" },
  { value: "North-West", label: "North-West" },
]

export function SpecificationsStep({ formData, errors, setErrors, onInputChange }: PropertyStepProps) {
  const handleFieldChange = (field: keyof PropertyFormData, value: any) => {
    onInputChange(field, value)
    
    // Clear field error when user starts typing
    if (errors[field]) {
      const newErrors = { ...errors }
      delete newErrors[field]
      setErrors(newErrors)
    }
  }

  const handleNumberChange = (field: keyof PropertyFormData, value: string) => {
    // If empty string, store undefined to trigger validation
    if (value === '' || value === null || value === undefined) {
      handleFieldChange(field, undefined)
    } else {
      const numValue = parseInt(value)
      if (isNaN(numValue)) {
        handleFieldChange(field, undefined)
      } else {
        // Allow 0 and negative values - validation will handle business rules
        handleFieldChange(field, numValue)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Property Layout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5 text-blue-600" />
            Property Layout
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Bedrooms */}
            <div className="space-y-2">
              <Label htmlFor="bedrooms" className="text-sm font-medium flex items-center gap-2">
                <Bed className="h-4 w-4" />
                Bedrooms *
              </Label>
              <Input
                id="bedrooms"
                type="number"
                min="1"
                max="20"
                placeholder="1"
                value={formData.bedrooms !== undefined ? formData.bedrooms.toString() : ''}
                onChange={(e) => handleNumberChange('bedrooms', e.target.value)}
                className={errors.bedrooms ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.bedrooms && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errors.bedrooms}
                </div>
              )}
            </div>

            {/* Bathrooms */}
            <div className="space-y-2">
              <Label htmlFor="bathrooms" className="text-sm font-medium flex items-center gap-2">
                <Bath className="h-4 w-4" />
                Bathrooms *
              </Label>
              <Input
                id="bathrooms"
                type="number"
                min="0"
                max="10"
                placeholder="0"
                value={formData.bathrooms !== undefined ? formData.bathrooms.toString() : ''}
                onChange={(e) => handleNumberChange('bathrooms', e.target.value)}
                className={errors.bathrooms ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.bathrooms && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errors.bathrooms}
                </div>
              )}
            </div>

            {/* Floor Level */}
            <div className="space-y-2">
              <Label htmlFor="floorLevel" className="text-sm font-medium flex items-center gap-2">
                <ArrowUp className="h-4 w-4" />
                Floor Level *
              </Label>
              <Input
                id="floorLevel"
                type="number"
                min="-5"
                max="200"
                placeholder="0"
                value={formData.floorLevel !== undefined ? formData.floorLevel.toString() : ''}
                onChange={(e) => handleNumberChange('floorLevel', e.target.value)}
                className={errors.floorLevel ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.floorLevel && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errors.floorLevel}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Area Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Maximize className="h-5 w-5 text-green-600" />
            Area Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Built Up Area */}
            <div className="space-y-2">
              <Label htmlFor="builtUpArea" className="text-sm font-medium">
                Built Up Area *
              </Label>
              <Input
                id="builtUpArea"
                placeholder="e.g., 1200 sq ft"
                value={formData.builtUpArea}
                onChange={(e) => handleFieldChange('builtUpArea', e.target.value)}
                className={errors.builtUpArea ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.builtUpArea && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errors.builtUpArea}
                </div>
              )}
            </div>

            {/* Carpet Area */}
            <div className="space-y-2">
              <Label htmlFor="carpetArea" className="text-sm font-medium">
                Carpet Area
              </Label>
              <Input
                id="carpetArea"
                placeholder="e.g., 900 sq ft"
                value={formData.carpetArea}
                onChange={(e) => handleFieldChange('carpetArea', e.target.value)}
                className={errors.carpetArea ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.carpetArea && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errors.carpetArea}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Property Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Property Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Furnishing Status */}
            <div className="space-y-2">
              <Label htmlFor="furnishingStatus" className="text-sm font-medium">
                Furnishing Status *
              </Label>
              <Select
                value={formData.furnishingStatus}
                onValueChange={(value) => handleFieldChange('furnishingStatus', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select furnishing status" />
                </SelectTrigger>
                <SelectContent>
                  {furnishingStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Facing Direction */}
            <div className="space-y-2">
              <Label htmlFor="facingDirection" className="text-sm font-medium">
                Facing Direction *
              </Label>
              <Select
                value={formData.facingDirection}
                onValueChange={(value) => handleFieldChange('facingDirection', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select facing direction" />
                </SelectTrigger>
                <SelectContent>
                  {facingDirections.map((direction) => (
                    <SelectItem key={direction.value} value={direction.value}>
                      {direction.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}