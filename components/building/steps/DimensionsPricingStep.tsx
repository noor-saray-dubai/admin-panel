// components/building/steps/DimensionsPricingStep.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, DollarSign, Ruler } from "lucide-react"
import { ValidatedInput } from "../ValidatedInput"
import type { BuildingFormData } from "@/types/buildings"

interface DimensionsPricingStepProps {
  formData: BuildingFormData
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  onInputChange: (field: string, value: any) => void
}

export function DimensionsPricingStep({
  formData,
  errors,
  setErrors,
  onInputChange
}: DimensionsPricingStepProps) {

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Building Dimensions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <ValidatedInput
              label="Number of Floors"
              field="dimensions.floors"
              value={formData.dimensions?.floors ?? 1}
              onChange={(value) => onInputChange("dimensions.floors", value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              type="number"
              required
              min={1}
              max={200}
            />

            <ValidatedInput
              label="Height (Display)"
              field="dimensions.height"
              value={formData.dimensions?.height ?? ""}
              onChange={(value) => onInputChange("dimensions.height", value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              placeholder="e.g., 321m"
              maxLength={20}
              description="Display format like '321m' or '1,050ft'"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ValidatedInput
              label="Height (Numeric in meters)"
              field="dimensions.heightNumeric"
              value={formData.dimensions?.heightNumeric ?? ""}
              onChange={(value) => onInputChange("dimensions.heightNumeric", value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              type="number"
              placeholder="321"
              min={0}
              max={2000}
              description="Actual height in meters for calculations"
            />

            <ValidatedInput
              label="Total Area (sqm)"
              field="dimensions.totalArea"
              value={formData.dimensions?.totalArea ?? ""}
              onChange={(value) => onInputChange("dimensions.totalArea", value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              type="number"
              placeholder="50000"
              min={0}
              description="Total built-up area in square meters"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ValidatedInput
              label="Land Area (sqm)"
              field="dimensions.landArea"
              value={formData.dimensions?.landArea ?? ""}
              onChange={(value) => onInputChange("dimensions.landArea", value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              type="number"
              placeholder="10000"
              min={0}
              description="Land plot area in square meters"
            />

            <ValidatedInput
              label="Floor Plate Size (sqm)"
              field="dimensions.floorPlateSize"
              value={formData.dimensions?.floorPlateSize ?? ""}
              onChange={(value) => onInputChange("dimensions.floorPlateSize", value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              type="number"
              placeholder="2000"
              min={0}
              description="Typical floor area in square meters"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Main Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price-currency">
                Currency <span className="text-red-500">*</span>
              </Label>
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
              label="Price (Numeric Value)"
              field="price.valueNumeric"
              value={formData.price?.valueNumeric ?? 0}
              onChange={(value) => onInputChange("price.valueNumeric", value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              type="number"
              required
              min={0}
              placeholder="2500000000"
              description="Actual price value for calculations"
            />

            <div className="space-y-2">
              <Label>Price (Display) <span className="text-green-600">*Auto-calculated</span></Label>
              <Input
                value={formData.price?.value ?? ""}
                disabled
                className="bg-gray-50 text-gray-700"
                placeholder="Will be formatted automatically"
              />
              <div className="text-xs text-gray-500">
                Automatically formatted from numeric value
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Price Range (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <ValidatedInput
              label="Min Price"
              field="priceRange.min"
              value={formData.priceRange?.min ?? ""}
              onChange={(value) => onInputChange("priceRange.min", value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              type="number"
              min={0}
              placeholder="5000000"
            />

            <ValidatedInput
              label="Max Price"
              field="priceRange.max"
              value={formData.priceRange?.max ?? ""}
              onChange={(value) => onInputChange("priceRange.max", value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              type="number"
              min={0}
              placeholder="40000000"
            />

            <div className="space-y-2">
              <Label>Range Currency</Label>
              <Select
                value={formData.priceRange?.currency ?? "AED"}
                onValueChange={(value) => onInputChange("priceRange.currency", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AED">AED</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <ValidatedInput
              label="Range Display"
              field="priceRange.display"
              value={formData.priceRange?.display ?? ""}
              onChange={(value) => onInputChange("priceRange.display", value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              placeholder="5M - 40M AED"
              maxLength={50}
              description="How the price range appears to users"
            />
          </div>

          <ValidatedInput
            label="Period (for commercial)"
            field="priceRange.period"
            value={formData.priceRange?.period ?? ""}
            onChange={(value) => onInputChange("priceRange.period", value)}
            formData={formData}
            errors={errors}
            setErrors={setErrors}
            placeholder="per year, per month, etc."
            maxLength={20}
            description="Time period for pricing (e.g., 'per year' for commercial leases)"
          />
        </CardContent>
      </Card>
    </div>
  )
}