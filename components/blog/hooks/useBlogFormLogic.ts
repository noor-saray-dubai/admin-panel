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

export function useBlogFormLogic(
  initialFormData: BlogFormData, 
  blog?: any, 
  mode?: "add" | "edit"
) {
  const [formData, setFormData] = useState<BlogFormData>(initialFormData)
  const [currentStep, setCurrentStep] = useState(0)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Generic input change handler
  const handleInputChange = useCallback((field: keyof BlogFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }, [errors])

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormData(initialFormData)
    setCurrentStep(0)
    setErrors({})
    setIsSubmitting(false)
  }, [initialFormData])

  // Content block management functions
  const addContentBlock = useCallback((type: string) => {
    const maxOrder = Math.max(0, ...formData.contentBlocks.map(block => block.order))
    const newOrder = maxOrder + 1

    let newBlock: any

    switch (type) {
      case "paragraph":
        newBlock = {
          type: "paragraph",
          order: newOrder,
          content: []
        }
        break
      case "heading":
        // Check if H1 already exists
        const hasH1 = formData.contentBlocks.some(block => 
          block.type === "heading" && block.level === 1
        )
        newBlock = {
          type: "heading",
          order: newOrder,
          level: hasH1 ? 2 : 1,
          content: "",
          bold: false,
          italic: false,
          color: "#000000"
        }
        break
      case "image":
        newBlock = {
          type: "image",
          order: newOrder,
          url: "",
          alt: "",
          caption: ""
        }
        break
      case "link":
        newBlock = {
          type: "link",
          order: newOrder,
          url: "",
          coverText: "",
          bold: false,
          italic: false,
          color: "#0aa83f"
        }
        break
      case "quote":
        newBlock = {
          type: "quote",
          order: newOrder,
          content: [],
          author: "",
          source: ""
        }
        break
      case "list":
        newBlock = {
          type: "list",
          order: newOrder,
          listType: "unordered",
          title: "",
          items: [],
          bold: false,
          italic: false,
          color: "#000000"
        }
        break
      default:
        return
    }

    setFormData(prev => ({
      ...prev,
      contentBlocks: [...prev.contentBlocks, newBlock]
    }))
  }, [formData.contentBlocks])

  const updateContentBlock = useCallback((index: number, updates: any) => {
    setFormData(prev => {
      const newBlocks = [...prev.contentBlocks]
      const currentBlock = newBlocks[index]
      
      // Type-safe update based on block type
      newBlocks[index] = {
        ...currentBlock,
        ...updates,
        type: currentBlock.type // Ensure type remains the same
      }
      
      return {
        ...prev,
        contentBlocks: newBlocks
      }
    })
  }, [])

  const removeContentBlock = useCallback((index: number) => {
    setFormData(prev => {
      const newBlocks = prev.contentBlocks.filter((_, i) => i !== index)
      // Re-order remaining blocks
      const reorderedBlocks = newBlocks.map((block, i) => ({
        ...block,
        order: i + 1
      }))
      
      return {
        ...prev,
        contentBlocks: reorderedBlocks
      }
    })
  }, [])

  const moveContentBlock = useCallback((index: number, direction: 'up' | 'down') => {
    setFormData(prev => {
      const newBlocks = [...prev.contentBlocks]
      const newIndex = direction === 'up' ? index - 1 : index + 1
      
      if (newIndex < 0 || newIndex >= newBlocks.length) return prev

      // Swap blocks
      const temp = newBlocks[index]
      newBlocks[index] = newBlocks[newIndex]
      newBlocks[newIndex] = temp

      // Update order values
      newBlocks[index].order = index + 1
      newBlocks[newIndex].order = newIndex + 1

      return {
        ...prev,
        contentBlocks: newBlocks
      }
    })
  }, [])

  // Tag management
  const addTag = useCallback((tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }))
    }
  }, [formData.tags])

  const removeTag = useCallback((tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }, [])

  // Image management
  const handleFeaturedImageUpload = useCallback((file: File) => {
    setFormData(prev => ({ ...prev, featuredImage: file }))
    
    // Clear featured image error
    if (errors.featuredImage) {
      setErrors(prev => ({ ...prev, featuredImage: '' }))
    }
  }, [errors])

  const removeFeaturedImage = useCallback(() => {
    setFormData(prev => ({ ...prev, featuredImage: null }))
  }, [])

  // Form validation helpers
  const isFormValid = useCallback(() => {
    const hasErrors = Object.values(errors).some(error => error && error.trim() !== '')
    const hasRequiredFields = formData.title && formData.excerpt && formData.author && formData.category
    const hasFeaturedImage = mode === 'edit' || formData.featuredImage
    const hasContentBlocks = formData.contentBlocks.length > 0
    const hasParagraph = formData.contentBlocks.some(block => block.type === "paragraph")
    
    // Check for empty segments or incomplete blocks
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
    
    return !hasErrors && hasRequiredFields && hasFeaturedImage && hasContentBlocks && hasParagraph && !hasIncompleteBlocks
  }, [formData, errors, mode])

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
    resetForm,
    
    // Content block management
    addContentBlock,
    updateContentBlock,
    removeContentBlock,
    moveContentBlock,
    
    // Tag management
    addTag,
    removeTag,
    
    // Image management
    handleFeaturedImageUpload,
    removeFeaturedImage,
    
    // Validation
    isFormValid
  }
}