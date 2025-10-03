// components/hotels/ValidatedTextarea.tsx
"use client"

import React, { useState, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle } from "lucide-react"
import type { HotelFormData } from "@/types/hotels"

interface ValidatedTextareaProps {
  label: string
  field: string
  value: string
  onChange: (value: string) => void
  formData: HotelFormData
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  placeholder?: string
  required?: boolean
  maxLength?: number
  minLength?: number
  rows?: number
  disabled?: boolean
  className?: string
  description?: string
}

export function ValidatedTextarea({
  label,
  field,
  value,
  onChange,
  formData,
  errors,
  setErrors,
  placeholder,
  required = false,
  maxLength,
  minLength,
  rows = 3,
  disabled = false,
  className = '',
  description
}: ValidatedTextareaProps) {
  const [touched, setTouched] = useState(false)
  const [isValid, setIsValid] = useState<boolean | null>(null)

  const error = errors[field]
  const hasError = Boolean(error)

  // Validate field on blur or value change
  useEffect(() => {
    if (touched) {
      validateField()
    }
  }, [value, touched])

  const validateField = () => {
    // Clear existing error first
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }

    // Basic validation
    let errorMessage = ''

    if (required && (!value || value.trim().length === 0)) {
      errorMessage = `${label} is required`
    } else if (value) {
      if (minLength && value.length < minLength) {
        errorMessage = `${label} must be at least ${minLength} characters`
      }
      if (maxLength && value.length > maxLength) {
        errorMessage = `${label} cannot exceed ${maxLength} characters`
      }
    }

    if (errorMessage) {
      setErrors(prev => ({ ...prev, [field]: errorMessage }))
      setIsValid(false)
    } else {
      setIsValid(touched ? true : null)
    }
  }

  const handleBlur = () => {
    setTouched(true)
    validateField()
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  const textareaClassName = `${className} ${
    hasError 
      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
      : isValid 
      ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
      : ''
  }`

  return (
    <div className="space-y-2">
      <Label htmlFor={field} className="flex items-center gap-2">
        {label}
        {required && <span className="text-red-500">*</span>}
        {isValid && !hasError && (
          <CheckCircle className="h-4 w-4 text-green-500" />
        )}
      </Label>
      
      <Textarea
        id={field}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        disabled={disabled}
        className={textareaClassName}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${field}-error` : description ? `${field}-description` : undefined}
      />
      
      {description && !hasError && (
        <p id={`${field}-description`} className="text-xs text-gray-500">
          {description}
        </p>
      )}
      
      {hasError && (
        <div id={`${field}-error`} className="flex items-center gap-1 text-red-500 text-xs mt-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}
      
      {maxLength && (
        <div className="text-xs text-right text-gray-400">
          {value.length}/{maxLength}
        </div>
      )}
    </div>
  )
}