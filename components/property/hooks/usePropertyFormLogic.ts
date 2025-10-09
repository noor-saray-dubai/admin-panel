// components/property/hooks/usePropertyFormLogic.ts
"use client"

import { useState, useCallback } from "react"
import type { PropertyFormData, IProperty, PropertyFormMode } from "@/types/properties"

export function usePropertyFormLogic(
  initialFormData: PropertyFormData,
  property?: IProperty,
  mode?: PropertyFormMode
) {
  const [formData, setFormData] = useState<PropertyFormData>(initialFormData)
  const [currentStep, setCurrentStep] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle input changes with type safety
  const handleInputChange = useCallback((field: keyof PropertyFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }

    // Handle special calculations
    if (field === 'price' || field === 'builtUpArea') {
      // Calculate price per sq ft when price or built up area changes
      const updatedData = { ...formData, [field]: value }
      if (updatedData.priceNumeric && updatedData.builtUpArea) {
        const area = parseFloat(updatedData.builtUpArea.replace(/[^0-9.]/g, ''))
        if (area > 0) {
          const pricePerSqFt = updatedData.priceNumeric / area
          setFormData(prev => ({
            ...prev,
            [field]: value,
            pricePerSqFt: Math.round(pricePerSqFt)
          }))
          return
        }
      }
    }

    if (field === 'price') {
      // Parse numeric value from price string
      const numericPrice = parseFloat(value.replace(/[^0-9.]/g, ''))
      setFormData(prev => ({
        ...prev,
        [field]: value,
        priceNumeric: numericPrice || 0
      }))
      return
    }
  }, [formData, errors])

  // Handle array operations
  const addArrayItem = useCallback((field: keyof PropertyFormData, item: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] as any[]), item]
    }))
  }, [])

  const removeArrayItem = useCallback((field: keyof PropertyFormData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as any[]).filter((_, i) => i !== index)
    }))
  }, [])

  const updateArrayItem = useCallback((field: keyof PropertyFormData, index: number, item: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as any[]).map((existingItem, i) => i === index ? item : existingItem)
    }))
  }, [])

  // Handle amenity operations
  const addAmenityCategory = useCallback(() => {
    addArrayItem('amenities', {
      category: '',
      items: []
    })
  }, [addArrayItem])

  const removeAmenityCategory = useCallback((index: number) => {
    removeArrayItem('amenities', index)
  }, [removeArrayItem])

  const updateAmenityCategory = useCallback((index: number, category: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.map((amenity, i) => 
        i === index ? { ...amenity, category } : amenity
      )
    }))
  }, [])

  const addAmenityItem = useCallback((categoryIndex: number, item: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.map((amenity, i) => 
        i === categoryIndex 
          ? { ...amenity, items: [...amenity.items, item] }
          : amenity
      )
    }))
  }, [])

  const removeAmenityItem = useCallback((categoryIndex: number, itemIndex: number) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.map((amenity, i) => 
        i === categoryIndex 
          ? { ...amenity, items: amenity.items.filter((_, j) => j !== itemIndex) }
          : amenity
      )
    }))
  }, [])

  const updateAmenityItem = useCallback((categoryIndex: number, itemIndex: number, item: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.map((amenity, i) => 
        i === categoryIndex 
          ? { 
              ...amenity, 
              items: amenity.items.map((existingItem, j) => 
                j === itemIndex ? item : existingItem
              )
            }
          : amenity
      )
    }))
  }, [])

  // Handle payment plan operations
  const addPaymentPlanMilestone = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      paymentPlan: {
        ...prev.paymentPlan,
        construction: [
          ...prev.paymentPlan.construction,
          { milestone: '', percentage: '' }
        ]
      }
    }))
  }, [])

  const removePaymentPlanMilestone = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      paymentPlan: {
        ...prev.paymentPlan,
        construction: prev.paymentPlan.construction.filter((_, i) => i !== index)
      }
    }))
  }, [])

  const updatePaymentPlanMilestone = useCallback((index: number, milestone: { milestone: string, percentage: string }) => {
    setFormData(prev => ({
      ...prev,
      paymentPlan: {
        ...prev.paymentPlan,
        construction: prev.paymentPlan.construction.map((item, i) => 
          i === index ? milestone : item
        )
      }
    }))
  }, [])

  // Handle flags
  const toggleFlag = useCallback((flag: keyof PropertyFormData['flags']) => {
    setFormData(prev => ({
      ...prev,
      flags: {
        ...prev.flags,
        [flag]: !prev.flags[flag]
      }
    }))
  }, [])

  // Handle tags
  const addTag = useCallback((tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }))
    }
  }, [formData.tags])

  const removeTag = useCallback((tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }, [])

  // Generate display price
  const generateDisplayPrice = useCallback((price: number): string => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M AED`
    } else if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}K AED`
    } else {
      return `${price} AED`
    }
  }, [])

  // Reset form
  const resetForm = useCallback(() => {
    setFormData(initialFormData)
    setCurrentStep(0)
    setErrors({})
    setIsSubmitting(false)
  }, [initialFormData])

  return {
    formData,
    setFormData,
    currentStep,
    setCurrentStep,
    errors,
    setErrors,
    isSubmitting,
    setIsSubmitting,
    handleInputChange,
    addArrayItem,
    removeArrayItem,
    updateArrayItem,
    addAmenityCategory,
    removeAmenityCategory,
    updateAmenityCategory,
    addAmenityItem,
    removeAmenityItem,
    updateAmenityItem,
    addPaymentPlanMilestone,
    removePaymentPlanMilestone,
    updatePaymentPlanMilestone,
    toggleFlag,
    addTag,
    removeTag,
    generateDisplayPrice,
    resetForm
  }
}