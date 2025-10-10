// components/hotels/steps/DimensionsPricingStep.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, DollarSign, Building2, Hotel, Bed } from "lucide-react"
import { ValidatedInput } from "../ValidatedInput"
import type { HotelFormData } from "@/types/hotels"

interface DimensionsPricingStepProps {
  formData: HotelFormData
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
            <Building2 className="h-5 w-5" />
            Hotel Dimensions
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
              min={1}
              max={200}
              description="Total floors in the hotel building (optional)"
            />

            <ValidatedInput
              label="Hotel Height (Display)"
              field="dimensions.height"
              value={formData.dimensions?.height ?? ""}
              onChange={(value) => onInputChange("dimensions.height", value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              type="text"
              placeholder="180m"
              maxLength={20}
              description="Height display format (e.g., '180m') - optional"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ValidatedInput
              label="Height (Numeric Value)"
              field="dimensions.heightNumeric"
              value={formData.dimensions?.heightNumeric ?? ""}
              onChange={(value) => onInputChange("dimensions.heightNumeric", value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              type="number"
              min={0}
              placeholder="180"
              description="Numeric height value in meters (optional)"
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
              placeholder="25000"
              min={0}
              description="Total built-up area in square meters"
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <ValidatedInput
              label="Land Area (sqm)"
              field="dimensions.landArea"
              value={formData.dimensions?.landArea ?? ""}
              onChange={(value) => onInputChange("dimensions.landArea", value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              type="number"
              placeholder="30000"
              min={0}
              description="Total land plot area in square meters"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hotel className="h-5 w-5" />
            Rooms & Suites
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <ValidatedInput
              label="Total Rooms"
              field="totalRooms"
              value={formData.totalRooms ?? 0}
              onChange={(value) => onInputChange("totalRooms", value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              type="number"
              min={1}
              max={5000}
              placeholder="250"
              description="Total number of guest rooms (optional)"
            />

            <ValidatedInput
              label="Total Suites"
              field="totalSuites"
              value={formData.totalSuites ?? 0}
              onChange={(value) => onInputChange("totalSuites", value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              type="number"
              min={0}
              max={500}
              placeholder="25"
              description="Number of luxury suites"
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
              field="price.totalNumeric"
              value={formData.price?.totalNumeric ?? 0}
              onChange={(value) => onInputChange("price.totalNumeric", value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              type="number"
              required
              min={0}
              placeholder="500000000"
              description="Actual price value for calculations"
            />

            <div className="space-y-2">
              <Label>Price (Display) <span className="text-green-600">*Auto-calculated</span></Label>
              <Input
                value={formData.price?.total || "Not calculated"}
                disabled
                className="bg-green-50 text-green-700 font-semibold"
                placeholder="Will be formatted automatically"
              />
              <div className="text-xs text-gray-500">
                Automatically formatted from numeric value (e.g., AED 500.0M)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle>Hotel Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <ValidatedInput
              label="Year (Display Format)"
              field="year"
              value={formData.year ?? ""}
              onChange={(value) => onInputChange("year", value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              type="text"
              required
              placeholder="2024"
              maxLength={10}
              description="Display format for year built/opened"
            />

            <ValidatedInput
              label="Year Built"
              field="yearBuilt"
              value={formData.yearBuilt ?? ""}
              onChange={(value) => onInputChange("yearBuilt", value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              type="number"
              min={1900}
              max={new Date().getFullYear() + 10}
              placeholder="2020"
              description="Actual year the hotel was built"
            />
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
