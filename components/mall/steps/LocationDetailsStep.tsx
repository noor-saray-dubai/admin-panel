// components/mall/steps/LocationDetailsStep.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ValidatedInput } from "../ValidatedInput"
import { ValidatedTextarea } from "../ValidatedTextarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Plus, Minus } from "lucide-react"
import { useState } from "react"
import type { MallFormData } from "@/types/mall"

interface LocationDetailsStepProps {
  formData: MallFormData
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  onInputChange: (field: string, value: any) => void
}

export function LocationDetailsStep({ formData, errors, setErrors, onInputChange }: LocationDetailsStepProps) {
  const [showDemographics, setShowDemographics] = useState(false)
  
  const handleAddHighway = () => {
    const currentHighways = formData.locationDetails?.connectivity?.highways || []
    onInputChange("locationDetails.connectivity.highways", [...currentHighways, ""])
  }

  const handleRemoveHighway = (index: number) => {
    const currentHighways = formData.locationDetails?.connectivity?.highways || []
    const newHighways = currentHighways.filter((_, i) => i !== index)
    onInputChange("locationDetails.connectivity.highways", newHighways)
  }

  const handleHighwayChange = (index: number, value: string) => {
    const currentHighways = formData.locationDetails?.connectivity?.highways || []
    const newHighways = [...currentHighways]
    newHighways[index] = value
    onInputChange("locationDetails.connectivity.highways", newHighways)
  }

  const handleAddAirport = () => {
    const currentAirports = formData.locationDetails?.connectivity?.airports || []
    onInputChange("locationDetails.connectivity.airports", [...currentAirports, ""])
  }

  const handleRemoveAirport = (index: number) => {
    const currentAirports = formData.locationDetails?.connectivity?.airports || []
    const newAirports = currentAirports.filter((_, i) => i !== index)
    onInputChange("locationDetails.connectivity.airports", newAirports)
  }

  const handleAirportChange = (index: number, value: string) => {
    const currentAirports = formData.locationDetails?.connectivity?.airports || []
    const newAirports = [...currentAirports]
    newAirports[index] = value
    onInputChange("locationDetails.connectivity.airports", newAirports)
  }

  const handleAddTransport = () => {
    const currentTransport = formData.locationDetails?.connectivity?.publicTransport || []
    onInputChange("locationDetails.connectivity.publicTransport", [...currentTransport, ""])
  }

  const handleRemoveTransport = (index: number) => {
    const currentTransport = formData.locationDetails?.connectivity?.publicTransport || []
    const newTransport = currentTransport.filter((_, i) => i !== index)
    onInputChange("locationDetails.connectivity.publicTransport", newTransport)
  }

  const handleTransportChange = (index: number, value: string) => {
    const currentTransport = formData.locationDetails?.connectivity?.publicTransport || []
    const newTransport = [...currentTransport]
    newTransport[index] = value
    onInputChange("locationDetails.connectivity.publicTransport", newTransport)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Location Description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ValidatedTextarea
            label="Location Description"
            field="locationDetails.description"
            value={formData.locationDetails?.description ?? ""}
            onChange={(value) => onInputChange("locationDetails.description", value)}
            formData={formData}
            placeholder="Describe the location, surroundings, and key landmarks..."
            maxLength={1000}
            rows={4}
            errors={errors}
            setErrors={setErrors}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coordinates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <ValidatedInput
              label="Latitude"
              field="locationDetails.coordinates.latitude"
              value={formData.locationDetails?.coordinates?.latitude ?? 0}
              onChange={(value) => onInputChange("locationDetails.coordinates.latitude", value)}
              type="number"
              step={0.000001}
              min={-90}
              max={90}
              placeholder="25.276987"
              formData={formData}
              errors={errors}
              setErrors={setErrors}
            />
            <ValidatedInput
              label="Longitude"
              field="locationDetails.coordinates.longitude"
              value={formData.locationDetails?.coordinates?.longitude ?? 0}
              onChange={(value) => onInputChange("locationDetails.coordinates.longitude", value)}
              type="number"
              step={0.000001}
              min={-180}
              max={180}
              placeholder="55.296249"
              formData={formData}
              errors={errors}
              setErrors={setErrors}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connectivity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <ValidatedInput
              label="Nearest Metro Station"
              field="locationDetails.connectivity.metroStation"
              value={formData.locationDetails?.connectivity?.metroStation ?? ""}
              onChange={(value) => onInputChange("locationDetails.connectivity.metroStation", value)}
              placeholder="e.g., Dubai Marina"
              maxLength={100}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
            />
            <ValidatedInput
              label="Metro Distance (km)"
              field="locationDetails.connectivity.metroDistance"
              value={formData.locationDetails?.connectivity?.metroDistance ?? 0}
              onChange={(value) => onInputChange("locationDetails.connectivity.metroDistance", value)}
              type="number"
              step={0.1}
              min={0}
              placeholder="1.5"
              formData={formData}
              errors={errors}
              setErrors={setErrors}
            />
          </div>

          <div className="space-y-3">
            <Label>Connected Highways</Label>
            {(formData.locationDetails?.connectivity?.highways || []).map((highway, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    value={highway}
                    onChange={(e) => handleHighwayChange(index, e.target.value)}
                    placeholder={`Highway ${index + 1}`}
                    maxLength={50}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveHighway(index)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={handleAddHighway}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Highway
            </Button>
          </div>

          <div className="space-y-3">
            <Label>Nearby Airports</Label>
            {(formData.locationDetails?.connectivity?.airports || []).map((airport, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    value={airport}
                    onChange={(e) => handleAirportChange(index, e.target.value)}
                    placeholder={`Airport ${index + 1} (with distance)`}
                    maxLength={100}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveAirport(index)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={handleAddAirport}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Airport
            </Button>
          </div>

          <div className="space-y-3">
            <Label>Public Transport</Label>
            {(formData.locationDetails?.connectivity?.publicTransport || []).map((transport, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    value={transport}
                    onChange={(e) => handleTransportChange(index, e.target.value)}
                    placeholder={`Transport option ${index + 1}`}
                    maxLength={100}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveTransport(index)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={handleAddTransport}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Transport Option
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Demographics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Label className="text-sm font-medium">Do you want to provide demographic information?</Label>
            </div>
            <RadioGroup
              value={showDemographics ? "yes" : "no"}
              onValueChange={(value) => setShowDemographics(value === "yes")}
              className="flex items-center space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="demographics-no" />
                <Label htmlFor="demographics-no" className="text-sm">No (Skip this section)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="demographics-yes" />
                <Label htmlFor="demographics-yes" className="text-sm">Yes (Provide demographic data)</Label>
              </div>
            </RadioGroup>
          </div>
          
          {showDemographics && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4">
                <ValidatedInput
                  label="Catchment Population"
                  field="locationDetails.demographics.catchmentPopulation"
                  value={formData.locationDetails?.demographics?.catchmentPopulation ?? 0}
                  onChange={(value) => onInputChange("locationDetails.demographics.catchmentPopulation", value)}
                  type="number"
                  min={0}
                  placeholder="500000"
                  formData={formData}
                  errors={errors}
                  setErrors={setErrors}
                />
                <ValidatedInput
                  label="Annual Tourist Footfall"
                  field="locationDetails.demographics.touristFootfall"
                  value={formData.locationDetails?.demographics?.touristFootfall ?? 0}
                  onChange={(value) => onInputChange("locationDetails.demographics.touristFootfall", value)}
                  type="number"
                  min={0}
                  placeholder="1000000"
                  formData={formData}
                  errors={errors}
                  setErrors={setErrors}
                />
              </div>

              <ValidatedInput
                label="Average Income Level"
                field="locationDetails.demographics.averageIncome"
                value={formData.locationDetails?.demographics?.averageIncome ?? ""}
                onChange={(value) => onInputChange("locationDetails.demographics.averageIncome", value)}
                placeholder="e.g., High, Upper Middle, Middle"
                maxLength={50}
                formData={formData}
                errors={errors}
                setErrors={setErrors}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}