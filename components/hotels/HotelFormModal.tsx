// components/hotels/HotelFormModal.tsx
"use client"

import React, { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Hotel, Layers, Star, Image, CheckCircle2, Bed, Utensils } from "lucide-react"
import type { IHotel, HotelFormData } from "@/types/hotels"
import { validateHotelFormData } from "@/lib/hotel-validation"
import { useHotelFormLogic } from "./hooks/useHotelFormLogic"
import { HotelFormStepNavigation, type Step } from "./HotelFormStepNavigation"
import { BasicInformationStep } from "./steps/BasicInformationStep"
import { DimensionsPricingStep } from "./steps/DimensionsPricingStep"
import { AmenitiesServicesStep } from "./steps/AmenitiesServicesStep"
import { RoomsSuitesStep } from "./steps/RoomsSuitesStep"
import { DiningVenuesStep } from "./steps/DiningVenuesStep"
import { MarketingMediaStep } from "./steps/MarketingMediaStep"
import { SettingsReviewStep } from "./steps/SettingsReviewStep"
import { ConfirmationDialogs } from "./ConfirmationDialogs"
import { DraftRestoreDialog } from "./DraftRestoreDialog"
import { useToast } from "@/components/ui/toast-system"

interface HotelFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (data: HotelFormData) => Promise<void>
  hotel?: IHotel | null
  mode: "add" | "edit"
}

// Initial form data structure
const createInitialFormData = (): HotelFormData => ({
  // Basic Information
  name: "",
  subtitle: "",
  location: "",
  subLocation: "",
  type: "",
  
  // Pricing & Dimensions
  price: { total: "", totalNumeric: 0, currency: "AED" },
  dimensions: { floors: 1, height: "", heightNumeric: 0, totalArea: 0, landArea: 0 },
  
  // Timeline
  year: "",
  yearBuilt: undefined,
  yearOpened: undefined,
  
  // Accommodation
  roomsSuites: [],
  totalRooms: 0,
  totalSuites: 0,
  
  // Facilities & Services
  dining: [],
  wellness: undefined,
  meetings: undefined,
  
  // Features & Amenities
  amenities: {},
  features: [],
  facts: [],
  
  // Business Information
  saleInformation: undefined,
  legalDetails: undefined,
  operationalDetails: undefined,
  marketingMaterials: undefined,
  investorRelations: undefined,
  
  // Media
  mainImage: "",
  gallery: [],
  floorPlan: "",
  
  // Location & Connectivity
  locationDetails: undefined,
  
  // Developer/Owner Information
  developer: undefined,
  currentOwner: "",
  
  // Ratings & Performance
  rating: 0,
  customerRating: undefined,
  occupancyRate: undefined,
  
  // Additional Details
  architecture: "",
  description: "",
  
  // Status & Availability
  status: "",
  verified: true,
  isActive: true,
  isAvailable: false,
})

