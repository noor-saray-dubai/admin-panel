// components/mall/steps/MarketingMediaStep.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ValidatedInput } from "../ValidatedInput"
import { ValidatedTextarea } from "../ValidatedTextarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { InstantImageUpload, type UploadedImage } from "@/components/ui/instant-image-upload"
import { Plus, Minus } from "lucide-react"
import { useState } from "react"
import type { MallFormData } from "@/types/mall"

interface MarketingMediaStepProps {
  formData: MallFormData
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  onInputChange: (field: string, value: any) => void
  mode: "add" | "edit"
}

export function MarketingMediaStep({ formData, errors, setErrors, onInputChange, mode }: MarketingMediaStepProps) {
  const [showGallery, setShowGallery] = useState(false)
  const [showFloorPlan, setShowFloorPlan] = useState(false)
  
  const handleAddInvestmentHighlight = () => {
    const currentHighlights = formData.marketingMaterials?.investmentHighlights || []
    onInputChange("marketingMaterials.investmentHighlights", [...currentHighlights, ""])
  }

  const handleRemoveInvestmentHighlight = (index: number) => {
    const currentHighlights = formData.marketingMaterials?.investmentHighlights || []
    const newHighlights = currentHighlights.filter((_, i) => i !== index)
    onInputChange("marketingMaterials.investmentHighlights", newHighlights)
  }

  const handleInvestmentHighlightChange = (index: number, value: string) => {
    const currentHighlights = formData.marketingMaterials?.investmentHighlights || []
    const newHighlights = [...currentHighlights]
    newHighlights[index] = value
    onInputChange("marketingMaterials.investmentHighlights", newHighlights)
  }

  const handleAddSellingPoint = () => {
    const currentPoints = formData.marketingMaterials?.keySellingPoints || []
    onInputChange("marketingMaterials.keySellingPoints", [...currentPoints, ""])
  }

  const handleRemoveSellingPoint = (index: number) => {
    const currentPoints = formData.marketingMaterials?.keySellingPoints || []
    const newPoints = currentPoints.filter((_, i) => i !== index)
    onInputChange("marketingMaterials.keySellingPoints", newPoints)
  }

  const handleSellingPointChange = (index: number, value: string) => {
    const currentPoints = formData.marketingMaterials?.keySellingPoints || []
    const newPoints = [...currentPoints]
    newPoints[index] = value
    onInputChange("marketingMaterials.keySellingPoints", newPoints)
  }

  // Handle main image upload
  const handleMainImageComplete = (result: UploadedImage | UploadedImage[]) => {
    const uploadedImage = result as UploadedImage
    onInputChange("image", uploadedImage.url)
  }

  // Handle gallery images upload
  const handleGalleryImageComplete = (result: UploadedImage | UploadedImage[]) => {
    const uploadedImages = Array.isArray(result) ? result : [result]
    const newUrls = uploadedImages.map(img => img.url)
    const currentGallery = formData.gallery || []
    onInputChange("gallery", [...currentGallery, ...newUrls])
  }

  // Handle floor plan upload
  const handleFloorPlanComplete = (result: UploadedImage | UploadedImage[]) => {
    const uploadedImage = result as UploadedImage
    onInputChange("floorPlan", uploadedImage.url)
  }

  // Handle image deletion
  const handleImageDelete = (imageUrl: string) => {
    if (formData.image === imageUrl) {
      onInputChange("image", "")
    } else if (formData.floorPlan === imageUrl) {
      onInputChange("floorPlan", "")
    } else if (formData.gallery?.includes(imageUrl)) {
      onInputChange("gallery", formData.gallery.filter(url => url !== imageUrl))
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Main Mall Image <span className="text-red-500">*</span></CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InstantImageUpload
            key={`main-image-${formData.image}`}
            mode="single"
            projectTitle={formData.name || "Mall"}
            imageType="cover"
            existingImages={formData.image}
            editMode={mode === "edit"}
            onUploadComplete={handleMainImageComplete}
            onDelete={handleImageDelete}
            title="Main Mall Image"
            description="Required: Upload the primary image that will represent this mall"
            maxSize={10}
            acceptedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gallery Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Label className="text-sm font-medium">Do you want to upload gallery images?</Label>
            </div>
            <RadioGroup
              value={showGallery ? "yes" : "no"}
              onValueChange={(value) => setShowGallery(value === "yes")}
              className="flex items-center space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="gallery-no" />
                <Label htmlFor="gallery-no" className="text-sm">No (Skip gallery)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="gallery-yes" />
                <Label htmlFor="gallery-yes" className="text-sm">Yes (Upload gallery images)</Label>
              </div>
            </RadioGroup>
          </div>
          
          {showGallery && (
            <div className="pt-4 border-t">
              <InstantImageUpload
                mode="multiple"
                maxFiles={20}
                projectTitle={formData.name || "Mall"}
                imageType="gallery"
                existingImages={formData.gallery}
                editMode={mode === "edit"}
                onUploadComplete={handleGalleryImageComplete}
                onDelete={handleImageDelete}
                title="Mall Gallery"
                description="Upload multiple images showcasing different areas of the mall"
                maxSize={10}
                acceptedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Floor Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Label className="text-sm font-medium">Do you want to upload a floor plan?</Label>
            </div>
            <RadioGroup
              value={showFloorPlan ? "yes" : "no"}
              onValueChange={(value) => setShowFloorPlan(value === "yes")}
              className="flex items-center space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="floorplan-no" />
                <Label htmlFor="floorplan-no" className="text-sm">No (Skip floor plan)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="floorplan-yes" />
                <Label htmlFor="floorplan-yes" className="text-sm">Yes (Upload floor plan)</Label>
              </div>
            </RadioGroup>
          </div>
          
          {showFloorPlan && (
            <div className="pt-4 border-t">
              <InstantImageUpload
                mode="single"
                projectTitle={formData.name || "Mall"}
                imageType="cover"
                existingImages={formData.floorPlan}
                editMode={mode === "edit"}
                onUploadComplete={handleFloorPlanComplete}
                onDelete={handleImageDelete}
                title="Floor Plan"
                description="Upload the mall floor plan or layout diagram"
                maxSize={10}
                acceptedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']}
              />
            </div>
          )}
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle>Investment Highlights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {(formData.marketingMaterials?.investmentHighlights || []).map((highlight, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    value={highlight}
                    onChange={(e) => handleInvestmentHighlightChange(index, e.target.value)}
                    placeholder={`Investment highlight ${index + 1}`}
                    maxLength={200}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveInvestmentHighlight(index)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={handleAddInvestmentHighlight}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Investment Highlight
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key Selling Points</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {(formData.marketingMaterials?.keySellingPoints || []).map((point, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    value={point}
                    onChange={(e) => handleSellingPointChange(index, e.target.value)}
                    placeholder={`Key selling point ${index + 1}`}
                    maxLength={200}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveSellingPoint(index)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={handleAddSellingPoint}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Selling Point
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Investor Relations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <ValidatedInput
              label="Broker Name"
              field="investorRelations.brokerContact.name"
              value={formData.investorRelations?.brokerContact?.name ?? ""}
              onChange={(value) => onInputChange("investorRelations.brokerContact.name", value)}
              placeholder="John Smith"
              maxLength={100}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
            />
            <ValidatedInput
              label="Broker Company"
              field="investorRelations.brokerContact.company"
              value={formData.investorRelations?.brokerContact?.company ?? ""}
              onChange={(value) => onInputChange("investorRelations.brokerContact.company", value)}
              placeholder="ABC Realty"
              maxLength={100}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ValidatedInput
              label="Broker Phone"
              field="investorRelations.brokerContact.phone"
              value={formData.investorRelations?.brokerContact?.phone ?? ""}
              onChange={(value) => onInputChange("investorRelations.brokerContact.phone", value)}
              placeholder="+971 50 123 4567"
              maxLength={50}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
            />
            <ValidatedInput
              label="Broker Email"
              field="investorRelations.brokerContact.email"
              value={formData.investorRelations?.brokerContact?.email ?? ""}
              onChange={(value) => onInputChange("investorRelations.brokerContact.email", value)}
              type="email"
              placeholder="broker@company.com"
              maxLength={100}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
            />
          </div>

          <ValidatedInput
            label="Data Room Access URL"
            field="investorRelations.dataRoomAccessUrl"
            value={formData.investorRelations?.dataRoomAccessUrl ?? ""}
            onChange={(value) => onInputChange("investorRelations.dataRoomAccessUrl", value)}
            placeholder="https://dataroom.company.com/mall123"
            maxLength={500}
            formData={formData}
            errors={errors}
            setErrors={setErrors}
          />

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="ndaRequired"
              checked={formData.investorRelations?.ndaRequired ?? false}
              onChange={(e) => onInputChange("investorRelations.ndaRequired", e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="ndaRequired">NDA Required for Access</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}