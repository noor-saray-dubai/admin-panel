"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Upload, X, Eye, Star, MapPin, Calendar, Building, Phone, Mail, Globe, Plus, Minus, AlertCircle } from "lucide-react"
import {
  saveDeveloperFormDraft,
  loadDeveloperFormDraft,
  clearDeveloperFormDraft,
  hasSavedDeveloperDraft,
  getDeveloperDraftTimestamp,
  createDebouncedDeveloperSave
} from "@/lib/developer-form-persistence"

interface IDescriptionSection {
  title?: string
  description: string
}

interface IAward {
  name: string
  year: number
}

interface Developer {
  _id?: string
  name: string
  slug?: string
  logo: string
  coverImage: string
  description: IDescriptionSection[]
  overview: string
  location: string
  establishedYear: number
  website: string
  email: string
  phone: string
  specialization: string[]
  awards: IAward[]
  verified: boolean
}

export interface DeveloperFormData {
  name: string
  logo: File | null
  coverImage: File | null
  description: IDescriptionSection[]
  overview: string
  location: string
  establishedYear: number
  website: string
  email: string
  phone: string
  specialization: string[]
  awards: IAward[]
  verified: boolean
}

interface FieldErrors {
  [key: string]: string
}

interface ApiError {
  message: string
  error: string
  errors?: Record<string, string[]>
}

interface SubmissionState {
  isSubmitting: boolean
  apiError: ApiError | null
  networkError: boolean
}

interface DeveloperFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (developer: Developer) => void
  developer?: Developer | null
  mode: "add" | "edit"
}

const specializationOptions = [
  "Luxury Residential",
  "Affordable Housing",
  "Commercial",
  "Hotel Apartments",
  "Luxury Villas",
  "Premium Apartments",
  "Golf Communities",
  "Hospitality",
  "Mixed-Use",
  "Industrial",
]

const initialFormData: DeveloperFormData = {
  name: "",
  logo: null,
  coverImage: null,
  description: [{ description: "" }],
  overview: "",
  location: "",
  establishedYear: new Date().getFullYear(),
  website: "",
  email: "nsr@noorsaray.com",
  phone: "+971 509856282",
  specialization: [],
  awards: [],
  verified: true,
}

// Real-time validation functions
const validateField = (field: string, value: any, formData: DeveloperFormData): string => {
  switch (field) {
    case 'name':
      if (!value || typeof value !== 'string') return 'Name is required'
      if (value.trim().length < 2) return 'Name must be at least 2 characters'
      if (value.trim().length > 100) return 'Name cannot exceed 100 characters'
      return ''

    case 'overview':
      if (!value || typeof value !== 'string') return 'Overview is required'
      const wordCount = value.trim().split(/\s+/).filter(word => word.length > 0).length
      if (wordCount > 20) return `Overview cannot exceed 20 words (${wordCount}/20)`
      return ''

    case 'location':
      if (!value || typeof value !== 'string') return 'Location is required'
      if (value.trim().length < 2) return 'Location must be at least 2 characters'
      if (value.trim().length > 100) return 'Location cannot exceed 100 characters'
      return ''

    case 'email':
      if (!value || typeof value !== 'string') return 'Email is required'
      const emailRegex = /^\S+@\S+\.\S+$/
      if (!emailRegex.test(value)) return 'Please provide a valid email address'
      return ''

    case 'phone':
      if (!value || typeof value !== 'string') return 'Phone is required'
      if (value.trim().length < 5) return 'Phone must be at least 5 characters'
      return ''

    case 'website':
      if (value && value.trim() && !value.startsWith('http')) {
        return 'Website URL must start with http:// or https://'
      }
      return ''

    case 'establishedYear':
      const currentYear = new Date().getFullYear()
      if (typeof value !== 'number') return 'Established year is required'
      if (value < 1800) return 'Year cannot be before 1800'
      if (value > currentYear) return 'Year cannot be in the future'
      return ''

    default:
      return ''
  }
}

// Character counter component
const CharacterCounter = ({ current, max }: { current: number; max: number }) => {
  const isNearLimit = current > max * 0.8
  const isOverLimit = current > max
  
  return (
    <div className={`text-xs mt-1 ${isOverLimit ? 'text-red-500' : isNearLimit ? 'text-yellow-500' : 'text-gray-400'}`}>
      {current}/{max}
    </div>
  )
}

// Word counter component
const WordCounter = ({ current, max }: { current: number; max: number }) => {
  const isOverLimit = current > max
  
  return (
    <div className={`text-xs mt-1 ${isOverLimit ? 'text-red-500' : current > max * 0.8 ? 'text-yellow-500' : 'text-gray-400'}`}>
      {current}/{max} words
    </div>
  )
}

