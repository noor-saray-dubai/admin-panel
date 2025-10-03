// components/mall/hooks/useMallFormValidation.ts
import { useMemo } from "react"
import type { MallFormData } from "@/types/mall"
import { validateMallFormData } from "@/lib/mall-validation"

export interface UseMallFormValidationProps {
  formData: MallFormData
}

export type StepStatus = "valid" | "invalid" | "incomplete"

export function useMallFormValidation({ formData }: UseMallFormValidationProps) {
  
  // Validate individual steps
  const getStepStatus = useMemo(() => {
    return (stepIndex: number): StepStatus => {
      const validation = validateMallFormData(formData)
      
      switch (stepIndex) {
        case 0: // Basic Information
          const basicFields = ['name', 'subtitle', 'location', 'subLocation', 'ownership', 'status']
          const basicErrors = basicFields.some(field => validation.errors[field])
          return basicErrors ? "invalid" : "valid"
        
        case 1: // Size & Price
          const sizeFields = [
            'price.total', 'price.perSqft', 'price.currency',
            'size.totalArea', 'size.retailArea', 'size.floors',
            'financials.capRate', 'financials.roi', 'financials.appreciation', 'financials.payback'
          ]
          const sizeErrors = sizeFields.some(field => validation.errors[field])
          return sizeErrors ? "invalid" : "valid"
        
        case 2: // Rental & Operations
          const rentalFields = [
            'rentalDetails.maxStores', 'rentalDetails.totalStores', 
            'rentalDetails.vacantStores', 'rentalDetails.currentOccupancy', 'rentalDetails.averageRent',
            'operationalDetails.maintenanceStatus'
          ]
          const rentalErrors = rentalFields.some(field => validation.errors[field])
          return rentalErrors ? "invalid" : "valid"
        
        case 3: // Sale & Legal
          const legalFields = [
            'saleInformation.saleStatus', 'saleInformation.dealStructure', 'saleInformation.preferredBuyerType',
            'saleInformation.askingPriceNumeric', 'legalDetails.zoning'
          ]
          const legalErrors = legalFields.some(field => validation.errors[field])
          return legalErrors ? "invalid" : "valid"
        
        case 4: // Features & Amenities
          const featureFields = [
            'developer.name', 'developer.slug', 'yearBuilt', 'yearOpened', 'architecture'
          ]
          const featureErrors = featureFields.some(field => validation.errors[field])
          return featureErrors ? "invalid" : "valid"
        
        case 5: // Location Details  
          const locationFields = [
            'locationDetails.coordinates.latitude', 'locationDetails.coordinates.longitude'
          ]
          const locationErrors = locationFields.some(field => validation.errors[field])
          return locationErrors ? "invalid" : "valid"
        
        case 6: // Marketing & Media
          const marketingFields = ['image']
          const marketingErrors = marketingFields.some(field => validation.errors[field])
          return marketingErrors ? "invalid" : "valid"
        
        case 7: // Settings & Review
          const settingsFields = ['rating']
          const settingsErrors = settingsFields.some(field => validation.errors[field])
          return settingsErrors ? "invalid" : "valid"
        
        default:
          return "incomplete"
      }
    }
  }, [formData])

  // Check if form has all required fields for submission
  const isFormValid = useMemo(() => {
    return () => {
      // Check all required fields (matching server validation)
      const requiredFields = {
        name: formData.name?.trim() && formData.name.trim().length >= 3,
        subtitle: formData.subtitle?.trim() && formData.subtitle.trim().length >= 3,
        location: formData.location?.trim() && formData.location.trim().length >= 3, 
        subLocation: formData.subLocation?.trim() && formData.subLocation.trim().length >= 3,
        ownership: formData.ownership?.trim(),
        status: formData.status?.trim(),
        // architecture: formData.architecture?.trim() && formData.architecture.trim().length >= 3, // Temporarily optional
        totalArea: formData.size?.totalArea > 0,
        retailArea: formData.size?.retailArea > 0,
        floors: formData.size?.floors >= 1,
        priceTotal: formData.price?.total?.trim() && formData.price.total.trim().length >= 3,
        pricePerSqft: formData.price?.perSqft > 0,
        currency: formData.price?.currency,
        maxStores: formData.rentalDetails?.maxStores >= 1,
        yearBuilt: (formData.yearBuilt ?? 0) >= 1900 && (formData.yearBuilt ?? 0) <= 2050,
        yearOpened: (formData.yearOpened ?? 0) >= 1900 && (formData.yearOpened ?? 0) <= 2050,
        mainImage: formData.image?.trim() && formData.image.trim().length > 0
      }
      
      const isValid = Object.values(requiredFields).every(field => !!field)
      
      return isValid
    }
  }, [formData])

  // Get validation errors for the current form data
  const getValidationErrors = useMemo(() => {
    const validation = validateMallFormData(formData)
    return validation.errors
  }, [formData])

  // Check if a specific step has any errors
  const hasStepErrors = useMemo(() => {
    return (stepIndex: number): boolean => {
      return getStepStatus(stepIndex) === "invalid"
    }
  }, [getStepStatus])

  // Get count of valid steps
  const validStepsCount = useMemo(() => {
    let count = 0
    for (let i = 0; i < 8; i++) {
      if (getStepStatus(i) === "valid") count++
    }
    return count
  }, [getStepStatus])

  // Get count of invalid steps
  const invalidStepsCount = useMemo(() => {
    let count = 0
    for (let i = 0; i < 8; i++) {
      if (getStepStatus(i) === "invalid") count++
    }
    return count
  }, [getStepStatus])

  // Check if specific required fields are filled
  const hasRequiredFields = useMemo(() => {
    return {
      basicInfo: !!(formData.name?.trim() && formData.location?.trim()),
      pricing: !!(formData.price?.total?.trim() && formData.size?.totalArea > 0),
      rental: formData.rentalDetails?.maxStores >= 1,
      legal: !!(formData.legalDetails?.titleDeedNumber?.trim())
    }
  }, [formData])

  return {
    getStepStatus,
    isFormValid,
    getValidationErrors,
    hasStepErrors,
    validStepsCount,
    invalidStepsCount,
    hasRequiredFields
  }
}