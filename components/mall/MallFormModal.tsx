// components/mall/MallFormModal.tsx
"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ChevronLeft, ChevronRight, AlertCircle, Building, DollarSign, Store, 
  FileText, Users, MapPin, Camera, Settings
} from "lucide-react"
import type { IMall, MallFormData, MallFormModalProps } from "@/types/mall"
import { validateMallFormData } from "@/lib/mall-validation"
import {
  saveMallFormDraft,
  loadMallFormDraft,
  clearMallFormDraft,
  hasSavedMallDraft,
  getMallDraftTimestamp,
  createDebouncedMallSave
} from "@/lib/mall-form-persistence"

// Import step components
import { MallFormStepNavigation, type Step } from "./MallFormStepNavigation"
import { BasicInfoStep } from "./steps/BasicInfoStep"
import { SizePriceStep } from "./steps/SizePriceStep"
import { RentalOperationsStep } from "./steps/RentalOperationsStep"
import { SaleLegalStep } from "./steps/SaleLegalStep"
import { FeaturesAmenitiesStep } from "./steps/FeaturesAmenitiesStep"
import { LocationDetailsStep } from "./steps/LocationDetailsStep"
import { MarketingMediaStep } from "./steps/MarketingMediaStep"
import { SettingsReviewStep } from "./steps/SettingsReviewStep"

// Import hooks and utilities
import { useMallFormLogic } from "./hooks/useMallFormLogic"
import { useMallFormValidation } from "./hooks/useMallFormValidation"
import { ConfirmationDialogs } from "./ConfirmationDialogs"
import { DraftRestoreDialog } from "./DraftRestoreDialog"

// Step configuration
const steps: Step[] = [
  { id: "basic", title: "Basic Information", icon: Building, description: "Name, location, type" },
  { id: "size-price", title: "Size & Pricing", icon: DollarSign, description: "Areas, pricing, financials" },
  { id: "rental", title: "Rental & Operations", icon: Store, description: "Tenants, operations" },
  { id: "sale-legal", title: "Sale & Legal", icon: FileText, description: "Sale info, legal details" },
  { id: "features", title: "Features & Amenities", icon: Users, description: "Mall amenities, features" },
  { id: "location", title: "Location Details", icon: MapPin, description: "Detailed location info" },
  { id: "marketing", title: "Marketing & Media", icon: Camera, description: "Images, marketing materials" },
  { id: "settings", title: "Settings & Review", icon: Settings, description: "Final settings, review" }
]

// Initial form data
const initialFormData: MallFormData = {
  name: "",
  subtitle: "",
  status: "",
  location: "",
  subLocation: "",
  ownership: "",
  price: {
    total: "",
    totalNumeric: 0,
    perSqft: 0,
    currency: "AED"
  },
  size: {
    totalArea: 0,
    retailArea: 0,
    totalSqm: 0,
    retailSqm: 0,
    floors: 1,
    parkingSpaces: 0
  },
  rentalDetails: {
    currentOccupancy: 0,
    averageRent: 0,
    totalStores: 0,
    maxStores: 1,
    vacantStores: 0,
    anchorTenants: []
  },
  financials: {
    annualRevenue: 0,
    noi: 0,
    operatingExpenses: 0,
    capRate: 0,
    roi: 0,
    appreciation: 0,
    payback: 0
  },
  saleInformation: {
    askingPrice: "",
    askingPriceNumeric: 0,
    valuationReports: [],
    saleStatus: "available",
    transactionHistory: [],
    dealStructure: "assetSale",
    saleConditions: [],
    preferredBuyerType: "any"
  },
  legalDetails: {
    titleDeedNumber: "",
    reraNumber: "",
    zoning: "",
    leaseholdExpiry: undefined,
    mortgageDetails: undefined
  },
  operationalDetails: {
    managementCompany: "",
    serviceCharges: 0,
    utilityCosts: 0,
    maintenanceStatus: "new",
    greenBuildingCertifications: []
  },
  leaseDetails: {
    leaseTermsSummary: {
      avgLeaseDuration: 0,
      escalationRate: 0
    },
    topTenants: [],
    leaseExpirySchedule: []
  },
  marketingMaterials: {
    brochure: "",
    videoTour: "",
    virtualTour3D: "",
    investmentHighlights: [],
    keySellingPoints: []
  },
  investorRelations: {
    brokerContact: undefined,
    ndaRequired: false,
    dataRoomAccessUrl: ""
  },
  amenities: {
    cinemas: false,
    foodCourt: false,
    hypermarket: false,
    departmentStore: false,
    entertainment: false,
    skiResort: false,
    aquarium: false,
    iceRink: false,
    hotel: false,
    offices: false,
    residential: false,
    mosque: false,
    clinic: false,
    bankingServices: false,
    vip_lounges: false,
    nursery: false
  },
  features: [],
  developer: {
    name: "",
    slug: "",
    established: new Date().getFullYear(),
    portfolio: []
  },
  yearBuilt: new Date().getFullYear(),
  yearOpened: new Date().getFullYear(),
  rating: 5,
  visitorsAnnually: 0,
  architecture: "",
  image: "",
  gallery: [],
  floorPlan: "",
  locationDetails: {
    description: "",
    coordinates: {
      latitude: 0,
      longitude: 0
    },
    connectivity: {
      metroStation: "",
      metroDistance: 0,
      highways: [],
      airports: [],
      publicTransport: []
    },
    demographics: {
      catchmentPopulation: 0,
      averageIncome: "",
      touristFootfall: 0
    }
  },
  verified: true,
  isActive: true,
  isAvailable: true,
  isOperational: false
}

