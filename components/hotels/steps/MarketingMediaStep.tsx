// components/hotels/steps/MarketingMediaStep.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Plus, X, Image, FileText, Phone, Mail, Globe, Instagram, 
  Facebook, Twitter, Youtube, AlertCircle, Upload, ExternalLink,
  MapPin, Building, User
} from "lucide-react"
import { ValidatedInput } from "../ValidatedInput"
import { ValidatedTextarea } from "../ValidatedTextarea"
import { InstantImageUpload } from "@/components/ui/instant-image-upload"
import type { HotelFormData } from "@/types/hotels"
import type { UploadedImage } from "@/components/ui/instant-image-upload"

interface MarketingMediaStepProps {
  formData: HotelFormData
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  onInputChange: (field: string, value: any) => void
  mode: "add" | "edit"
}

export function MarketingMediaStep({
  formData,
  errors,
  setErrors,
  onInputChange,
  mode
}: MarketingMediaStepProps) {
  const [newFloorPlan, setNewFloorPlan] = useState("")

  // Handle floor plan (single URL)
  const updateFloorPlan = () => {
    if (newFloorPlan.trim() && isValidUrl(newFloorPlan)) {
      onInputChange('floorPlan', newFloorPlan.trim())
      setNewFloorPlan("")
    }
  }

  const clearFloorPlan = () => {
    onInputChange('floorPlan', '')
  }

  // URL validation helper
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return url.startsWith('http://') || url.startsWith('https://')
    } catch {
      return false
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="images" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="images" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Images
          </TabsTrigger>
          <TabsTrigger value="marketing" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Marketing Materials
          </TabsTrigger>
        </TabsList>

        {/* Images Tab */}
        <TabsContent value="images" className="space-y-4">
          {/* Main Image */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Main Hotel Image
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InstantImageUpload
                mode="single"
                projectTitle={formData.name || "hotel"}
                imageType="cover"
                existingImages={formData.mainImage}
                editMode={mode === "edit"}
                title="Main Hotel Image"
                description="Primary hotel image displayed on listings and cards. Recommended: 1920x1080px or larger, landscape orientation."
                onUploadComplete={(result) => {
                  if (Array.isArray(result)) {
                    onInputChange('mainImage', result[0]?.url || '')
                  } else {
                    onInputChange('mainImage', result.url)
                  }
                }}
                onDelete={() => {
                  onInputChange('mainImage', '')
                }}
                onError={(error) => {
                  console.error('Main image upload error:', error)
                }}
                maxSize={10}
                acceptedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
              />
            </CardContent>
          </Card>

          {/* Gallery */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Image Gallery ({(formData.gallery || []).length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InstantImageUpload
                mode="multiple"
                maxFiles={20}
                projectTitle={formData.name || "hotel"}
                imageType="gallery"
                existingImages={formData.gallery}
                editMode={mode === "edit"}
                title="Hotel Gallery Images"
                description="Additional images showcasing the hotel. Recommended: 1200x800px or larger. You can upload multiple images at once."
                onUploadComplete={(result) => {
                  if (Array.isArray(result)) {
                    // Multiple images uploaded
                    const newUrls = result.map(img => img.url)
                    const currentGallery = formData.gallery || []
                    onInputChange('gallery', [...currentGallery, ...newUrls])
                  } else {
                    // Single image uploaded
                    const currentGallery = formData.gallery || []
                    onInputChange('gallery', [...currentGallery, result.url])
                  }
                }}
                onDelete={(imageUrl) => {
                  const currentGallery = formData.gallery || []
                  const updatedGallery = currentGallery.filter(url => url !== imageUrl)
                  onInputChange('gallery', updatedGallery)
                }}
                onError={(error) => {
                  console.error('Gallery image upload error:', error)
                }}
                maxSize={8}
                acceptedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
              />
            </CardContent>
          </Card>

          {/* Floor Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Floor Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!formData.floorPlan ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://example.com/floor-plan.pdf"
                      value={newFloorPlan}
                      onChange={(e) => setNewFloorPlan(e.target.value)}
                      className={newFloorPlan && !isValidUrl(newFloorPlan) ? 'border-red-500' : ''}
                    />
                    <Button 
                      onClick={updateFloorPlan}
                      disabled={!newFloorPlan.trim() || !isValidUrl(newFloorPlan)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No floor plan added yet</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium">Floor Plan</span>
                      <a
                        href={formData.floorPlan}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFloorPlan}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Marketing Tab */}
        <TabsContent value="marketing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Marketing Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <ValidatedInput
                  label="Brochure URL"
                  field="marketingMaterials.brochure"
                  value={formData.marketingMaterials?.brochure || ""}
                  onChange={(value) => onInputChange('marketingMaterials.brochure', value)}
                  formData={formData}
                  errors={errors}
                  setErrors={setErrors}
                  placeholder="https://example.com/hotel-brochure.pdf"
                  type="url"
                  description="Link to hotel brochure PDF"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ValidatedInput
                  label="Virtual Tour URL"
                  field="marketingMaterials.virtualTour3D"
                  value={formData.marketingMaterials?.virtualTour3D || ""}
                  onChange={(value) => onInputChange('marketingMaterials.virtualTour3D', value)}
                  formData={formData}
                  errors={errors}
                  setErrors={setErrors}
                  placeholder="https://example.com/virtual-tour"
                  type="url"
                  description="360° virtual tour link"
                />
                
                <ValidatedInput
                  label="Video Tour URL"
                  field="marketingMaterials.videoTour"
                  value={formData.marketingMaterials?.videoTour || ""}
                  onChange={(value) => onInputChange('marketingMaterials.videoTour', value)}
                  formData={formData}
                  errors={errors}
                  setErrors={setErrors}
                  placeholder="https://youtube.com/watch?v=..."
                  type="url"
                  description="Hotel promotional video"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Validation Status */}
      {!formData.mainImage && (
        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>A main hotel image is required to continue.</span>
        </div>
      )}
    </div>
  )
}
