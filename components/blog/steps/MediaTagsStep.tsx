"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface BlogFormData {
  featuredImage: File | null
  tags: string[]
  // ... other fields
}

interface FieldErrors {
  [key: string]: string
}

interface MediaTagsStepProps {
  formData: BlogFormData
  errors: FieldErrors
  onFieldChange: (field: keyof BlogFormData, value: any) => void
  mode: "add" | "edit"
  featuredImagePreview: string | null
  tagInput: string
  setTagInput: (value: string) => void
  addTag: () => void
  removeTag: (tag: string) => void
  handleTagKeyPress: (e: React.KeyboardEvent) => void
  handleFeaturedImageUpload: (file: File) => void
  removeFeaturedImage: () => void
  // This will be the existing ImageUpload component
  ImageUpload?: React.ComponentType<any>
}

export function MediaTagsStep({ 
  formData,
  errors,
  onFieldChange,
  mode,
  featuredImagePreview,
  tagInput,
  setTagInput,
  addTag,
  removeTag,
  handleTagKeyPress,
  handleFeaturedImageUpload,
  removeFeaturedImage,
  ImageUpload
}: MediaTagsStepProps) {
  return (
    <div className="space-y-6">
      {/* Featured Image */}
      <Card>
        <CardHeader>
          <CardTitle>
            Featured Image {mode === 'add' ? <span className="text-red-500">*</span> : '(Optional - leave blank to keep existing)'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ImageUpload && (
            <ImageUpload
              file={formData.featuredImage}
              url={featuredImagePreview}
              onChange={handleFeaturedImageUpload}
              onRemove={removeFeaturedImage}
              label="Featured Image"
              required={mode === 'add'}
              error={errors.featuredImage}
            />
          )}
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleTagKeyPress}
              placeholder="Add a tag and press Enter"
              className="flex-1"
            />
            <Button type="button" onClick={addTag}>
              Add Tag
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag, index) => (
              <div key={index} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}