export function MallFormModal({ isOpen, onClose, onSuccess, mall, mode }: MallFormModalProps) {
  // Use custom hooks for form logic and validation
  const {
    formData,
    setFormData,
    currentStep,
    setCurrentStep,
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
  } = useMallFormLogic({
    initialFormData,
    isOpen,
    mode,
    mall,
    onSuccess,
    onClose
  })

  const {
    getStepStatus,
    isFormValid
  } = useMallFormValidation({ formData })

  // Render current step content
  const renderStepContent = () => {
    const currentStepId = steps[currentStep].id

    switch (currentStepId) {
      case "basic":
        return (
          <BasicInfoStep
            formData={formData}
            errors={errors}
            setErrors={setErrors}
            onInputChange={handleInputChange}
          />
        )

      case "size-price":
        return (
          <SizePriceStep
            formData={formData}
            errors={errors}
            setErrors={setErrors}
            onInputChange={handleInputChange}
          />
        )

      case "rental":
        return (
          <RentalOperationsStep
            formData={formData}
            errors={errors}
            setErrors={setErrors}
            onInputChange={handleInputChange}
          />
        )

      case "sale-legal":
        return (
          <SaleLegalStep
            formData={formData}
            errors={errors}
            setErrors={setErrors}
            onInputChange={handleInputChange}
          />
        )

      case "features":
        return (
          <FeaturesAmenitiesStep
            formData={formData}
            errors={errors}
            setErrors={setErrors}
            onInputChange={handleInputChange}
          />
        )

      case "location":
        return (
          <LocationDetailsStep
            formData={formData}
            errors={errors}
            setErrors={setErrors}
            onInputChange={handleInputChange}
          />
        )

      case "marketing":
        return (
          <MarketingMediaStep
            formData={formData}
            errors={errors}
            setErrors={setErrors}
            onInputChange={handleInputChange}
            mode={mode}
          />
        )

      case "settings":
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
          if ((window as any).handleMallFormClose) {
            (window as any).handleMallFormClose()
          } else {
            onClose()
          }
        }
      }}>
        <DialogContent className="max-w-6xl max-h-[95vh] p-0 flex flex-col">
          <DialogHeader className="p-6 pb-0 flex-shrink-0">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              {mode === "add" ? "Add New Mall" : "Edit Mall"}
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                  Unsaved Changes
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Step Navigation */}
          <MallFormStepNavigation
            steps={steps}
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
              {currentStep < steps.length - 1 ? (
                <Button onClick={nextStep}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !isFormValid()}
                >
                  {isSubmitting ? "Saving..." : mode === "edit" ? "Update Mall" : "Create Mall"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}