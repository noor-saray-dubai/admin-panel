// components/project/ProjectFormModal.tsx
"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ChevronLeft, ChevronRight, AlertCircle, Building, DollarSign, 
  FileText, Users, MapPin, Camera, Settings, Package, Hammer, Calendar
} from "lucide-react"
import type { IProject, ProjectFormData, ProjectFormModalProps, ProjectStep } from "@/types/projects"
import { validateProjectFormData } from "@/lib/project-validation"
import {
  saveProjectFormDraft,
  loadProjectFormDraft,
  clearProjectFormDraft,
  hasSavedProjectDraft,
  getProjectDraftTimestamp,
  createDebouncedProjectSave,
  projectToFormData
} from "@/lib/project-form-persistence"

// Import step components
import { ProjectFormStepNavigation } from "./ProjectFormStepNavigation"
import { BasicInfoStep } from "./steps/BasicInfoStep"
import { PricingPaymentStep } from "./steps/PricingPaymentStep"
import { DetailsOverviewStep } from "./steps/DetailsOverviewStep"
import { UnitsAmenitiesStep } from "./steps/UnitsAmenitiesStep"
import { LocationDetailsStep } from "./steps/LocationDetailsStep"
import { MarketingMediaStep } from "./steps/MarketingMediaStep"
import { SettingsReviewStep } from "./steps/SettingsReviewStep"

// Import hooks and utilities
import { useProjectFormLogic } from "./hooks/useProjectFormLogic"
import { useProjectFormValidation } from "./hooks/useProjectFormValidation"
import { ConfirmationDialogs } from "./ConfirmationDialogs"
import { DraftRestoreDialog } from "./DraftRestoreDialog"

// Step configuration - matching old form exactly
const steps: ProjectStep[] = [
  { id: "basic", title: "Basic Details", icon: Building, description: "Name, location, type, developer" },
  { id: "pricing", title: "Pricing & Payment", icon: DollarSign, description: "Price, payment plan" },
  { id: "details", title: "Details & Overview", icon: FileText, description: "Description, overview, dates" },
  { id: "units", title: "Units & Amenities", icon: Package, description: "Unit types, amenities" },
  { id: "location", title: "Location Details", icon: MapPin, description: "Detailed location info" },
  { id: "marketing", title: "Images & Media", icon: Camera, description: "Cover image, gallery images" },
  { id: "settings", title: "Settings & Review", icon: Settings, description: "Final settings, review" }
]

// Initial form data
const initialFormData: ProjectFormData = {
  name: "",
  subtitle: "",
  location: "",
  subLocation: "",
  type: "",
  status: "",
  developer: "",
  developerSlug: "",
  
  // Pricing
  price: {
    total: "",
    totalNumeric: 0,
    currency: "AED"
  },
  
  paymentPlan: {
    booking: "",
    construction: [{ milestone: "", percentage: "" }],
    handover: ""
  },
  
  // Details
  description: "",
  overview: "",
  completionDate: "",
  launchDate: "",
  totalUnits: 0,
  
  // Features
  amenities: [{
    category: "Basic Amenities",
    items: ["Parking"]
  }],
  unitTypes: [{
    type: "1 Bedroom",
    size: "500 sq ft",
    price: "AED 500K"
  }],
  features: [],
  
  // Media - Using URLs for instant upload
  image: "",
  gallery: ["https://via.placeholder.com/800x600.jpg?text=Sample+Gallery+Image"],
  floorPlan: "",
  brochure: "",
  
  // Location - Match actual schema
  locationDetails: {
    description: "Prime location with excellent connectivity",
    nearby: [{
      name: "Metro Station",
      distance: "500m"
    }],
    coordinates: { latitude: 25.2048, longitude: 55.2708 }
  },
  
  // Settings
  categories: ["Residential"],
  registrationOpen: false,
  featured: false,
  flags: {
    elite: false,
    exclusive: false,
    featured: false,
    highValue: false
  },
  
  // System fields - Match actual schema
  verified: false,
  isActive: true,
  isAvailable: true
}

