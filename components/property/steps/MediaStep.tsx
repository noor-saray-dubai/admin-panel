// components/property/steps/MediaStep.tsx
"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera } from "lucide-react"
import type { PropertyFormData, PropertyStepProps } from "@/types/properties"
import { InstantImageUpload, UploadedImage } from "@/components/ui/instant-image-upload"

export function MediaStep({ formData, errors, setErrors, onInputChange }: PropertyStepProps) {
  
  const handleCoverImageUpload = (result: UploadedImage | UploadedImage[]) => {
    // For single mode, result should be a single UploadedImage, but handle both cases
    if (Array.isArray(result)) {
      // If somehow an array is passed, use the first image
      onInputChange('coverImage', result[0]?.url || '')
    } else {
      // Normal case: single image
      onInputChange('coverImage', result.url)
    }
  }

  const handleCoverImageDelete = (imageUrl: string) => {
    onInputChange('coverImage', '')
  }

  const handleGalleryUpload = (result: UploadedImage | UploadedImage[]) => {
    // For multiple mode, result should be an array, but handle both cases
    if (Array.isArray(result)) {
      // Normal case: array of images
      const newUrls = result.map(img => img.url)
      onInputChange('gallery', [...formData.gallery, ...newUrls])
    } else {
      // If somehow a single image is passed, treat it as an array with one item
      onInputChange('gallery', [...formData.gallery, result.url])
    }
  }

  const handleGalleryDelete = (imageUrl: string) => {
    const updatedGallery = formData.gallery.filter((url: string) => url !== imageUrl)
    onInputChange('gallery', updatedGallery)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-4">
        <Camera className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Images & Media</h2>
      </div>

      {/* Cover Image Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Cover Image</CardTitle>
        </CardHeader>
        <CardContent>
          <InstantImageUpload
            mode="single"
            projectTitle={formData.name || 'New Property'}
            imageType="cover"
            existingImages={formData.coverImage}
            title="Upload Cover Image"
            description="Upload a high-quality cover image for your property. Landscape orientation works best."
            onUploadComplete={handleCoverImageUpload}
            onDelete={handleCoverImageDelete}
            className="w-full"
            maxSize={10}
          />
          {errors.coverImage && (
            <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
              <span>⚠️</span> {errors.coverImage}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Gallery Images Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Gallery Images</CardTitle>
        </CardHeader>
        <CardContent>
          <InstantImageUpload
            mode="multiple"
            maxFiles={10}
            projectTitle={formData.name || 'New Property'}
            imageType="gallery"
            existingImages={formData.gallery}
            title="Upload Gallery Images"
            description="Upload multiple images to showcase your property. You can upload up to 10 high-quality images."
            onUploadComplete={handleGalleryUpload}
            onDelete={handleGalleryDelete}
            className="w-full"
            maxSize={10}
          />
          {errors.gallery && (
            <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
              <span>⚠️</span> {errors.gallery}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}