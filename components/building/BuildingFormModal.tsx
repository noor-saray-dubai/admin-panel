// components/building/BuildingFormModal.tsx
"use client"

import React, { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Building2, Layers, Home, Image, CheckCircle2 } from "lucide-react"
import type { IBuilding, BuildingFormData } from "@/types/buildings"
import { validateBuildingFormData } from "@/lib/building-validation"
import { useBuildingFormLogic } from "./hooks/useBuildingFormLogic"
import { BuildingFormStepNavigation, type Step } from "./BuildingFormStepNavigation"
import { BasicInformationStep } from "./steps/BasicInformationStep"
import { DimensionsPricingStep } from "./steps/DimensionsPricingStep"
import { UnitsAmenitiesStep } from "./steps/UnitsAmenitiesStep"
import { MarketingMediaStep } from "./steps/MarketingMediaStep"
import { SettingsReviewStep } from "./steps/SettingsReviewStep"
import { ConfirmationDialogs } from "./ConfirmationDialogs"
import { DraftRestoreDialog } from "./DraftRestoreDialog"
import { useToast } from "@/components/ui/toast-system"

interface BuildingFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (data: BuildingFormData) => Promise<void>
  building?: IBuilding | null
  mode: "add" | "edit"
}

// Initial form data structure
const createInitialFormData = (): BuildingFormData => ({
  name: "",
  subtitle: "",
  location: "",
  subLocation: "",
  category: "",
  type: "",
  price: { value: "", valueNumeric: 0, currency: "AED" },
  priceRange: undefined,
  dimensions: { floors: 1 },
  year: new Date().getFullYear(),
  yearBuilt: undefined,
  units: [],
  totalUnits: 0,
  availableUnits: undefined,
  amenities: {},
  features: [],
  highlights: [],
  financials: undefined,
  saleInformation: undefined,
  legalDetails: undefined,
  operationalDetails: undefined,
  marketingMaterials: undefined,
  investorRelations: undefined,
  mainImage: "",
  gallery: [],
  floorPlans: [],
  locationDetails: undefined,
  developer: undefined,
  currentOwner: "",
  masterDeveloper: "",
  rating: "",
  sustainabilityRating: "",
  architecture: "",
  architect: "",
  description: "",
  status: "",
  verified: true,
  isActive: true,
  isFeatured: false,
})

// Define the form steps
const formSteps: Step[] = [
  {
    id: "basic",
    title: "Basic Info",
    icon: Building2,
    description: "Building name, location, category, and description"
  },
  {
    id: "dimensions",
    title: "Dimensions",
    icon: Layers,
    description: "Dimensions, floors, area, and pricing information"
  },
  {
    id: "units",
    title: "Units",
    icon: Home,
    description: "Unit types, amenities, features, and highlights"
  },
  {
    id: "media",
    title: "Media",
    icon: Image,
    description: "Images, marketing materials, and contact information"
  },
  {
    id: "review",
    title: "Review",
    icon: CheckCircle2,
    description: "Review all information and submit"
  }
]

