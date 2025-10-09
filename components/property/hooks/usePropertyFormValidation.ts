// components/property/hooks/usePropertyFormValidation.ts
"use client"

import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import type { PropertyFormData, StepValidationStatus, ValidationResult } from "@/types/properties"

// Validation rules for each step
const stepValidationRules = {
  basic: {
    required: ['name', 'propertyType', 'propertyStatus', 'availabilityStatus', 'ownershipType'],
    validate: (data: PropertyFormData) => {
      const errors: Record<string, string> = {}
      
      if (!data.name.trim()) {
        errors.name = 'Property name is required'
      } else if (data.name.length < 3) {
        errors.name = 'Property name must be at least 3 characters'
      }
      
      if (!data.propertyType) {
        errors.propertyType = 'Property type is required'
      }
      
      if (!data.propertyStatus) {
        errors.propertyStatus = 'Construction status is required'
      }
      
      if (!data.availabilityStatus) {
        errors.availabilityStatus = 'Availability status is required'
      }
      
      if (!data.ownershipType) {
        errors.ownershipType = 'Ownership type is required'
      }
      
      return errors
    }
  },
  specifications: {
    required: ['bedrooms', 'bathrooms', 'builtUpArea', 'furnishingStatus', 'facingDirection', 'floorLevel'],
    validate: (data: PropertyFormData) => {
      const errors: Record<string, string> = {}
      
      // Bedrooms validation - must be at least 1
      if (data.bedrooms === undefined || data.bedrooms === null) {
        errors.bedrooms = 'Number of bedrooms is required'
      } else if (typeof data.bedrooms !== 'number' || data.bedrooms < 1) {
        errors.bedrooms = 'Number of bedrooms must be at least 1'
      }
      
      // Bathrooms validation - can be 0 (some properties might not have bathrooms)
      if (data.bathrooms === undefined || data.bathrooms === null) {
        errors.bathrooms = 'Number of bathrooms is required'
      } else if (typeof data.bathrooms !== 'number' || data.bathrooms < 0) {
        errors.bathrooms = 'Number of bathrooms cannot be negative'
      }
      
      // Floor level validation - can be 0 for ground floor  
      if (data.floorLevel === undefined || data.floorLevel === null) {
        errors.floorLevel = 'Floor level is required'
      } else if (typeof data.floorLevel !== 'number') {
        errors.floorLevel = 'Floor level must be a number'
      } else if (data.floorLevel < -5) {
        errors.floorLevel = 'Floor level cannot be less than -5'
      } else if (data.floorLevel > 200) {
        errors.floorLevel = 'Floor level cannot be more than 200'
      }
      
      // Built up area validation
      if (!data.builtUpArea?.trim()) {
        errors.builtUpArea = 'Built up area is required'
      } else if (!/^\d+(\.\d+)?\s*(sq\.?\s*ft\.?|sqft|square\s*feet?)$/i.test(data.builtUpArea)) {
        errors.builtUpArea = 'Built up area must be in format "1000 sq ft"'
      }
      
      // Carpet area validation (optional)
      if (data.carpetArea && !/^\d+(\.\d+)?\s*(sq\.?\s*ft\.?|sqft|square\s*feet?)$/i.test(data.carpetArea)) {
        errors.carpetArea = 'Carpet area must be in format "800 sq ft"'
      }
      
      // Furnishing status validation
      if (!data.furnishingStatus) {
        errors.furnishingStatus = 'Furnishing status is required'
      }
      
      // Facing direction validation
      if (!data.facingDirection) {
        errors.facingDirection = 'Facing direction is required'
      }
      
      return errors
    }
  },
  location: {
    required: ['address', 'area', 'city'],
    validate: (data: PropertyFormData) => {
      const errors: Record<string, string> = {}
      
      if (!data.address.trim()) {
        errors.address = 'Address is required'
      }
      
      if (!data.area.trim()) {
        errors.area = 'Area is required'
      }
      
      if (!data.city.trim()) {
        errors.city = 'City is required'
      }
      
      if (data.latitude < -90 || data.latitude > 90) {
        errors.latitude = 'Latitude must be between -90 and 90'
      }
      
      if (data.longitude < -180 || data.longitude > 180) {
        errors.longitude = 'Longitude must be between -180 and 180'
      }
      
      return errors
    }
  },
  pricing: {
    required: ['price'],
    validate: (data: PropertyFormData) => {
      const errors: Record<string, string> = {}
      
      if (!data.price.trim()) {
        errors.price = 'Price is required'
      }
      
      if (data.priceNumeric <= 0) {
        errors.price = 'Price must be greater than 0'
      }
      
      if (data.pricePerSqFt < 0) {
        errors.pricePerSqFt = 'Price per sq ft cannot be negative'
      }
      
      return errors
    }
  },
  description: {
    required: ['description', 'overview'],
    validate: (data: PropertyFormData) => {
      const errors: Record<string, string> = {}
      
      if (!data.description.trim()) {
        errors.description = 'Description is required'
      } else if (data.description.length < 50) {
        errors.description = 'Description must be at least 50 characters'
      }
      
      if (!data.overview.trim()) {
        errors.overview = 'Overview is required'
      } else if (data.overview.length < 50) {
        errors.overview = 'Overview must be at least 50 characters'
      }
      
      return errors
    }
  },
  media: {
    required: ['coverImage'],
    validate: (data: PropertyFormData) => {
      const errors: Record<string, string> = {}
      
      if (!data.coverImage.trim()) {
        errors.coverImage = 'Cover image is required'
      } else {
        // Validate URL format
        try {
          new URL(data.coverImage)
        } catch {
          errors.coverImage = 'Cover image must be a valid URL'
        }
      }
      
      // Validate gallery images
      if (data.gallery.length === 0) {
        errors.gallery = 'At least one gallery image is required'
      } else {
        const invalidImages = data.gallery.filter((url, index) => {
          try {
            new URL(url)
            return false
          } catch {
            return true
          }
        })
        
        if (invalidImages.length > 0) {
          errors.gallery = 'All gallery images must be valid URLs'
        }
      }
      
      return errors
    }
  },
  amenities: {
    required: [],
    validate: (data: PropertyFormData) => {
      const errors: Record<string, string> = {}
      
      // Validate amenity categories
      data.amenities.forEach((amenity, index) => {
        if (!amenity.category.trim()) {
          errors[`amenities.${index}.category`] = 'Category name is required'
        }
        
        if (amenity.items.length === 0) {
          errors[`amenities.${index}.items`] = 'At least one item is required'
        }
      })
      
      return errors
    }
  },
  links: {
    required: [],
    validate: (data: PropertyFormData) => {
      const errors: Record<string, string> = {}
      
      // If any agent field is provided, require ID, name and phone
      const hasAnyAgent = data.agentId || data.agentName || data.agentPhone || data.agentEmail
      if (hasAnyAgent) {
        if (!data.agentId?.trim()) {
          errors.agentId = 'Agent ID is required when agent details are provided'
        }
        if (!data.agentName?.trim()) {
          errors.agentName = 'Agent name is required when agent details are provided'
        }
        if (!data.agentPhone?.trim()) {
          errors.agentPhone = 'Agent phone is required when agent details are provided'
        } else if (!/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/i.test(data.agentPhone)) {
          errors.agentPhone = 'Invalid phone number format'
        }
      }
      
      // Validate agent email if provided
      if (data.agentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.agentEmail)) {
        errors.agentEmail = 'Invalid email format'
      }
      
      return errors
    }
  },
  settings: {
    required: [],
    validate: (data: PropertyFormData) => {
      const errors: Record<string, string> = {}
      
      // Validate payment plan if enabled
      if (data.hasPaymentPlan) {
        if (!data.paymentPlan.booking.trim()) {
          errors['paymentPlan.booking'] = 'Booking amount is required'
        }
        
        if (!data.paymentPlan.handover.trim()) {
          errors['paymentPlan.handover'] = 'Handover amount is required'
        }
        
        if (data.paymentPlan.construction.length === 0) {
          errors['paymentPlan.construction'] = 'At least one construction milestone is required'
        }
      }
      
      return errors
    }
  }
}

