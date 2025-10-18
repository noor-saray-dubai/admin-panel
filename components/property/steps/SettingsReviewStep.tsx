// components/property/steps/SettingsReviewStep.tsx
"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  AlertCircle, Settings, Eye, Star, Award, DollarSign, 
  CheckCircle, XCircle, Plus, X, CreditCard, Calendar, Waves 
} from "lucide-react"
import type { PropertyFormData, PropertyStepProps, StepValidationStatus } from "@/types/properties"

interface SettingsReviewStepProps extends PropertyStepProps {
  validationStatus: StepValidationStatus
}

export function SettingsReviewStep({ 
  formData, 
  errors, 
  setErrors, 
  onInputChange, 
  validationStatus 
}: SettingsReviewStepProps) {
  const [newTag, setNewTag] = React.useState("")

  const handleFieldChange = (field: keyof PropertyFormData, value: any) => {
    onInputChange(field, value)
    
    // Clear field error when user starts typing
    if (errors[field]) {
      const newErrors = { ...errors }
      delete newErrors[field]
      setErrors(newErrors)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      const newTags = [...formData.tags, newTag.trim()]
      handleFieldChange('tags', newTags)
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    const newTags = formData.tags.filter((tag: string) => tag !== tagToRemove)
    handleFieldChange('tags', newTags)
  }

  const toggleWaterfrontTag = () => {
    const isWaterfront = formData.tags.includes('waterfront')
    if (isWaterfront) {
      // Remove waterfront tag
      const newTags = formData.tags.filter((tag: string) => tag !== 'waterfront')
      handleFieldChange('tags', newTags)
    } else {
      // Add waterfront tag
      const newTags = [...formData.tags, 'waterfront']
      handleFieldChange('tags', newTags)
    }
  }

  const toggleFlag = (flag: keyof PropertyFormData['flags']) => {
    const newFlags = { ...formData.flags, [flag]: !formData.flags[flag] }
    handleFieldChange('flags', newFlags)
  }

  const addPaymentPlanMilestone = () => {
    // Get the last milestone to prefill the new one
    const existingMilestones = formData.paymentPlan.construction
    const lastMilestone = existingMilestones.length > 0 ? existingMilestones[existingMilestones.length - 1] : null
    
    // Create new milestone with prefilled values from the last milestone (if exists)
    const newMilestone = {
      milestone: lastMilestone ? lastMilestone.milestone : '',
      percentage: lastMilestone ? lastMilestone.percentage : ''
    }
    
    const newMilestones = [...existingMilestones, newMilestone]
    handleFieldChange('paymentPlan', { ...formData.paymentPlan, construction: newMilestones })
  }

  const removePaymentPlanMilestone = (index: number) => {
    const newMilestones = formData.paymentPlan.construction.filter((_: any, i: number) => i !== index)
    handleFieldChange('paymentPlan', { ...formData.paymentPlan, construction: newMilestones })
  }

  const updatePaymentPlanMilestone = (index: number, field: 'milestone' | 'percentage', value: string) => {
    const newMilestones = formData.paymentPlan.construction.map((item: any, i: number) => 
      i === index ? { ...item, [field]: value } : item
    )
    handleFieldChange('paymentPlan', { ...formData.paymentPlan, construction: newMilestones })
  }

  const getValidationSummary = () => {
    const totalSteps = Object.keys(validationStatus).length
    const validSteps = Object.values(validationStatus).filter((status: any) => status.isValid).length
    const stepsWithErrors = Object.values(validationStatus).filter((status: any) => status.hasErrors).length
    
    return { totalSteps, validSteps, stepsWithErrors }
  }

  const { totalSteps, validSteps, stepsWithErrors } = getValidationSummary()

  return (
    <div className="space-y-6">
      {/* Form Validation Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Form Validation Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-700">{validSteps}</div>
              <div className="text-sm text-green-600">Valid Steps</div>
            </div>
            
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-700">{stepsWithErrors}</div>
              <div className="text-sm text-red-600">Steps with Errors</div>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-700">{Math.round((validSteps / totalSteps) * 100)}%</div>
              <div className="text-sm text-blue-600">Completion</div>
            </div>
          </div>

          {stepsWithErrors > 0 && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Action Required</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Please review and fix the errors in the highlighted steps before submitting.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Property Flags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-600" />
            Property Flags
          </CardTitle>
          <CardDescription>
            Special designations and features for the property
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Elite Flag */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-purple-600" />
                <div>
                  <Label className="text-sm font-medium">Elite Property</Label>
                  <p className="text-xs text-gray-500">Premium luxury property</p>
                </div>
              </div>
              <Switch
                checked={formData.flags.elite}
                onCheckedChange={() => toggleFlag('elite')}
              />
            </div>

            {/* Exclusive Flag */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-600" />
                <div>
                  <Label className="text-sm font-medium">Exclusive Listing</Label>
                  <p className="text-xs text-gray-500">Available only through us</p>
                </div>
              </div>
              <Switch
                checked={formData.flags.exclusive}
                onCheckedChange={() => toggleFlag('exclusive')}
              />
            </div>

            {/* Featured Flag */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-600" />
                <div>
                  <Label className="text-sm font-medium">Featured Property</Label>
                  <p className="text-xs text-gray-500">Highlighted in listings</p>
                </div>
              </div>
              <Switch
                checked={formData.flags.featured}
                onCheckedChange={() => toggleFlag('featured')}
              />
            </div>

            {/* High Value Flag */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <div>
                  <Label className="text-sm font-medium">High Value</Label>
                  <p className="text-xs text-gray-500">Premium price range</p>
                </div>
              </div>
              <Switch
                checked={formData.flags.highValue}
                onCheckedChange={() => toggleFlag('highValue')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Property Tags</CardTitle>
          <CardDescription>
            Add custom tags for better categorization and search
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Waterfront Checkbox */}
          <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50 border-blue-200">
            <div className="flex items-center gap-2">
              <Waves className="h-4 w-4 text-blue-600" />
              <div>
                <Label className="text-sm font-medium">Waterfront Property</Label>
                <p className="text-xs text-gray-500">Property with water views or beach access</p>
              </div>
            </div>
            <Switch
              checked={formData.tags.includes('waterfront')}
              onCheckedChange={toggleWaterfrontTag}
            />
          </div>

          {/* Current Tags */}
          <div className="flex flex-wrap gap-2">
          {formData.tags.map((tag: string, index: number) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 text-red-500 hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          {/* Add Tag */}
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag (e.g., waterfront, new-build, investment)"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTag()
                }
              }}
            />
            <Button type="button" variant="outline" size="sm" onClick={addTag}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Plan (for primary market) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            Payment Plan
          </CardTitle>
          <CardDescription>
            Payment structure for off-plan or primary market properties
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enable Payment Plan */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label className="text-sm font-medium">Enable Payment Plan</Label>
              <p className="text-xs text-gray-500">For off-plan and primary market properties</p>
            </div>
            <Switch
              checked={formData.hasPaymentPlan}
              onCheckedChange={(checked) => handleFieldChange('hasPaymentPlan', checked)}
            />
          </div>

          {/* Payment Plan Details */}
          {formData.hasPaymentPlan && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Booking Amount */}
                <div className="space-y-2">
                  <Label htmlFor="booking" className="text-sm font-medium">
                    Booking Amount
                  </Label>
                  <Input
                    id="booking"
                    placeholder="e.g., 10%"
                    value={formData.paymentPlan.booking}
                    onChange={(e) => handleFieldChange('paymentPlan', { 
                      ...formData.paymentPlan, 
                      booking: e.target.value 
                    })}
                    className={errors['paymentPlan.booking'] ? 'border-red-500' : ''}
                  />
                  {errors['paymentPlan.booking'] && (
                    <div className="flex items-center gap-1 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {errors['paymentPlan.booking']}
                    </div>
                  )}
                </div>

                {/* Handover Amount */}
                <div className="space-y-2">
                  <Label htmlFor="handover" className="text-sm font-medium">
                    Handover Amount
                  </Label>
                  <Input
                    id="handover"
                    placeholder="e.g., 70%"
                    value={formData.paymentPlan.handover}
                    onChange={(e) => handleFieldChange('paymentPlan', { 
                      ...formData.paymentPlan, 
                      handover: e.target.value 
                    })}
                    className={errors['paymentPlan.handover'] ? 'border-red-500' : ''}
                  />
                  {errors['paymentPlan.handover'] && (
                    <div className="flex items-center gap-1 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {errors['paymentPlan.handover']}
                    </div>
                  )}
                </div>
              </div>

              {/* Construction Milestones */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Construction Milestones</Label>
                
                {formData.paymentPlan.construction.map((milestone: any, index: number) => (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Input
                        placeholder="Milestone name"
                        value={milestone.milestone}
                        onChange={(e) => updatePaymentPlanMilestone(index, 'milestone', e.target.value)}
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        placeholder="20%"
                        value={milestone.percentage}
                        onChange={(e) => updatePaymentPlanMilestone(index, 'percentage', e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removePaymentPlanMilestone(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPaymentPlanMilestone}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Milestone
                </Button>

                {errors['paymentPlan.construction'] && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {errors['paymentPlan.construction']}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Final Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-600" />
            Final Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Active Status */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label className="text-sm font-medium">Active Property</Label>
              <p className="text-xs text-gray-500">Property is visible and available</p>
            </div>
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) => handleFieldChange('isActive', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit Error */}
      {errors.submit && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Submission Error</p>
                <p className="text-sm text-red-700 mt-1">{errors.submit}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}