export function BuildingFormModal({ isOpen, onClose, onSuccess, building, mode }: BuildingFormModalProps) {
  const toast = useToast()
  const initialFormData = useMemo(() => createInitialFormData(), [])
  
  const {
    formData,
    currentStep,
    errors,
    setErrors,
    isSubmitting,
    hasUnsavedChanges,
    handleInputChange,
    handleSubmit,
    nextStep,
    prevStep,
    goToStep,
    resetForm,
    showDraftRestoreDialog,
    draftTimestamp,
    handleRestoreDraft,
    handleDiscardDraft
  } = useBuildingFormLogic({
    initialFormData,
    isOpen,
    mode,
    building,
    onSuccess,
    onClose
  })

  // Step validation function
  const getStepStatus = (stepIndex: number): 'valid' | 'invalid' | 'incomplete' => {
    const validation = validateBuildingFormData(formData)
    const stepErrors = Object.keys(validation.errors)
    
    switch (stepIndex) {
      case 0: // Basic Information
        const basicFields = ['name', 'location', 'description', 'category', 'type', 'status', 'year']
        const basicErrors = stepErrors.filter(field => basicFields.includes(field))
        const basicRequired = formData.name && formData.location && formData.description && formData.category && formData.type && formData.status && formData.year
        if (basicErrors.length > 0) return 'invalid'
        return basicRequired ? 'valid' : 'incomplete'
        
      case 1: // Dimensions & Pricing
        const dimensionFields = ['dimensions.floors', 'price.value', 'price.valueNumeric', 'price.currency']
        const dimensionErrors = stepErrors.filter(field => dimensionFields.some(df => field.includes(df.split('.')[0])))
        const dimensionRequired = formData.dimensions?.floors && formData.price?.valueNumeric && formData.price?.currency
        if (dimensionErrors.length > 0) return 'invalid'
        return dimensionRequired ? 'valid' : 'incomplete'
        
      case 2: // Units & Amenities
        const unitErrors = stepErrors.filter(field => field.includes('totalUnits') || field.includes('units'))
        const unitRequired = formData.totalUnits > 0
        if (unitErrors.length > 0) return 'invalid'
        return unitRequired ? 'valid' : 'incomplete'
        
      case 3: // Marketing & Media
        const mediaErrors = stepErrors.filter(field => field.includes('mainImage'))
        const mediaRequired = formData.mainImage
        if (mediaErrors.length > 0) return 'invalid'
        return mediaRequired ? 'valid' : 'incomplete'
        
      case 4: // Settings & Review
        return validation.isValid ? 'valid' : (stepErrors.length > 0 ? 'invalid' : 'incomplete')
        
      default:
        return 'incomplete'
    }
  }

  // Validation function for form completion
  const isFormValid = () => {
    const validation = validateBuildingFormData(formData)
    return validation.isValid
  }

  // Render current step content
  const renderStepContent = () => {
    if (!formSteps[currentStep]) {
      console.error('Invalid step index:', currentStep, 'Total steps:', formSteps.length)
      return <div className="p-8 text-center text-red-500">Error: Invalid step</div>
    }
    
    const currentStepId = formSteps[currentStep].id

    switch (currentStepId) {
      case "basic":
        return (
          <BasicInformationStep
            formData={formData}
            errors={errors}
            setErrors={setErrors}
            onInputChange={handleInputChange}
          />
        )

      case "dimensions":
        return (
          <DimensionsPricingStep
            formData={formData}
            errors={errors}
            setErrors={setErrors}
            onInputChange={handleInputChange}
          />
        )

      case "units":
        return (
          <UnitsAmenitiesStep
            formData={formData}
            errors={errors}
            setErrors={setErrors}
            onInputChange={handleInputChange}
          />
        )

      case "media":
        return (
          <MarketingMediaStep
            formData={formData}
            errors={errors}
            setErrors={setErrors}
            onInputChange={handleInputChange}
            mode={mode}
          />
        )

      case "review":
        return (
          <SettingsReviewStep
            formData={formData}
            errors={errors}
            setErrors={setErrors}
            onInputChange={handleInputChange}
            getStepStatus={getStepStatus}
          />
        )

      default:
        return <div className="p-8 text-center text-gray-500">Step content for {currentStepId} - Coming Soon</div>
    }
  }

  return (
    <>
      {/* Draft Restore Dialog */}
      <DraftRestoreDialog
        isOpen={showDraftRestoreDialog}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
        draftTimestamp={draftTimestamp}
      />

      <ConfirmationDialogs
        mode={mode}
        hasUnsavedChanges={hasUnsavedChanges}
        formData={formData}
        onClose={onClose}
        isSubmitting={isSubmitting}
        onResetForm={resetForm}
        isModalOpen={isOpen}
      />

      {/* Main Form Modal */}
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open && !isSubmitting) {
          // Use the global confirmation handler
          if ((window as any).handleBuildingFormClose) {
            (window as any).handleBuildingFormClose()
          } else {
            onClose()
          }
        }
      }}>
        <DialogContent className="max-w-6xl max-h-[95vh] p-0 flex flex-col">
          <DialogHeader className="p-6 pb-0 flex-shrink-0">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              {mode === "add" ? "Add New Building" : "Edit Building"}
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                  Unsaved Changes
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Step Navigation */}
          <BuildingFormStepNavigation
            steps={formSteps}
            currentStep={currentStep}
            onStepClick={goToStep}
            getStepStatus={getStepStatus}
          />

          {/* Step Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {renderStepContent()}
          </div>

          {/* Navigation Footer */}
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              {currentStep < formSteps.length - 1 ? (
                <Button onClick={nextStep}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !isFormValid()}
                >
                  {isSubmitting ? "Saving..." : mode === "edit" ? "Update Building" : "Create Building"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
