// components/hotels/steps/AmenitiesServicesStep.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X, Star, Waves, Utensils, Dumbbell, Wifi, Car, Users, Sparkles } from "lucide-react"
import { ValidatedInput } from "../ValidatedInput"
import { ValidatedTextarea } from "../ValidatedTextarea"
import type { HotelFormData } from "@/types/hotels"

interface AmenitiesServicesStepProps {
  formData: HotelFormData
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  onInputChange: (field: string, value: any) => void
}

// Predefined amenities based on hotel schema
const hotelAmenities = {
  spa: { label: "Spa", icon: Sparkles },
  pool: { label: "Swimming Pool", icon: Waves },
  infinityPool: { label: "Infinity Pool", icon: Waves },
  privateBeach: { label: "Private Beach", icon: Waves },
  gym: { label: "Fitness Center", icon: Dumbbell },
  businessCenter: { label: "Business Center", icon: Users },
  concierge: { label: "Concierge Service", icon: Users },
  roomService: { label: "24/7 Room Service", icon: Users },
  valet: { label: "Valet Parking", icon: Car },
  butler: { label: "Butler Service", icon: Users },
  helipad: { label: "Helipad", icon: Users },
  marina: { label: "Marina", icon: Waves },
  golf: { label: "Golf Course", icon: Users },
  tennis: { label: "Tennis Court", icon: Users },
  kidClub: { label: "Kids Club", icon: Users },
  petFriendly: { label: "Pet Friendly", icon: Users },
  airportTransfer: { label: "Airport Transfer", icon: Car },
  wheelchairAccessible: { label: "Wheelchair Accessible", icon: Users },
}

