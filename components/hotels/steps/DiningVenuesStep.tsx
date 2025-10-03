// components/hotels/steps/DiningVenuesStep.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X, Utensils, Users, MapPin, Clock, AlertCircle, Coffee, Wine, Cake } from "lucide-react"
import { ValidatedInput } from "../ValidatedInput"
import { ValidatedTextarea } from "../ValidatedTextarea"
import type { HotelFormData, IDiningVenue } from "@/types/hotels"

interface DiningVenuesStepProps {
  formData: HotelFormData
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  onInputChange: (field: string, value: any) => void
}

// Dining venue types with icons
const venueTypes = {
  restaurant: { label: "Restaurant", icon: Utensils },
  cafe: { label: "Café", icon: Coffee },
  bar: { label: "Bar", icon: Wine },
  lounge: { label: "Lounge", icon: Users },
  buffet: { label: "Buffet", icon: Utensils },
  roomService: { label: "Room Service", icon: Utensils },
  bakery: { label: "Bakery", icon: Cake },
  fineDining: { label: "Fine Dining", icon: Utensils },
  casual: { label: "Casual Dining", icon: Utensils },
  rooftop: { label: "Rooftop Dining", icon: Utensils },
}

const cuisineTypes = [
  "International", "Italian", "French", "Chinese", "Japanese", "Indian", 
  "Arabic", "Mediterranean", "Asian", "European", "American", "Mexican",
  "Thai", "Lebanese", "Turkish", "Seafood", "Steakhouse", "Vegetarian", "Fusion"
]

const priceRanges = [
  { value: "$", label: "$ - Budget (Under AED 100)" },
  { value: "$$", label: "$$ - Moderate (AED 100-200)" },
  { value: "$$$", label: "$$$ - Upscale (AED 200-400)" },
  { value: "$$$$", label: "$$$$ - Fine Dining (AED 400-600)" },
  { value: "$$$$$", label: "$$$$$ - Ultra Luxury (AED 600+)" }
]

