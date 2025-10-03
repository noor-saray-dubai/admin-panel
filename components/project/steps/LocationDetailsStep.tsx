// components/project/steps/LocationDetailsStep.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { MapPin, Plus, Trash2 } from "lucide-react"
import type { ProjectFormData, INearbyPlace } from "@/types/projects"
import { ValidatedInput } from "../ValidatedInput"
import { ValidatedTextarea } from "../ValidatedTextarea"

interface LocationDetailsStepProps {
  formData: ProjectFormData
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  onInputChange: (field: string, value: any) => void
}

export function LocationDetailsStep({ 
  formData, 
  errors, 
  setErrors, 
  onInputChange 
}: LocationDetailsStepProps) {

  const addNearbyPlace = () => {
    const newNearby = [...formData.locationDetails.nearby, { name: "", distance: "" }]
    onInputChange('locationDetails.nearby', newNearby)
  }

  const removeNearbyPlace = (index: number) => {
    const newNearby = formData.locationDetails.nearby.filter((_, i) => i !== index)
    onInputChange('locationDetails.nearby', newNearby)
  }

  const updateNearbyPlace = (index: number, field: keyof INearbyPlace, value: string) => {
    const newNearby = [...formData.locationDetails.nearby]
    newNearby[index] = { ...newNearby[index], [field]: value }
    onInputChange('locationDetails.nearby', newNearby)
  }

  // Removed connectivity functions as they don't exist in the actual schema

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-4">
        <MapPin className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Location Details</h2>
      </div>

      {/* Location Description & Coordinates */}
      <Card>
        <CardHeader>
          <CardTitle>Location Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ValidatedTextarea
            label="Location Description"
            field="locationDetails.description"
            value={formData.locationDetails.description}
            onChange={(value: string) => onInputChange('locationDetails.description', value)}
            formData={formData}
            errors={errors}
            setErrors={setErrors}
            required={true}
            maxLength={1000}
            minLength={20}
            placeholder="Describe the location and its advantages, accessibility, and surrounding area..."
            rows={3}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ValidatedInput
              label="Latitude"
              field="locationDetails.coordinates.latitude"
              value={formData.locationDetails.coordinates.latitude?.toString() || ''}
              onChange={(value: string | number) => onInputChange('locationDetails.coordinates.latitude', Number(value) || 0)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              required={true}
              min={-90}
              max={90}
              type="number"
              placeholder="25.0800"
              step="0.000001"
            />
            
            <ValidatedInput
              label="Longitude"
              field="locationDetails.coordinates.longitude"
              value={formData.locationDetails.coordinates.longitude?.toString() || ''}
              onChange={(value: string | number) => onInputChange('locationDetails.coordinates.longitude', Number(value) || 0)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              required={true}
              min={-180}
              max={180}
              type="number"
              placeholder="55.1400"
              step="0.000001"
            />
          </div>
        </CardContent>
      </Card>

      {/* Nearby Places */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Nearby Places
            <Button type="button" onClick={addNearbyPlace} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Place
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {formData.locationDetails.nearby.map((place, index) => {
              const isComplete = place.name && place.distance
              return (
                <div key={index} className={`flex gap-2 items-start p-3 rounded border ${!isComplete ? 'bg-red-50 border-red-200' : 'border-gray-200'}`}>
                  <div className="flex-1">
                    <ValidatedInput
                      label="Place Name"
                      field={`nearby_${index}_name`}
                      value={place.name}
                      onChange={(value: string | number) => updateNearbyPlace(index, 'name', value as string)}
                      formData={formData}
                      errors={errors}
                      setErrors={setErrors}
                      required={true}
                      maxLength={100}
                      minLength={2}
                      placeholder="e.g., Dubai Marina Mall"
                    />
                  </div>
                  <div className="w-32">
                    <ValidatedInput
                      label="Distance"
                      field={`nearby_${index}_distance`}
                      value={place.distance}
                      onChange={(value: string | number) => updateNearbyPlace(index, 'distance', value as string)}
                      formData={formData}
                      errors={errors}
                      setErrors={setErrors}
                      required={true}
                      maxLength={20}
                      minLength={2}
                      placeholder="300m"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeNearbyPlace(index)}
                    className="mt-6"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>

          {formData.locationDetails.nearby.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No nearby places added yet.</p>
              <Button type="button" onClick={addNearbyPlace} size="sm" className="mt-2">
                <Plus className="h-4 w-4 mr-1" />
                Add First Place
              </Button>
            </div>
          )}
        </CardContent>
      </Card>



      {/* Location Summary - Only schema fields */}
      {(formData.locationDetails.description || formData.locationDetails.nearby.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Location Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <Label className="font-medium">Location Information</Label>
              <ul className="text-gray-600 mt-1 space-y-1">
                <li>Description: {formData.locationDetails.description ? 'Provided' : 'Not provided'}</li>
                <li>Coordinates: {formData.locationDetails.coordinates.latitude && formData.locationDetails.coordinates.longitude ? 'Set' : 'Not set'}</li>
                <li>Nearby Places: {formData.locationDetails.nearby.length}</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}