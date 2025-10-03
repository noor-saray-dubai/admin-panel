// components/project/steps/DetailsOverviewStep.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus, X, Calendar } from "lucide-react"
import type { ProjectFormData } from "@/types/projects"
import { ValidatedInput } from "../ValidatedInput"
import { ValidatedTextarea } from "../ValidatedTextarea"
import { useState } from "react"

interface DetailsOverviewStepProps {
  formData: ProjectFormData
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  onInputChange: (field: string, value: any) => void
}

export function DetailsOverviewStep({ 
  formData, 
  errors, 
  setErrors, 
  onInputChange 
}: DetailsOverviewStepProps) {
  
  const [newCategory, setNewCategory] = useState("")

  const addCategory = () => {
    if (newCategory.trim() && !formData.categories.includes(newCategory.trim())) {
      onInputChange('categories', [...formData.categories, newCategory.trim()])
      setNewCategory("")
    }
  }

  const removeCategory = (index: number) => {
    const newCategories = formData.categories.filter((_, i) => i !== index)
    onInputChange('categories', newCategories)
  }

  const addFeature = () => {
    onInputChange('features', [...formData.features, ""])
  }

  const removeFeature = (index: number) => {
    const newFeatures = formData.features.filter((_, i) => i !== index)
    onInputChange('features', newFeatures)
  }

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features]
    newFeatures[index] = value
    onInputChange('features', newFeatures)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-4">
        <FileText className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Details & Overview</h2>
      </div>

      {/* Project Description */}
      <Card>
        <CardHeader>
          <CardTitle>Project Description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ValidatedTextarea
            label="Overview"
            field="overview"
            value={formData.overview}
            onChange={(value) => onInputChange('overview', value)}
            formData={formData}
            errors={errors}
            setErrors={setErrors}
            required={true}
            maxLength={5000}
            minLength={100}
            placeholder="Enter a comprehensive project overview highlighting key features, location advantages, and investment potential..."
            rows={4}
          />

          <ValidatedTextarea
            label="Detailed Description"
            field="description"
            value={formData.description}
            onChange={(value) => onInputChange('description', value)}
            formData={formData}
            errors={errors}
            setErrors={setErrors}
            required={true}
            maxLength={2000}
            minLength={50}
            placeholder="Provide detailed description of the project including architecture, design, amenities, and unique selling points..."
            rows={6}
          />
        </CardContent>
      </Card>

      {/* Project Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Project Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="launchDate">Launch Date *</Label>
              <Input
                id="launchDate"
                type="date"
                value={formData.launchDate}
                onChange={(e) => onInputChange('launchDate', e.target.value)}
                className={`mt-1 ${errors.launchDate ? 'border-red-500' : formData.launchDate ? 'border-green-500' : ''} ${!formData.launchDate ? 'bg-red-50 border-red-200' : ''}`}
              />
              {errors.launchDate && (
                <span className="text-red-500 text-xs mt-1 block">{errors.launchDate}</span>
              )}
            </div>
            
            <div>
              <Label htmlFor="completionDate">Completion Date *</Label>
              <Input
                id="completionDate"
                type="date"
                value={formData.completionDate}
                onChange={(e) => onInputChange('completionDate', e.target.value)}
                className={`mt-1 ${errors.completionDate ? 'border-red-500' : formData.completionDate ? 'border-green-500' : ''} ${!formData.completionDate ? 'bg-red-50 border-red-200' : ''}`}
              />
              {errors.completionDate && (
                <span className="text-red-500 text-xs mt-1 block">{errors.completionDate}</span>
              )}
            </div>
          </div>
          
          <ValidatedInput
            label="Total Units"
            field="totalUnits"
            value={formData.totalUnits?.toString() || ''}
            onChange={(value) => onInputChange('totalUnits', Number(value) || 0)}
            formData={formData}
            errors={errors}
            setErrors={setErrors}
            required={true}
            min={1}
            max={10000}
            type="number"
            placeholder="250"
          />
        </CardContent>
      </Card>

      {/* Project Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Project Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add a category (e.g., Luxury, Waterfront, Modern)"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCategory()}
              className="flex-1"
            />
            <Button type="button" onClick={addCategory} disabled={!newCategory.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {formData.categories.map((category, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {category}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => removeCategory(index)}
                />
              </Badge>
            ))}
          </div>

          {formData.categories.length === 0 && (
            <p className="text-sm text-gray-500">
              Add categories to help classify your project (e.g., Luxury, Waterfront, High-Rise, Modern)
            </p>
          )}
        </CardContent>
      </Card>

      {/* Key Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Key Features
            <Button type="button" onClick={addFeature} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Feature
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {formData.features.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p>No features added yet.</p>
              <Button type="button" onClick={addFeature} size="sm" className="mt-2">
                <Plus className="h-4 w-4 mr-1" />
                Add First Feature
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.features.map((feature, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <div className="flex-1">
                    <ValidatedInput
                      label={`Feature ${index + 1}`}
                      field={`feature_${index}`}
                      value={feature}
                      onChange={(value: string | number) => updateFeature(index, value as string)}
                      formData={formData}
                      errors={errors}
                      setErrors={setErrors}
                      required={true}
                      maxLength={200}
                      minLength={3}
                      placeholder="e.g., Smart home automation, Premium finishes, 24/7 concierge"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeFeature(index)}
                    className="mt-6"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Summary */}
      {(formData.overview || formData.description || formData.categories.length > 0 || formData.features.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Content Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="font-medium">Overview</Label>
                <p className="text-gray-600 mt-1">
                  {formData.overview ? `${formData.overview.length} characters` : 'Not provided'}
                </p>
              </div>
              
              <div>
                <Label className="font-medium">Description</Label>
                <p className="text-gray-600 mt-1">
                  {formData.description ? `${formData.description.length} characters` : 'Not provided'}
                </p>
              </div>
              
              <div>
                <Label className="font-medium">Categories</Label>
                <p className="text-gray-600 mt-1">
                  {formData.categories.length} categories
                </p>
              </div>
              
              <div>
                <Label className="font-medium">Key Features</Label>
                <p className="text-gray-600 mt-1">
                  {formData.features.length} features
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}