// components/property/steps/LocationStep.tsx
"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, MapPin, Globe, Navigation } from "lucide-react"
import type { PropertyFormData, PropertyStepProps } from "@/types/properties"

// UAE Cities
const uaeCities = [
  { value: "Dubai", label: "Dubai" },
  { value: "Abu Dhabi", label: "Abu Dhabi" },
  { value: "Sharjah", label: "Sharjah" },
  { value: "Ajman", label: "Ajman" },
  { value: "Ras Al Khaimah", label: "Ras Al Khaimah" },
  { value: "Fujairah", label: "Fujairah" },
  { value: "Umm Al Quwain", label: "Umm Al Quwain" },
]

// Popular Dubai Areas (for reference)
const dubaiAreas = [
  "Downtown Dubai", "Dubai Marina", "Jumeirah Beach Residence (JBR)", "Business Bay",
  "Dubai Investment Park (DIP)", "Jumeirah Village Circle (JVC)", "Dubai Sports City",
  "The Greens", "The Views", "Emirates Hills", "Dubai Hills Estate", "Dubailand",
  "Motor City", "Arabian Ranches", "The Springs", "The Meadows", "Dubai Silicon Oasis",
  "International City", "Discovery Gardens", "Jumeirah Lake Towers (JLT)", "DIFC",
  "Palm Jumeirah", "Jumeirah", "Umm Suqeim", "Al Barsha", "Sheikh Zayed Road"
]

export function LocationStep({ formData, errors, setErrors, onInputChange }: PropertyStepProps) {
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
    const numValue = parseFloat(value) || 0
    handleFieldChange(field, numValue)
  }

  return (
    <div className="space-y-6">
      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Address Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Full Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium">
              Full Address *
            </Label>
            <Textarea
              id="address"
              placeholder="e.g., Apartment 1204, Marina View Tower A, Dubai Marina, Dubai"
              value={formData.address}
              onChange={(e) => handleFieldChange('address', e.target.value)}
              className={errors.address ? 'border-red-500 focus-visible:ring-red-500' : ''}
              rows={2}
            />
            {errors.address && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.address}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Area */}
            <div className="space-y-2">
              <Label htmlFor="area" className="text-sm font-medium">
                Area/Community *
              </Label>
              <Input
                id="area"
                placeholder="e.g., Dubai Marina"
                value={formData.area}
                onChange={(e) => handleFieldChange('area', e.target.value)}
                className={errors.area ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.area && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errors.area}
                </div>
              )}
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm font-medium">
                City *
              </Label>
              <Select
                value={formData.city}
                onValueChange={(value) => handleFieldChange('city', value)}
              >
                <SelectTrigger className={errors.city ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {uaeCities.map((city) => (
                    <SelectItem key={city.value} value={city.value}>
                      {city.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.city && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errors.city}
                </div>
              )}
            </div>
          </div>

          {/* Country */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm font-medium">
                Country
              </Label>
              <Select
                value={formData.country}
                onValueChange={(value) => handleFieldChange('country', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UAE">United Arab Emirates</SelectItem>
                  <SelectItem value="Saudi Arabia">Saudi Arabia</SelectItem>
                  <SelectItem value="Qatar">Qatar</SelectItem>
                  <SelectItem value="Kuwait">Kuwait</SelectItem>
                  <SelectItem value="Bahrain">Bahrain</SelectItem>
                  <SelectItem value="Oman">Oman</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coordinates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-green-600" />
            Location Coordinates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Latitude */}
            <div className="space-y-2">
              <Label htmlFor="latitude" className="text-sm font-medium">
                Latitude
              </Label>
              <Input
                id="latitude"
                type="number"
                step="0.000001"
                min="-90"
                max="90"
                placeholder="25.2048"
                value={formData.latitude || ''}
                onChange={(e) => handleNumberChange('latitude', e.target.value)}
                className={errors.latitude ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.latitude && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errors.latitude}
                </div>
              )}
            </div>

            {/* Longitude */}
            <div className="space-y-2">
              <Label htmlFor="longitude" className="text-sm font-medium">
                Longitude
              </Label>
              <Input
                id="longitude"
                type="number"
                step="0.000001"
                min="-180"
                max="180"
                placeholder="55.2708"
                value={formData.longitude || ''}
                onChange={(e) => handleNumberChange('longitude', e.target.value)}
                className={errors.longitude ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.longitude && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errors.longitude}
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Globe className="h-4 w-4 text-gray-600 mt-1" />
              <div>
                <p className="text-sm text-gray-700">
                  <strong>Current coordinates:</strong> {formData.latitude}, {formData.longitude}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  You can get coordinates from Google Maps by right-clicking on the location
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Popular Areas Reference */}
      {formData.city === "Dubai" && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg text-blue-900">Popular Dubai Areas</CardTitle>
            <CardDescription className="text-blue-700">
              Common areas in Dubai for reference
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm">
              {dubaiAreas.map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() => handleFieldChange('area', area)}
                  className="text-left p-2 text-blue-800 hover:bg-blue-100 rounded transition-colors"
                >
                  {area}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location Tips */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="bg-gray-100 p-2 rounded-full">
              <MapPin className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Location Tips</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Be as specific as possible with the address</li>
                <li>• Include building name, apartment/villa number</li>
                <li>• Use well-known landmarks for better searchability</li>
                <li>• Accurate coordinates help with map integration</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}