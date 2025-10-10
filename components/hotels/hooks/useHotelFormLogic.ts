// components/hotels/hooks/useHotelFormLogic.ts
import { useState, useEffect, useCallback, useMemo } from "react"
import { useToast } from "@/components/ui/toast-system"
import type { IHotel, HotelFormData } from "@/types/hotels"
import { validateHotelFormData } from "@/lib/hotel-validation"
import {
  saveHotelFormDraft,
  loadHotelFormDraft,
  clearHotelFormDraft,
  hasSavedHotelDraft,
  getHotelDraftTimestamp,
  createDebouncedHotelSave
} from "@/lib/hotel-form-persistence"

export interface UseHotelFormLogicProps {
  initialFormData: HotelFormData
  isOpen: boolean
  mode: "add" | "edit"
  hotel?: IHotel | null
  onSuccess: (data: HotelFormData) => void
  onClose: () => void
}

export function useHotelFormLogic({
  initialFormData,
  isOpen,
  mode,
  hotel,
  onSuccess,
  onClose
}: UseHotelFormLogicProps) {
  const toast = useToast()
  const [formData, setFormData] = useState<HotelFormData>(initialFormData)
  const [currentStep, setCurrentStep] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Draft restoration state
  const [showDraftRestoreDialog, setShowDraftRestoreDialog] = useState(false)
  const [draftTimestamp, setDraftTimestamp] = useState<string | null>(null)
  const [isDraftRestored, setIsDraftRestored] = useState(false)
  const [baselineFormData, setBaselineFormData] = useState<HotelFormData>(initialFormData)

  // Create debounced save function (3 second delay to avoid excessive saves)
  const debouncedSave = useMemo(
    () => createDebouncedHotelSave(3000),
    []
  )

  // Track unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (mode === "edit" && hotel) {
      const hasChanges = JSON.stringify(formData) !== JSON.stringify(hotel)
      return hasChanges
    }
    
    // In add mode, compare against the baseline (initial or restored draft)
    const hasChangesFromBaseline = JSON.stringify(formData) !== JSON.stringify(baselineFormData)
    
    // Also check if any meaningful data has been entered (fallback for new forms)
    const hasContent = !!(formData.name.trim() || 
                         formData.location.trim() || 
                         formData.description.trim() ||
                         formData.price.total.trim() ||
                         (formData.dimensions.floors ?? 0) > 1 ||
                         (formData.totalRooms ?? 0) > 0 ||
                         formData.type.trim() ||
                         (formData.rating ?? 0) > 0)
    
    const result = hasChangesFromBaseline || hasContent
    
    // Debug logging (can be removed in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('Hotel add mode - Has changes:', result, {
        hasChangesFromBaseline,
        hasContent,
        isDraftRestored
      })
    }
    
    return result
  }, [formData, mode, hotel, baselineFormData, isDraftRestored])

  // Transform hotel data to form data structure
  const transformHotelToFormData = useCallback((hotelData: IHotel): HotelFormData => {
    return {
      ...initialFormData,
      ...hotelData,
      // Ensure proper defaults for optional nested objects
      developer: hotelData.developer ? {
        name: hotelData.developer.name || '',
        slug: hotelData.developer.slug || '',
        established: hotelData.developer.established || new Date().getFullYear(),
        portfolio: hotelData.developer.portfolio || []
      } : initialFormData.developer,
      operationalDetails: hotelData.operationalDetails || initialFormData.operationalDetails,
      legalDetails: hotelData.legalDetails || initialFormData.legalDetails,
      marketingMaterials: hotelData.marketingMaterials || initialFormData.marketingMaterials,
      investorRelations: hotelData.investorRelations || initialFormData.investorRelations,
      locationDetails: hotelData.locationDetails || initialFormData.locationDetails,
      amenities: hotelData.amenities || initialFormData.amenities,
      // Ensure arrays are properly initialized
      features: hotelData.features || [],
      gallery: hotelData.gallery || [],
      floorPlan: hotelData.floorPlan || '',
      totalRooms: hotelData.totalRooms || initialFormData.totalRooms,
      totalSuites: hotelData.totalSuites || initialFormData.totalSuites,
      // Handle wellness and meetings facilities
      wellness: hotelData.wellness || initialFormData.wellness,
      meetings: hotelData.meetings || initialFormData.meetings,
      // Handle nested objects that might be missing
      saleInformation: {
        ...initialFormData.saleInformation,
        ...hotelData.saleInformation
      }
    } as HotelFormData
  }, [initialFormData])

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && hotel) {
        const transformedData = transformHotelToFormData(hotel)
        setFormData(transformedData)
        setBaselineFormData(transformedData)
        setShowDraftRestoreDialog(false)
        setIsDraftRestored(false)
      } else {
        // Check for saved draft in add mode
        const hasDraft = hasSavedHotelDraft() // This now checks for meaningful data
        if (hasDraft) {
          const timestamp = getHotelDraftTimestamp()
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
  }, [isOpen, mode, hotel, initialFormData])

  // Auto-save draft in add mode (only when there's meaningful content)
  useEffect(() => {
    if (mode === "add" && hasUnsavedChanges && !showDraftRestoreDialog) {
      // Only auto-save if user has entered at least a hotel name
      if (formData.name.trim().length > 2) {
        console.log('Auto-saving hotel draft...')
        debouncedSave(formData)
      }
    }
  }, [formData, mode, hasUnsavedChanges, debouncedSave, showDraftRestoreDialog])

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !showDraftRestoreDialog && !isSubmitting) {
        // Use confirmation handler if available
        if ((window as any).handleHotelFormClose) {
          (window as any).handleHotelFormClose()
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
        total: formattedValue,
        totalNumeric: numericValue,
        currency: currency
      }
    }))
  }, [])

  // Handle input changes with validation
  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev }
      
      // Handle nested field updates
      if (field.includes('.')) {
        const parts = field.split('.')
        let current = newData as any
        
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) {
            current[parts[i]] = {}
          }
          current = current[parts[i]]
        }
        
        current[parts[parts.length - 1]] = value
      } else {
        (newData as any)[field] = value
      }

      // Special handling for price fields - trigger auto-calculation
      if (field === 'price.totalNumeric' || field === 'price.valueNumeric') {
        const currency = newData.price?.currency || 'AED'
        updatePriceCalculations(value, currency)
        return prev // Return the updated data from updatePriceCalculations
      }

      return newData
    })

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
    setCurrentStep(prev => prev + 1)
  }, [])

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(0, prev - 1))
  }, [])

  const goToStep = useCallback((step: number) => {
    setCurrentStep(step)
  }, [])

  // Form submission
  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return

    console.log('🚀 Submitting hotel form...', { mode, formData })

    // Validate form data
    const validation = validateHotelFormData(formData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      toast.error("Please fix the validation errors before submitting.")
      console.log('❌ Validation failed:', validation.errors)
      return
    }

    setIsSubmitting(true)

    try {
      await onSuccess(formData)
      
      // Clear draft on successful submission
      if (mode === "add") {
        clearHotelFormDraft()
        console.log('🗑️ Cleared hotel draft after successful submission')
      }
      
      toast.success(
        mode === "add" 
          ? `Hotel "${formData.name}" created successfully!` 
          : `Hotel "${formData.name}" updated successfully!`
      )
    } catch (error: any) {
      console.error('❌ Hotel form submission error:', error)
      toast.error(error.message || 'Failed to save hotel')
      
      // Handle field-specific errors
      if (error.fieldErrors) {
        setErrors(error.fieldErrors)
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, mode, isSubmitting, onSuccess, toast])

  // Reset form
  const resetForm = useCallback(() => {
    setFormData(initialFormData)
    setBaselineFormData(initialFormData)
    setCurrentStep(0)
    setErrors({})
    setIsDraftRestored(false)
    if (mode === "add") {
      clearHotelFormDraft()
      console.log('🔄 Hotel form reset and draft cleared')
    }
  }, [initialFormData, mode])

  // Draft restoration handlers
  const handleRestoreDraft = useCallback(() => {
    const savedDraft = loadHotelFormDraft()
    if (savedDraft) {
      setFormData(savedDraft)
      setBaselineFormData(savedDraft) // Set restored draft as baseline
      setIsDraftRestored(true)
      console.log('📋 Hotel draft restored successfully')
    }
    setShowDraftRestoreDialog(false)
  }, [])

  const handleDiscardDraft = useCallback(() => {
    clearHotelFormDraft()
    setFormData(initialFormData)
    setBaselineFormData(initialFormData)
    setIsDraftRestored(false)
    setShowDraftRestoreDialog(false)
    console.log('🗑️ Hotel draft discarded - starting fresh')
  }, [initialFormData])

  return {
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
    handleDiscardDraft,
    updatePriceCalculations
  }
}