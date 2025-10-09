// components/property/steps/BasicInfoStep.tsx
"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Building2, Key, CheckCircle } from "lucide-react"
import type { PropertyFormData, PropertyStepProps } from "@/types/properties"

// Property type options - exact schema enum values
const propertyTypes = [
  { value: "Apartment", label: "Apartment" },
  { value: "Villa", label: "Villa" },
  { value: "Penthouse", label: "Penthouse" },
  { value: "Condo", label: "Condo" },
  { value: "Townhouse", label: "Townhouse" },
  { value: "Studio", label: "Studio" },
  { value: "Duplex", label: "Duplex" },
  { value: "Loft", label: "Loft" },
]

// Ownership type options - exact schema enum values
const ownershipTypes = [
  { value: "Primary", label: "Primary (From Developer)" },
  { value: "Secondary", label: "Secondary (From Owner)" },
]

// Property status options - exact schema enum values 
const propertyStatuses = [
  { value: "Ready", label: "Ready to Move" },
  { value: "Offplan", label: "Off-plan" },
]

// Availability status options - exact schema enum values
const availabilityStatuses = [
  { value: "Ready", label: "Ready to Move" },
  { value: "Offplan", label: "Off-plan" },
]

export function BasicInfoStep({ formData, errors, setErrors, onInputChange }: PropertyStepProps) {
  const handleFieldChange = (field: keyof PropertyFormData, value: any) => {
    onInputChange(field, value)
    
    // Clear field error when user starts typing
    if (errors[field]) {
      const newErrors = { ...errors }
      delete newErrors[field]
      setErrors(newErrors)
    }
  }

  return (
    <div className="space-y-6">
      {/* Property Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Property Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Property Name */}
          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Property Name *
            </Label>
            <Input
              id="name"
              placeholder="e.g., Marina View Apartment 1204"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              className={errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {errors.name && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.name}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Property Type */}
            <div className="space-y-2">
              <Label htmlFor="propertyType" className="text-sm font-medium">
                Property Type *
              </Label>
              <Select
                value={formData.propertyType}
                onValueChange={(value) => handleFieldChange('propertyType', value)}
              >
                <SelectTrigger className={errors.propertyType ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.propertyType && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errors.propertyType}
                </div>
              )}
            </div>

            {/* Property Status */}
            <div className="space-y-2">
              <Label htmlFor="propertyStatus" className="text-sm font-medium">
                Construction Status *
              </Label>
              <Select
                value={formData.propertyStatus}
                onValueChange={(value) => handleFieldChange('propertyStatus', value)}
              >
                <SelectTrigger className={errors.propertyStatus ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {propertyStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.propertyStatus && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errors.propertyStatus}
                </div>
              )}
            </div>

            {/* Availability Status */}
            <div className="space-y-2">
              <Label htmlFor="availabilityStatus" className="text-sm font-medium">
                Availability Status *
              </Label>
              <Select
                value={formData.availabilityStatus}
                onValueChange={(value) => handleFieldChange('availabilityStatus', value)}
              >
                <SelectTrigger className={errors.availabilityStatus ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select availability" />
                </SelectTrigger>
                <SelectContent>
                  {availabilityStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        {status.value === 'Ready' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {status.value === 'Offplan' && <AlertCircle className="h-4 w-4 text-blue-500" />}
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.availabilityStatus && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errors.availabilityStatus}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ownership Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-green-600" />
            Ownership Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Ownership Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ownershipType" className="text-sm font-medium">
                Ownership Type *
              </Label>
              <Select
                value={formData.ownershipType}
                onValueChange={(value) => handleFieldChange('ownershipType', value)}
              >
                <SelectTrigger className={errors.ownershipType ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select ownership type" />
                </SelectTrigger>
                <SelectContent>
                  {ownershipTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.ownershipType && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errors.ownershipType}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}