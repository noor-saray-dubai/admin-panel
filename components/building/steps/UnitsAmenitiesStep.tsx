// components/building/steps/UnitsAmenitiesStep.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Minus, Home, Star, Zap } from "lucide-react"
import { ValidatedInput } from "../ValidatedInput"
import type { BuildingFormData } from "@/types/buildings"

interface UnitsAmenitiesStepProps {
  formData: BuildingFormData
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  onInputChange: (field: string, value: any) => void
}

export function UnitsAmenitiesStep({
  formData,
  errors,
  setErrors,
  onInputChange
}: UnitsAmenitiesStepProps) {
  const unitTypeOptions = ["Studio", "1BR", "2BR", "3BR", "4BR", "5BR+", "Penthouse", "Office", "Retail", "Restaurant", "Showroom"]

  const addUnit = () => {
    const currentUnits = formData.units || []
    onInputChange("units", [...currentUnits, { type: "1BR", count: 1 }])
  }

  const removeUnit = (index: number) => {
    const currentUnits = formData.units || []
    const newUnits = currentUnits.filter((_, i) => i !== index)
    onInputChange("units", newUnits)
  }

  const updateUnit = (index: number, field: string, value: any) => {
    const currentUnits = formData.units || []
    const newUnits = currentUnits.map((unit, i) =>
      i === index ? { ...unit, [field]: value } : unit
    )
    onInputChange("units", newUnits)
  }

  const addFeature = () => {
    const currentFeatures = formData.features || []
    onInputChange("features", [...currentFeatures, ""])
  }

  const removeFeature = (index: number) => {
    const currentFeatures = formData.features || []
    const newFeatures = currentFeatures.filter((_, i) => i !== index)
    onInputChange("features", newFeatures)
  }

  const updateFeature = (index: number, value: string) => {
    const currentFeatures = formData.features || []
    const newFeatures = currentFeatures.map((f, i) => i === index ? value : f)
    onInputChange("features", newFeatures)
  }

  const addHighlight = () => {
    const currentHighlights = formData.highlights || []
    onInputChange("highlights", [...currentHighlights, ""])
  }

  const removeHighlight = (index: number) => {
    const currentHighlights = formData.highlights || []
    const newHighlights = currentHighlights.filter((_, i) => i !== index)
    onInputChange("highlights", newHighlights)
  }

  const updateHighlight = (index: number, value: string) => {
    const currentHighlights = formData.highlights || []
    const newHighlights = currentHighlights.map((h, i) => i === index ? value : h)
    onInputChange("highlights", newHighlights)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Units Information
            </span>
            <Button type="button" variant="outline" size="sm" onClick={addUnit}>
              <Plus className="h-4 w-4 mr-1" />
              Add Unit Type
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <ValidatedInput
              label="Total Units"
              field="totalUnits"
              value={formData.totalUnits ?? 0}
              onChange={(value) => onInputChange("totalUnits", value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              type="number"
              required
              min={1}
            />

            <ValidatedInput
              label="Available Units"
              field="availableUnits"
              value={formData.availableUnits ?? ""}
              onChange={(value) => onInputChange("availableUnits", value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              type="number"
              min={0}
              description="Number of units currently available for sale/rent"
            />
          </div>

          {formData.units && formData.units.map((unit, index) => (
            <div key={index} className="border p-4 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <Label>Unit Type {index + 1}</Label>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeUnit(index)}>
                  <Minus className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={unit.type}
                    onValueChange={(value) => updateUnit(index, 'type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {unitTypeOptions.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Count</Label>
                  <Input
                    type="number"
                    value={unit.count || ""}
                    onChange={(e) => updateUnit(index, 'count', parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Available</Label>
                  <Input
                    type="number"
                    value={unit.availability || ""}
                    onChange={(e) => updateUnit(index, 'availability', parseInt(e.target.value) || 0)}
                    min="0"
                    placeholder="Available units"
                  />
                </div>
              </div>

              {unit.sizeRange && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Min Size</Label>
                    <Input
                      type="number"
                      value={unit.sizeRange.min || ""}
                      onChange={(e) => updateUnit(index, 'sizeRange', { ...unit.sizeRange, min: parseFloat(e.target.value) || 0 })}
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Size</Label>
                    <Input
                      type="number"
                      value={unit.sizeRange.max || ""}
                      onChange={(e) => updateUnit(index, 'sizeRange', { ...unit.sizeRange, max: parseFloat(e.target.value) || 0 })}
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Select
                      value={unit.sizeRange.unit || "sqm"}
                      onValueChange={(value) => updateUnit(index, 'sizeRange', { ...unit.sizeRange, unit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sqm">sqm</SelectItem>
                        <SelectItem value="sqft">sqft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => updateUnit(index, 'sizeRange', { min: 0, max: 0, unit: 'sqm' })}
              >
                Add Size Range
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Amenities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              // Residential amenities
              { key: 'privateElevator', label: 'Private Elevator' },
              { key: 'skyLounge', label: 'Sky Lounge' },
              { key: 'concierge', label: 'Concierge Service' },
              { key: 'infinityPool', label: 'Infinity Pool' },
              { key: 'skyBridge', label: 'Sky Bridge' },
              { key: 'privateCinema', label: 'Private Cinema' },
              { key: 'skyPool', label: 'Sky Pool' },
              { key: 'panoramicViews', label: 'Panoramic Views' },
              { key: 'valetService', label: 'Valet Service' },
              { key: 'marinaAccess', label: 'Marina Access' },
              { key: 'beachClub', label: 'Beach Club' },
              { key: 'golfCourse', label: 'Golf Course' },
              
              // Commercial amenities
              { key: 'executiveLounges', label: 'Executive Lounges' },
              { key: 'helipad', label: 'Helipad' },
              { key: 'fiveStarHotel', label: 'Five Star Hotel' },
              { key: 'tradingFloors', label: 'Trading Floors' },
              { key: 'conferenceCenters', label: 'Conference Centers' },
              { key: 'fineDining', label: 'Fine Dining' },
              { key: 'exhibitionHalls', label: 'Exhibition Halls' },
              { key: 'conventionCenter', label: 'Convention Center' },
              { key: 'retailSpaces', label: 'Retail Spaces' },
              { key: 'marinaViews', label: 'Marina Views' },
              
              // Common amenities
              { key: 'gym', label: 'Fitness Center' },
              { key: 'spa', label: 'Spa & Wellness' },
              { key: 'parking', label: 'Parking' },
              { key: 'security247', label: '24/7 Security' },
              { key: 'smartHome', label: 'Smart Home Technology' },
              { key: 'highSpeedElevators', label: 'High Speed Elevators' },
              { key: 'businessCenter', label: 'Business Center' },
              { key: 'cafeteria', label: 'Cafeteria' },
              { key: 'landscapedGardens', label: 'Landscaped Gardens' },
              { key: 'childrenPlayArea', label: 'Children Play Area' },
              { key: 'petFriendly', label: 'Pet Friendly' },
              { key: 'wheelchairAccessible', label: 'Wheelchair Accessible' }
            ].map(amenity => (
              <div key={amenity.key} className="flex items-center space-x-2">
                <Checkbox
                  id={amenity.key}
                  checked={formData.amenities?.[amenity.key as keyof typeof formData.amenities] || false}
                  onCheckedChange={(checked) => 
                    onInputChange("amenities", { 
                      ...formData.amenities, 
                      [amenity.key]: checked 
                    })
                  }
                />
                <Label htmlFor={amenity.key} className="text-sm">
                  {amenity.label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Features
            </span>
            <Button type="button" variant="outline" size="sm" onClick={addFeature}>
              <Plus className="h-4 w-4 mr-1" />
              Add Feature
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.features && formData.features.map((feature, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Feature description"
                value={feature}
                onChange={(e) => updateFeature(index, e.target.value)}
                maxLength={200}
              />
              <Button type="button" variant="ghost" size="sm" onClick={() => removeFeature(index)}>
                <Minus className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Key Highlights
            <Button type="button" variant="outline" size="sm" onClick={addHighlight}>
              <Plus className="h-4 w-4 mr-1" />
              Add Highlight
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.highlights && formData.highlights.map((highlight, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Key highlight"
                value={highlight}
                onChange={(e) => updateHighlight(index, e.target.value)}
                maxLength={200}
              />
              <Button type="button" variant="ghost" size="sm" onClick={() => removeHighlight(index)}>
                <Minus className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}