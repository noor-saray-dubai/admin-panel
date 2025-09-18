// components/mall/hooks/useMallFormLogic.ts
import { useState, useEffect, useCallback, useMemo } from "react"
import { useToast } from "@/components/ui/toast-system"
import type { IMall, MallFormData } from "@/types/mall"
import { validateMallFormData } from "@/lib/mall-validation"
import {
  saveMallFormDraft,
  loadMallFormDraft,
  clearMallFormDraft,
  hasSavedMallDraft,
  getMallDraftTimestamp,
  createDebouncedMallSave
} from "@/lib/mall-form-persistence"

export interface UseMallFormLogicProps {
  initialFormData: MallFormData
  isOpen: boolean
  mode: "add" | "edit"
  mall?: IMall | null
  onSuccess: (data: MallFormData) => void
  onClose: () => void
}

export function useMallFormLogic({
  initialFormData,
  isOpen,
  mode,
  mall,
  onSuccess,
  onClose
}: UseMallFormLogicProps) {
  const toast = useToast()
  const [formData, setFormData] = useState<MallFormData>(initialFormData)
  const [currentStep, setCurrentStep] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Draft restoration state
  const [showDraftRestoreDialog, setShowDraftRestoreDialog] = useState(false)
  const [draftTimestamp, setDraftTimestamp] = useState<string | null>(null)
  const [isDraftRestored, setIsDraftRestored] = useState(false)
  const [baselineFormData, setBaselineFormData] = useState<MallFormData>(initialFormData)

  // Create debounced save function (3 second delay to avoid excessive saves)
  const debouncedSave = useMemo(
    () => createDebouncedMallSave(3000),
    []
  )

  // Track unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (mode === "edit" && mall) {
      const hasChanges = JSON.stringify(formData) !== JSON.stringify(mall)
      return hasChanges
    }
    
    // In add mode, compare against the baseline (initial or restored draft)
    const hasChangesFromBaseline = JSON.stringify(formData) !== JSON.stringify(baselineFormData)
    
    // Also check if any meaningful data has been entered (fallback for new forms)
    const hasContent = !!(formData.name.trim() || 
                         formData.location.trim() || 
                         formData.price.total.trim() ||
                         formData.size.totalArea > 0 ||
                         formData.subtitle.trim() ||
                         formData.status.trim() ||
                         formData.ownership.trim())
    
    const result = hasChangesFromBaseline || hasContent
    
    // Debug logging (can be removed in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('Add mode - Has changes:', result, {
        hasChangesFromBaseline,
        hasContent,
        isDraftRestored
      })
    }
    
    return result
  }, [formData, mode, mall, baselineFormData, isDraftRestored])

  // Transform mall data to form data structure
  const transformMallToFormData = useCallback((mallData: IMall): MallFormData => {
    return {
      ...initialFormData,
      ...mallData,
      // Ensure proper defaults for optional nested objects
      developer: mallData.developer ? {
        name: mallData.developer.name || '',
        slug: mallData.developer.slug || '',
        established: mallData.developer.established || new Date().getFullYear(),
        portfolio: mallData.developer.portfolio || []
      } : initialFormData.developer,
      operationalDetails: mallData.operationalDetails || initialFormData.operationalDetails,
      leaseDetails: mallData.leaseDetails || initialFormData.leaseDetails,
      marketingMaterials: mallData.marketingMaterials || initialFormData.marketingMaterials,
      investorRelations: mallData.investorRelations || initialFormData.investorRelations,
      locationDetails: mallData.locationDetails || initialFormData.locationDetails,
      amenities: mallData.amenities || initialFormData.amenities,
      // Ensure arrays are properly initialized
      features: mallData.features || [],
      gallery: mallData.gallery || [],
      // Handle nested objects that might be missing
      legalDetails: {
        ...initialFormData.legalDetails,
        ...mallData.legalDetails,
        // Properly handle mortgage details - preserve if exists, otherwise undefined
        mortgageDetails: mallData.legalDetails?.mortgageDetails ? {
          lender: mallData.legalDetails.mortgageDetails.lender || '',
          outstandingAmount: mallData.legalDetails.mortgageDetails.outstandingAmount || 0,
          maturityDate: mallData.legalDetails.mortgageDetails.maturityDate || undefined
        } : undefined
      },
      saleInformation: {
        ...initialFormData.saleInformation,
        ...mallData.saleInformation
      }
    } as MallFormData
  }, [initialFormData])

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && mall) {
        const transformedData = transformMallToFormData(mall)
        setFormData(transformedData)
        setBaselineFormData(transformedData)
        setShowDraftRestoreDialog(false)
        setIsDraftRestored(false)
      } else {
        // Check for saved draft in add mode
        const hasDraft = hasSavedMallDraft()
        if (hasDraft) {
          const timestamp = getMallDraftTimestamp()
          setDraftTimestamp(timestamp)
          setShowDraftRestoreDialog(true)
          // Don't set baseline yet - wait for user decision
        } else {
          setFormData(initialFormData)
          setBaselineFormData(initialFormData)
          setIsDraftRestored(false)
        }
      }
      setCurrentStep(0)
      setErrors({})
    }
  }, [isOpen, mode, mall, initialFormData])

  // Auto-save draft in add mode (only when there's meaningful content)
  useEffect(() => {
    if (mode === "add" && hasUnsavedChanges && !showDraftRestoreDialog) {
      // Only auto-save if user has entered at least a mall name
      if (formData.name.trim().length > 2) {
        console.log('Auto-saving draft...')
        debouncedSave(formData)
      }
    }
  }, [formData, mode, hasUnsavedChanges, debouncedSave, showDraftRestoreDialog])

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !showDraftRestoreDialog && !isSubmitting) {
        // Use confirmation handler if available
        if ((window as any).handleMallFormClose) {
          (window as any).handleMallFormClose()
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

  // Auto-calculate square meters when square feet changes
  const updateSizeCalculations = useCallback((totalArea: number, retailArea?: number) => {
    const totalSqm = Math.round(totalArea * 0.092903 * 100) / 100
    const retailSqm = retailArea ? Math.round(retailArea * 0.092903 * 100) / 100 : Math.round(totalArea * 0.7 * 0.092903 * 100) / 100

    setFormData(prev => ({
      ...prev,
      size: {
        ...prev.size,
        totalArea,
        retailArea: retailArea || Math.round(totalArea * 0.7), // Default to 70% retail
        totalSqm,
        retailSqm
      }
    }))
  }, [])

  // Auto-calculate retail area sqm when retail area sqft changes independently
  const updateRetailAreaCalculations = useCallback((retailArea: number) => {
    const retailSqm = Math.round(retailArea * 0.092903 * 100) / 100

    setFormData(prev => ({
      ...prev,
      size: {
        ...prev.size,
        retailArea,
        retailSqm
      }
    }))
  }, [])

  // Auto-calculate pricing when per sqft or area changes
  const updatePriceCalculations = useCallback((perSqft: number, totalArea: number, currency: string = "AED") => {
    const totalNumeric = Math.round(perSqft * totalArea)
    const total = formatPrice(totalNumeric, currency)

    setFormData(prev => ({
      ...prev,
      price: {
        ...prev.price,
        perSqft,
        totalNumeric,
        total,
        currency
      }
    }))
  }, [])

  // Format price for display
  const formatPrice = (amount: number, currency: string) => {
    if (amount >= 1000000000) {
      return `${currency} ${(amount / 1000000000).toFixed(1)}B`
    } else if (amount >= 1000000) {
      return `${currency} ${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `${currency} ${(amount / 1000).toFixed(1)}K`
    } else {
      return `${currency} ${amount.toLocaleString()}`
    }
  }

  // Handle input changes
  const handleInputChange = useCallback((field: string, value: any) => {
    // Debug logging for image uploads
    if (field === 'image' || field === 'gallery' || field === 'floorPlan') {
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
      
      console.log('📝 Form data updated - field:', field, 'value:', value)
      return newData
    })

    // Auto-calculate related fields
    if (field === 'size.totalArea' && typeof value === 'number') {
      setTimeout(() => updateSizeCalculations(value), 0)
    }
    if (field === 'size.retailArea' && typeof value === 'number') {
      setTimeout(() => updateRetailAreaCalculations(value), 0)
    }
    if (field === 'price.perSqft' && typeof value === 'number') {
      setTimeout(() => {
        setFormData(current => {
          const totalArea = current.size?.totalArea ?? 0
          const currency = current.price?.currency ?? "AED"
          updatePriceCalculations(value, totalArea, currency)
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
  }, [errors, updateSizeCalculations, updateRetailAreaCalculations, updatePriceCalculations])

  // Navigation functions
  const nextStep = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, 7)) // 8 steps total (0-7)
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
      const draft = loadMallFormDraft()
      if (draft) {
        const restoredData = {
          ...initialFormData,
          ...draft // Include all data including image URLs
        }
        setFormData(restoredData)
        setBaselineFormData(restoredData) // Set restored data as new baseline
        setIsDraftRestored(true)
        toast.success("Draft restored successfully with images")
      }
    } catch (error) {
      toast.error("Failed to restore draft")
    }
    setShowDraftRestoreDialog(false)
  }, [initialFormData, toast])

  const handleDiscardDraft = useCallback(() => {
    clearMallFormDraft()
    setFormData(initialFormData)
    setBaselineFormData(initialFormData) // Reset baseline to initial
    setIsDraftRestored(false)
    setShowDraftRestoreDialog(false)
    toast.success("Draft discarded - starting fresh")
  }, [initialFormData])

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormData(initialFormData)
    setBaselineFormData(initialFormData)
    setIsDraftRestored(false)
    setCurrentStep(0)
    setErrors({})
    console.log('Form reset to initial state')
  }, [initialFormData])

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true)
    
    try {
      // Client-side validation before submission
      const validation = validateMallFormData(formData)
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
        clearMallFormDraft()
      }
      
      // Success is handled by the parent component (it calls onClose)
      // So we don't call toast.success or onClose here to avoid duplicates
    } catch (error: any) {
      console.error("Error submitting form:", error)
      
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
        setCurrentStep(7)
        // Let user know they've been redirected to see errors
        setTimeout(() => {
          toast.info(`Redirected to Review step to view ${Object.keys(fieldErrors).length} validation error${Object.keys(fieldErrors).length > 1 ? 's' : ''}`)
        }, 500)
      }

      // Show user-friendly toasts based on error type
      if (errorType === 'VALIDATION_ERROR') {
        if (fieldErrors && Object.keys(fieldErrors).length > 0) {
          toast.error(`Form validation failed. Check Review step for ${Object.keys(fieldErrors).length} error${Object.keys(fieldErrors).length > 1 ? 's' : ''}.`)
        } else {
          toast.error("Form has validation errors. Please review your input.")
        }
      } else if (errorType === 'DB_VALIDATION_ERROR') {
        if (fieldErrors && Object.keys(fieldErrors).length > 0) {
          toast.error(`Database validation failed. Check Review step for ${Object.keys(fieldErrors).length} error${Object.keys(fieldErrors).length > 1 ? 's' : ''}.`)
        } else {
          toast.error(error.message || "Database validation error. Please check your input.")
        }
      } else if (errorType === 'DUPLICATE_ENTRY') {
        toast.error(error.message || "A mall with this name already exists. Please choose a different name.")
      } else if (errorType === 'RATE_LIMITED') {
        toast.error("Too many requests. Please wait a moment before trying again.")
      } else if (errorType === 'EMPTY_DATA') {
        toast.error("No data submitted. Please fill in the required fields.")
      } else if (errorType === 'NOT_FOUND') {
        toast.error("Mall not found. It may have been deleted by another user.")
      } else if (typeof error?.message === 'string') {
        toast.error(error.message)
      } else {
        toast.error("Failed to save mall. Please check your connection and try again.")
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