// components/property/PropertyFormModal.tsx
"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ChevronLeft, ChevronRight, AlertCircle, Building2, DollarSign, 
  FileText, MapPin, Camera, Settings, Home, Users, Bed, Bath
} from "lucide-react"
import type { IProperty, PropertyFormData, PropertyFormModalProps, PropertyStep } from "@/types/properties"
import { validatePropertyFormData } from "@/lib/property-validation"
import {
  savePropertyFormDraft,
  loadPropertyFormDraft,
  clearPropertyFormDraft,
  hasSavedPropertyDraft,
  getPropertyDraftTimestamp,
  createDebouncedPropertySave,
  propertyToFormData
} from "@/lib/property-form-persistence"

// Import step components
import { PropertyFormStepNavigation } from "./PropertyFormStepNavigation"
import { BasicInfoStep } from "./steps/BasicInfoStep"
import { SpecificationsStep } from "./steps/SpecificationsStep"
import { LocationStep } from "./steps/LocationStep"
import { PricingStep } from "./steps/PricingStep"
import { DescriptionStep } from "./steps/DescriptionStep"
import { MediaStep } from "./steps/MediaStep"
import { AmenitiesStep } from "./steps/AmenitiesStep"
import { LinksStep } from "./steps/LinksStep"
import { SettingsReviewStep } from "./steps/SettingsReviewStep"

// Import hooks and utilities
import { usePropertyFormLogic } from "./hooks/usePropertyFormLogic"
import { usePropertyFormValidation } from "./hooks/usePropertyFormValidation"
import { ConfirmationDialogs } from "./ConfirmationDialogs"
import { DraftRestoreDialog } from "./DraftRestoreDialog"

// Step configuration - matching property schema
const steps: PropertyStep[] = [
  { id: "basic", title: "Basic Info", icon: Building2, description: "Name, property type, ownership" },
  { id: "specifications", title: "Specifications", icon: Home, description: "Bedrooms, bathrooms, areas, floor" },
  { id: "location", title: "Location", icon: MapPin, description: "Address, coordinates, area" },
  { id: "pricing", title: "Pricing", icon: DollarSign, description: "Price, price per sq ft" },
  { id: "description", title: "Description", icon: FileText, description: "Description and overview" },
  { id: "media", title: "Images & Media", icon: Camera, description: "Cover image, gallery images" },
  { id: "amenities", title: "Amenities", icon: Users, description: "Amenity categories and items" },
  { id: "links", title: "Links & Agent", icon: Users, description: "Project, developer, agent links" },
  { id: "settings", title: "Settings & Review", icon: Settings, description: "Final settings, review" }
]

// Initial form data matching property schema
const initialFormData: PropertyFormData = {
  name: "",
  
  // Optional linking
  projectName: "",
  projectSlug: "",
  developerName: "",
  developerSlug: "",
  communityName: "",
  communitySlug: "",
  agentId: "",
  agentName: "",
  agentPhone: "",
  agentEmail: "",
  
  // Property specifications
  propertyType: "",
  bedrooms: 1,
  bathrooms: 0,
  builtUpArea: "",
  carpetArea: "",
  furnishingStatus: "",
  facingDirection: "",
  floorLevel: 0,
  
  // Ownership & Availability
  ownershipType: "",
  propertyStatus: "",
  availabilityStatus: "Ready",
  
  // Location
  address: "",
  area: "",
  city: "",
  country: "UAE",
  latitude: 25.2048,
  longitude: 55.2708,
  
  // Pricing
  price: "",
  priceNumeric: 0,
  pricePerSqFt: 0,
  
  // Description
  description: "",
  overview: "",
  
  // Media
  coverImage: "",
  gallery: ["https://via.placeholder.com/800x600.jpg?text=Property+Gallery+Image"],
  
  // Amenities
  amenities: [{
    category: "Basic Amenities",
    items: ["Parking", "24/7 Security"]
  }],
  
  // Payment Plan (for primary market)
  hasPaymentPlan: false,
  paymentPlan: {
    booking: "10%",
    construction: [{ milestone: "Foundation", percentage: "20%" }],
    handover: "70%"
  },
  
  // Flags
  flags: {
    elite: false,
    exclusive: false,
    featured: false,
    highValue: false
  },
  
  // Metadata
  tags: [],
  isActive: true
}