// Enhanced Input with validation
const ValidatedInput = ({ 
  label, 
  field, 
  value, 
  onChange, 
  formData, 
  errors, 
  setErrors,
  type = "text",
  placeholder = "",
  required = false,
  maxLength,
  className = ""
}: {
  label: string
  field: string
  value: string | number
  onChange: (value: string | number) => void
  formData: DeveloperFormData
  errors: FieldErrors
  setErrors: React.Dispatch<React.SetStateAction<FieldErrors>>
  type?: string
  placeholder?: string
  required?: boolean
  maxLength?: number
  className?: string
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue: string | number = e.target.value
    
    if (type === 'number') {
      newValue = parseInt(newValue) || 0
    }
    
    if (maxLength && typeof newValue === 'string' && newValue.length > maxLength) {
      return
    }
    
    onChange(newValue)
    
    const error = validateField(field, newValue, formData)
    setErrors(prev => ({ ...prev, [field]: error }))
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text')
    if (maxLength && pastedText.length > maxLength) {
      e.preventDefault()
      const trimmedText = pastedText.slice(0, maxLength)
      onChange(trimmedText)
      setErrors(prev => ({ ...prev, [field]: validateField(field, trimmedText, formData) }))
    }
  }

  return (
    <div className={className}>
      <Label htmlFor={field}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id={field}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onPaste={handlePaste}
        className={`mt-1 ${errors[field] ? 'border-red-500' : ''}`}
      />
      {maxLength && typeof value === 'string' && (
        <CharacterCounter current={value.length} max={maxLength} />
      )}
      {errors[field] && (
        <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
          <AlertCircle className="h-3 w-3" />
          {errors[field]}
        </div>
      )}
    </div>
  )
}

// Enhanced Textarea with validation
const ValidatedTextarea = ({ 
  label, 
  field, 
  value, 
  onChange, 
  formData, 
  errors, 
  setErrors,
  placeholder = "",
  required = false,
  maxLength,
  rows = 3
}: {
  label: string
  field: string
  value: string
  onChange: (value: string) => void
  formData: DeveloperFormData
  errors: FieldErrors
  setErrors: React.Dispatch<React.SetStateAction<FieldErrors>>
  placeholder?: string
  required?: boolean
  maxLength?: number
  rows?: number
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let newValue = e.target.value
    
    if (maxLength && newValue.length > maxLength) {
      return
    }
    
    onChange(newValue)
    
    const error = validateField(field, newValue, formData)
    setErrors(prev => ({ ...prev, [field]: error }))
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text')
    if (maxLength && pastedText.length > maxLength) {
      e.preventDefault()
      const trimmedText = pastedText.slice(0, maxLength)
      onChange(trimmedText)
      setErrors(prev => ({ ...prev, [field]: validateField(field, trimmedText, formData) }))
    }
  }

  return (
    <div>
      <Label htmlFor={field}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Textarea
        id={field}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onPaste={handlePaste}
        rows={rows}
        className={`mt-1 ${errors[field] ? 'border-red-500' : ''}`}
      />
      {maxLength && (
        <CharacterCounter current={value.length} max={maxLength} />
      )}
      {errors[field] && (
        <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
          <AlertCircle className="h-3 w-3" />
          {errors[field]}
        </div>
      )}
    </div>
  )
}