export function ProjectFormModal({ isOpen, onClose, onSuccess, project, mode }: ProjectFormModalProps) {
  // Debug notification
  React.useEffect(() => {
    if (isOpen && process.env.NODE_ENV === 'development') {
      console.log('🚪 Project Form Modal opened in DEBUG mode')
      console.log('💡 Watch this console for detailed submission logs and error parsing')
      console.log('🔍 Form mode:', mode, '| Project:', project?.name || 'New Project')
    }
  }, [isOpen, mode, project])
  
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
  } = useProjectFormLogic(initialFormData, project, mode)

  const {
    validateCurrentStep,
    validateAllSteps,
    getStepValidationStatus,
    hasUnsavedChanges,
    setHasUnsavedChanges
  } = useProjectFormValidation(formData, currentStep)

  // Draft management
  const [showDraftDialog, setShowDraftDialog] = useState(false)
  const [showConfirmClose, setShowConfirmClose] = useState(false)
  const [showConfirmCancel, setShowConfirmCancel] = useState(false)
  const [draftTimestamp, setDraftTimestamp] = useState<Date | null>(null)

  // Auto-save draft functionality
  const debouncedSave = useCallback(
    createDebouncedProjectSave(project?.slug, 3000), // 3 second delay
    [project?.slug]
  )

  // Initialize form data and check for drafts
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && project) {
        // Load existing project data
        const convertedData = projectToFormData(project)
        setFormData(convertedData)
      } else if (mode === 'add') {
        // Check for saved draft
        const hasDraft = hasSavedProjectDraft()
        if (hasDraft) {
          const timestamp = getProjectDraftTimestamp()
          setDraftTimestamp(timestamp)
          setShowDraftDialog(true)
        } else {
          resetForm()
        }
      }
    }
  }, [isOpen, mode, project, setFormData, resetForm])

  // Auto-save draft when form data changes
  useEffect(() => {
    if (isOpen && hasUnsavedChanges && mode === 'add') {
      debouncedSave(formData)
    }
  }, [formData, hasUnsavedChanges, isOpen, mode, debouncedSave])

  // Draft dialog handlers
  const handleRestoreDraft = () => {
    const draft = loadProjectFormDraft()
    if (draft) {
      setFormData(draft)
      setHasUnsavedChanges(true)
    }
    setShowDraftDialog(false)
  }

  const handleDiscardDraft = () => {
    clearProjectFormDraft()
    resetForm()
    setShowDraftDialog(false)
  }

  // Navigation handlers
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const currentStepValid = validateCurrentStep()
      if (currentStepValid.isValid) {
        setCurrentStep(currentStep + 1)
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
        // Convert price object to flat fields expected by API
        price: formData.price.total,
        priceNumeric: formData.price.totalNumeric,
        // Generate slugs
        id: project?.slug || `proj_${Date.now()}`,
        slug: formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        locationSlug: formData.location.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        statusSlug: formData.status.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        developerSlug: formData.developer.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      }

      const endpoint = mode === 'edit' ? `/api/projects/update/${project?.slug}` : '/api/projects/add'
      const method = mode === 'edit' ? 'PUT' : 'POST'

      console.log('🚀 Submitting project data:', {
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
              // Pattern 1: "fieldName is required and must be a string."
              const fieldMatch1 = errorMsg.match(/^([a-zA-Z.\[\]0-9_]+)\s+(.*)/)
              // Pattern 2: "Path `fieldName` is required."
              const pathMatch = errorMsg.match(/Path `([^`]+)` (.+)/)
              // Pattern 3: "Cast to Number failed for value ..."
              const castMatch = errorMsg.match(/Cast to (\w+) failed for value .* at path "([^"]+)"/)
              // Pattern 4: "ValidationError: fieldName: message"
              const validationMatch = errorMsg.match(/ValidationError: ([^:]+): (.+)/)
              
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
              } else if (validationMatch) {
                const fieldName = validationMatch[1]
                const message = validationMatch[2]
                backendErrors[fieldName] = message
                console.log(`✅ Mapped validation error: ${fieldName} -> ${message}`)
              } else if (fieldMatch1 && fieldMatch1[1].includes('.')) {
                // Nested field like "locationDetails.description"
                const fieldName = fieldMatch1[1]
                const message = fieldMatch1[2]
                backendErrors[fieldName] = message
                console.log(`✅ Mapped nested field: ${fieldName} -> ${message}`)
              } else {
                // Try to extract field name from common error patterns
                const commonPatterns = [
                  /^(\w+)\s+(.+)$/, // "fieldName error message"
                  /(\w+):\s*(.+)/, // "fieldName: error message"
                  /"([^"]+)".*?(.+)/, // "fieldName" in quotes
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
        throw new Error(errorData.message || 'Failed to save project')
      }

      const savedProject = await response.json()
      
      // Clear draft on successful save
      if (mode === 'add') {
        clearProjectFormDraft()
      }
      
      onSuccess(savedProject)
      onClose()
    } catch (error) {
      console.error('Error saving project:', error)
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to save project' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Close handler with unsaved changes check
  const handleClose = () => {
    if (hasUnsavedChanges && mode === 'add') {
      setShowConfirmClose(true)
    } else {
      onClose()
    }
  }

  const confirmClose = () => {
    setShowConfirmClose(false)
    onClose()
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
      case 'pricing':
        return (
          <PricingPaymentStep
            formData={formData}
            errors={errors}
            setErrors={setErrors}
            onInputChange={handleInputChange}
          />
        )
      case 'details':
        return (
          <DetailsOverviewStep
            formData={formData}
            errors={errors}
            setErrors={setErrors}
            onInputChange={handleInputChange}
          />
        )
      case 'units':
        return (
          <UnitsAmenitiesStep
            formData={formData}
            errors={errors}
            setErrors={setErrors}
            onInputChange={handleInputChange}
          />
        )
      case 'location':
        return (
          <LocationDetailsStep
            formData={formData}
            errors={errors}
            setErrors={setErrors}
            onInputChange={handleInputChange}
          />
        )
      case 'marketing':
        return (
          <MarketingMediaStep
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
          if ((window as any).handleProjectFormClose) {
            (window as any).handleProjectFormClose()
          } else {
            onClose()
          }
        }
      }}>
        <DialogContent className="max-w-6xl max-h-[95vh] p-0 flex flex-col">
          <DialogHeader className="p-6 pb-0 flex-shrink-0">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              {mode === "add" ? "Add New Project" : "Edit Project"}
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                  Unsaved Changes
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Step Navigation */}
          <ProjectFormStepNavigation
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
                  {isSubmitting ? "Saving..." : mode === "edit" ? "Update Project" : "Create Project"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