export function DiningVenuesStep({
  formData,
  errors,
  setErrors,
  onInputChange
}: DiningVenuesStepProps) {
  const [isAddingVenue, setIsAddingVenue] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [currentVenue, setCurrentVenue] = useState<Partial<IDiningVenue>>({
    name: "",
    type: "",
    location: "",
    description: "",
    capacity: 0,
    cuisine: [],
    priceRange: "",
    operatingHours: {
      breakfast: "",
      lunch: "",
      dinner: "",
      allDay: false
    },
    reservationRequired: false,
    dressCode: ""
  })

  const diningVenues = formData.dining || []

  // Handle adding/editing venue
  const handleSaveVenue = () => {
    if (!currentVenue.name?.trim() || !currentVenue.type?.trim() || !currentVenue.location?.trim() || !currentVenue.description?.trim()) {
      return
    }

    const venueData: IDiningVenue = {
      name: currentVenue.name!,
      type: currentVenue.type!,
      location: currentVenue.location!,
      description: currentVenue.description!,
      capacity: currentVenue.capacity || 0,
      cuisine: currentVenue.cuisine || [],
      priceRange: currentVenue.priceRange || "",
      operatingHours: currentVenue.operatingHours || {
        breakfast: "",
        lunch: "",
        dinner: "",
        allDay: false
      },
      reservationRequired: currentVenue.reservationRequired || false,
      dressCode: currentVenue.dressCode || ""
    }

    let updatedVenues = [...diningVenues]
    
    if (editingIndex !== null) {
      updatedVenues[editingIndex] = venueData
    } else {
      updatedVenues.push(venueData)
    }

    onInputChange('dining', updatedVenues)
    resetForm()
  }

  const resetForm = () => {
    setCurrentVenue({
      name: "",
      type: "",
      location: "",
      description: "",
      capacity: 0,
      cuisine: [],
      priceRange: "",
      operatingHours: {
        breakfast: "",
        lunch: "",
        dinner: "",
        allDay: false
      },
      reservationRequired: false,
      dressCode: ""
    })
    setIsAddingVenue(false)
    setEditingIndex(null)
  }

  const handleEditVenue = (index: number) => {
    setCurrentVenue(diningVenues[index])
    setEditingIndex(index)
    setIsAddingVenue(true)
  }

  const handleDeleteVenue = (index: number) => {
    const updatedVenues = diningVenues.filter((_, i) => i !== index)
    onInputChange('dining', updatedVenues)
  }

  const handleCuisineToggle = (cuisine: string) => {
    const currentCuisines = currentVenue.cuisine || []
    let updatedCuisines: string[]
    
    if (currentCuisines.includes(cuisine)) {
      updatedCuisines = currentCuisines.filter(c => c !== cuisine)
    } else {
      updatedCuisines = [...currentCuisines, cuisine]
    }
    
    setCurrentVenue(prev => ({ ...prev, cuisine: updatedCuisines }))
  }

  return (
    <div className="space-y-6">
      {/* Dining Venues List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5" />
              Dining Venues ({diningVenues.length})
            </CardTitle>
            <Button onClick={() => setIsAddingVenue(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Dining Venue
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {diningVenues.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Utensils className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No dining venues added yet</p>
              <p className="text-sm">Add at least one dining venue to continue</p>
            </div>
          ) : (
            <div className="space-y-4">
              {diningVenues.map((venue, index) => {
                const venueTypeInfo = venueTypes[venue.type as keyof typeof venueTypes]
                const TypeIcon = venueTypeInfo?.icon || Utensils
                
                return (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <TypeIcon className="h-5 w-5" />
                          <h3 className="font-semibold text-lg">{venue.name}</h3>
                          <Badge variant="outline">{venueTypeInfo?.label || venue.type}</Badge>
                          {venue.capacity && venue.capacity > 0 && (
                            <Badge variant="secondary">
                              <Users className="h-3 w-3 mr-1" />
                              {venue.capacity} seats
                            </Badge>
                          )}
                          {venue.priceRange && (
                            <Badge variant="outline">{venue.priceRange}</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          {venue.location}
                        </div>
                        
                        <p className="text-gray-600 mb-3 text-sm">{venue.description}</p>
                        
                        {venue.cuisine && venue.cuisine.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {venue.cuisine.map(c => (
                              <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {venue.operatingHours?.allDay ? (
                            <span>🕐 24/7</span>
                          ) : (
                            <>
                              {venue.operatingHours?.breakfast && <span>🌅 {venue.operatingHours.breakfast}</span>}
                              {venue.operatingHours?.lunch && <span>🌞 {venue.operatingHours.lunch}</span>}
                              {venue.operatingHours?.dinner && <span>🌙 {venue.operatingHours.dinner}</span>}
                            </>
                          )}
                          {venue.reservationRequired && <span>📞 Reservation Required</span>}
                          {venue.dressCode && <span>👔 {venue.dressCode}</span>}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditVenue(index)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteVenue(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Venue Form */}
      {isAddingVenue && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingIndex !== null ? 'Edit Dining Venue' : 'Add New Dining Venue'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ValidatedInput
                label="Venue Name"
                field="currentVenue.name"
                value={currentVenue.name || ""}
                onChange={(value) => setCurrentVenue(prev => ({ ...prev, name: value }))}
                formData={formData}
                errors={errors}
                setErrors={setErrors}
                placeholder="Main Restaurant"
                required
                maxLength={100}
                description="Name of the dining venue"
              />
              
              <div className="space-y-2">
                <Label htmlFor="venue-type">
                  Venue Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={currentVenue.type || ""}
                  onValueChange={(value) => setCurrentVenue(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select venue type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(venueTypes).map(([key, type]) => {
                      const Icon = type.icon
                      return (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Type of dining venue</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ValidatedInput
                label="Location"
                field="currentVenue.location"
                value={currentVenue.location || ""}
                onChange={(value) => setCurrentVenue(prev => ({ ...prev, location: value }))}
                formData={formData}
                errors={errors}
                setErrors={setErrors}
                placeholder="Ground Floor, Lobby"
                required
                maxLength={100}
                description="Location within the hotel"
              />
              
              <ValidatedInput
                label="Capacity"
                field="currentVenue.capacity"
                value={currentVenue.capacity || 0}
                onChange={(value) => setCurrentVenue(prev => ({ ...prev, capacity: Number(value) }))}
                formData={formData}
                errors={errors}
                setErrors={setErrors}
                type="number"
                placeholder="120"
                min={1}
                description="Maximum seating capacity"
              />
            </div>

            <ValidatedTextarea
              label="Description"
              field="currentVenue.description"
              value={currentVenue.description || ""}
              onChange={(value) => setCurrentVenue(prev => ({ ...prev, description: value }))}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              placeholder="Describe the dining venue, ambiance, and specialties"
              required
              rows={3}
              maxLength={500}
              description="Detailed description of the dining venue"
            />

            {/* Cuisine Types */}
            <div className="space-y-3">
              <Label>Cuisine Types</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {cuisineTypes.map(cuisine => (
                  <div key={cuisine} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`cuisine-${cuisine}`}
                      checked={(currentVenue.cuisine || []).includes(cuisine)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleCuisineToggle(cuisine)
                        } else {
                          handleCuisineToggle(cuisine)
                        }
                      }}
                      className="rounded"
                    />
                    <Label htmlFor={`cuisine-${cuisine}`} className="text-sm cursor-pointer">
                      {cuisine}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price-range">Price Range</Label>
                <Select
                  value={currentVenue.priceRange || ""}
                  onValueChange={(value) => setCurrentVenue(prev => ({ ...prev, priceRange: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select price range" />
                  </SelectTrigger>
                  <SelectContent>
                    {priceRanges.map(range => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <ValidatedInput
                label="Dress Code"
                field="currentVenue.dressCode"
                value={currentVenue.dressCode || ""}
                onChange={(value) => setCurrentVenue(prev => ({ ...prev, dressCode: value }))}
                formData={formData}
                errors={errors}
                setErrors={setErrors}
                placeholder="Smart Casual"
                maxLength={50}
                description="Dress code requirements"
              />
            </div>

            {/* Operating Hours */}
            <div className="space-y-3">
              <Label>Operating Hours</Label>
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="checkbox"
                  id="all-day"
                  checked={currentVenue.operatingHours?.allDay || false}
                  onChange={(e) => setCurrentVenue(prev => ({
                    ...prev,
                    operatingHours: {
                      breakfast: "",
                      lunch: "",
                      dinner: "",
                      allDay: e.target.checked
                    }
                  }))}
                  className="rounded"
                />
                <Label htmlFor="all-day" className="cursor-pointer">24/7 Operation</Label>
              </div>

              {!currentVenue.operatingHours?.allDay && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ValidatedInput
                    label="Breakfast Hours"
                    field="currentVenue.operatingHours.breakfast"
                    value={currentVenue.operatingHours?.breakfast || ""}
                    onChange={(value) => setCurrentVenue(prev => ({
                      ...prev,
                      operatingHours: { 
                        breakfast: value,
                        lunch: prev.operatingHours?.lunch || '',
                        dinner: prev.operatingHours?.dinner || '',
                        allDay: prev.operatingHours?.allDay || false
                      }
                    }))}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    placeholder="06:30 - 10:30"
                    maxLength={20}
                    description="Breakfast service hours"
                  />
                  
                  <ValidatedInput
                    label="Lunch Hours"
                    field="currentVenue.operatingHours.lunch"
                    value={currentVenue.operatingHours?.lunch || ""}
                    onChange={(value) => setCurrentVenue(prev => ({
                      ...prev,
                      operatingHours: { 
                        breakfast: prev.operatingHours?.breakfast || '',
                        lunch: value,
                        dinner: prev.operatingHours?.dinner || '',
                        allDay: prev.operatingHours?.allDay || false
                      }
                    }))}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    placeholder="12:00 - 15:00"
                    maxLength={20}
                    description="Lunch service hours"
                  />
                  
                  <ValidatedInput
                    label="Dinner Hours"
                    field="currentVenue.operatingHours.dinner"
                    value={currentVenue.operatingHours?.dinner || ""}
                    onChange={(value) => setCurrentVenue(prev => ({
                      ...prev,
                      operatingHours: { 
                        breakfast: prev.operatingHours?.breakfast || '',
                        lunch: prev.operatingHours?.lunch || '',
                        dinner: value,
                        allDay: prev.operatingHours?.allDay || false
                      }
                    }))}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    placeholder="19:00 - 23:00"
                    maxLength={20}
                    description="Dinner service hours"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="reservation-required"
                checked={currentVenue.reservationRequired || false}
                onChange={(e) => setCurrentVenue(prev => ({ ...prev, reservationRequired: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="reservation-required" className="cursor-pointer">Reservation Required</Label>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <Button onClick={handleSaveVenue}>
                {editingIndex !== null ? 'Update Venue' : 'Add Venue'}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Status */}
      {diningVenues.length === 0 && (
        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>At least one dining venue is required to continue.</span>
        </div>
      )}
    </div>
  )
}