export function PropertyFormModal({ isOpen, onClose, onSuccess, property, mode }: PropertyFormModalProps) {
  // Debug notification
  React.useEffect(() => {
    if (isOpen && process.env.NODE_ENV === 'development') {
      console.log('🚪 Property Form Modal opened in DEBUG mode')
      console.log('💡 Watch this console for detailed submission logs and error parsing')
      console.log('🔍 Form mode:', mode, '| Property:', property?.name || 'New Property')
    }
  }, [isOpen, mode, property])
  
  // Use custom hooks for form logic and validation
  const {
    formData,
    setFormData,
    currentStep,
    setCurrentStep,
    errors,
    setErrors,
    isSubmitting,
    setIsSubmitting,
    handleInputChange,
    generateDisplayPrice,
    resetForm
  } = usePropertyFormLogic(initialFormData, property, mode)

  const {
    validateCurrentStep,
    validateAllSteps,
    getStepValidationStatus,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    resetChangeTracking
  } = usePropertyFormValidation(formData, currentStep)

  // Draft management
  const [showDraftDialog, setShowDraftDialog] = useState(false)
  const [draftTimestamp, setDraftTimestamp] = useState<Date | null>(null)
  
  // Track initialization to prevent duplicate runs
  const initializedRef = useRef<{ mode: string, propertyId: string } | null>(null)

  // Auto-save draft functionality
  const debouncedSave = useCallback(
    createDebouncedPropertySave(mode === 'edit' ? property?.slug : undefined, 3000), // 3 second delay
    [mode, property?.slug]
  )

  // Initialize form data and check for drafts
  useEffect(() => {
    if (!isOpen) {
      // Reset initialization tracking when modal closes
      initializedRef.current = null
      return
    }
    
    const currentKey = `${mode}_${property?.id || 'new'}`
    
    // Skip if already initialized for this mode/property combination
    if (initializedRef.current?.mode === mode && 
        initializedRef.current?.propertyId === (property?.id || 'new')) {
      return
    }
    
    if (mode === 'edit' && property) {
      // Load existing property data for edit mode
      const convertedData = propertyToFormData(property)
      setFormData(convertedData)
      setHasUnsavedChanges(false)
    } else if (mode === 'add') {
      // Check for saved draft
      const hasDraft = hasSavedPropertyDraft()
      if (hasDraft) {
        const timestamp = getPropertyDraftTimestamp()
        setDraftTimestamp(timestamp)
        setShowDraftDialog(true)
      } else {
        setFormData(initialFormData)
        setCurrentStep(0)
        setErrors({})
        setIsSubmitting(false)
        setHasUnsavedChanges(false)
      }
    }
    
    // Mark as initialized
    initializedRef.current = { mode, propertyId: property?.id || 'new' }
  }, [isOpen, mode, property?.id])

  // Auto-save draft when form data changes
  useEffect(() => {
    if (isOpen && hasUnsavedChanges && mode === 'add') {
      debouncedSave(formData)
    }
  }, [formData, hasUnsavedChanges, isOpen, mode, debouncedSave])

  // Draft dialog handlers
  const handleRestoreDraft = () => {
    const draft = loadPropertyFormDraft()
    if (draft) {
      setFormData(draft)
      setHasUnsavedChanges(true)
    }
    setShowDraftDialog(false)
  }

  const handleDiscardDraft = () => {
    clearPropertyFormDraft()
    resetForm()
    resetChangeTracking()
    setShowDraftDialog(false)
  }

  // Navigation handlers
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const currentStepValid = validateCurrentStep()
      console.log('🔍 Step validation:', {
        currentStep,
        stepId: steps[currentStep].id,
        isValid: currentStepValid.isValid,
        errors: currentStepValid.fieldErrors
      })
      
      if (currentStepValid.isValid) {
        setCurrentStep(currentStep + 1)
      } else {
        // Set errors to display validation issues
        setErrors(currentStepValid.fieldErrors || {})
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepClick = (stepIndex: number) => {
    // Allow navigation to any step
    setCurrentStep(stepIndex)
  }

  // Form submission
  const handleSubmit = async () => {
    // Clear previous errors
    setErrors({})
    
    const validation = validateAllSteps()
    if (!validation.isValid) {
      setErrors(validation.fieldErrors || {})
      return
    }

    setIsSubmitting(true)
    try {
      // Prepare data for API
      const submitData = {
        ...formData,
        // Generate slugs
        id: property?.id || `prop_${Date.now()}`,
        slug: formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        
        // Convert flat form data to nested structure expected by API
        project: formData.projectSlug ? {
          projectName: formData.projectName,
          projectSlug: formData.projectSlug
        } : undefined,
        
        developer: formData.developerSlug ? {
          developerName: formData.developerName,
          developerSlug: formData.developerSlug
        } : undefined,
        
        community: formData.communitySlug ? {
          communityName: formData.communityName,
          communitySlug: formData.communitySlug
        } : undefined,
        
        agent: formData.agentId ? {
          agentId: formData.agentId,
          agentName: formData.agentName,
          phoneNumber: formData.agentPhone,
          email: formData.agentEmail
        } : undefined,
        
        location: {
          address: formData.address,
          area: formData.area,
          city: formData.city,
          country: formData.country,
          coordinates: {
            latitude: formData.latitude,
            longitude: formData.longitude
          }
        },
        
        // Remove form-specific fields that don't belong in API
        hasPaymentPlan: undefined,
        projectName: undefined,
        projectSlug: undefined,
        developerName: undefined,
        developerSlug: undefined,
        communityName: undefined,
        communitySlug: undefined,
        agentId: undefined,
        agentName: undefined,
        agentPhone: undefined,
        agentEmail: undefined,
        address: undefined,
        area: undefined,
        city: undefined,
        country: undefined,
        latitude: undefined,
        longitude: undefined
      }

      const endpoint = mode === 'edit' ? `/api/properties/update/${property?.slug}` : '/api/properties/add'
      const method = mode === 'edit' ? 'PUT' : 'POST'

      console.log('🚀 Submitting property data:', {
        endpoint,
        method,
        dataKeys: Object.keys(submitData),
        submitData: JSON.stringify(submitData, null, 2)
      })

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      if (!response.ok) {
        console.log('❌ Response not OK:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        })
        
        const errorData = await response.json()
        console.log('📝 Full error response:', errorData)
        
        // Handle validation errors from backend
        if ((errorData.error === 'VALIDATION_ERROR' || errorData.error === 'DB_VALIDATION_ERROR') && errorData.errors) {
          const backendErrors: Record<string, string> = {}
          
          console.log('🔍 Backend validation error details:', {
            errorType: errorData.error,
            errors: errorData.errors,
            message: errorData.message
          })
          
          // If errors is an array, convert to field-specific errors
          if (Array.isArray(errorData.errors)) {
            errorData.errors.forEach((errorMsg: string, index: number) => {
              console.log(`📝 Processing error ${index + 1}:`, errorMsg)
              
              // Multiple parsing patterns for different error formats
              const fieldMatch1 = errorMsg.match(/^([a-zA-Z.\\[\\]0-9_]+)\\s+(.*)/)
              const pathMatch = errorMsg.match(/Path `([^`]+)` (.+)/)
              const castMatch = errorMsg.match(/Cast to (\\w+) failed for value .* at path \"([^\"]+)\"/)
              const embeddedMatch = errorMsg.match(/Cast to Embedded failed for value .* at path \"([^\"]+)\"/)
              const validationMatch = errorMsg.match(/ValidationError: ([^:]+): (.+)/)
              const fieldCastMatch = errorMsg.match(/([^:]+): Cast to .* failed/)
              
              if (pathMatch) {
                const fieldName = pathMatch[1]
                const message = pathMatch[2]
                backendErrors[fieldName] = message
                console.log(`✅ Mapped path error: ${fieldName} -> ${message}`)
              } else if (castMatch) {
                const fieldName = castMatch[2]
                const message = `Invalid ${castMatch[1].toLowerCase()} value`
                backendErrors[fieldName] = message
                console.log(`✅ Mapped cast error: ${fieldName} -> ${message}`)
              } else if (embeddedMatch) {
                const fieldName = embeddedMatch[1]
                const message = `Invalid object structure for ${fieldName}`
                backendErrors[fieldName] = message
                console.log(`✅ Mapped embedded cast error: ${fieldName} -> ${message}`)
              } else if (fieldCastMatch) {
                const fieldName = fieldCastMatch[1]
                const message = `Invalid data type for ${fieldName}`
                backendErrors[fieldName] = message
                console.log(`✅ Mapped field cast error: ${fieldName} -> ${message}`)
              } else if (validationMatch) {
                const fieldName = validationMatch[1]
                const message = validationMatch[2]
                backendErrors[fieldName] = message
                console.log(`✅ Mapped validation error: ${fieldName} -> ${message}`)
              } else if (fieldMatch1 && fieldMatch1[1].includes('.')) {
                // Nested field like \"location.address\"
                const fieldName = fieldMatch1[1]
                const message = fieldMatch1[2]
                backendErrors[fieldName] = message
                console.log(`✅ Mapped nested field: ${fieldName} -> ${message}`)
              } else {
                // Try to extract field name from common error patterns
                const commonPatterns = [
                  /^(\\w+)\\s+(.+)$/, // \"fieldName error message\"
                  /(\\w+):\\s*(.+)/, // \"fieldName: error message\"
                  /\"([^\"]+)\".*?(.+)/, // \"fieldName\" in quotes
                ]
                
                let matched = false
                for (const pattern of commonPatterns) {
                  const match = errorMsg.match(pattern)
                  if (match) {
                    const fieldName = match[1]
                    const message = match[2]
                    backendErrors[fieldName] = message
                    console.log(`✅ Mapped with pattern: ${fieldName} -> ${message}`)
                    matched = true
                    break
                  }
                }
                
                if (!matched) {
                  // Generic error - add to submit errors
                  console.log(`⚠️ Could not parse field from error: ${errorMsg}`)
                  if (backendErrors.submit) {
                    backendErrors.submit += '; ' + errorMsg
                  } else {
                    backendErrors.submit = errorMsg
                  }
                }
              }
            })
          } else if (typeof errorData.errors === 'object') {
            // Errors already in field format
            console.log('📊 Using object format errors:', errorData.errors)
            Object.assign(backendErrors, errorData.errors)
          }
          
          // Add general submit error
          if (!backendErrors.submit) {
            backendErrors.submit = errorData.message || 'Validation failed'
          }
          
          console.log('🎯 Final mapped errors:', backendErrors)
          
          setErrors(backendErrors)
          return // Don't throw, just set errors and return
        }
        
        // Handle other error types
        throw new Error(errorData.message || 'Failed to save property')
      }

      const savedProperty = await response.json()
      
      // Clear draft on successful save
      if (mode === 'add') {
        clearPropertyFormDraft()
      }
      
      // Reset change tracking
      resetChangeTracking()
      
      onSuccess(savedProperty)
      onClose()
    } catch (error) {
      console.error('Error saving property:', error)
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to save property' })
    } finally {
      setIsSubmitting(false)
    }
  }


  // Render current step
  const renderCurrentStep = () => {
    switch (steps[currentStep].id) {
      case 'basic':
        return (
          <BasicInfoStep
            formData={formData}
            errors={errors}
            setErrors={setErrors}
            onInputChange={handleInputChange}
          />
        )
      case 'specifications':
        return (
          <SpecificationsStep
            formData={formData}
            errors={errors}
            setErrors={setErrors}
            onInputChange={handleInputChange}
          />
        )
      case 'location':
        return (
          <LocationStep
            formData={formData}
            errors={errors}
            setErrors={setErrors}
            onInputChange={handleInputChange}
          />
        )
      case 'pricing':
        return (
          <PricingStep
            formData={formData}
            errors={errors}
            setErrors={setErrors}
            onInputChange={handleInputChange}
          />
        )
      case 'description':
        return (
          <DescriptionStep
            formData={formData}
            errors={errors}
            setErrors={setErrors}
            onInputChange={handleInputChange}
          />
        )
      case 'media':
        return (
          <MediaStep
            formData={formData}
            errors={errors}
            setErrors={setErrors}
            onInputChange={handleInputChange}
          />
        )
      case 'amenities':
        return (
          <AmenitiesStep
            formData={formData}
            errors={errors}
            setErrors={setErrors}
            onInputChange={handleInputChange}
          />
        )
      case 'links':
        return (
          <LinksStep
            formData={formData}
            errors={errors}
            setErrors={setErrors}
            onInputChange={handleInputChange}
          />
        )
      case 'settings':
        return (
          <SettingsReviewStep
            formData={formData}
            errors={errors}
            setErrors={setErrors}
            onInputChange={handleInputChange}
            validationStatus={getStepValidationStatus()}
          />
        )
      default:
        return null
    }
  }

  return (
    <>
      {/* Draft Restore Dialog */}
      <DraftRestoreDialog
        isOpen={showDraftDialog}
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
          if ((window as any).handlePropertyFormClose) {
            (window as any).handlePropertyFormClose()
          } else {
            onClose()
          }
        }
      }}>
        <DialogContent className="max-w-6xl max-h-[95vh] p-0 flex flex-col">
          <DialogHeader className="p-6 pb-0 flex-shrink-0">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              {mode === "add" ? "Add New Property" : "Edit Property"}
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                  Unsaved Changes
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Step Navigation */}
          <PropertyFormStepNavigation
            steps={steps}
            currentStep={currentStep}
            onStepClick={handleStepClick}
            validationStatus={getStepValidationStatus()}
          />

          {/* Step Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {renderCurrentStep()}
          </div>

          {/* Navigation Footer */}
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              {currentStep < steps.length - 1 ? (
                <Button onClick={handleNext}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !validateAllSteps().isValid || Object.keys(errors).some(key => key !== 'submit')}
                >
                  {isSubmitting ? "Saving..." : mode === "edit" ? "Update Property" : "Create Property"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}