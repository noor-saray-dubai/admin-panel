// components/building/hooks/useBuildingFormLogic.ts
import { useState, useEffect, useCallback, useMemo } from "react"
import { useToast } from "@/components/ui/toast-system"
import type { IBuilding, BuildingFormData } from "@/types/buildings"
import { validateBuildingFormData } from "@/lib/building-validation"
import {
  saveBuildingFormDraft,
  loadBuildingFormDraft,
  clearBuildingFormDraft,
  hasSavedBuildingDraft,
  getBuildingDraftTimestamp,
  createDebouncedBuildingSave
} from "@/lib/building-form-persistence"

export interface UseBuildingFormLogicProps {
  initialFormData: BuildingFormData
  isOpen: boolean
  mode: "add" | "edit"
  building?: IBuilding | null
  onSuccess: (data: BuildingFormData) => void
  onClose: () => void
}

export function useBuildingFormLogic({
  initialFormData,
  isOpen,
  mode,
  building,
  onSuccess,
  onClose
}: UseBuildingFormLogicProps) {
  const toast = useToast()
  const [formData, setFormData] = useState<BuildingFormData>(initialFormData)
  const [currentStep, setCurrentStep] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Draft restoration state
  const [showDraftRestoreDialog, setShowDraftRestoreDialog] = useState(false)
  const [draftTimestamp, setDraftTimestamp] = useState<string | null>(null)
  const [isDraftRestored, setIsDraftRestored] = useState(false)
  const [baselineFormData, setBaselineFormData] = useState<BuildingFormData>(initialFormData)

  // Create debounced save function (3 second delay to avoid excessive saves)
  const debouncedSave = useMemo(
    () => createDebouncedBuildingSave(3000),
    []
  )

  // Track unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (mode === "edit" && building) {
      const hasChanges = JSON.stringify(formData) !== JSON.stringify(building)
      return hasChanges
    }
    
    // In add mode, compare against the baseline (initial or restored draft)
    const hasChangesFromBaseline = JSON.stringify(formData) !== JSON.stringify(baselineFormData)
    
    // Also check if any meaningful data has been entered (fallback for new forms)
    const hasContent = !!(formData.name.trim() || 
                         formData.location.trim() || 
                         formData.description.trim() ||
                         formData.price.value.trim() ||
                         formData.dimensions.floors > 1 ||
                         formData.totalUnits > 0 ||
                         formData.category.trim() ||
                         formData.type.trim())
    
    const result = hasChangesFromBaseline || hasContent
    
    // Debug logging (can be removed in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('Building add mode - Has changes:', result, {
        hasChangesFromBaseline,
        hasContent,
        isDraftRestored
      })
    }
    
    return result
  }, [formData, mode, building, baselineFormData, isDraftRestored])

  // Transform building data to form data structure
  const transformBuildingToFormData = useCallback((buildingData: IBuilding): BuildingFormData => {
    return {
      ...initialFormData,
      ...buildingData,
      // Ensure proper defaults for optional nested objects
      developer: buildingData.developer ? {
        name: buildingData.developer.name || '',
        slug: buildingData.developer.slug || '',
        established: buildingData.developer.established || new Date().getFullYear(),
        portfolio: buildingData.developer.portfolio || []
      } : initialFormData.developer,
      operationalDetails: buildingData.operationalDetails || initialFormData.operationalDetails,
      legalDetails: buildingData.legalDetails || initialFormData.legalDetails,
      marketingMaterials: buildingData.marketingMaterials || initialFormData.marketingMaterials,
      investorRelations: buildingData.investorRelations || initialFormData.investorRelations,
      locationDetails: buildingData.locationDetails || initialFormData.locationDetails,
      amenities: buildingData.amenities || initialFormData.amenities,
      // Ensure arrays are properly initialized
      features: buildingData.features || [],
      gallery: buildingData.gallery || [],
      floorPlans: buildingData.floorPlans || [],
      highlights: buildingData.highlights || [],
      units: buildingData.units || [],
      // Handle nested objects that might be missing
      saleInformation: {
        ...initialFormData.saleInformation,
        ...buildingData.saleInformation
      },
      financials: {
        ...initialFormData.financials,
        ...buildingData.financials
      }
    } as BuildingFormData
  }, [initialFormData])

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && building) {
        const transformedData = transformBuildingToFormData(building)
        setFormData(transformedData)
        setBaselineFormData(transformedData)
        setShowDraftRestoreDialog(false)
        setIsDraftRestored(false)
      } else {
        // Check for saved draft in add mode
        const hasDraft = hasSavedBuildingDraft() // This now checks for meaningful data
        if (hasDraft) {
          const timestamp = getBuildingDraftTimestamp()
          setDraftTimestamp(timestamp)
          setShowDraftRestoreDialog(true)
          console.log('📋 Showing draft restore dialog for meaningful draft data')
          // Don't set baseline yet - wait for user decision
        } else {
          setFormData(initialFormData)
          setBaselineFormData(initialFormData)
          setIsDraftRestored(false)
          setShowDraftRestoreDialog(false) // Ensure dialog is hidden
          console.log('✨ Starting fresh - no meaningful draft found')
        }
      }
      setCurrentStep(0)
      setErrors({})
    }
  }, [isOpen, mode, building, initialFormData])

  // Auto-save draft in add mode (only when there's meaningful content)
  useEffect(() => {
    if (mode === "add" && hasUnsavedChanges && !showDraftRestoreDialog) {
      // Only auto-save if user has entered at least a building name
      if (formData.name.trim().length > 2) {
        console.log('Auto-saving building draft...')
        debouncedSave(formData)
      }
    }
  }, [formData, mode, hasUnsavedChanges, debouncedSave, showDraftRestoreDialog])

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !showDraftRestoreDialog && !isSubmitting) {
        // Use confirmation handler if available
        if ((window as any).handleBuildingFormClose) {
          (window as any).handleBuildingFormClose()
        } else {
          onClose()
        }
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, showDraftRestoreDialog, isSubmitting, onClose])

  // Auto-calculate price formatting
  const updatePriceCalculations = useCallback((numericValue: number, currency: string = "AED") => {
    const formatPrice = (amount: number, curr: string) => {
      if (amount >= 1000000000) {
        return `${curr} ${(amount / 1000000000).toFixed(1)}B`
      } else if (amount >= 1000000) {
        return `${curr} ${(amount / 1000000).toFixed(1)}M`
      } else if (amount >= 1000) {
        return `${curr} ${(amount / 1000).toFixed(1)}K`
      } else {
        return `${curr} ${amount.toLocaleString()}`
      }
    }

    const formattedValue = formatPrice(numericValue, currency)
    
    setFormData(prev => ({
      ...prev,
      price: {
        ...prev.price,
        value: formattedValue,
        valueNumeric: numericValue,
        currency
      }
    }))
  }, [])

  // Handle input changes
  const handleInputChange = useCallback((field: string, value: any) => {
    // Debug logging for image uploads
    if (field === 'mainImage' || field === 'gallery' || field === 'floorPlans') {
      console.log(`🖼️ ${field} field updated:`, value, '- will be saved in draft')
    }
    
    setFormData(prev => {
      const newData = { ...prev }
      
      // Handle nested fields
      if (field.includes('.')) {
        const keys = field.split('.')
        let current: any = newData
        
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {}
          }
          current = current[keys[i]]
        }
        
        current[keys[keys.length - 1]] = value
      } else {
        // Use type assertion to safely update top-level fields
        (newData as any)[field] = value
      }
      
      console.log('📝 Building form data updated - field:', field, 'value:', value)
      return newData
    })

    // Auto-calculate related fields
    if (field === 'price.valueNumeric' && typeof value === 'number') {
      setTimeout(() => {
        setFormData(current => {
          const currency = current.price?.currency ?? "AED"
          updatePriceCalculations(value, currency)
          return current
        })
      }, 0)
    }

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }, [errors, updatePriceCalculations])

  // Navigation functions
  const nextStep = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, 4)) // 5 steps total (0-4)
  }, [])

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }, [])

  const goToStep = useCallback((step: number) => {
    setCurrentStep(step)
  }, [])

  // Draft restoration handlers
  const handleRestoreDraft = useCallback(() => {
    try {
      const draft = loadBuildingFormDraft()
      if (draft) {
        const restoredData = {
          ...initialFormData,
          ...draft // Include all data including image URLs
        }
        setFormData(restoredData)
        setBaselineFormData(restoredData) // Set restored data as new baseline
        setIsDraftRestored(true)
        toast.success("Building draft restored successfully with images")
      }
    } catch (error) {
      toast.error("Failed to restore building draft")
    }
    setShowDraftRestoreDialog(false)
  }, [initialFormData, toast])

  const handleDiscardDraft = useCallback(() => {
    clearBuildingFormDraft()
    setFormData(initialFormData)
    setBaselineFormData(initialFormData) // Reset baseline to initial
    setIsDraftRestored(false)
    setShowDraftRestoreDialog(false)
    toast.success("Building draft discarded - starting fresh")
  }, [initialFormData])

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormData(initialFormData)
    setBaselineFormData(initialFormData)
    setIsDraftRestored(false)
    setCurrentStep(0)
    setErrors({})
    console.log('Building form reset to initial state')
  }, [initialFormData])

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true)
    
    try {
      // Client-side validation before submission
      const validation = validateBuildingFormData(formData)
      if (!validation.isValid) {
        // Set field errors for display
        setErrors(validation.errors)
        toast.error("Please fix the validation errors before submitting")
        return
      }
      
      // Clear any existing errors
      setErrors({})
      
      // Submit form data
      await onSuccess(formData)
      
      // Clear draft after successful submission in add mode
      if (mode === "add") {
        clearBuildingFormDraft()
      }
      
      // Reset form state to prevent stale data
      setFormData(initialFormData)
      setBaselineFormData(initialFormData)
      setIsDraftRestored(false)
      setCurrentStep(0)
      setErrors({})
      setShowDraftRestoreDialog(false)
      
      console.log('✅ Building form submitted successfully and state reset')
      
      // Success is handled by the parent component (it calls onClose)
      // So we don't call toast.success or onClose here to avoid duplicates
    } catch (error: any) {
      console.error("Error submitting building form:", error)
      
      // Extract structured error info if available
      const errorType = error?.errorType || ''
      let fieldErrors: Record<string, string> | undefined
      
      // Handle different error formats from API
      if (error?.fieldErrors) {
        if (typeof error.fieldErrors === 'object' && !Array.isArray(error.fieldErrors)) {
          fieldErrors = error.fieldErrors as Record<string, string>
        } else if (Array.isArray(error.fieldErrors)) {
          // Convert array errors to object format for display
          fieldErrors = error.fieldErrors.reduce((acc: Record<string, string>, errorMsg: string, index: number) => {
            acc[`Field ${index + 1}`] = errorMsg
            return acc
          }, {})
        }
      }

      // If API returned field-level errors, surface them in the UI state and go to Review step
      if (fieldErrors && Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors)
        // Jump to the last step (Settings & Review) so user sees errors summary
        setCurrentStep(4) // Building has 5 steps (0-4), last step is index 4
        // Let user know they've been redirected to see errors
        setTimeout(() => {
          toast.info(`Redirected to Review step to view ${Object.keys(fieldErrors).length} validation error${Object.keys(fieldErrors).length > 1 ? 's' : ''}`)
        }, 500)
      }

      // Show user-friendly toasts based on error type
      if (errorType === 'VALIDATION_ERROR') {
        if (fieldErrors && Object.keys(fieldErrors).length > 0) {
          toast.error(`Building form validation failed. Check Review step for ${Object.keys(fieldErrors).length} error${Object.keys(fieldErrors).length > 1 ? 's' : ''}.`)
        } else {
          toast.error("Building form has validation errors. Please review your input.")
        }
      } else if (errorType === 'DB_VALIDATION_ERROR') {
        if (fieldErrors && Object.keys(fieldErrors).length > 0) {
          toast.error(`Database validation failed. Check Review step for ${Object.keys(fieldErrors).length} error${Object.keys(fieldErrors).length > 1 ? 's' : ''}.`)
        } else {
          toast.error(error.message || "Database validation error. Please check your input.")
        }
      } else if (errorType === 'DUPLICATE_ENTRY') {
        toast.error(error.message || "A building with this name already exists. Please choose a different name.")
      } else if (errorType === 'RATE_LIMITED') {
        toast.error("Too many requests. Please wait a moment before trying again.")
      } else if (errorType === 'EMPTY_DATA') {
        toast.error("No data submitted. Please fill in the required fields.")
      } else if (errorType === 'NOT_FOUND') {
        toast.error("Building not found. It may have been deleted by another user.")
      } else if (typeof error?.message === 'string') {
        toast.error(error.message)
      } else {
        toast.error("Failed to save building. Please check your connection and try again.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, mode, onSuccess, toast, setErrors, setCurrentStep])

  return {
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
    // Draft restoration
    showDraftRestoreDialog,
    draftTimestamp,
    handleRestoreDraft,
    handleDiscardDraft
  }
}