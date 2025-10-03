// components/project/steps/UnitsAmenitiesStep.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Plus, Trash2, AlertCircle, CheckCircle } from "lucide-react"
import type { ProjectFormData, IAmenityCategory, IUnitType } from "@/types/projects"
import { ValidatedInput } from "../ValidatedInput"

interface UnitsAmenitiesStepProps {
  formData: ProjectFormData
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  onInputChange: (field: string, value: any) => void
}

const AMENITY_CATEGORIES = {
  'Recreation': ['Swimming Pool', 'Gymnasium', 'Tennis Court', 'Basketball Court', 'Kids Play Area', 'Jogging Track', 'Cycling Track', 'Sports Club', 'Game Room', 'Billiards Room'],
  'Convenience': ['24/7 Security', 'Concierge Service', 'Parking', 'Elevators', 'Reception', 'Maintenance Service', 'Housekeeping', 'Laundry Service', 'Dry Cleaning'],
  'Lifestyle': ['Spa & Wellness Center', 'Business Center', 'Restaurant', 'Retail Shops', 'Coffee Shop', 'Library', 'Meeting Rooms', 'Event Hall', 'Rooftop Terrace', 'BBQ Area'],
  'Utilities': ['High-speed Internet', 'Cable TV', 'Central Air Conditioning', 'Backup Power', 'Water Supply', 'Waste Management', 'Fire Safety', 'CCTV'],
  'Outdoor': ['Garden', 'Landscaping', 'Water Features', 'Outdoor Seating', 'Children\'s Playground', 'Pet Area', 'Parking Shade', 'Walking Paths']
}

