// components/mall/steps/FeaturesAmenitiesStep.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ValidatedInput } from "../ValidatedInput"
import { ValidatedTextarea } from "../ValidatedTextarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Minus } from "lucide-react"
import type { MallFormData } from "@/types/mall"

interface FeaturesAmenitiesStepProps {
  formData: MallFormData
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  onInputChange: (field: string, value: any) => void
}

export function FeaturesAmenitiesStep({ formData, errors, setErrors, onInputChange }: FeaturesAmenitiesStepProps) {
  
  const handleAddFeature = () => {
    const currentFeatures = formData.features || []
    onInputChange("features", [...currentFeatures, ""])
  }

  const handleRemoveFeature = (index: number) => {
    const currentFeatures = formData.features || []
    const newFeatures = currentFeatures.filter((_, i) => i !== index)
    onInputChange("features", newFeatures)
  }

  const handleFeatureChange = (index: number, value: string) => {
    const currentFeatures = formData.features || []
    const newFeatures = [...currentFeatures]
    newFeatures[index] = value
    onInputChange("features", newFeatures)
  }

  const handleAddPortfolioItem = () => {
    const currentPortfolio = formData.developer?.portfolio || []
    onInputChange("developer.portfolio", [...currentPortfolio, ""])
  }

  const handleRemovePortfolioItem = (index: number) => {
    const currentPortfolio = formData.developer?.portfolio || []
    const newPortfolio = currentPortfolio.filter((_, i) => i !== index)
    onInputChange("developer.portfolio", newPortfolio)
  }

  const handlePortfolioItemChange = (index: number, value: string) => {
    const currentPortfolio = formData.developer?.portfolio || []
    const newPortfolio = [...currentPortfolio]
    newPortfolio[index] = value
    onInputChange("developer.portfolio", newPortfolio)
  }

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    onInputChange(`amenities.${amenity}`, checked)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mall Amenities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="cinemas"
                checked={formData.amenities?.cinemas ?? false}
                onCheckedChange={(checked) => handleAmenityChange("cinemas", checked as boolean)}
              />
              <Label htmlFor="cinemas">Cinemas</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="foodCourt"
                checked={formData.amenities?.foodCourt ?? false}
                onCheckedChange={(checked) => handleAmenityChange("foodCourt", checked as boolean)}
              />
              <Label htmlFor="foodCourt">Food Court</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hypermarket"
                checked={formData.amenities?.hypermarket ?? false}
                onCheckedChange={(checked) => handleAmenityChange("hypermarket", checked as boolean)}
              />
              <Label htmlFor="hypermarket">Hypermarket</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="departmentStore"
                checked={formData.amenities?.departmentStore ?? false}
                onCheckedChange={(checked) => handleAmenityChange("departmentStore", checked as boolean)}
              />
              <Label htmlFor="departmentStore">Department Store</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="entertainment"
                checked={formData.amenities?.entertainment ?? false}
                onCheckedChange={(checked) => handleAmenityChange("entertainment", checked as boolean)}
              />
              <Label htmlFor="entertainment">Entertainment</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="skiResort"
                checked={formData.amenities?.skiResort ?? false}
                onCheckedChange={(checked) => handleAmenityChange("skiResort", checked as boolean)}
              />
              <Label htmlFor="skiResort">Ski Resort</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="aquarium"
                checked={formData.amenities?.aquarium ?? false}
                onCheckedChange={(checked) => handleAmenityChange("aquarium", checked as boolean)}
              />
              <Label htmlFor="aquarium">Aquarium</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="iceRink"
                checked={formData.amenities?.iceRink ?? false}
                onCheckedChange={(checked) => handleAmenityChange("iceRink", checked as boolean)}
              />
              <Label htmlFor="iceRink">Ice Rink</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hotel"
                checked={formData.amenities?.hotel ?? false}
                onCheckedChange={(checked) => handleAmenityChange("hotel", checked as boolean)}
              />
              <Label htmlFor="hotel">Hotel</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="offices"
                checked={formData.amenities?.offices ?? false}
                onCheckedChange={(checked) => handleAmenityChange("offices", checked as boolean)}
              />
              <Label htmlFor="offices">Offices</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="residential"
                checked={formData.amenities?.residential ?? false}
                onCheckedChange={(checked) => handleAmenityChange("residential", checked as boolean)}
              />
              <Label htmlFor="residential">Residential</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mosque"
                checked={formData.amenities?.mosque ?? false}
                onCheckedChange={(checked) => handleAmenityChange("mosque", checked as boolean)}
              />
              <Label htmlFor="mosque">Mosque</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="clinic"
                checked={formData.amenities?.clinic ?? false}
                onCheckedChange={(checked) => handleAmenityChange("clinic", checked as boolean)}
              />
              <Label htmlFor="clinic">Clinic</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="bankingServices"
                checked={formData.amenities?.bankingServices ?? false}
                onCheckedChange={(checked) => handleAmenityChange("bankingServices", checked as boolean)}
              />
              <Label htmlFor="bankingServices">Banking Services</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="vip_lounges"
                checked={formData.amenities?.vip_lounges ?? false}
                onCheckedChange={(checked) => handleAmenityChange("vip_lounges", checked as boolean)}
              />
              <Label htmlFor="vip_lounges">VIP Lounges</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="nursery"
                checked={formData.amenities?.nursery ?? false}
                onCheckedChange={(checked) => handleAmenityChange("nursery", checked as boolean)}
              />
              <Label htmlFor="nursery">Nursery</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {(formData.features || []).map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    value={feature}
                    onChange={(e) => handleFeatureChange(index, e.target.value)}
                    placeholder={`Feature ${index + 1}`}
                    maxLength={200}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveFeature(index)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={handleAddFeature}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Feature
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Developer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <ValidatedInput
              label="Developer Name"
              field="developer.name"
              value={formData.developer?.name ?? ""}
              onChange={(value) => onInputChange("developer.name", value)}
              placeholder="e.g., Emaar Properties"
              required
              maxLength={100}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
            />
            <ValidatedInput
              label="Developer Slug"
              field="developer.slug"
              value={formData.developer?.slug ?? ""}
              onChange={(value) => onInputChange("developer.slug", value)}
              placeholder="e.g., emaar-properties"
              required
              maxLength={100}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
            />
          </div>

          <ValidatedInput
            label="Established Year"
            field="developer.established"
            value={formData.developer?.established ?? new Date().getFullYear()}
            onChange={(value) => onInputChange("developer.established", value)}
            type="number"
            min={1900}
            max={new Date().getFullYear()}
            formData={formData}
            errors={errors}
            setErrors={setErrors}
          />

          <div className="space-y-3">
            <Label>Portfolio (Other Developments)</Label>
            {(formData.developer?.portfolio || []).map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    value={item}
                    onChange={(e) => handlePortfolioItemChange(index, e.target.value)}
                    placeholder={`Development ${index + 1}`}
                    maxLength={100}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemovePortfolioItem(index)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={handleAddPortfolioItem}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Portfolio Item
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mall Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <ValidatedInput
              label="Year Built"
              field="yearBuilt"
              value={formData.yearBuilt ?? new Date().getFullYear()}
              onChange={(value) => onInputChange("yearBuilt", value)}
              type="number"
              min={1900}
              max={new Date().getFullYear() + 10}
              required
              formData={formData}
              errors={errors}
              setErrors={setErrors}
            />
            <ValidatedInput
              label="Year Opened"
              field="yearOpened"
              value={formData.yearOpened ?? new Date().getFullYear()}
              onChange={(value) => onInputChange("yearOpened", value)}
              type="number"
              min={1900}
              max={new Date().getFullYear() + 10}
              required
              formData={formData}
              errors={errors}
              setErrors={setErrors}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ValidatedInput
              label="Rating (1-5)"
              field="rating"
              value={formData.rating ?? 5}
              onChange={(value) => onInputChange("rating", value)}
              type="number"
              min={1}
              max={5}
              step={0.1}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
            />
            <ValidatedInput
              label="Annual Visitors"
              field="visitorsAnnually"
              value={formData.visitorsAnnually ?? 0}
              onChange={(value) => onInputChange("visitorsAnnually", value)}
              type="number"
              min={0}
              placeholder="0"
              formData={formData}
              errors={errors}
              setErrors={setErrors}
            />
          </div>

          <ValidatedTextarea
            label="Architecture Description"
            field="architecture"
            value={formData.architecture ?? ""}
            onChange={(value) => onInputChange("architecture", value)}
            placeholder="Describe the architectural style and design..."
            required
            maxLength={500}
            rows={3}
            formData={formData}
            errors={errors}
            setErrors={setErrors}
          />
        </CardContent>
      </Card>
    </div>
  )
}