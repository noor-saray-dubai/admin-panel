"use client"

import { useState, useCallback } from "react"

interface BlogFormData {
  title: string
  excerpt: string
  contentBlocks: any[]
  featuredImage: File | null
  author: string
  category: string
  tags: string[]
  status: "Published" | "Draft"
  publishDate: string
  featured: boolean
}

interface FieldErrors {
  [key: string]: string
}

interface ValidationResult {
  isValid: boolean
  fieldErrors?: FieldErrors
  warnings?: string[]
}

// Validation functions
const validateField = (field: string, value: any, formData?: BlogFormData): string => {
  switch (field) {
    case 'title':
      if (!value || !value.toString().trim()) return 'Title is required'
      if (value.toString().length > 200) return 'Title cannot exceed 200 characters'
      return ''
    case 'excerpt':
      if (!value || !value.toString().trim()) return 'Excerpt is required'
      if (value.toString().length > 500) return 'Excerpt cannot exceed 500 characters'
      return ''
    case 'author':
      if (!value || !value.toString().trim()) return 'Author is required'
      return ''
    case 'category':
      if (!value || !value.toString().trim()) return 'Category is required'
      return ''
    case 'publishDate':
      if (!value) return 'Publish date is required'
      return ''
    case 'featuredImage':
      if (!value) return 'Featured image is required'
      return ''
    case 'contentBlocks':
      if (!value || !Array.isArray(value) || value.length === 0) {
        return 'At least one content block is required'
      }
      const hasParagraph = value.some(block => block.type === "paragraph")
      if (!hasParagraph) {
        return 'At least one paragraph block is required'
      }
      return ''
    default:
      return ''
  }
}

export function useBlogFormValidation(formData: BlogFormData, currentStep: number) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Validate specific step
  const validateCurrentStep = useCallback((): ValidationResult => {
    const errors: FieldErrors = {}
    
    switch (currentStep) {
      case 0: // Basic Info
        const titleError = validateField('title', formData.title, formData)
        if (titleError) errors.title = titleError
        
        const excerptError = validateField('excerpt', formData.excerpt, formData)
        if (excerptError) errors.excerpt = excerptError
        
        const authorError = validateField('author', formData.author, formData)
        if (authorError) errors.author = authorError
        
        const categoryError = validateField('category', formData.category, formData)
        if (categoryError) errors.category = categoryError
        break
        
      case 1: // Content Creation
        const contentError = validateField('contentBlocks', formData.contentBlocks, formData)
        if (contentError) errors.contentBlocks = contentError
        
        // Validate each content block
        formData.contentBlocks.forEach((block, index) => {
          switch (block.type) {
            case "paragraph":
            case "quote":
              if (!block.content || block.content.length === 0) {
                errors[`block-${index}-content`] = `${block.type} content is required`
              }
              break
            case "heading":
              if (!block.content || !block.content.trim()) {
                errors[`block-${index}-content`] = 'Heading content is required'
              }
              break
            case "image":
              if (!block.alt || !block.alt.trim()) {
                errors[`block-${index}-alt`] = 'Image alt text is required'
              }
              if (!block.url && !block.file) {
                errors[`block-${index}-image`] = 'Image is required'
              }
              break
            case "link":
              if (!block.coverText || !block.coverText.trim()) {
                errors[`block-${index}-coverText`] = 'Link text is required'
              }
              if (!block.url || !block.url.trim()) {
                errors[`block-${index}-url`] = 'Link URL is required'
              }
              break
            case "list":
              if (!block.title || !block.title.trim()) {
                errors[`block-${index}-title`] = 'List title is required'
              }
              if (!block.items || block.items.length === 0) {
                errors[`block-${index}-items`] = 'List must have at least one item'
              }
              break
          }
        })
        break
        
      case 2: // Media & Tags
        // Featured image validation only for add mode
        const featuredImageError = validateField('featuredImage', formData.featuredImage, formData)
        if (featuredImageError) errors.featuredImage = featuredImageError
        break
        
      case 3: // Publishing
        const publishDateError = validateField('publishDate', formData.publishDate, formData)
        if (publishDateError) errors.publishDate = publishDateError
        break
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      fieldErrors: errors
    }
  }, [formData, currentStep])

  // Validate all steps
  const validateAllSteps = useCallback((): ValidationResult => {
    const errors: FieldErrors = {}
    
    // Basic Info validation
    const titleError = validateField('title', formData.title, formData)
    if (titleError) errors.title = titleError
    
    const excerptError = validateField('excerpt', formData.excerpt, formData)
    if (excerptError) errors.excerpt = excerptError
    
    const authorError = validateField('author', formData.author, formData)
    if (authorError) errors.author = authorError
    
    const categoryError = validateField('category', formData.category, formData)
    if (categoryError) errors.category = categoryError
    
    // Content validation
    const contentError = validateField('contentBlocks', formData.contentBlocks, formData)
    if (contentError) errors.contentBlocks = contentError
    
    // Publishing validation
    const publishDateError = validateField('publishDate', formData.publishDate, formData)
    if (publishDateError) errors.publishDate = publishDateError
    
    // Check for incomplete blocks
    const hasIncompleteBlocks = formData.contentBlocks.some(block => {
      switch (block.type) {
        case "paragraph":
        case "quote":
          return block.content.length === 0 || block.content.some((segment: any) => 
            !segment.content.trim() || (segment.type === 'link' && !segment.url.trim())
          )
        case "heading":
          return !block.content.trim()
        case "image":
          return !block.alt.trim() || (!block.url && !block.file)
        case "link":
          return !block.coverText.trim() || !block.url.trim()
        case "list":
          return !block.title.trim() || block.items.length === 0 || block.items.some((item: any) => !item.text.trim())
        default:
          return false
      }
    })
    
    if (hasIncompleteBlocks) {
      errors.contentBlocks = 'Some content blocks are incomplete'
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      fieldErrors: errors
    }
  }, [formData])

  // Get validation status for each step
  const getStepValidationStatus = useCallback(() => {
    const statuses = []
    
    // We'll validate each step individually
    for (let i = 0; i < 4; i++) {
      const stepErrors: FieldErrors = {}
      
      switch (i) {
        case 0: // Basic Info
          if (validateField('title', formData.title)) stepErrors.title = 'error'
          if (validateField('excerpt', formData.excerpt)) stepErrors.excerpt = 'error'
          if (validateField('author', formData.author)) stepErrors.author = 'error'
          if (validateField('category', formData.category)) stepErrors.category = 'error'
          break
        case 1: // Content
          if (validateField('contentBlocks', formData.contentBlocks)) stepErrors.content = 'error'
          break
        case 2: // Media
          // Only validate featured image for add mode
          break
        case 3: // Publishing
          if (validateField('publishDate', formData.publishDate)) stepErrors.publishDate = 'error'
          break
      }
      
      statuses.push({
        isValid: Object.keys(stepErrors).length === 0,
        errors: stepErrors
      })
    }
    
    return statuses
  }, [formData])

  return {
    validateCurrentStep,
    validateAllSteps,
    getStepValidationStatus,
    hasUnsavedChanges,
    setHasUnsavedChanges
  }
}