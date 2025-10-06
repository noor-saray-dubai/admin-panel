// components/project/steps/PricingPaymentStep.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DollarSign, Plus, Trash2, AlertCircle } from "lucide-react"
import type { ProjectFormData } from "@/types/projects"
import { ValidatedInput } from "../ValidatedInput"
import { ValidatedTextarea } from "../ValidatedTextarea"

interface PricingPaymentStepProps {
  formData: ProjectFormData
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  onInputChange: (field: string, value: any) => void
}

const CURRENCY_OPTIONS = [
  { value: "AED", label: "AED - UAE Dirham" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" }
]

export function PricingPaymentStep({ 
  formData, 
  errors, 
  setErrors, 
  onInputChange 
}: PricingPaymentStepProps) {

  const addConstructionMilestone = () => {
    const newConstruction = [...formData.paymentPlan.construction, { milestone: "", percentage: "" }]
    onInputChange('paymentPlan.construction', newConstruction)
  }

  const removeConstructionMilestone = (index: number) => {
    const newConstruction = formData.paymentPlan.construction.filter((_, i) => i !== index)
    onInputChange('paymentPlan.construction', newConstruction)
  }

  const updateConstructionMilestone = (index: number, field: 'milestone' | 'percentage', value: string | number) => {
    const newConstruction = [...formData.paymentPlan.construction]
    // Convert value to string since milestone and percentage fields are strings in the data model
    const stringValue = typeof value === 'number' ? value.toString() : value
    newConstruction[index] = { ...newConstruction[index], [field]: stringValue }
    onInputChange('paymentPlan.construction', newConstruction)
  }

  const calculateTotalPercentage = () => {
    return formData.paymentPlan.construction.reduce((total, milestone) => {
      const percentage = parseFloat(milestone.percentage.replace('%', '')) || 0
      return total + percentage
    }, 0)
  }

  const totalPercentage = calculateTotalPercentage()
  const isPercentageValid = totalPercentage <= 100

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-4">
        <DollarSign className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Pricing & Payment Plan</h2>
      </div>

      {/* Pricing Information */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <ValidatedInput
                label="Price Display Text (Auto-Generated)"
                field="price.total"
                value={formData.price.total}
                onChange={() => {}} // No-op since it's auto-generated
                formData={formData}
                errors={errors}
                setErrors={setErrors}
                required={true}
                disabled={true}
                placeholder="Will be auto-generated from numeric price"
                description="This field is automatically generated when you enter the numeric price below."
              />
            </div>
            
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select 
                value={formData.price.currency} 
                onValueChange={(value) => onInputChange('price.currency', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <ValidatedInput
              label="Total Numeric Price"
              field="price.totalNumeric"
              value={formData.price.totalNumeric?.toString() || ''}
                onChange={(value) => {
                const numericValue = Number(value) || 0
                onInputChange('price.totalNumeric', numericValue)
                // Auto-generate display price
                let displayPrice = ''
                
                if (numericValue > 0) {
                  if (numericValue >= 1000000) {
                    const millions = (numericValue / 1000000).toFixed(1).replace('.0', '')
                    displayPrice = `AED ${millions}M`
                  } else if (numericValue >= 1000) {
                    const thousands = (numericValue / 1000).toFixed(0)
                    displayPrice = `AED ${thousands}K`
                  } else {
                    displayPrice = `AED ${numericValue.toLocaleString()}`
                  }
                }
                
                onInputChange('price.total', displayPrice)
              }}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              required={true}
              min={0}
              type="number"
              placeholder="1200000"
              description="Enter the numeric price value. Display text will be auto-generated."
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment Plan Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Plan Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ValidatedTextarea
            label="Booking Payment"
            field="paymentPlan.booking"
            value={formData.paymentPlan.booking}
            onChange={(value) => onInputChange('paymentPlan.booking', value)}
            formData={formData}
            errors={errors}
            setErrors={setErrors}
            required={true}
            maxLength={500}
            minLength={10}
            placeholder="e.g., 20% down payment upon booking confirmation"
            rows={2}
          />

          <ValidatedTextarea
            label="Handover Payment"
            field="paymentPlan.handover"
            value={formData.paymentPlan.handover}
            onChange={(value) => onInputChange('paymentPlan.handover', value)}
            formData={formData}
            errors={errors}
            setErrors={setErrors}
            required={true}
            maxLength={500}
            minLength={10}
            placeholder="e.g., 20% upon completion and handover"
            rows={2}
          />
        </CardContent>
      </Card>

      {/* Construction Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Construction Milestones
            <div className="flex items-center gap-2">
              <span className={`text-sm px-2 py-1 rounded ${isPercentageValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                Total: {totalPercentage}%
              </span>
              <Button type="button" onClick={addConstructionMilestone} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Milestone
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isPercentageValid && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Construction milestone percentages total {totalPercentage}%, which exceeds 100%
                </span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {formData.paymentPlan.construction.map((milestone, index) => {
              const isComplete = milestone.milestone && milestone.percentage
              return (
                <div key={index} className={`flex gap-2 items-start p-3 rounded-lg border ${!isComplete ? 'bg-red-50 border-red-200' : 'border-gray-200'}`}>
                  <div className="flex-1">
                    <ValidatedInput
                      label={`Milestone ${index + 1} Description`}
                      field={`milestone_${index}`}
                      value={milestone.milestone}
                      onChange={(value) => updateConstructionMilestone(index, 'milestone', value)}
                      formData={formData}
                      errors={errors}
                      setErrors={setErrors}
                      required={true}
                      maxLength={200}
                      minLength={5}
                      placeholder="e.g., Foundation completion"
                    />
                  </div>
                  <div className="w-32">
                    <ValidatedInput
                      label="Percentage"
                      field={`percentage_${index}`}
                      value={milestone.percentage}
                      onChange={(value) => updateConstructionMilestone(index, 'percentage', value)}
                      formData={formData}
                      errors={errors}
                      setErrors={setErrors}
                      required={true}
                      maxLength={10}
                      minLength={2}
                      placeholder="20%"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeConstructionMilestone(index)}
                    disabled={formData.paymentPlan.construction.length === 1}
                    className="mt-6"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>

          {formData.paymentPlan.construction.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No construction milestones added yet.</p>
              <Button type="button" onClick={addConstructionMilestone} size="sm" className="mt-2">
                <Plus className="h-4 w-4 mr-1" />
                Add First Milestone
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Plan Summary */}
      {(formData.paymentPlan.booking || formData.paymentPlan.handover || formData.paymentPlan.construction.some(m => m.milestone && m.percentage)) && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Plan Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {formData.paymentPlan.booking && (
                <div className="flex justify-between">
                  <span className="font-medium">Booking:</span>
                  <span>{formData.paymentPlan.booking}</span>
                </div>
              )}
              
              {formData.paymentPlan.construction.filter(m => m.milestone && m.percentage).map((milestone, index) => (
                <div key={index} className="flex justify-between">
                  <span className="font-medium">{milestone.milestone}:</span>
                  <span>{milestone.percentage}</span>
                </div>
              ))}
              
              {formData.paymentPlan.handover && (
                <div className="flex justify-between">
                  <span className="font-medium">Handover:</span>
                  <span>{formData.paymentPlan.handover}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}