export function usePropertyFormValidation(
  formData: PropertyFormData, 
  currentStep: number
) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const initialFormDataRef = useRef<PropertyFormData | null>(null)
  const isInitializedRef = useRef(false)

  // Store initial form data on first render
  useEffect(() => {
    if (!isInitializedRef.current) {
      initialFormDataRef.current = { ...formData }
      isInitializedRef.current = true
    }
  }, [])

  // Track changes in form data
  useEffect(() => {
    if (!isInitializedRef.current || !initialFormDataRef.current) {
      return
    }

    // Deep comparison of form data to detect changes
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormDataRef.current)
    setHasUnsavedChanges(hasChanges)
  }, [formData])

  // Validate current step
  const validateCurrentStep = useCallback((): ValidationResult => {
    const stepIds = Object.keys(stepValidationRules)
    const currentStepId = stepIds[currentStep] as keyof typeof stepValidationRules
    
    if (!currentStepId || !stepValidationRules[currentStepId]) {
      return { isValid: true, fieldErrors: {} }
    }
    
    const rules = stepValidationRules[currentStepId]
    const errors = rules.validate(formData)
    
    return {
      isValid: Object.keys(errors).length === 0,
      fieldErrors: errors
    }
  }, [formData, currentStep])

  // Validate all steps
  const validateAllSteps = useCallback((): ValidationResult => {
    const allErrors: Record<string, string> = {}
    
    Object.entries(stepValidationRules).forEach(([stepId, rules]) => {
      const stepErrors = rules.validate(formData)
      Object.assign(allErrors, stepErrors)
    })
    
    return {
      isValid: Object.keys(allErrors).length === 0,
      fieldErrors: allErrors
    }
  }, [formData])

  // Get validation status for all steps
  const getStepValidationStatus = useCallback((): StepValidationStatus => {
    const status: StepValidationStatus = {}
    
    Object.entries(stepValidationRules).forEach(([stepId, rules]) => {
      const stepErrors = rules.validate(formData)
      const errorCount = Object.keys(stepErrors).length
      
      status[stepId] = {
        isValid: errorCount === 0,
        hasErrors: errorCount > 0,
        errorCount
      }
    })
    
    return status
  }, [formData])

  // Check if step has been visited or completed
  const getStepProgress = useCallback((stepIndex: number) => {
    const stepIds = Object.keys(stepValidationRules)
    const stepId = stepIds[stepIndex]
    
    if (stepIndex === currentStep) return 'current'
    if (stepIndex < currentStep) return 'completed'
    return 'pending'
  }, [currentStep])

  // Get form completion percentage
  const getFormCompletion = useMemo(() => {
    const stepStatus = getStepValidationStatus()
    const totalSteps = Object.keys(stepValidationRules).length
    const completedSteps = Object.values(stepStatus).filter((status: any) => status.isValid).length
    
    return Math.round((completedSteps / totalSteps) * 100)
  }, [getStepValidationStatus])

  // Validate specific field
  const validateField = useCallback((fieldName: string, value: any): string | null => {
    // Find which step this field belongs to
    for (const [stepId, rules] of Object.entries(stepValidationRules)) {
      const stepErrors = rules.validate({
        ...formData,
        [fieldName]: value
      })
      
      if (stepErrors[fieldName]) {
        return stepErrors[fieldName]
      }
    }
    
    return null
  }, [formData])

  // Reset change tracking (useful after save or reset)
  const resetChangeTracking = useCallback(() => {
    initialFormDataRef.current = { ...formData }
    setHasUnsavedChanges(false)
  }, [formData])

  return {
    validateCurrentStep,
    validateAllSteps,
    getStepValidationStatus,
    getStepProgress,
    getFormCompletion,
    validateField,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    resetChangeTracking
  }
}