// components/mall/steps/SizePriceStep.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle } from "lucide-react"
import { ValidatedInput } from "../ValidatedInput"
import type { MallFormData } from "@/types/mall"

interface SizePriceStepProps {
  formData: MallFormData
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  onInputChange: (field: string, value: any) => void
}

export function SizePriceStep({
  formData,
  errors,
  setErrors,
  onInputChange
}: SizePriceStepProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Size & Area Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <ValidatedInput
              label="Total Area (sqft)"
              field="size.totalArea"
              value={formData.size?.totalArea ?? 0}
              onChange={(value) => onInputChange("size.totalArea", value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              type="number"
              placeholder="0"
              required
              min={0}
            />
            <ValidatedInput
              label="Retail Area (sqft)"
              field="size.retailArea"
              value={formData.size?.retailArea ?? 0}
              onChange={(value) => onInputChange("size.retailArea", value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              type="number"
              placeholder="0"
              required
              min={0}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Total Area (sqm)</Label>
              <Input value={formData.size?.totalSqm ?? 0} disabled className="bg-gray-50" />
            </div>
            <div>
              <Label>Retail Area (sqm)</Label>
              <Input value={formData.size?.retailSqm ?? 0} disabled className="bg-gray-50" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ValidatedInput
              label="Floors"
              field="size.floors"
              value={formData.size?.floors ?? 1}
              onChange={(value) => onInputChange("size.floors", value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              type="number"
              required
              min={1}
            />
            <ValidatedInput
              label="Parking Spaces"
              field="size.parkingSpaces"
              value={formData.size?.parkingSpaces ?? 0}
              onChange={(value) => onInputChange("size.parkingSpaces", value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              type="number"
              min={0}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing & Financials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Currency <span className="text-red-500">*</span></Label>
              <Select
                value={formData.price?.currency ?? "AED"}
                onValueChange={(value) => onInputChange("price.currency", value)}
              >
                <SelectTrigger className={errors['price.currency'] ? 'border-red-500' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AED">AED</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
              {errors['price.currency'] && (
                <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors['price.currency']}
                </div>
              )}
            </div>
            <ValidatedInput
              label="Price per sqft"
              field="price.perSqft"
              value={formData.price?.perSqft ?? 0}
              onChange={(value) => onInputChange("price.perSqft", value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              type="number"
              required
              min={0}
              step={0.01}
            />
            <div>
              <Label>Total Price</Label>
              <Input value={formData.price?.total ?? ""} disabled className="bg-gray-50" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <ValidatedInput
              label="Annual Revenue"
              field="financials.annualRevenue"
              value={formData.financials?.annualRevenue ?? 0}
              onChange={(value) => onInputChange("financials.annualRevenue", value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              type="number"
              min={0}
            />
            <ValidatedInput
              label="NOI (Net Operating Income)"
              field="financials.noi"
              value={formData.financials?.noi ?? 0}
              onChange={(value) => onInputChange("financials.noi", value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              type="number"
              min={0}
            />
            <ValidatedInput
              label="Cap Rate (%)"
              field="financials.capRate"
              value={formData.financials?.capRate ?? 0}
              onChange={(value) => onInputChange("financials.capRate", value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              type="number"
              required
              min={0}
              max={100}
              step={0.01}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}