export function UnitsAmenitiesStep({ 
  formData, 
  errors, 
  setErrors, 
  onInputChange 
}: UnitsAmenitiesStepProps) {

  // Unit Types functions
  const addUnitType = () => {
    const newUnitTypes = [...formData.unitTypes, { type: "", size: "", price: "" }]
    onInputChange('unitTypes', newUnitTypes)
  }

  const removeUnitType = (index: number) => {
    const newUnitTypes = formData.unitTypes.filter((_, i) => i !== index)
    onInputChange('unitTypes', newUnitTypes)
  }

  const updateUnitType = (index: number, field: keyof IUnitType, value: string) => {
    const newUnitTypes = [...formData.unitTypes]
    newUnitTypes[index] = { ...newUnitTypes[index], [field]: value }
    onInputChange('unitTypes', newUnitTypes)
  }

  // Amenity functions
  const addAmenityCategory = () => {
    const newAmenities = [...formData.amenities, { category: "", items: [] }]
    onInputChange('amenities', newAmenities)
  }

  const removeAmenityCategory = (index: number) => {
    const newAmenities = formData.amenities.filter((_, i) => i !== index)
    onInputChange('amenities', newAmenities)
  }

  const updateAmenityCategory = (index: number, category: string) => {
    const newAmenities = [...formData.amenities]
    newAmenities[index] = { category, items: [] }
    onInputChange('amenities', newAmenities)
  }

  const toggleAmenityItem = (categoryIndex: number, item: string) => {
    const newAmenities = [...formData.amenities]
    const amenity = newAmenities[categoryIndex]
    
    if (amenity.items.includes(item)) {
      amenity.items = amenity.items.filter(existingItem => existingItem !== item)
    } else {
      amenity.items = [...amenity.items, item]
    }
    
    onInputChange('amenities', newAmenities)
  }

  const getAvailableCategories = () => {
    const selectedCategories = formData.amenities.map(a => a.category).filter(c => c)
    return Object.keys(AMENITY_CATEGORIES).filter(cat => !selectedCategories.includes(cat))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-4">
        <Users className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Units & Amenities</h2>
      </div>

      {/* Unit Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Unit Types
            <Button type="button" onClick={addUnitType} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Unit Type
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {errors.unitTypes && (
            <div className="text-red-500 text-sm mb-4 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.unitTypes}
            </div>
          )}
          
          <div className="space-y-4">
            {formData.unitTypes.map((unit, index) => {
              const isComplete = unit.type && unit.size && unit.price
              return (
                <div key={index} className={`p-4 border rounded-lg ${!isComplete ? 'bg-red-50 border-red-200' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className={`font-medium flex items-center gap-1 ${isComplete ? 'text-green-600' : ''}`}>
                      {isComplete && <CheckCircle className="h-3 w-3" />}
                      Unit Type {index + 1}
                    </h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeUnitType(index)}
                      disabled={formData.unitTypes.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <ValidatedInput
                      label="Unit Type"
                      field={`unit_type_${index}`}
                      value={unit.type}
                      onChange={(value: string | number) => updateUnitType(index, 'type', value as string)}
                      formData={formData}
                      errors={errors}
                      setErrors={setErrors}
                      required={true}
                      maxLength={50}
                      minLength={2}
                      placeholder="e.g., Studio, 1BR, 2BR"
                    />
                    
                    <ValidatedInput
                      label="Size"
                      field={`unit_size_${index}`}
                      value={unit.size}
                      onChange={(value: string | number) => updateUnitType(index, 'size', value as string)}
                      formData={formData}
                      errors={errors}
                      setErrors={setErrors}
                      required={true}
                      maxLength={50}
                      minLength={5}
                      placeholder="e.g., 500-600 sq ft"
                    />
                    
                    <ValidatedInput
                      label="Price Range"
                      field={`unit_price_${index}`}
                      value={unit.price}
                      onChange={(value: string | number) => updateUnitType(index, 'price', value as string)}
                      formData={formData}
                      errors={errors}
                      setErrors={setErrors}
                      required={true}
                      maxLength={100}
                      minLength={5}
                      placeholder="e.g., Starting from AED 800K"
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {formData.unitTypes.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No unit types added yet.</p>
              <Button type="button" onClick={addUnitType} size="sm" className="mt-2">
                <Plus className="h-4 w-4 mr-1" />
                Add First Unit Type
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Amenities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Amenities
            <Button 
              type="button" 
              onClick={addAmenityCategory} 
              size="sm"
              disabled={getAvailableCategories().length === 0}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Category
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {errors.amenities && (
            <div className="text-red-500 text-sm mb-4 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.amenities}
            </div>
          )}
          
          <div className="space-y-4">
            {formData.amenities.map((amenity, categoryIndex) => (
              <div key={categoryIndex} className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex-1 mr-3">
                    <Label className={`flex items-center gap-1 ${amenity.category ? 'text-green-600' : ''}`}>
                      {amenity.category && <CheckCircle className="h-3 w-3" />}
                      Category Name
                    </Label>
                    <Select
                      value={amenity.category}
                      onValueChange={(value) => updateAmenityCategory(categoryIndex, value)}
                    >
                      <SelectTrigger className={`mt-1 ${errors[`amenity_category_${categoryIndex}`] ? 'border-red-500' : amenity.category ? 'border-green-500' : ''} ${!amenity.category ? 'bg-red-50 border-red-200' : ''}`}>
                        <SelectValue placeholder="Select amenity category" />
                      </SelectTrigger>
                      <SelectContent>
                        {(amenity.category ? [amenity.category, ...getAvailableCategories()] : getAvailableCategories()).map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors[`amenity_category_${categoryIndex}`] && (
                      <span className="text-red-500 text-xs flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors[`amenity_category_${categoryIndex}`]}
                      </span>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeAmenityCategory(categoryIndex)}
                    disabled={formData.amenities.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                {amenity.category && AMENITY_CATEGORIES[amenity.category as keyof typeof AMENITY_CATEGORIES] && (
                  <div>
                    <Label className={`text-sm flex items-center gap-1 ${amenity.items.length > 0 ? 'text-green-600' : ''}`}>
                      {amenity.items.length > 0 && <CheckCircle className="h-3 w-3" />}
                      Available Items ({amenity.items.length} selected)
                    </Label>
                    {errors[`amenity_items_${categoryIndex}`] && (
                      <div className="text-red-500 text-xs flex items-center gap-1 mt-1 mb-2">
                        <AlertCircle className="h-3 w-3" />
                        {errors[`amenity_items_${categoryIndex}`]}
                      </div>
                    )}
                    <div className={`grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto p-2 border rounded ${amenity.items.length === 0 ? 'bg-red-50 border-red-200' : ''}`}>
                      {AMENITY_CATEGORIES[amenity.category as keyof typeof AMENITY_CATEGORIES].map((item) => (
                        <div key={item} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${categoryIndex}-${item}`}
                            checked={amenity.items.includes(item)}
                            onCheckedChange={() => toggleAmenityItem(categoryIndex, item)}
                          />
                          <Label htmlFor={`${categoryIndex}-${item}`} className="text-sm">
                            {item}
                          </Label>
                        </div>
                      ))}
                    </div>
                    
                    {amenity.items.length > 0 && (
                      <div className="mt-2">
                        <Label className="text-sm text-gray-600">Selected ({amenity.items.length}):</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {amenity.items.map((item, itemIndex) => (
                            <Badge key={itemIndex} variant="outline" className="text-xs">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {formData.amenities.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No amenity categories added yet.</p>
              <Button type="button" onClick={addAmenityCategory} size="sm" className="mt-2">
                <Plus className="h-4 w-4 mr-1" />
                Add First Category
              </Button>
            </div>
          )}

          {getAvailableCategories().length === 0 && formData.amenities.length > 0 && (
            <div className="text-sm text-green-600 text-center py-2">
              ✓ All amenity categories have been added
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {(formData.unitTypes.length > 0 || formData.amenities.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Units & Amenities Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="font-medium">Unit Types</Label>
                <p className="text-gray-600 mt-1">
                  {formData.unitTypes.length} unit types configured
                </p>
                {formData.unitTypes.filter(u => u.type && u.size && u.price).length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {formData.unitTypes.filter(u => u.type && u.size && u.price).map((unit, index) => (
                      <li key={index} className="text-xs text-gray-600">
                        • {unit.type} - {unit.size}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              <div>
                <Label className="font-medium">Amenities</Label>
                <p className="text-gray-600 mt-1">
                  {formData.amenities.length} categories, {formData.amenities.reduce((total, amenity) => total + amenity.items.length, 0)} total amenities
                </p>
                {formData.amenities.filter(a => a.category && a.items.length > 0).length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {formData.amenities.filter(a => a.category && a.items.length > 0).map((amenity, index) => (
                      <li key={index} className="text-xs text-gray-600">
                        • {amenity.category}: {amenity.items.length} items
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}