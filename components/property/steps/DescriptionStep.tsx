// components/property/steps/DescriptionStep.tsx
"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, FileText, MessageSquare, Lightbulb } from "lucide-react"
import type { PropertyFormData, PropertyStepProps } from "@/types/properties"

export function DescriptionStep({ formData, errors, setErrors, onInputChange }: PropertyStepProps) {
  const handleFieldChange = (field: keyof PropertyFormData, value: any) => {
    onInputChange(field, value)
    
    // Clear field error when user starts typing
    if (errors[field]) {
      const newErrors = { ...errors }
      delete newErrors[field]
      setErrors(newErrors)
    }
  }

  const descriptionWordCount = formData.description.trim().split(/\s+/).filter((word: string) => word.length > 0).length
  const overviewWordCount = formData.overview.trim().split(/\s+/).filter((word: string) => word.length > 0).length

  return (
    <div className="space-y-6">
      {/* Main Description */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Property Description
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="description" className="text-sm font-medium">
                Main Description *
              </Label>
              <span className={`text-xs ${descriptionWordCount < 25 ? 'text-red-500' : 'text-gray-500'}`}>
                {descriptionWordCount} words (minimum 25)
              </span>
            </div>
            <Textarea
              id="description"
              placeholder="Enter a comprehensive description of the property. Include key features, location benefits, amenities, and what makes this property special. Be specific about room layouts, views, nearby landmarks, and unique selling points."
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              className={errors.description ? 'border-red-500 focus-visible:ring-red-500' : ''}
              rows={6}
            />
            {errors.description && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.description}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Overview/Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            Property Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="overview" className="text-sm font-medium">
                Brief Overview *
              </Label>
              <span className={`text-xs ${overviewWordCount < 25 ? 'text-red-500' : 'text-gray-500'}`}>
                {overviewWordCount} words (minimum 25)
              </span>
            </div>
            <Textarea
              id="overview"
              placeholder="A concise overview highlighting the key features and benefits of this property in 1-2 sentences."
              value={formData.overview}
              onChange={(e) => handleFieldChange('overview', e.target.value)}
              className={errors.overview ? 'border-red-500 focus-visible:ring-red-500' : ''}
              rows={3}
            />
            {errors.overview && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.overview}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}