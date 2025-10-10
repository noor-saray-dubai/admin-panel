// components/hotels/steps/BasicInformationStep.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle } from "lucide-react"
import { ValidatedInput } from "../ValidatedInput"
import { ValidatedTextarea } from "../ValidatedTextarea"
import type { HotelFormData } from "@/types/hotels"

interface BasicInformationStepProps {
  formData: HotelFormData
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
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Hotel Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ValidatedInput
              label="Hotel Name"
              field="name"
              value={formData.name}
              onChange={(value) => onInputChange('name', value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              placeholder="Enter hotel name"
              required
              maxLength={200}
              description="The official name of the hotel"
            />
            
            <ValidatedInput
              label="Subtitle"
              field="subtitle"
              value={formData.subtitle}
              onChange={(value) => onInputChange('subtitle', value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              placeholder="Enter hotel subtitle"
              required
              maxLength={300}
              description="A brief tagline or subtitle for the hotel"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ValidatedInput
              label="Location"
              field="location"
              value={formData.location}
              onChange={(value) => onInputChange('location', value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              placeholder="e.g., Dubai Marina, Dubai"
              required
              maxLength={100}
              description="Main location of the hotel"
            />
            
            <ValidatedInput
              label="Sub Location"
              field="subLocation"
              value={formData.subLocation || ''}
              onChange={(value) => onInputChange('subLocation', value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              placeholder="e.g., Jumeirah Beach Road"
              maxLength={100}
              description="Specific area or street within the main location"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type" className="flex items-center gap-2">
                Hotel Type <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.type} onValueChange={(value) => onInputChange('type', value)}>
                <SelectTrigger className={errors.type ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}>
                  <SelectValue placeholder="Select hotel type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ultra Luxury Resort">Ultra Luxury Resort</SelectItem>
                  <SelectItem value="Luxury Hotel">Luxury Hotel</SelectItem>
                  <SelectItem value="Business Hotel">Business Hotel</SelectItem>
                  <SelectItem value="Boutique Hotel">Boutique Hotel</SelectItem>
                  <SelectItem value="Beach Resort">Beach Resort</SelectItem>
                  <SelectItem value="City Hotel">City Hotel</SelectItem>
                  <SelectItem value="Airport Hotel">Airport Hotel</SelectItem>
                  <SelectItem value="Conference Hotel">Conference Hotel</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.type}
                </div>
              )}
              <p className="text-xs text-gray-500">Classification of the hotel based on target market and service level</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rating">Star Rating</Label>
              <Select 
                value={formData.rating?.toString()} 
                onValueChange={(value) => onInputChange('rating', parseInt(value))}
              >
                <SelectTrigger className={errors.rating ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}>
                  <SelectValue placeholder="Select star rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Star</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="6">6 Stars</SelectItem>
                  <SelectItem value="7">7 Stars</SelectItem>
                </SelectContent>
              </Select>
              {errors.rating && (
                <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.rating}
                </div>
              )}
              <p className="text-xs text-gray-500">Official star rating of the hotel (1-7 stars)</p>
            </div>
          </div>

          <ValidatedTextarea
            label="Description"
            field="description"
            value={formData.description}
            onChange={(value) => onInputChange('description', value)}
            formData={formData}
            errors={errors}
            setErrors={setErrors}
            placeholder="Enter detailed hotel description"
            required
            rows={4}
            maxLength={2000}
            minLength={50}
            description="Detailed description of the hotel, its amenities, and unique features"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status" className="flex items-center gap-2">
                Status <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.status} onValueChange={(value) => onInputChange('status', value)}>
                <SelectTrigger className={errors.status ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}>
                  <SelectValue placeholder="Select hotel status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Operational">Operational</SelectItem>
                  <SelectItem value="Under Construction">Under Construction</SelectItem>
                  <SelectItem value="Planned">Planned</SelectItem>
                  <SelectItem value="Under Renovation">Under Renovation</SelectItem>
                  <SelectItem value="Temporarily Closed">Temporarily Closed</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.status}
                </div>
              )}
              <p className="text-xs text-gray-500">Current operational status of the hotel</p>
            </div>

            <ValidatedInput
              label="Architecture Style"
              field="architecture"
              value={formData.architecture || ''}
              onChange={(value) => onInputChange('architecture', value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              placeholder="e.g., Contemporary Arabic, Modern Luxury"
              maxLength={100}
              description="Architectural style or design theme of the hotel"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
