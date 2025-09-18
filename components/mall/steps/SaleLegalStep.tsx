// components/mall/steps/SaleLegalStep.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ValidatedInput } from "../ValidatedInput"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, Plus, Minus } from "lucide-react"
import { useEffect, useState } from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { MallFormData } from "@/types/mall"

interface SaleLegalStepProps {
  formData: MallFormData
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  onInputChange: (field: string, value: any) => void
}

export function SaleLegalStep({ formData, errors, setErrors, onInputChange }: SaleLegalStepProps) {
  // State for mortgage details toggle
  const [showMortgageDetails, setShowMortgageDetails] = useState(false)
  
  // Initialize mortgage details toggle based on existing data
  useEffect(() => {
    const hasMortgageData = formData.legalDetails?.mortgageDetails && (
      (formData.legalDetails.mortgageDetails.lender && formData.legalDetails.mortgageDetails.lender.trim().length > 0) ||
      (formData.legalDetails.mortgageDetails.outstandingAmount && formData.legalDetails.mortgageDetails.outstandingAmount > 0) ||
      (formData.legalDetails.mortgageDetails.maturityDate && 
       (formData.legalDetails.mortgageDetails.maturityDate instanceof Date || 
        (typeof formData.legalDetails.mortgageDetails.maturityDate === 'string' && 
         formData.legalDetails.mortgageDetails.maturityDate.trim().length > 0)))
    )
    setShowMortgageDetails(Boolean(hasMortgageData))
  }, [])
  
  // Handle mortgage details toggle change
  const handleMortgageToggle = (value: string) => {
    const shouldShow = value === 'yes'
    setShowMortgageDetails(shouldShow)
    
    if (!shouldShow) {
      // Remove mortgage details from form data when toggled off
      if (formData.legalDetails?.mortgageDetails) {
        const updatedLegalDetails = { ...formData.legalDetails }
        delete updatedLegalDetails.mortgageDetails
        onInputChange('legalDetails', updatedLegalDetails)
      }
    } else {
      // Initialize empty mortgage details when toggled on
      // Ensure legalDetails object exists first
      if (!formData.legalDetails) {
        onInputChange('legalDetails', {
          titleDeedNumber: '',
          reraNumber: '',
          zoning: '',
          leaseholdExpiry: undefined,
          mortgageDetails: {
            lender: '',
            outstandingAmount: 0,
            maturityDate: undefined
          }
        })
      } else {
        onInputChange('legalDetails.mortgageDetails', {
          lender: '',
          outstandingAmount: 0,
          maturityDate: undefined
        })
      }
    }
  }
  
  // Format price for display
  const formatPrice = (amount: number): string => {
    if (amount >= 1000000000) {
      return `AED ${(amount / 1000000000).toFixed(1)}B`
    } else if (amount >= 1000000) {
      return `AED ${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `AED ${(amount / 1000).toFixed(1)}K`
    } else {
      return `AED ${amount.toLocaleString()}`
    }
  }
  
  // Auto-populate asking price from main price if empty
  useEffect(() => {
    // Only auto-populate if asking price fields are empty and main price exists
    const hasMainPrice = formData.price?.totalNumeric && formData.price.totalNumeric > 0
    const hasAskingPrice = formData.saleInformation?.askingPriceNumeric && formData.saleInformation.askingPriceNumeric > 0
    const hasAskingPriceDisplay = formData.saleInformation?.askingPrice && formData.saleInformation.askingPrice.trim().length > 0
    
    if (hasMainPrice && !hasAskingPrice && !hasAskingPriceDisplay) {
      // Auto-populate from main price
      onInputChange("saleInformation.askingPriceNumeric", formData.price.totalNumeric)
      onInputChange("saleInformation.askingPrice", formData.price.total)
    }
  }, [formData.price?.totalNumeric, formData.price?.total])
  
  // Auto-update asking price display when asking price numeric changes
  useEffect(() => {
    const numericPrice = formData.saleInformation?.askingPriceNumeric || 0
    if (numericPrice > 0) {
      const formattedPrice = formatPrice(numericPrice)
      if (formData.saleInformation?.askingPrice !== formattedPrice) {
        onInputChange("saleInformation.askingPrice", formattedPrice)
      }
    }
  }, [formData.saleInformation?.askingPriceNumeric])
  
  const handleAddSaleCondition = () => {
    const currentConditions = formData.saleInformation?.saleConditions || []
    onInputChange("saleInformation.saleConditions", [...currentConditions, ""])
  }

  const handleRemoveSaleCondition = (index: number) => {
    const currentConditions = formData.saleInformation?.saleConditions || []
    const newConditions = currentConditions.filter((_, i) => i !== index)
    onInputChange("saleInformation.saleConditions", newConditions)
  }

  const handleSaleConditionChange = (index: number, value: string) => {
    const currentConditions = formData.saleInformation?.saleConditions || []
    const newConditions = [...currentConditions]
    newConditions[index] = value
    onInputChange("saleInformation.saleConditions", newConditions)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sale Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="askingPrice">
                Asking Price (Display) <span className="text-green-600">*Auto-calculated</span>
              </Label>
              <Input
                id="askingPrice"
                value={formData.saleInformation?.askingPrice ?? ""}
                disabled
                className="bg-gray-50 text-gray-700"
                placeholder="Enter numeric price first"
              />
              <div className="text-xs text-gray-500">
                This field is automatically formatted when you enter the numeric price
              </div>
            </div>
            <ValidatedInput
              label="Asking Price (Numeric in AED)"
              field="saleInformation.askingPriceNumeric"
              value={formData.saleInformation?.askingPriceNumeric ?? 0}
              onChange={(value) => onInputChange("saleInformation.askingPriceNumeric", value)}
              type="number"
              placeholder="2500000000"
              min={0}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="saleStatus">
                Sale Status <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.saleInformation?.saleStatus ?? "available"}
                onValueChange={(value) => onInputChange("saleInformation.saleStatus", value)}
              >
                <SelectTrigger className={errors["saleInformation.saleStatus"] ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select sale status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="underNegotiation">Under Negotiation</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="offMarket">Off Market</SelectItem>
                </SelectContent>
              </Select>
              {errors["saleInformation.saleStatus"] && (
                <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors["saleInformation.saleStatus"]}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dealStructure">
                Deal Structure <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.saleInformation?.dealStructure ?? "assetSale"}
                onValueChange={(value) => onInputChange("saleInformation.dealStructure", value)}
              >
                <SelectTrigger className={errors["saleInformation.dealStructure"] ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select deal structure" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assetSale">Asset Sale</SelectItem>
                  <SelectItem value="shareSale">Share Sale</SelectItem>
                  <SelectItem value="jointVenture">Joint Venture</SelectItem>
                  <SelectItem value="leaseback">Sale & Leaseback</SelectItem>
                </SelectContent>
              </Select>
              {errors["saleInformation.dealStructure"] && (
                <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors["saleInformation.dealStructure"]}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferredBuyerType">
              Preferred Buyer Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.saleInformation?.preferredBuyerType ?? "any"}
              onValueChange={(value) => onInputChange("saleInformation.preferredBuyerType", value)}
            >
              <SelectTrigger className={errors["saleInformation.preferredBuyerType"] ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select buyer type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Buyer</SelectItem>
                <SelectItem value="institutional">Institutional</SelectItem>
                <SelectItem value="REIT">REIT</SelectItem>
                <SelectItem value="privateInvestor">Private Investor</SelectItem>
                <SelectItem value="developer">Developer</SelectItem>
              </SelectContent>
            </Select>
            {errors["saleInformation.preferredBuyerType"] && (
              <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                <AlertCircle className="h-3 w-3" />
                {errors["saleInformation.preferredBuyerType"]}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sale Conditions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {(formData.saleInformation?.saleConditions || []).map((condition, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-1">
                  <Textarea
                    value={condition}
                    onChange={(e) => handleSaleConditionChange(index, e.target.value)}
                    placeholder={`Sale condition ${index + 1}`}
                    rows={2}
                    maxLength={500}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveSaleCondition(index)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={handleAddSaleCondition}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Sale Condition
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Legal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <ValidatedInput
              label="Title Deed Number"
              field="legalDetails.titleDeedNumber"
              value={formData.legalDetails?.titleDeedNumber ?? ""}
              onChange={(value) => onInputChange("legalDetails.titleDeedNumber", value)}
              placeholder="e.g., 123/456/789"
              maxLength={50}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
            />
            <ValidatedInput
              label="RERA Number"
              field="legalDetails.reraNumber"
              value={formData.legalDetails?.reraNumber ?? ""}
              onChange={(value) => onInputChange("legalDetails.reraNumber", value)}
              placeholder="e.g., RN-123456"
              maxLength={50}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="zoning">
              Zoning <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.legalDetails?.zoning ?? ""}
              onValueChange={(value) => onInputChange("legalDetails.zoning", value)}
            >
              <SelectTrigger className={errors["legalDetails.zoning"] ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select zoning type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Commercial">Commercial</SelectItem>
                <SelectItem value="Mixed-Use">Mixed-Use</SelectItem>
                <SelectItem value="Retail">Retail</SelectItem>
                <SelectItem value="Shopping Center">Shopping Center</SelectItem>
                <SelectItem value="Community Commercial">Community Commercial</SelectItem>
                <SelectItem value="Regional Commercial">Regional Commercial</SelectItem>
                <SelectItem value="Entertainment">Entertainment</SelectItem>
                <SelectItem value="Hospitality">Hospitality</SelectItem>
                <SelectItem value="Business Commercial">Business Commercial</SelectItem>
                <SelectItem value="General Commercial">General Commercial</SelectItem>
                <SelectItem value="Service Commercial">Service Commercial</SelectItem>
                <SelectItem value="Tourism Commercial">Tourism Commercial</SelectItem>
                <SelectItem value="Other Commercial">Other Commercial</SelectItem>
              </SelectContent>
            </Select>
            {errors["legalDetails.zoning"] && (
              <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                <AlertCircle className="h-3 w-3" />
                {errors["legalDetails.zoning"]}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="leaseholdExpiry">Leasehold Expiry (if applicable)</Label>
            <Input
              type="date"
              value={formData.legalDetails?.leaseholdExpiry ? 
                (typeof formData.legalDetails.leaseholdExpiry === 'string' ? 
                  formData.legalDetails.leaseholdExpiry : 
                  new Date(formData.legalDetails.leaseholdExpiry).toISOString().split('T')[0]) : ''}
              onChange={(e) => onInputChange("legalDetails.leaseholdExpiry", e.target.value || undefined)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mortgage Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Does this property have mortgage details to provide?</Label>
            <RadioGroup
              value={showMortgageDetails ? 'yes' : 'no'}
              onValueChange={handleMortgageToggle}
              className="flex items-center space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="mortgage-no" />
                <Label htmlFor="mortgage-no" className="cursor-pointer">No mortgage details</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="mortgage-yes" />
                <Label htmlFor="mortgage-yes" className="cursor-pointer">Yes, provide mortgage details</Label>
              </div>
            </RadioGroup>
          </div>

          {showMortgageDetails && (
            <div className="space-y-4 pt-4 border-t">
              <div className="text-sm text-gray-600 mb-3">
                Please provide all mortgage details. All fields are required when mortgage information is provided.
              </div>
              
              <ValidatedInput
                label="Lender"
                field="legalDetails.mortgageDetails.lender"
                value={formData.legalDetails?.mortgageDetails?.lender ?? ""}
                onChange={(value) => onInputChange("legalDetails.mortgageDetails.lender", value)}
                placeholder="e.g., Emirates NBD"
                maxLength={100}
                required
                formData={formData}
                errors={errors}
                setErrors={setErrors}
              />

              <div className="grid grid-cols-2 gap-4">
                <ValidatedInput
                  label="Outstanding Amount (AED)"
                  field="legalDetails.mortgageDetails.outstandingAmount"
                  value={formData.legalDetails?.mortgageDetails?.outstandingAmount ?? 0}
                  onChange={(value) => onInputChange("legalDetails.mortgageDetails.outstandingAmount", value)}
                  type="number"
                  placeholder="0"
                  min={0}
                  required
                  formData={formData}
                  errors={errors}
                  setErrors={setErrors}
                />
                <div className="space-y-2">
                  <Label htmlFor="maturityDate">
                    Maturity Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={formData.legalDetails?.mortgageDetails?.maturityDate ? 
                      (typeof formData.legalDetails.mortgageDetails.maturityDate === 'string' ? 
                        formData.legalDetails.mortgageDetails.maturityDate : 
                        new Date(formData.legalDetails.mortgageDetails.maturityDate).toISOString().split('T')[0]) : ''}
                    onChange={(e) => onInputChange("legalDetails.mortgageDetails.maturityDate", e.target.value || undefined)}
                    className={errors["legalDetails.mortgageDetails.maturityDate"] ? 'border-red-500' : ''}
                  />
                  {errors["legalDetails.mortgageDetails.maturityDate"] && (
                    <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors["legalDetails.mortgageDetails.maturityDate"]}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}