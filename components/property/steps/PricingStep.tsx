// components/property/steps/PricingStep.tsx
"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, DollarSign, Calculator, TrendingUp, Info } from "lucide-react"
import type { PropertyFormData, PropertyStepProps } from "@/types/properties"

export function PricingStep({ formData, errors, setErrors, onInputChange }: PropertyStepProps) {
  const handleFieldChange = (field: keyof PropertyFormData, value: any) => {
    onInputChange(field, value)
    
    // Clear field error when user starts typing
    if (errors[field]) {
      const newErrors = { ...errors }
      delete newErrors[field]
      setErrors(newErrors)
    }
  }

  const handlePriceChange = (value: string) => {
    // Remove non-numeric characters except decimal point
    const cleanValue = value.replace(/[^0-9.]/g, '')
    
    // Parse numeric value
    const numericPrice = parseFloat(cleanValue) || 0
    
    // Format display price
    const formattedPrice = cleanValue ? `${cleanValue} AED` : ''
    
    // Update both price fields
    onInputChange('price', formattedPrice)
    onInputChange('priceNumeric', numericPrice)
    
    // Calculate price per sq ft if built up area exists
    if (numericPrice > 0 && formData.builtUpArea) {
      const area = formData.builtUpArea // builtUpArea is already a number
      if (area > 0) {
        const pricePerSqFt = Math.round(numericPrice / area)
        onInputChange('pricePerSqFt', pricePerSqFt)
      }
    }
  }

  const handlePricePerSqFtChange = (value: string) => {
    const numericValue = parseFloat(value) || 0
    handleFieldChange('pricePerSqFt', numericValue)
  }

  // Format number with commas
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  // Generate price display
  const generatePriceDisplay = (price: number): string => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)} Million AED`
    } else if (price >= 1000) {
      return `${Math.round(price / 1000)}K AED`
    } else {
      return `${formatNumber(price)} AED`
    }
  }

  return (
    <div className="space-y-6">
      {/* Price Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Price Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Price */}
          <div className="space-y-2">
            <Label htmlFor="price" className="text-sm font-medium">
              Property Price (AED) *
            </Label>
            <Input
              id="price"
              placeholder="e.g., 1500000"
              value={formData.price.replace(' AED', '')}
              onChange={(e) => handlePriceChange(e.target.value)}
              className={errors.price ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {errors.price && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.price}
              </div>
            )}
            
            {/* Price Display */}
            {formData.priceNumeric > 0 && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    Formatted Price: {generatePriceDisplay(formData.priceNumeric)}
                  </span>
                </div>
                <p className="text-xs text-green-700 mt-1">
                  Numeric Value: {formatNumber(formData.priceNumeric)} AED
                </p>
              </div>
            )}
          </div>

          {/* Price per Sq Ft */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pricePerSqFt" className="text-sm font-medium flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Price per Sq Ft (AED)
              </Label>
              <Input
                id="pricePerSqFt"
                type="number"
                placeholder="0"
                value={formData.pricePerSqFt || ''}
                onChange={(e) => handlePricePerSqFtChange(e.target.value)}
                className={errors.pricePerSqFt ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.pricePerSqFt && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errors.pricePerSqFt}
                </div>
              )}
            </div>
          </div>

          {/* Price Calculation Info */}
          {formData.priceNumeric > 0 && formData.builtUpArea && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Info className="h-4 w-4 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">Price Calculation</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>Property Price: {formatNumber(formData.priceNumeric)} AED</p>
                    <p>Built-up Area: {formData.builtUpArea} {formData.areaUnit}</p>
                    {formData.pricePerSqFt > 0 && (
                      <p>Price per Sq Ft: {formatNumber(formData.pricePerSqFt)} AED/sq ft</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}