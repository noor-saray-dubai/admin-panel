// components/mall/steps/RentalOperationsStep.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ValidatedInput } from "../ValidatedInput"
import { ValidatedTextarea } from "../ValidatedTextarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Plus, Minus, Info, AlertTriangle } from "lucide-react"
import { useState } from "react"
import type { MallFormData } from "@/types/mall"

interface RentalOperationsStepProps {
  formData: MallFormData
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  onInputChange: (field: string, value: any) => void
}

export function RentalOperationsStep({ formData, errors, setErrors, onInputChange }: RentalOperationsStepProps) {
  const [showOperationalDetails, setShowOperationalDetails] = useState(false)
  
  // Comprehensive validation for rental fields
  const validateRentalFields = () => {
    const maxStores = formData.rentalDetails?.maxStores || 0
    const totalStores = formData.rentalDetails?.totalStores || 0
    const vacantStores = formData.rentalDetails?.vacantStores || 0
    const currentOccupancy = formData.rentalDetails?.currentOccupancy || 0
    
    const validationErrors: string[] = []
    
    // Check if total stores exceeds max capacity
    if (totalStores > maxStores && maxStores > 0) {
      validationErrors.push(`Total stores (${totalStores}) cannot exceed max capacity (${maxStores})`)
    }
    
    // Check if vacant stores exceed total stores
    if (vacantStores > totalStores && totalStores > 0) {
      validationErrors.push(`Vacant stores (${vacantStores}) cannot exceed total stores (${totalStores})`)
    }
    
    // Check occupancy consistency (if all fields are provided)
    if (totalStores > 0 && vacantStores >= 0 && currentOccupancy > 0) {
      const occupiedStores = totalStores - vacantStores
      const calculatedOccupancy = (occupiedStores / totalStores) * 100
      const difference = Math.abs(calculatedOccupancy - currentOccupancy)
      
      if (difference > 10) { // Allow 10% tolerance
        validationErrors.push(`Occupancy ${currentOccupancy}% doesn't match calculated ${calculatedOccupancy.toFixed(1)}% (based on ${occupiedStores}/${totalStores} occupied stores)`)
      }
    }
    
    return validationErrors
  }
  
  const validationErrors = validateRentalFields()
  
  const handleAddAnchorTenant = () => {
    const currentTenants = formData.rentalDetails?.anchorTenants || []
    onInputChange("rentalDetails.anchorTenants", [...currentTenants, ""])
  }

  const handleRemoveAnchorTenant = (index: number) => {
    const currentTenants = formData.rentalDetails?.anchorTenants || []
    const newTenants = currentTenants.filter((_, i) => i !== index)
    onInputChange("rentalDetails.anchorTenants", newTenants)
  }

  const handleAnchorTenantChange = (index: number, value: string) => {
    const currentTenants = formData.rentalDetails?.anchorTenants || []
    const newTenants = [...currentTenants]
    newTenants[index] = value
    onInputChange("rentalDetails.anchorTenants", newTenants)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Rental Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Validation Warnings */}
          {validationErrors.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800 mb-2">Validation Warnings</h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <ValidatedInput
              label="Total Stores"
              field="rentalDetails.totalStores"
              value={formData.rentalDetails?.totalStores ?? 0}
              onChange={(value) => onInputChange("rentalDetails.totalStores", value)}
              type="number"
              placeholder="0"
              min={0}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
            />
            <ValidatedInput
              label="Max Stores Capacity"
              field="rentalDetails.maxStores"
              value={formData.rentalDetails?.maxStores ?? 1}
              onChange={(value) => onInputChange("rentalDetails.maxStores", value)}
              type="number"
              placeholder="1"
              required
              min={1}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ValidatedInput
              label="Vacant Stores"
              field="rentalDetails.vacantStores"
              value={formData.rentalDetails?.vacantStores ?? 0}
              onChange={(value) => onInputChange("rentalDetails.vacantStores", value)}
              type="number"
              placeholder="0"
              min={0}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
            />
            <ValidatedInput
              label="Current Occupancy (%)"
              field="rentalDetails.currentOccupancy"
              value={formData.rentalDetails?.currentOccupancy ?? 0}
              onChange={(value) => onInputChange("rentalDetails.currentOccupancy", value)}
              type="number"
              placeholder="0"
              min={0}
              max={100}
              step={0.1}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
            />
          </div>

          <ValidatedInput
            label="Average Rent (per sqft/year)"
            field="rentalDetails.averageRent"
            value={formData.rentalDetails?.averageRent ?? 0}
            onChange={(value) => onInputChange("rentalDetails.averageRent", value)}
            type="number"
            placeholder="0"
            min={0}
            step={0.01}
            formData={formData}
            errors={errors}
            setErrors={setErrors}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Anchor Tenants
            <div className="group relative">
              <Info className="h-4 w-4 text-blue-500 cursor-help" />
              <div className="absolute left-0 top-6 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 w-64 z-10">
                Major retail stores (like department stores, supermarkets) that attract customers to the mall and increase foot traffic for smaller retailers.
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600 mb-3">
            Add major stores that serve as primary attractions for your mall (e.g., Carrefour, H&M, Zara, etc.)
          </div>
          <div className="space-y-3">
            {(formData.rentalDetails?.anchorTenants || []).map((tenant, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    value={tenant}
                    onChange={(e) => handleAnchorTenantChange(index, e.target.value)}
                    placeholder={`Anchor tenant ${index + 1}`}
                    maxLength={100}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveAnchorTenant(index)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={handleAddAnchorTenant}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Anchor Tenant
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Operational Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Label className="text-sm font-medium">Do you want to provide operational details?</Label>
            </div>
            <RadioGroup
              value={showOperationalDetails ? "yes" : "no"}
              onValueChange={(value) => setShowOperationalDetails(value === "yes")}
              className="flex items-center space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="operational-no" />
                <Label htmlFor="operational-no" className="text-sm">No (Skip this section)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="operational-yes" />
                <Label htmlFor="operational-yes" className="text-sm">Yes (Provide details)</Label>
              </div>
            </RadioGroup>
          </div>
          
          {showOperationalDetails && (
            <div className="space-y-4 pt-4 border-t">
              <ValidatedInput
                label="Management Company"
                field="operationalDetails.managementCompany"
                value={formData.operationalDetails?.managementCompany ?? ""}
                onChange={(value) => onInputChange("operationalDetails.managementCompany", value)}
                placeholder="e.g., Emaar Properties"
                maxLength={100}
                formData={formData}
                errors={errors}
                setErrors={setErrors}
              />

              <div className="grid grid-cols-2 gap-4">
                <ValidatedInput
                  label="Annual Service Charges (AED)"
                  field="operationalDetails.serviceCharges"
                  value={formData.operationalDetails?.serviceCharges ?? 0}
                  onChange={(value) => onInputChange("operationalDetails.serviceCharges", value)}
                  type="number"
                  placeholder="0"
                  min={0}
                  formData={formData}
                  errors={errors}
                  setErrors={setErrors}
                />
                <ValidatedInput
                  label="Utility Costs (AED/month)"
                  field="operationalDetails.utilityCosts"
                  value={formData.operationalDetails?.utilityCosts ?? 0}
                  onChange={(value) => onInputChange("operationalDetails.utilityCosts", value)}
                  type="number"
                  placeholder="0"
                  min={0}
                  formData={formData}
                  errors={errors}
                  setErrors={setErrors}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}