// Define the form steps
const formSteps: Step[] = [
  {
    id: "basic",
    title: "Basic Info",
    icon: Hotel,
    description: "Hotel name, location, type, and description"
  },
  {
    id: "dimensions",
    title: "Dimensions",
    icon: Layers,
    description: "Dimensions, floors, area, and pricing information"
  },
  {
    id: "amenities",
    title: "Amenities",
    icon: Star,
    description: "Amenities, services, features, and performance metrics"
  },
  {
    id: "rooms",
    title: "Rooms",
    icon: Bed,
    description: "Room and suite types with detailed specifications"
  },
  {
    id: "dining",
    title: "Dining",
    icon: Utensils,
    description: "Dining venues, restaurants, and culinary offerings"
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

export function HotelFormModal({ isOpen, onClose, onSuccess, hotel, mode }: HotelFormModalProps) {
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
  } = useHotelFormLogic({
    initialFormData,
    isOpen,
    mode,
    hotel,
    onSuccess,
    onClose
  })

  // Step validation function - only check fields relevant to each step
  const getStepStatus = (stepIndex: number): 'valid' | 'invalid' | 'incomplete' => {
    switch (stepIndex) {
      case 0: // Basic Information
        const basicRequired = formData.name?.trim() && 
                             formData.location?.trim() && 
                             formData.description?.trim() && 
                             formData.type?.trim() && 
                             formData.rating && 
                             formData.status?.trim()
        
        // Check for basic field errors
        const hasBasicErrors = !formData.name?.trim() ||
                              !formData.location?.trim() ||
                              !formData.description?.trim() ||
                              !formData.type?.trim() ||
                              !formData.rating ||
                              !formData.status?.trim() ||
                              (formData.name && formData.name.length > 100) ||
                              (formData.location && formData.location.length > 100) ||
                              (formData.description && formData.description.length > 2000) ||
                              (formData.type && formData.type.length > 50)
        
        if (hasBasicErrors) return basicRequired ? 'invalid' : 'incomplete'
        return basicRequired ? 'valid' : 'incomplete'
        
      case 1: // Dimensions & Pricing
        const dimensionRequired = formData.dimensions?.floors && 
                                 formData.dimensions?.height?.trim() && 
                                 formData.dimensions?.heightNumeric && 
                                 formData.totalRooms && 
                                 formData.price?.totalNumeric && 
                                 formData.price?.currency?.trim() && 
                                 formData.year?.trim()
        
        // Check for dimension field errors
        const hasDimensionErrors = !formData.dimensions?.floors ||
                                  !formData.dimensions?.height?.trim() ||
                                  !formData.dimensions?.heightNumeric ||
                                  !formData.totalRooms ||
                                  !formData.price?.totalNumeric ||
                                  !formData.price?.currency?.trim() ||
                                  !formData.year?.trim() ||
                                  formData.dimensions.floors < 1 ||
                                  formData.dimensions.heightNumeric < 0 ||
                                  formData.totalRooms < 1 ||
                                  formData.price.totalNumeric < 0
        
        if (hasDimensionErrors) return dimensionRequired ? 'invalid' : 'incomplete'
        return dimensionRequired ? 'valid' : 'incomplete'
        
      case 2: // Amenities & Services
        const amenityRequired = Object.keys(formData.amenities || {}).length > 0
        return amenityRequired ? 'valid' : 'incomplete'
        
      case 3: // Rooms & Suites
        const roomsRequired = (formData.roomsSuites && formData.roomsSuites.length > 0)
        
        // Check for room validation errors
        let hasRoomErrors = false
        if (formData.roomsSuites && formData.roomsSuites.length > 0) {
          hasRoomErrors = formData.roomsSuites.some(room => 
            !room.name?.trim() ||
            !room.size?.trim() ||
            !room.description?.trim() ||
            !room.features || room.features.length === 0 ||
            !room.count || room.count < 1
          )
        }
        
        if (hasRoomErrors) return 'invalid'
        return roomsRequired ? 'valid' : 'incomplete'
        
      case 4: // Dining Venues
        const diningRequired = (formData.dining && formData.dining.length > 0)
        
        // Check for dining validation errors
        let hasDiningErrors = false
        if (formData.dining && formData.dining.length > 0) {
          hasDiningErrors = formData.dining.some(venue => 
            !venue.name?.trim() ||
            !venue.type?.trim() ||
            !venue.location?.trim() ||
            !venue.description?.trim()
          )
        }
        
        if (hasDiningErrors) return 'invalid'
        return diningRequired ? 'valid' : 'incomplete'
        
      case 5: // Marketing & Media
        const mediaRequired = formData.mainImage?.trim()
        return mediaRequired ? 'valid' : 'incomplete'
        
      case 6: // Settings & Review
        // For final review, check if all previous steps are valid
        const allStepsValid = [0, 1, 2, 3, 4, 5].every(i => getStepStatus(i) === 'valid')
        return allStepsValid ? 'valid' : 'incomplete'
        
      default:
        return 'incomplete'
    }
  }

  // Validation function for form completion
  const isFormValid = () => {
    const validation = validateHotelFormData(formData)
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

      case "amenities":
        return (
          <AmenitiesServicesStep
            formData={formData}
            errors={errors}
            setErrors={setErrors}
            onInputChange={handleInputChange}
          />
        )

      case "rooms":
        return (
          <RoomsSuitesStep
            formData={formData}
            errors={errors}
            setErrors={setErrors}
            onInputChange={handleInputChange}
          />
        )

      case "dining":
        return (
          <DiningVenuesStep
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
          if ((window as any).handleHotelFormClose) {
            (window as any).handleHotelFormClose()
          } else {
            onClose()
          }
        }
      }}>
        <DialogContent className="max-w-6xl max-h-[95vh] p-0 flex flex-col">
          <DialogHeader className="p-6 pb-0 flex-shrink-0">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Hotel className="h-6 w-6" />
              {mode === "add" ? "Add New Hotel" : "Edit Hotel"}
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                  Unsaved Changes
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Step Navigation */}
          <HotelFormStepNavigation
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
                  {isSubmitting ? "Saving..." : mode === "edit" ? "Update Hotel" : "Create Hotel"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}