// Enhanced Image upload with drag & drop and paste
const ImageUpload = ({ 
  label, 
  value, 
  onChange, 
  preview,
  onRemove,
  accept = "image/*",
  required = false,
  errors,
  field
}: { 
  label: string
  value: File | null
  onChange: (file: File | null) => void
  preview: string | null
  onRemove: () => void
  accept?: string
  required?: boolean
  errors: FieldErrors
  field: string
}) => {
  const [isDragOver, setIsDragOver] = useState(false)

  const validateAndSetFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPEG, JPG)')
      return false
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB')
      return false
    }
    onChange(file)
    return true
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      validateAndSetFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith('image/'))
    
    if (imageFile) {
      validateAndSetFile(imageFile)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items)
    const imageItem = items.find(item => item.type.startsWith('image/'))
    
    if (imageItem) {
      const file = imageItem.getAsFile()
      if (file) {
        validateAndSetFile(file)
      }
    }
  }

  return (
    <div className="space-y-2">
      <Label>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {!preview ? (
        <div 
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
            ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
            ${errors[field] ? 'border-red-500' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onPaste={handlePaste}
          tabIndex={0}
        >
          <Upload className={`mx-auto h-8 w-8 mb-2 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
          <div>
            <Label htmlFor={label.replace(/\s+/g, '-').toLowerCase()} className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-500">
                Upload {label.toLowerCase()}
              </span>
              <Input
                id={label.replace(/\s+/g, '-').toLowerCase()}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                className="hidden"
              />
            </Label>
            <p className="text-gray-500 text-xs mt-1">
              PNG, JPEG, JPG (max 5MB)<br/>
              Drag & drop, paste, or click to upload
            </p>
          </div>
        </div>
      ) : (
        <div className="relative">
          <img
            src={preview}
            alt={`${label} preview`}
            className="w-full h-32 object-cover rounded-lg"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      {errors[field] && (
        <div className="flex items-center gap-1 text-red-500 text-xs">
          <AlertCircle className="h-3 w-3" />
          {errors[field]}
        </div>
      )}
    </div>
  )
}

// Error Display Component
const ErrorDisplay = ({ submissionState, onRetry }: { 
  submissionState: SubmissionState; 
  onRetry: () => void;
}) => {
  if (!submissionState.apiError) return null;

  const { apiError, networkError } = submissionState;
  
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-red-800 mb-1">
            {networkError ? 'Connection Error' : 'Submission Failed'}
          </h4>
          <p className="text-sm text-red-700 mb-3">
            {apiError.message}
          </p>
          
          {/* Show detailed field errors if available */}
          {apiError.errors && Object.keys(apiError.errors).length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-red-800 mb-2">Details:</p>
              <ul className="text-xs text-red-700 space-y-1">
                {Object.entries(apiError.errors).map(([field, messages]) => (
                  <li key={field} className="flex items-start gap-1">
                    <span className="font-medium capitalize">{field}:</span>
                    <span>{Array.isArray(messages) ? messages.join(', ') : messages}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
              className="text-red-700 border-red-300 hover:bg-red-100"
            >
              Try Again
            </Button>
            {networkError && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => window.location.reload()}
                className="text-red-700 hover:bg-red-100"
              >
                Refresh Page
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export function DeveloperFormModal({ isOpen, onClose, onSuccess, developer, mode }: DeveloperFormModalProps) {
  const [formData, setFormData] = useState<DeveloperFormData>(initialFormData)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    isSubmitting: false,
    apiError: null,
    networkError: false
  });

  // Draft persistence state (only for add mode)
  const [hasDraft, setHasDraft] = useState(false)
  const [showDraftRestoreDialog, setShowDraftRestoreDialog] = useState(false)
  const [draftTimestamp, setDraftTimestamp] = useState<string | null>(null)
  
  // Unsaved changes state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false)
  const [pendingClose, setPendingClose] = useState(false)

  // Create debounced save function
  const debouncedSave = useMemo(
    () => createDebouncedDeveloperSave(1500), // Save 1.5 seconds after user stops typing
    []
  )

  // Handle keyboard events (Escape key)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !showDraftRestoreDialog && !showUnsavedChangesDialog && !submissionState.isSubmitting) {
        handleModalClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, showDraftRestoreDialog, showUnsavedChangesDialog, submissionState.isSubmitting])

  // Initialize form data and handle draft restoration
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && developer) {
        // Edit mode - load existing developer data
        setFormData({
          name: developer.name || "",
          logo: null,
          coverImage: null,
          description: developer.description || [{ description: "" }],
          overview: developer.overview || "",
          location: developer.location || "",
          establishedYear: developer.establishedYear || new Date().getFullYear(),
          website: developer.website || "",
          email: developer.email || "nsr@noorsaray.com",
          phone: developer.phone || "+971 509856282",
          verified: developer.verified ?? true,
          specialization: developer.specialization || [],
          awards: developer.awards || [],
        })
        
        if (developer.logo) setLogoPreview(developer.logo)
        if (developer.coverImage) setCoverImagePreview(developer.coverImage)
        setHasDraft(false)
      } else {
        // Add mode - check for saved draft
        const savedDraft = hasSavedDeveloperDraft()
        setHasDraft(savedDraft)

        if (savedDraft) {
          const timestamp = getDeveloperDraftTimestamp()
          setDraftTimestamp(timestamp)
          setShowDraftRestoreDialog(true)
        } else {
          setFormData(initialFormData)
          setLogoPreview(null)
          setCoverImagePreview(null)
        }
      }

      setErrors({})
      setSubmissionState({
        isSubmitting: false,
        apiError: null,
        networkError: false
      })
    }
  }, [developer, mode, isOpen])

  // Check if form has meaningful changes from initial state
  const hasFormChanges = useCallback((): boolean => {
    // For edit mode, compare with original developer data
    if (mode === 'edit' && developer) {
      return (
        formData.name !== (developer.name || '') ||
        formData.overview !== (developer.overview || '') ||
        formData.location !== (developer.location || '') ||
        formData.establishedYear !== (developer.establishedYear || new Date().getFullYear()) ||
        formData.website !== (developer.website || '') ||
        formData.email !== (developer.email || '') ||
        formData.phone !== (developer.phone || '') ||
        formData.verified !== (developer.verified ?? true) ||
        JSON.stringify(formData.description) !== JSON.stringify(developer.description || [{ description: "" }]) ||
        JSON.stringify(formData.specialization) !== JSON.stringify(developer.specialization || []) ||
        JSON.stringify(formData.awards) !== JSON.stringify(developer.awards || []) ||
        formData.logo !== null ||
        formData.coverImage !== null
      )
    }
    
    // For add mode, check if any meaningful data has been entered
    return (
      formData.name.trim() !== '' ||
      formData.overview.trim() !== '' ||
      formData.location.trim() !== '' ||
      formData.establishedYear !== new Date().getFullYear() ||
      formData.website.trim() !== '' ||
      (formData.email !== 'nsr@noorsaray.com' && formData.email.trim() !== '') ||
      (formData.phone !== '+971 509856282' && formData.phone.trim() !== '') ||
      formData.description.some(desc => desc.description.trim() !== '' || desc.title?.trim() !== '') ||
      formData.specialization.length > 0 ||
      formData.awards.length > 0 ||
      formData.logo !== null ||
      formData.coverImage !== null
    )
  }, [formData, mode, developer])

  // Handle input changes with auto-save and validation
  const handleInputChange = (field: keyof DeveloperFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Update unsaved changes flag
    setTimeout(() => {
      setHasUnsavedChanges(hasFormChanges())
    }, 0)

    // Save draft automatically for add mode only
    if (mode === 'add') {
      setTimeout(() => {
        setFormData(current => {
          debouncedSave(current)
          return current
        })
      }, 0)
    }
  }

  const handleSpecializationChange = (spec: string, checked: boolean) => {
    const newSpecialization = checked 
      ? [...formData.specialization, spec] 
      : formData.specialization.filter((s) => s !== spec)
    
    handleInputChange('specialization', newSpecialization)
  }

  // Description sections management
  const addDescriptionSection = () => {
    const newDescription = [...formData.description, { description: "" }]
    handleInputChange('description', newDescription)
  }

  const removeDescriptionSection = (index: number) => {
    const newDescription = formData.description.filter((_, i) => i !== index)
    handleInputChange('description', newDescription)
  }

  const updateDescriptionSection = (index: number, field: 'title' | 'description', value: string) => {
    const newDescription = formData.description.map((section, i) => 
      i === index 
        ? { ...section, [field]: value }
        : section
    )
    handleInputChange('description', newDescription)
  }

  // Awards management
  const addAward = () => {
    const newAwards = [...formData.awards, { name: "", year: new Date().getFullYear() }]
    handleInputChange('awards', newAwards)
  }

  const removeAward = (index: number) => {
    const newAwards = formData.awards.filter((_, i) => i !== index)
    handleInputChange('awards', newAwards)
  }

  const updateAward = (index: number, field: 'name' | 'year', value: string | number) => {
    const newAwards = formData.awards.map((award, i) => 
      i === index 
        ? { ...award, [field]: value }
        : award
    )
    handleInputChange('awards', newAwards)
  }

  // Handle logo upload
  const handleLogoUpload = (file: File | null) => {
    handleInputChange('logo', file)
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle cover image upload
  const handleCoverImageUpload = (file: File | null) => {
    handleInputChange('coverImage', file)
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setCoverImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Remove images
  const removeLogo = () => {
    handleInputChange('logo', null)
    setLogoPreview(null)
  }

  const removeCoverImage = () => {
    handleInputChange('coverImage', null)
    setCoverImagePreview(null)
  }

  // Count words in overview
  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  // Handle draft restoration
  const handleRestoreDraft = () => {
    try {
      const draft = loadDeveloperFormDraft()
      if (draft) {
        setFormData({
          ...draft,
          logo: null, // Reset file fields as they're not persisted
          coverImage: null
        })
        setLogoPreview(null)
        setCoverImagePreview(null)
        toast.success("Draft restored successfully")
      }
    } catch (error) {
      toast.error("Failed to restore draft")
    }
    setShowDraftRestoreDialog(false)
  }

  const handleDiscardDraft = () => {
    clearDeveloperFormDraft()
    setFormData(initialFormData)
    setLogoPreview(null)
    setCoverImagePreview(null)
    setHasDraft(false)
    setShowDraftRestoreDialog(false)
    toast.success("Draft discarded")
  }

  // Handle modal close - always show confirmation
  const handleModalClose = () => {
    if (submissionState.isSubmitting) {
      // Don't allow closing during submission
      return
    }
    
    // Always show confirmation dialog
    setPendingClose(true)
    setShowUnsavedChangesDialog(true)
  }

  // Handle unsaved changes dialog actions
  const handleContinueEditing = () => {
    setShowUnsavedChangesDialog(false)
    setPendingClose(false)
  }

  const handleSaveDraftAndClose = () => {
    if (mode === 'add') {
      debouncedSave(formData)
      toast.success("Draft saved successfully")
    }
    setShowUnsavedChangesDialog(false)
    setPendingClose(false)
    onClose()
    resetForm()
  }

  const handleDiscardAndClose = () => {
    if (mode === 'add') {
      clearDeveloperFormDraft()
    }
    setShowUnsavedChangesDialog(false)
    setPendingClose(false)
    onClose()
    resetForm()
  }

  // Reset form state
  const resetForm = () => {
    setHasUnsavedChanges(false)
    setFormData(initialFormData)
    setLogoPreview(null)
    setCoverImagePreview(null)
    setErrors({})
  }

  // Fill fake data for testing
  const fillFakeData = () => {
    const newFormData = {
      name: "Elite Developers LLC",
      logo: null,
      coverImage: null,
      description: [
        { 
          title: "About Us", 
          description: "A premium real estate development company specializing in luxury residential and commercial projects across Dubai." 
        },
        { 
          description: "With over 15 years of experience, we deliver exceptional quality and innovative designs that exceed expectations." 
        }
      ],
      overview: "Leading Dubai developer creating luxury residential and commercial projects with innovative designs and exceptional quality.",
      location: "Dubai, UAE",
      establishedYear: 2008,
      website: "https://www.elitedevelopers.ae",
      email: "info@elitedevelopers.ae",
      phone: "+971 4 123 4567",
      specialization: ["Luxury Residential", "Premium Apartments", "Commercial", "Mixed-Use"],
      awards: [
        { name: "Best Luxury Developer Award", year: 2023 },
        { name: "Excellence in Design Award", year: 2022 }
      ],
      verified: true,
    }
    
    setFormData(newFormData)
    
    // Trigger auto-save for add mode
    if (mode === 'add') {
      debouncedSave(newFormData)
    }
    
    // Update unsaved changes flag
    setTimeout(() => {
      setHasUnsavedChanges(hasFormChanges())
    }, 0)
  }

  // Validate entire form
  const validateForm = (): boolean => {
    const newErrors: FieldErrors = {}
    
    // Validate all fields
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof DeveloperFormData], formData)
      if (error) newErrors[key] = error
    })

    // Validate description sections
    formData.description.forEach((section, index) => {
      if (!section.description.trim()) {
        newErrors[`description-${index}`] = 'Description is required'
      }
      if (section.description.length > 500) {
        newErrors[`description-${index}`] = 'Description cannot exceed 500 characters'
      }
      if (section.title && section.title.length > 100) {
        newErrors[`description-title-${index}`] = 'Title cannot exceed 100 characters'
      }
    })

    // Validate awards
    formData.awards.forEach((award, index) => {
      if (!award.name.trim()) {
        newErrors[`award-name-${index}`] = 'Award name is required'
      }
      if (award.name.length > 200) {
        newErrors[`award-name-${index}`] = 'Award name cannot exceed 200 characters'
      }
    })

    // Image validation for add mode
    if (mode === 'add') {
      if (!formData.logo) newErrors['logo'] = 'Logo is required'
      if (!formData.coverImage) newErrors['coverImage'] = 'Cover image is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error("Please fix all validation errors before submitting")
      return
    }

    setSubmissionState({
      isSubmitting: true,
      apiError: null,
      networkError: false
    });

    try {
      const submitData = new FormData()
      
      // Add all form fields
      submitData.append('name', formData.name)
      submitData.append('description', JSON.stringify(formData.description))
      submitData.append('overview', formData.overview)
      submitData.append('location', formData.location)
      submitData.append('establishedYear', formData.establishedYear.toString())
      submitData.append('website', formData.website)
      submitData.append('email', formData.email)
      submitData.append('phone', formData.phone)
      submitData.append('verified', formData.verified.toString())
      submitData.append('specialization', JSON.stringify(formData.specialization))
      submitData.append('awards', JSON.stringify(formData.awards))

      // Add files if provided
      if (formData.logo) submitData.append('logoFile', formData.logo)
      if (formData.coverImage) submitData.append('coverImageFile', formData.coverImage)

      const endpoint = mode === 'add' ? '/api/developers/add' : `/api/developers/update/${developer?.slug}`
      const method = mode === 'add' ? 'POST' : 'PUT'

      const response = await fetch(endpoint, {
        method,
        body: submitData,
      })

      const result = await response.json()

      if (!response.ok) {
        // Handle different types of API errors
        const apiError: ApiError = {
          message: result.message || 'An error occurred',
          error: result.error || 'UNKNOWN_ERROR',
          errors: result.errors || {}
        };

        // Set field-specific errors if they exist
        if (result.errors && typeof result.errors === 'object') {
          const newFieldErrors: FieldErrors = {};
          
          Object.entries(result.errors).forEach(([field, messages]) => {
            if (Array.isArray(messages) && messages.length > 0) {
              newFieldErrors[field] = messages[0]; // Take first error message
            }
          });
          
          setErrors(prev => ({ ...prev, ...newFieldErrors }));
        }

        setSubmissionState({
          isSubmitting: false,
          apiError,
          networkError: false
        });

        // Show toast for immediate feedback
        toast.error(apiError.message);
        return;
      }

      // Success
      // Clear draft on successful submission for add mode
      if (mode === "add") {
        clearDeveloperFormDraft()
      }

      toast.success(`Developer ${mode === 'edit' ? 'updated' : 'created'} successfully!`)
      
      // Clear unsaved changes flag on successful submission
      setHasUnsavedChanges(false)
      
      // Call success callback and close modal
      if (onSuccess) {
        onSuccess(result.developer)
      }
      onClose()
      resetForm()

    } catch (error) {
      console.error('Error saving developer:', error)
      
      // Handle network errors
      const isNetworkError = error instanceof TypeError && error.message.includes('fetch');
      const errorMessage = isNetworkError 
        ? 'Network error. Please check your connection and try again.' 
        : error instanceof Error ? error.message : 'An unexpected error occurred';

      setSubmissionState({
        isSubmitting: false,
        apiError: {
          message: errorMessage,
          error: isNetworkError ? 'NETWORK_ERROR' : 'UNEXPECTED_ERROR'
        },
        networkError: isNetworkError
      });

      toast.error(errorMessage);
    }
  }

  const handleClose = () => {
    if (submissionState.isSubmitting) {
      return
    }
    handleModalClose()
  }

  return (
    <>
      {/* Draft Restoration Dialog */}
      <Dialog open={showDraftRestoreDialog} onOpenChange={setShowDraftRestoreDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Restore Saved Draft?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              You have a saved draft from {draftTimestamp}. Would you like to restore it or start fresh?
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleDiscardDraft}>
                Start Fresh
              </Button>
              <Button onClick={handleRestoreDraft}>
                Restore Draft
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Close Confirmation Dialog */}
      <Dialog open={showUnsavedChangesDialog} onOpenChange={(open) => !open && handleContinueEditing()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className={`h-5 w-5 ${hasUnsavedChanges ? 'text-amber-500' : 'text-blue-500'}`} />
              {hasUnsavedChanges ? 'Unsaved Changes' : 'Confirm Close'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {hasUnsavedChanges 
                ? 'You have unsaved changes in the developer form. What would you like to do?'
                : 'Are you sure you want to close the developer form?'
              }
            </p>
            <div className="grid gap-2">
              <Button 
                variant="outline" 
                onClick={handleContinueEditing}
                className="justify-start"
              >
                {hasUnsavedChanges ? 'Continue Editing' : 'Cancel'}
              </Button>
              {hasUnsavedChanges && mode === 'add' && (
                <Button 
                  variant="outline" 
                  onClick={handleSaveDraftAndClose}
                  className="justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  Save Draft & Close
                </Button>
              )}
              <Button 
                variant={hasUnsavedChanges ? "destructive" : "default"}
                onClick={handleDiscardAndClose}
                className="justify-start"
              >
                {hasUnsavedChanges ? 'Discard Changes & Close' : 'Yes, Close Form'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Form Modal */}
      <Dialog open={isOpen} onOpenChange={submissionState.isSubmitting ? undefined : handleModalClose}>
        <DialogContent className="max-w-6xl max-h-[95vh] p-0 flex flex-col">
          <DialogHeader className="p-6 pb-0 flex-shrink-0">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              {mode === "add" ? "Add New Developer" : "Edit Developer"}
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                  Unsaved Changes
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0">
            <div className="space-y-8 py-4">

              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <ValidatedInput
                      label="Developer Name"
                      field="name"
                      value={formData.name}
                      onChange={(value) => handleInputChange("name", value)}
                      formData={formData}
                      errors={errors}
                      setErrors={setErrors}
                      placeholder="Enter developer name"
                      required
                      maxLength={100}
                    />
                    <ValidatedInput
                      label="Location"
                      field="location"
                      value={formData.location}
                      onChange={(value) => handleInputChange("location", value)}
                      formData={formData}
                      errors={errors}
                      setErrors={setErrors}
                      placeholder="e.g., Dubai, UAE"
                      required
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <Label htmlFor="overview">
                      Overview <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="overview"
                      placeholder="Brief overview (max 20 words)"
                      value={formData.overview}
                      onChange={(e) => {
                        const newValue = e.target.value
                        const wordCount = getWordCount(newValue)
                        if (wordCount <= 20) {
                          handleInputChange("overview", newValue)
                          setErrors(prev => ({ ...prev, overview: validateField("overview", newValue, formData) }))
                        }
                      }}
                      onPaste={(e) => {
                        const pastedText = e.clipboardData.getData('text')
                        const wordCount = getWordCount(pastedText)
                        if (wordCount > 20) {
                          e.preventDefault()
                          const words = pastedText.trim().split(/\s+/).slice(0, 20)
                          const trimmedText = words.join(' ')
                          handleInputChange("overview", trimmedText)
                          setErrors(prev => ({ ...prev, overview: validateField("overview", trimmedText, formData) }))
                        }
                      }}
                      rows={2}
                      className={`mt-1 ${errors.overview ? 'border-red-500' : ''}`}
                    />
                    <WordCounter current={getWordCount(formData.overview)} max={20} />
                    {errors.overview && (
                      <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.overview}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Description Sections */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Description Sections
                    <Button type="button" variant="outline" size="sm" onClick={addDescriptionSection}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Section
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.description.map((section, index) => (
                    <div key={index} className="border p-4 rounded-lg space-y-3">
                      <div className="flex justify-between items-center">
                        <Label>Section {index + 1}</Label>
                        {formData.description.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDescriptionSection(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div>
                        <Label>Title (Optional)</Label>
                        <Input
                          placeholder="Section title"
                          value={section.title || ""}
                          onChange={(e) => {
                            const newValue = e.target.value
                            if (newValue.length <= 100) {
                              updateDescriptionSection(index, 'title', newValue)
                            }
                          }}
                          onPaste={(e) => {
                            const pastedText = e.clipboardData.getData('text')
                            if (pastedText.length > 100) {
                              e.preventDefault()
                              const trimmedText = pastedText.slice(0, 100)
                              updateDescriptionSection(index, 'title', trimmedText)
                            }
                          }}
                          className={`mt-1 ${errors[`description-title-${index}`] ? 'border-red-500' : ''}`}
                        />
                        <CharacterCounter current={(section.title || "").length} max={100} />
                        {errors[`description-title-${index}`] && (
                          <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors[`description-title-${index}`]}
                          </div>
                        )}
                      </div>

                      <div>
                        <Label>Description <span className="text-red-500">*</span></Label>
                        <Textarea
                          placeholder="Section description"
                          value={section.description}
                          onChange={(e) => {
                            const newValue = e.target.value
                            if (newValue.length <= 500) {
                              updateDescriptionSection(index, 'description', newValue)
                              setErrors(prev => ({ 
                                ...prev, 
                                [`description-${index}`]: newValue.trim() ? '' : 'Description is required'
                              }))
                            }
                          }}
                          onPaste={(e) => {
                            const pastedText = e.clipboardData.getData('text')
                            if (pastedText.length > 500) {
                              e.preventDefault()
                              const trimmedText = pastedText.slice(0, 500)
                              updateDescriptionSection(index, 'description', trimmedText)
                              setErrors(prev => ({ 
                                ...prev, 
                                [`description-${index}`]: trimmedText.trim() ? '' : 'Description is required'
                              }))
                            }
                          }}
                          rows={3}
                          className={`mt-1 ${errors[`description-${index}`] ? 'border-red-500' : ''}`}
                        />
                        <CharacterCounter current={section.description.length} max={500} />
                        {errors[`description-${index}`] && (
                          <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors[`description-${index}`]}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Company Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Company Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <ValidatedInput
                      label="Established Year"
                      field="establishedYear"
                      type="number"
                      value={formData.establishedYear}
                      onChange={(value) => handleInputChange("establishedYear", value)}
                      formData={formData}
                      errors={errors}
                      setErrors={setErrors}
                      required
                    />
                    <div>
                      <div className="flex items-center space-x-2 pt-6">
                        <Checkbox
                          id="verified"
                          checked={formData.verified}
                          onCheckedChange={(checked) => handleInputChange("verified", checked as boolean)}
                        />
                        <Label htmlFor="verified">Verified Developer</Label>
                      </div>
                    </div>
                  </div>

                  <ValidatedInput
                    label="Website"
                    field="website"
                    value={formData.website}
                    onChange={(value) => handleInputChange("website", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    placeholder="https://www.example.com"
                  />
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <ValidatedInput
                      label="Email"
                      field="email"
                      type="email"
                      value={formData.email}
                      onChange={(value) => handleInputChange("email", value)}
                      formData={formData}
                      errors={errors}
                      setErrors={setErrors}
                      placeholder="nsr@noorsaray.com"
                      required
                    />
                    <ValidatedInput
                      label="Phone"
                      field="phone"
                      value={formData.phone}
                      onChange={(value) => handleInputChange("phone", value)}
                      formData={formData}
                      errors={errors}
                      setErrors={setErrors}
                      placeholder="+971 509856282"
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Images */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    Images {mode === 'add' ? <span className="text-red-500">*</span> : '(Optional - leave blank to keep existing)'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <ImageUpload
                      label="Company Logo"
                      value={formData.logo}
                      onChange={handleLogoUpload}
                      preview={logoPreview}
                      onRemove={removeLogo}
                      required={mode === 'add'}
                      errors={errors}
                      field="logo"
                    />
                    <ImageUpload
                      label="Cover Image"
                      value={formData.coverImage}
                      onChange={handleCoverImageUpload}
                      preview={coverImagePreview}
                      onRemove={removeCoverImage}
                      required={mode === 'add'}
                      errors={errors}
                      field="coverImage"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Specialization */}
              <Card>
                <CardHeader>
                  <CardTitle>Specialization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {specializationOptions.map((spec) => (
                      <div key={spec} className="flex items-center space-x-2">
                        <Checkbox
                          id={spec}
                          checked={formData.specialization.includes(spec)}
                          onCheckedChange={(checked) => handleSpecializationChange(spec, checked as boolean)}
                        />
                        <Label htmlFor={spec} className="text-sm">
                          {spec}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {errors.specialization && (
                    <div className="flex items-center gap-1 text-red-500 text-xs mt-2">
                      <AlertCircle className="h-3 w-3" />
                      {errors.specialization}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Awards */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Awards (Optional)
                    <Button type="button" variant="outline" size="sm" onClick={addAward}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Award
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.awards.length === 0 ? (
                    <p className="text-gray-500 text-sm">No awards added yet. Click "Add Award" to add awards.</p>
                  ) : (
                    formData.awards.map((award, index) => (
                      <div key={index} className="border p-4 rounded-lg space-y-3">
                        <div className="flex justify-between items-center">
                          <Label>Award {index + 1}</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAward(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Award Name <span className="text-red-500">*</span></Label>
                            <Input
                              placeholder="Award name"
                              value={award.name}
                              onChange={(e) => {
                                const newValue = e.target.value
                                if (newValue.length <= 200) {
                                  updateAward(index, 'name', newValue)
                                  setErrors(prev => ({ 
                                    ...prev, 
                                    [`award-name-${index}`]: newValue.trim() ? '' : 'Award name is required'
                                  }))
                                }
                              }}
                              onPaste={(e) => {
                                const pastedText = e.clipboardData.getData('text')
                                if (pastedText.length > 200) {
                                  e.preventDefault()
                                  const trimmedText = pastedText.slice(0, 200)
                                  updateAward(index, 'name', trimmedText)
                                  setErrors(prev => ({ 
                                    ...prev, 
                                    [`award-name-${index}`]: trimmedText.trim() ? '' : 'Award name is required'
                                  }))
                                }
                              }}
                              className={`mt-1 ${errors[`award-name-${index}`] ? 'border-red-500' : ''}`}
                            />
                            <CharacterCounter current={award.name.length} max={200} />
                            {errors[`award-name-${index}`] && (
                              <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                                <AlertCircle className="h-3 w-3" />
                                {errors[`award-name-${index}`]}
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <Label>Year <span className="text-red-500">*</span></Label>
                            <Input
                              type="number"
                              placeholder="2023"
                              min="1900"
                              max={new Date().getFullYear()}
                              value={award.year}
                              onChange={(e) => {
                                const year = parseInt(e.target.value) || new Date().getFullYear()
                                updateAward(index, 'year', year)
                                const currentYear = new Date().getFullYear()
                                const error = year < 1900 ? 'Year cannot be before 1900' : 
                                             year > currentYear ? 'Year cannot be in the future' : ''
                                setErrors(prev => ({ ...prev, [`award-year-${index}`]: error }))
                              }}
                              className={`mt-1 ${errors[`award-year-${index}`] ? 'border-red-500' : ''}`}
                            />
                            {errors[`award-year-${index}`] && (
                              <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                                <AlertCircle className="h-3 w-3" />
                                {errors[`award-year-${index}`]}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Preview Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Developer Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Header */}
                  <div className="border-b pb-4">
                    <div className="flex items-start gap-4 mb-4">
                      {logoPreview && (
                        <img src={logoPreview} alt="Logo" className="w-16 h-16 object-cover rounded-lg" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-2xl font-bold">{formData.name || "Developer Name"}</h3>
                          {formData.verified && (
                            <Badge className="bg-green-500">
                              <span className="mr-1">✓</span> Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {formData.location || "Location"}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Est. {formData.establishedYear}
                          </div>
                        </div>
                      </div>
                    </div>

                    {coverImagePreview && (
                      <img src={coverImagePreview} alt="Cover" className="w-full h-48 object-cover rounded-lg" />
                    )}
                  </div>

                  {/* Overview */}
                  {formData.overview && (
                    <div>
                      <h4 className="font-semibold mb-2">Overview</h4>
                      <p className="text-gray-700">{formData.overview}</p>
                    </div>
                  )}

                  {/* Description */}
                  {formData.description.some(section => section.description.trim()) && (
                    <div>
                      <h4 className="font-semibold mb-2">About</h4>
                      <div className="space-y-3">
                        {formData.description
                          .filter(section => section.description.trim())
                          .map((section, index) => (
                          <div key={index}>
                            {section.title && (
                              <h5 className="font-medium mb-1">{section.title}</h5>
                            )}
                            <p className="text-gray-700">{section.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Awards */}
                  {formData.awards.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Awards & Recognition</h4>
                      <div className="space-y-2">
                        {formData.awards.map((award, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">{award.name}</span>
                            <span className="text-gray-500">({award.year})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Specialization */}
                  {formData.specialization.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Specialization</h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.specialization.map((spec) => (
                          <Badge key={spec} variant="outline">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact */}
                  <div>
                    <h4 className="font-semibold mb-3">Contact Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {formData.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-gray-500" />
                          <a href={formData.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            Website
                          </a>
                        </div>
                      )}
                      {formData.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <a href={`mailto:${formData.email}`} className="text-blue-600 hover:underline">
                            {formData.email}
                          </a>
                        </div>
                      )}
                      {formData.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <a href={`tel:${formData.phone}`} className="text-blue-600 hover:underline">
                            {formData.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t p-6 bg-gray-50 flex-shrink-0">
            {/* Error Display */}
            <ErrorDisplay 
              submissionState={submissionState}
              onRetry={() => {
                setSubmissionState(prev => ({ ...prev, apiError: null, networkError: false }));
              }}
            />
            
            <div className="flex gap-2 justify-between">
              <Button variant="outline" onClick={fillFakeData} disabled={submissionState.isSubmitting}>
                Fill Test Data
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} disabled={submissionState.isSubmitting}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={submissionState.isSubmitting || Object.keys(errors).some(key => errors[key])}
                >
                  {submissionState.isSubmitting ? 
                    (mode === "edit" ? "Updating..." : "Creating...") : 
                    (mode === "edit" ? "Update Developer" : "Create Developer")
                  }
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}