export function AmenitiesServicesStep({
  formData,
  errors,
  setErrors,
  onInputChange
}: AmenitiesServicesStepProps) {
  const [newFeature, setNewFeature] = useState('')
  const [newFact, setNewFact] = useState('')
  const [newWellnessFacility, setNewWellnessFacility] = useState('')
  const [newMeetingFacility, setNewMeetingFacility] = useState('')

  // Handle amenity checkbox changes
  const handleAmenityChange = (amenityKey: string, checked: boolean) => {
    const currentAmenities = formData.amenities || {}
    const updatedAmenities = {
      ...currentAmenities,
      [amenityKey]: checked
    }
    onInputChange('amenities', updatedAmenities)
  }

  // Handle adding new features
  const addFeature = () => {
    if (newFeature.trim()) {
      const currentFeatures = formData.features || []
      onInputChange('features', [...currentFeatures, newFeature.trim()])
      setNewFeature("")
    }
  }

  // Handle removing features
  const removeFeature = (index: number) => {
    const currentFeatures = formData.features || []
    const updatedFeatures = currentFeatures.filter((_, i) => i !== index)
    onInputChange('features', updatedFeatures)
  }

  // Handle adding new facts
  const addFact = () => {
    if (newFact.trim()) {
      const currentFacts = formData.facts || []
      onInputChange('facts', [...currentFacts, newFact.trim()])
      setNewFact("")
    }
  }

  // Handle removing facts
  const removeFact = (index: number) => {
    const currentFacts = formData.facts || []
    const updatedFacts = currentFacts.filter((_, i) => i !== index)
    onInputChange('facts', updatedFacts)
  }

  // Wellness facility handlers
  const addWellnessFacility = () => {
    if (newWellnessFacility.trim() && formData.wellness) {
      const updatedFacilities = [...(formData.wellness.facilities || []), newWellnessFacility.trim()]
      onInputChange('wellness', { ...formData.wellness, facilities: updatedFacilities })
      setNewWellnessFacility('')
    }
  }

  const removeWellnessFacility = (index: number) => {
    if (formData.wellness) {
      const updatedFacilities = (formData.wellness.facilities || []).filter((_, i) => i !== index)
      onInputChange('wellness', { ...formData.wellness, facilities: updatedFacilities })
    }
  }

  // Meeting facility handlers
  const addMeetingFacility = () => {
    if (newMeetingFacility.trim() && formData.meetings) {
      const updatedFacilities = [...(formData.meetings.facilities || []), newMeetingFacility.trim()]
      onInputChange('meetings', { ...formData.meetings, facilities: updatedFacilities })
      setNewMeetingFacility('')
    }
  }

  const removeMeetingFacility = (index: number) => {
    if (formData.meetings) {
      const updatedFacilities = (formData.meetings.facilities || []).filter((_, i) => i !== index)
      onInputChange('meetings', { ...formData.meetings, facilities: updatedFacilities })
    }
  }

  return (
    <div className="space-y-6">
      {/* Main Amenities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Hotel Amenities
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(hotelAmenities).map(([key, amenity]) => {
              const IconComponent = amenity.icon
              const isChecked = formData.amenities?.[key as keyof typeof formData.amenities] || false
              
              return (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`amenity-${key}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => handleAmenityChange(key, !!checked)}
                  />
                  <Label 
                    htmlFor={`amenity-${key}`} 
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <IconComponent className="h-4 w-4" />
                    {amenity.label}
                  </Label>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Hotel Features */}
      <Card>
        <CardHeader>
          <CardTitle>Hotel Features & Highlights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add a hotel feature or highlight"
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addFeature()}
              maxLength={200}
            />
            <Button onClick={addFeature} disabled={!newFeature.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {(formData.features || []).map((feature, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {feature}
                <button
                  onClick={() => removeFeature(index)}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          
          {(formData.features || []).length === 0 && (
            <p className="text-sm text-gray-500">No features added yet. Add some unique features or highlights of the hotel.</p>
          )}
        </CardContent>
      </Card>

      {/* Hotel Facts */}
      <Card>
        <CardHeader>
          <CardTitle>Key Hotel Facts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add a key hotel fact"
              value={newFact}
              onChange={(e) => setNewFact(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addFact()}
              maxLength={200}
            />
            <Button onClick={addFact} disabled={!newFact.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {(formData.facts || []).map((fact, index) => (
              <Badge key={index} variant="outline" className="flex items-center gap-1">
                {fact}
                <button
                  onClick={() => removeFact(index)}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          
          {(formData.facts || []).length === 0 && (
            <p className="text-sm text-gray-500">No facts added yet. Add some interesting facts about the hotel.</p>
          )}
        </CardContent>
      </Card>

      {/* Additional Ratings */}
      <Card>
        <CardHeader>
          <CardTitle>Performance & Ratings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ValidatedInput
              label="Customer Rating (1-5)"
              field="customerRating"
              value={formData.customerRating ?? ""}
              onChange={(value) => onInputChange("customerRating", value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              type="number"
              min={1}
              max={5}
              step={0.1}
              placeholder="4.5"
              description="Average customer satisfaction rating"
            />

            <ValidatedInput
              label="Occupancy Rate (%)"
              field="occupancyRate"
              value={formData.occupancyRate ?? ""}
              onChange={(value) => onInputChange("occupancyRate", value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              type="number"
              min={0}
              max={100}
              step={0.1}
              placeholder="85.5"
              description="Average annual occupancy percentage"
            />

            <div className="space-y-2">
              <Label>Availability Status</Label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive || false}
                    onCheckedChange={(checked) => onInputChange('isActive', !!checked)}
                  />
                  <Label htmlFor="isActive" className="text-sm cursor-pointer">
                    Active
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isAvailable"
                    checked={formData.isAvailable || false}
                    onCheckedChange={(checked) => onInputChange('isAvailable', !!checked)}
                  />
                  <Label htmlFor="isAvailable" className="text-sm cursor-pointer">
                    Available for Investment
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="verified"
                    checked={formData.verified || false}
                    onCheckedChange={(checked) => onInputChange('verified', !!checked)}
                  />
                  <Label htmlFor="verified" className="text-sm cursor-pointer">
                    Verified
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wellness Facilities */}
      <Card>
        <CardHeader>
          <CardTitle>Wellness & Spa Facilities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="hasWellness"
              checked={!!formData.wellness}
              onCheckedChange={(checked) => {
                if (checked) {
                  onInputChange('wellness', {
                    name: '',
                    description: '',
                    facilities: [],
                    signature: '',
                    operatingHours: '',
                    bookingRequired: true,
                    additionalServices: []
                  })
                } else {
                  onInputChange('wellness', undefined)
                }
              }}
            />
            <Label htmlFor="hasWellness" className="text-sm cursor-pointer">
              Hotel has wellness/spa facilities
            </Label>
          </div>

          {formData.wellness && (
            <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ValidatedInput
                  label="Wellness Facility Name"
                  field="wellness.name"
                  value={formData.wellness.name || ""}
                  onChange={(value) => onInputChange('wellness', { ...formData.wellness!, name: value })}
                  formData={formData}
                  errors={errors}
                  setErrors={setErrors}
                  placeholder="Serenity Spa & Wellness Center"
                  required
                  maxLength={100}
                  description="Name of the wellness/spa facility"
                />
                
                <ValidatedInput
                  label="Signature Treatment/Service"
                  field="wellness.signature"
                  value={formData.wellness.signature || ""}
                  onChange={(value) => onInputChange('wellness', { ...formData.wellness!, signature: value })}
                  formData={formData}
                  errors={errors}
                  setErrors={setErrors}
                  placeholder="Royal Arabian Hammam Experience"
                  required
                  maxLength={100}
                  description="Signature treatment or service offered"
                />
              </div>

              <ValidatedTextarea
                label="Wellness Facility Description"
                field="wellness.description"
                value={formData.wellness.description || ""}
                onChange={(value) => onInputChange('wellness', { ...formData.wellness!, description: value })}
                formData={formData}
                errors={errors}
                setErrors={setErrors}
                placeholder="Describe the wellness facilities, treatments, and overall experience"
                required
                rows={3}
                maxLength={1000}
                description="Detailed description of wellness facilities"
              />

              <div className="space-y-2">
                <Label>Wellness Facilities Offered</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add a wellness facility"
                    value={newWellnessFacility}
                    onChange={(e) => setNewWellnessFacility(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addWellnessFacility()}
                    maxLength={100}
                  />
                  <Button onClick={addWellnessFacility} disabled={!newWellnessFacility.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {(formData.wellness.facilities || []).map((facility, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {facility}
                      <button
                        onClick={() => removeWellnessFacility(index)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                
                {(formData.wellness.facilities || []).length === 0 && (
                  <p className="text-sm text-gray-500">No facilities added yet. Add wellness facilities like "Steam Room", "Sauna", "Massage Rooms", etc.</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ValidatedInput
                  label="Operating Hours"
                  field="wellness.operatingHours"
                  value={formData.wellness.operatingHours || ""}
                  onChange={(value) => onInputChange('wellness', { ...formData.wellness!, operatingHours: value })}
                  formData={formData}
                  errors={errors}
                  setErrors={setErrors}
                  placeholder="6:00 AM - 10:00 PM"
                  maxLength={50}
                  description="Daily operating hours"
                />
                
                <div className="space-y-2">
                  <Label>Booking Requirements</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="wellnessBookingRequired"
                      checked={formData.wellness.bookingRequired || false}
                      onCheckedChange={(checked) => onInputChange('wellness', { ...formData.wellness!, bookingRequired: !!checked })}
                    />
                    <Label htmlFor="wellnessBookingRequired" className="text-sm cursor-pointer">
                      Advance booking required
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Meetings & Events Facilities */}
      <Card>
        <CardHeader>
          <CardTitle>Meetings & Events Facilities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="hasMeetings"
              checked={!!formData.meetings}
              onCheckedChange={(checked) => {
                if (checked) {
                  onInputChange('meetings', {
                    description: '',
                    facilities: [],
                    maxCapacity: 0,
                    totalVenues: 0,
                    cateringAvailable: true,
                    technicalSupport: true
                  })
                } else {
                  onInputChange('meetings', undefined)
                }
              }}
            />
            <Label htmlFor="hasMeetings" className="text-sm cursor-pointer">
              Hotel has meetings & events facilities
            </Label>
          </div>

          {formData.meetings && (
            <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
              <ValidatedTextarea
                label="Meetings Facilities Description"
                field="meetings.description"
                value={formData.meetings.description || ""}
                onChange={(value) => onInputChange('meetings', { ...formData.meetings!, description: value })}
                formData={formData}
                errors={errors}
                setErrors={setErrors}
                placeholder="Describe the meetings and events facilities available"
                required
                rows={3}
                maxLength={1000}
                description="Overview of meetings and events capabilities"
              />

              <div className="space-y-2">
                <Label>Meeting Facilities Available</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add a meeting facility"
                    value={newMeetingFacility}
                    onChange={(e) => setNewMeetingFacility(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addMeetingFacility()}
                    maxLength={100}
                  />
                  <Button onClick={addMeetingFacility} disabled={!newMeetingFacility.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {(formData.meetings.facilities || []).map((facility, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {facility}
                      <button
                        onClick={() => removeMeetingFacility(index)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                
                {(formData.meetings.facilities || []).length === 0 && (
                  <p className="text-sm text-gray-500">No facilities added yet. Add meeting facilities like "Boardroom", "Grand Ballroom", "Conference Center", etc.</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ValidatedInput
                  label="Maximum Capacity"
                  field="meetings.maxCapacity"
                  value={formData.meetings.maxCapacity || 0}
                  onChange={(value) => onInputChange('meetings', { ...formData.meetings!, maxCapacity: Number(value) })}
                  formData={formData}
                  errors={errors}
                  setErrors={setErrors}
                  type="number"
                  min={1}
                  placeholder="500"
                  description="Maximum people capacity across all venues"
                />
                
                <ValidatedInput
                  label="Total Venues"
                  field="meetings.totalVenues"
                  value={formData.meetings.totalVenues || 0}
                  onChange={(value) => onInputChange('meetings', { ...formData.meetings!, totalVenues: Number(value) })}
                  formData={formData}
                  errors={errors}
                  setErrors={setErrors}
                  type="number"
                  min={1}
                  placeholder="8"
                  description="Total number of meeting/event venues"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Services Available</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="cateringAvailable"
                        checked={formData.meetings.cateringAvailable || false}
                        onCheckedChange={(checked) => onInputChange('meetings', { ...formData.meetings!, cateringAvailable: !!checked })}
                      />
                      <Label htmlFor="cateringAvailable" className="text-sm cursor-pointer">
                        Catering services available
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="technicalSupport"
                        checked={formData.meetings.technicalSupport || false}
                        onCheckedChange={(checked) => onInputChange('meetings', { ...formData.meetings!, technicalSupport: !!checked })}
                      />
                      <Label htmlFor="technicalSupport" className="text-sm cursor-pointer">
                        Technical support available
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
