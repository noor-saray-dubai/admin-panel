"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { AlertCircle, Eye } from "lucide-react"

interface BlogFormData {
  status: "Published" | "Draft"
  publishDate: string // Still exists but handled automatically
  featured: boolean
  // ... other fields for preview
  title: string
  excerpt: string
  author: string
  category: string
  tags: string[]
  contentBlocks: any[]
  featuredImage: File | null
}

interface FieldErrors {
  [key: string]: string
}

interface PublishingStepProps {
  formData: BlogFormData
  errors: FieldErrors
  onFieldChange: (field: keyof BlogFormData, value: any) => void
  apiError: string
  isFormValid: () => boolean
  fillFakeData: () => void
  isSubmitting: boolean
  // This will be the existing BlogPreview component
  BlogPreview?: React.ComponentType<any>
}

export function PublishingStep({ 
  formData,
  errors,
  onFieldChange,
  apiError,
  isFormValid,
  fillFakeData,
  isSubmitting,
  BlogPreview
}: PublishingStepProps) {
  return (
    <div className="space-y-6">
      {/* Publishing Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Publishing Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => {
                  onFieldChange("status", value)
                  // Auto-set publish date when status changes to Published
                  if (value === "Published") {
                    const now = new Date().toISOString().slice(0, 16)
                    onFieldChange("publishDate", now)
                  }
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Published">Published</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-xs text-gray-500 mt-1">
                {formData.status === "Published" 
                  ? "Will be published immediately" 
                  : "Saved as draft"
                }
              </div>
            </div>

            <div>
              <Label className="text-sm text-gray-600">Publish Date</Label>
              <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600">
                {formData.status === "Published" 
                  ? new Date().toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : "Not published yet"
                }
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                checked={formData.featured}
                onCheckedChange={(checked) => onFieldChange("featured", checked as boolean)}
              />
              <Label>Featured Blog Post</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blog Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Final Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            {BlogPreview && <BlogPreview formData={formData} />}
          </div>
        </CardContent>
      </Card>

      {/* API Error Display */}
      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-800 mb-1">Server Error:</h4>
              <p className="text-red-700 text-sm">{apiError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Development Helper */}
      <div className="flex gap-2 justify-start pt-4 border-t">
        <Button variant="outline" onClick={fillFakeData} disabled={isSubmitting}>
          Fill Test Data
        </Button>
      </div>
    </div>
  )
}