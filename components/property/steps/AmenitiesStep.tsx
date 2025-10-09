// components/property/steps/AmenitiesStep.tsx
"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Users, Plus, X, Star, Building, Car, Waves } from "lucide-react"
import type { PropertyFormData, PropertyStepProps } from "@/types/properties"

// Common amenity categories and their typical items
const commonAmenities = {
  "Basic Amenities": [
    "Parking", "24/7 Security", "CCTV Surveillance", "Elevators", "Power Backup", 
    "Water Storage", "Maintenance Service", "Reception/Concierge"
  ],
  "Recreation & Fitness": [
    "Swimming Pool", "Gymnasium", "Tennis Court", "Basketball Court", "Jogging Track", 
    "Children's Play Area", "BBQ Area", "Sports Facilities", "Yoga Studio"
  ],
  "Lifestyle & Convenience": [
    "Shopping Mall", "Restaurants", "Cafes", "Supermarket", "Laundry Service", 
    "Dry Cleaning", "ATM", "Pharmacy", "Medical Center"
  ],
  "Luxury Features": [
    "Spa & Wellness Center", "Rooftop Lounge", "Business Center", "Meeting Rooms", 
    "Library", "Cinema Room", "Wine Cellar", "Valet Parking", "Butler Service"
  ],
  "Family & Kids": [
    "Nursery", "Kids Club", "Game Room", "Study Room", "Teen Zone", 
    "Baby Sitting Service", "Education Center", "Art Studio"
  ],
  "Outdoor & Nature": [
    "Garden", "Landscaped Areas", "Walking Trails", "Outdoor Seating", 
    "Water Features", "Pet Area", "Outdoor Gym", "Courtyard"
  ]
}

export function AmenitiesStep({ formData, errors, setErrors, onInputChange }: PropertyStepProps) {
  const [newItemInput, setNewItemInput] = useState<Record<number, string>>({})

  const handleFieldChange = (field: keyof PropertyFormData, value: any) => {
    onInputChange(field, value)
    
    // Clear field error when user starts typing
    if (errors[field]) {
      const newErrors = { ...errors }
      delete newErrors[field]
      setErrors(newErrors)
    }
  }

  const addAmenityCategory = () => {
    const newAmenities = [...formData.amenities, { category: '', items: [] }]
    handleFieldChange('amenities', newAmenities)
  }

  const removeAmenityCategory = (index: number) => {
    const newAmenities = formData.amenities.filter((_: any, i: number) => i !== index)
    handleFieldChange('amenities', newAmenities)
  }

  const updateAmenityCategory = (index: number, category: string) => {
    const newAmenities = formData.amenities.map((amenity: any, i: number) =>
      i === index ? { ...amenity, category } : amenity
    )
    handleFieldChange('amenities', newAmenities)
  }

  const addAmenityItem = (categoryIndex: number, item: string) => {
    if (!item.trim()) return
    
    const newAmenities = formData.amenities.map((amenity: any, i: number) =>
      i === categoryIndex 
        ? { ...amenity, items: [...amenity.items, item.trim()] }
        : amenity
    )
    handleFieldChange('amenities', newAmenities)
    
    // Clear the input
    setNewItemInput(prev => ({ ...prev, [categoryIndex]: '' }))
  }

  const removeAmenityItem = (categoryIndex: number, itemIndex: number) => {
    const newAmenities = formData.amenities.map((amenity: any, i: number) =>
      i === categoryIndex 
        ? { ...amenity, items: amenity.items.filter((_: any, j: number) => j !== itemIndex) }
        : amenity
    )
    handleFieldChange('amenities', newAmenities)
  }

  const addCommonAmenity = (categoryIndex: number, item: string) => {
    const currentItems = formData.amenities[categoryIndex]?.items || []
    if (!currentItems.includes(item)) {
      addAmenityItem(categoryIndex, item)
    }
  }

  return (
    <div className="space-y-6">
      {/* Amenities Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Property Amenities
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {formData.amenities.map((amenity: any, categoryIndex: number) => (
            <div key={categoryIndex} className="space-y-4 p-4 border rounded-lg">
              {/* Category Header */}
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`category-${categoryIndex}`} className="text-sm font-medium">
                    Category Name
                  </Label>
                  <Input
                    id={`category-${categoryIndex}`}
                    placeholder="e.g., Basic Amenities"
                    value={amenity.category}
                    onChange={(e) => updateAmenityCategory(categoryIndex, e.target.value)}
                    className={errors[`amenities.${categoryIndex}.category`] ? 'border-red-500' : ''}
                  />
                  {errors[`amenities.${categoryIndex}.category`] && (
                    <div className="flex items-center gap-1 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {errors[`amenities.${categoryIndex}.category`]}
                    </div>
                  )}
                </div>
                
                {formData.amenities.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeAmenityCategory(categoryIndex)}
                    className="ml-4 text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Amenity Items */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Amenities in this category:</Label>
                
                {/* Current Items */}
                <div className="flex flex-wrap gap-2">
                  {amenity.items.map((item: string, itemIndex: number) => (
                    <Badge key={itemIndex} variant="secondary" className="flex items-center gap-1">
                      {item}
                      <button
                        type="button"
                        onClick={() => removeAmenityItem(categoryIndex, itemIndex)}
                        className="ml-1 text-red-500 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>

                {/* Add New Item */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add new amenity"
                    value={newItemInput[categoryIndex] || ''}
                    onChange={(e) => setNewItemInput(prev => ({ ...prev, [categoryIndex]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addAmenityItem(categoryIndex, newItemInput[categoryIndex] || '')
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addAmenityItem(categoryIndex, newItemInput[categoryIndex] || '')}
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>

                {/* Common Amenities for this category */}
                {amenity.category && commonAmenities[amenity.category as keyof typeof commonAmenities] && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-600">
                      Common amenities for "{amenity.category}":
                    </Label>
                    <div className="flex flex-wrap gap-1">
                      {commonAmenities[amenity.category as keyof typeof commonAmenities].map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => addCommonAmenity(categoryIndex, item)}
                          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
                          disabled={amenity.items.includes(item)}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category Error */}
                {errors[`amenities.${categoryIndex}.items`] && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {errors[`amenities.${categoryIndex}.items`]}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Add Category Button */}
          <Button
            type="button"
            variant="outline"
            onClick={addAmenityCategory}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Amenity Category
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}