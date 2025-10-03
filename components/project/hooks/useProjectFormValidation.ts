// components/project/hooks/useProjectFormValidation.ts
"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import type { ProjectFormData } from "@/types/projects"
import { validateProjectFormData, validateProjectStep } from "@/lib/project-validation"
import type { StepValidationStatus } from "../ProjectFormStepNavigation"

export function useProjectFormValidation(
  formData: ProjectFormData,
  currentStep: number
) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Track form changes
  useEffect(() => {
    // Simple check - in a real app you might want more sophisticated change detection
    const hasData = Object.values(formData).some(value => {
      if (typeof value === 'string') return value.trim() !== ''
      if (typeof value === 'number') return value > 0
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(v => {
          if (typeof v === 'string') return v.trim() !== ''
          if (typeof v === 'number') return v > 0
          if (Array.isArray(v)) return v.length > 0
          if (typeof v === 'object' && v !== null) {
            return Object.values(v).some(nested => {
              if (typeof nested === 'string') return nested.trim() !== ''
              if (typeof nested === 'number') return nested > 0
              if (Array.isArray(nested)) return nested.length > 0
              return false
            })
          }
          return false
        })
      }
      return false
    })
    
    setHasUnsavedChanges(hasData)
  }, [formData])

  // Validate current step
  const validateCurrentStep = useCallback(() => {
    const stepIds = ['basic', 'pricing', 'details', 'units', 'location', 'marketing', 'settings']
    const stepId = stepIds[currentStep]
    
    if (!stepId) {
      return { isValid: true, errors: {}, warnings: [] }
    }
    
    return validateProjectStep(stepId, formData)
  }, [formData, currentStep])

  // Validate all steps
  const validateAllSteps = useCallback(() => {
    return validateProjectFormData(formData)
  }, [formData])

  // Get validation status for each step
  const getStepValidationStatus = useCallback((): StepValidationStatus => {
    const stepIds = ['basic', 'pricing', 'details', 'units', 'location', 'marketing', 'settings']
    const status: StepValidationStatus = {}
    
    stepIds.forEach((stepId, index) => {
      const validation = validateProjectStep(stepId, formData)
      
      if (index === currentStep) {
        // Current step - show as valid/invalid based on validation
        status[index] = validation.isValid ? 'valid' : 'invalid'
      } else {
        // Other steps - check if they have required data
        switch (stepId) {
          case 'basic':
            status[index] = (formData.name && formData.location && formData.type && formData.status && formData.developer) 
              ? 'valid' : 'incomplete'
            break
          case 'pricing':
            status[index] = (formData.price?.total && formData.price?.totalNumeric > 0) 
              ? 'valid' : 'incomplete'
            break
          case 'details':
            status[index] = (formData.description && formData.overview && formData.completionDate && formData.totalUnits > 0) 
              ? 'valid' : 'incomplete'
            break
          case 'units':
            status[index] = ((formData.unitTypes?.length || 0) > 0 && (formData.amenities?.length || 0) > 0) 
              ? 'valid' : 'incomplete'
            break
          case 'location':
            status[index] = (formData.locationDetails?.description && (formData.locationDetails?.nearby?.length || 0) > 0) 
              ? 'valid' : 'incomplete'
            break
          case 'marketing':
            status[index] = (formData.image && (formData.gallery?.length || 0) > 0) 
              ? 'valid' : 'incomplete'
            break
          case 'settings':
            // Final step is always valid if we reach it
            status[index] = 'valid'
            break
          default:
            status[index] = 'incomplete'
        }
      }
    })
    
    return status
  }, [formData, currentStep])

  // Get validation summary
  const validationSummary = useMemo(() => {
    const validation = validateAllSteps()
    const stepStatus = getStepValidationStatus()
    
    const totalSteps = Object.keys(stepStatus).length
    const validSteps = Object.values(stepStatus).filter(status => status === 'valid').length
    const invalidSteps = Object.values(stepStatus).filter(status => status === 'invalid').length
    const incompleteSteps = totalSteps - validSteps - invalidSteps
    
    return {
      isFormValid: validation.isValid,
      totalErrors: Object.keys(validation.errors).length,
      warnings: validation.warnings,
      progress: {
        total: totalSteps,
        valid: validSteps,
        invalid: invalidSteps,
        incomplete: incompleteSteps,
        percentage: Math.round((validSteps / totalSteps) * 100)
      }
    }
  }, [validateAllSteps, getStepValidationStatus])

  // Check if step can be completed
  const canCompleteStep = useCallback((stepIndex: number) => {
    const stepIds = ['basic', 'pricing', 'details', 'units', 'location', 'marketing', 'settings']
    const stepId = stepIds[stepIndex]
    
    if (!stepId) return false
    
    const validation = validateProjectStep(stepId, formData)
    return validation.isValid
  }, [formData])

  // Get required fields for a step
  const getRequiredFieldsForStep = useCallback((stepIndex: number) => {
    const stepIds = ['basic', 'pricing', 'details', 'units', 'location', 'marketing', 'settings']
    const stepId = stepIds[stepIndex]
    
    const requiredFields: Record<string, string[]> = {
      basic: ['name', 'location', 'type', 'status', 'developer'],
      pricing: ['price.total', 'price.totalNumeric'],
      details: ['description', 'overview', 'completionDate', 'totalUnits'],
      units: ['unitTypes', 'amenities'],
      location: ['locationDetails.description', 'locationDetails.nearby'],
      marketing: ['image', 'gallery'],
      settings: []
    }
    
    return requiredFields[stepId] || []
  }, [])

  // Get missing required fields for a step
  const getMissingFieldsForStep = useCallback((stepIndex: number) => {
    const requiredFields = getRequiredFieldsForStep(stepIndex)
    const missingFields: string[] = []
    
    requiredFields.forEach(field => {
      const keys = field.split('.')
      let value: any = formData
      
      // Safely traverse nested properties
      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key]
        } else {
          value = undefined
          break
        }
      }
      
      if (value === undefined || value === null || value === '' || 
          (Array.isArray(value) && value.length === 0) ||
          (typeof value === 'number' && value <= 0)) {
        missingFields.push(field)
      }
    })
    
    return missingFields
  }, [formData, getRequiredFieldsForStep])

  return {
    // Validation functions
    validateCurrentStep,
    validateAllSteps,
    getStepValidationStatus,
    canCompleteStep,
    
    // Field utilities
    getRequiredFieldsForStep,
    getMissingFieldsForStep,
    
    // Summary data
    validationSummary,
    
    // State
    hasUnsavedChanges,
    setHasUnsavedChanges
  }
}