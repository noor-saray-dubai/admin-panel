// components/project/hooks/useProjectFormLogic.ts
"use client"

import { useState, useCallback, useEffect } from "react"
import type { ProjectFormData, IProject } from "@/types/projects"
import { projectToFormData } from "@/lib/project-form-persistence"

export function useProjectFormLogic(
  initialData: ProjectFormData,
  project?: IProject | null,
  mode?: 'add' | 'edit'
) {
  const [formData, setFormData] = useState<ProjectFormData>(initialData)
  const [currentStep, setCurrentStep] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form data when project changes
  useEffect(() => {
    if (mode === 'edit' && project) {
      const convertedData = projectToFormData(project)
      setFormData(convertedData)
    } else if (mode === 'add') {
      setFormData(initialData)
    }
  }, [project, mode, initialData])

  // Generic input change handler
  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => {
      const keys = field.split('.')
      if (keys.length === 1) {
        return { ...prev, [field]: value }
      }
      
      // Handle nested objects (e.g., "price.total", "locationDetails.description")
      const newData = { ...prev }
      let current: any = newData
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {}
        }
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = value
      return newData
    })

    // Clear related errors
    if (errors[field]) {
      const newErrors = { ...errors }
      delete newErrors[field]
      setErrors(newErrors)
    }
  }, [errors])


  // Generate display price from numeric price
  const generateDisplayPrice = useCallback((numericPrice: number) => {
    if (numericPrice <= 0) return ''
    
    if (numericPrice >= 1000000) {
      const millions = (numericPrice / 1000000).toFixed(1).replace('.0', '')
      return `AED ${millions}M`
    } else if (numericPrice >= 1000) {
      const thousands = (numericPrice / 1000).toFixed(0)
      return `AED ${thousands}K`
    } else {
      return `AED ${numericPrice.toLocaleString()}`
    }
  }, [])

  // Auto-update display price when numeric price changes
  useEffect(() => {
    const displayPrice = generateDisplayPrice(formData.price.totalNumeric)
    if (displayPrice !== formData.price.total) {
      handleInputChange('price.total', displayPrice)
    }
  }, [formData.price.totalNumeric, generateDisplayPrice, handleInputChange])

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormData(initialData)
    setCurrentStep(0)
    setErrors({})
    setIsSubmitting(false)
  }, [initialData])

  // Add helper functions for complex form operations
  const addPaymentMilestone = useCallback(() => {
    const newMilestone = { milestone: "", percentage: "" }
    const updatedMilestones = [...(formData.paymentPlan?.construction || []), newMilestone]
    handleInputChange('paymentPlan.construction', updatedMilestones)
  }, [formData.paymentPlan?.construction, handleInputChange])

  const removePaymentMilestone = useCallback((index: number) => {
    const updatedMilestones = (formData.paymentPlan?.construction || []).filter((_, i) => i !== index)
    handleInputChange('paymentPlan.construction', updatedMilestones)
  }, [formData.paymentPlan?.construction, handleInputChange])

  const addNearbyPlace = useCallback(() => {
    const newPlace = { name: "", distance: "" }
    const updatedNearby = [...(formData.locationDetails?.nearby || []), newPlace]
    handleInputChange('locationDetails.nearby', updatedNearby)
  }, [formData.locationDetails?.nearby, handleInputChange])

  const removeNearbyPlace = useCallback((index: number) => {
    const updatedNearby = (formData.locationDetails?.nearby || []).filter((_, i) => i !== index)
    handleInputChange('locationDetails.nearby', updatedNearby)
  }, [formData.locationDetails?.nearby, handleInputChange])

  const addUnitType = useCallback(() => {
    const newUnitType = { type: "", size: "", price: "", count: 1 }
    const updatedUnitTypes = [...(formData.unitTypes || []), newUnitType]
    handleInputChange('unitTypes', updatedUnitTypes)
  }, [formData.unitTypes, handleInputChange])

  const removeUnitType = useCallback((index: number) => {
    const updatedUnitTypes = (formData.unitTypes || []).filter((_, i) => i !== index)
    handleInputChange('unitTypes', updatedUnitTypes)
  }, [formData.unitTypes, handleInputChange])

  const addAmenityCategory = useCallback(() => {
    const newCategory = { category: "", items: [""] }
    const updatedAmenities = [...(formData.amenities || []), newCategory]
    handleInputChange('amenities', updatedAmenities)
  }, [formData.amenities, handleInputChange])

  const removeAmenityCategory = useCallback((index: number) => {
    const updatedAmenities = (formData.amenities || []).filter((_, i) => i !== index)
    handleInputChange('amenities', updatedAmenities)
  }, [formData.amenities, handleInputChange])

  const addAmenityItem = useCallback((categoryIndex: number) => {
    const updatedAmenities = [...(formData.amenities || [])]
    if (updatedAmenities[categoryIndex]) {
      updatedAmenities[categoryIndex].items.push("")
      handleInputChange('amenities', updatedAmenities)
    }
  }, [formData.amenities, handleInputChange])

  const removeAmenityItem = useCallback((categoryIndex: number, itemIndex: number) => {
    const updatedAmenities = [...(formData.amenities || [])]
    if (updatedAmenities[categoryIndex]) {
      updatedAmenities[categoryIndex].items = updatedAmenities[categoryIndex].items.filter((_, i) => i !== itemIndex)
      handleInputChange('amenities', updatedAmenities)
    }
  }, [formData.amenities, handleInputChange])

  const addGalleryImage = useCallback((imageUrl: string) => {
    const updatedGallery = [...(formData.gallery || []), imageUrl]
    handleInputChange('gallery', updatedGallery)
  }, [formData.gallery, handleInputChange])

  const removeGalleryImage = useCallback((index: number) => {
    const updatedGallery = formData.gallery.filter((_, i) => i !== index)
    handleInputChange('gallery', updatedGallery)
  }, [formData.gallery, handleInputChange])

  const addFeature = useCallback((feature: string) => {
    if (feature.trim()) {
      const updatedFeatures = [...(formData.features || []), feature.trim()]
      handleInputChange('features', updatedFeatures)
    }
  }, [formData.features, handleInputChange])

  const removeFeature = useCallback((index: number) => {
    const updatedFeatures = formData.features.filter((_, i) => i !== index)
    handleInputChange('features', updatedFeatures)
  }, [formData.features, handleInputChange])

  return {
    // State
    formData,
    setFormData,
    currentStep,
    setCurrentStep,
    errors,
    setErrors,
    isSubmitting,
    setIsSubmitting,
    
    // Handlers
    handleInputChange,
    generateDisplayPrice,
    resetForm,
    
    // Helper functions for complex operations
    addPaymentMilestone,
    removePaymentMilestone,
    addNearbyPlace,
    removeNearbyPlace,
    addUnitType,
    removeUnitType,
    addAmenityCategory,
    removeAmenityCategory,
    addAmenityItem,
    removeAmenityItem,
    addGalleryImage,
    removeGalleryImage,
    addFeature,
    removeFeature
  }
}