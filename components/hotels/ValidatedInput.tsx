// components/hotels/ValidatedInput.tsx
"use client"

import React, { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle } from "lucide-react"
import type { HotelFormData } from "@/types/hotels"

interface ValidatedInputProps {
  label: string
  field: string
  value: string | number
  onChange: (value: any) => void
  formData: HotelFormData
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  type?: 'text' | 'number' | 'email' | 'tel' | 'url'
  placeholder?: string
  required?: boolean
  min?: number
  max?: number
  step?: number | string
  maxLength?: number
  disabled?: boolean
  className?: string
  description?: string
}

export function ValidatedInput({
  label,
  field,
  value,
  onChange,
  formData,
  errors,
  setErrors,
  type = 'text',
  placeholder,
  required = false,
  min,
  max,
  step,
  maxLength,
  disabled = false,
  className = '',
  description
}: ValidatedInputProps) {
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

    if (required && (!value || (typeof value === 'string' && value.trim().length === 0))) {
      errorMessage = `${label} is required`
    } else if (value) {
      if (type === 'number') {
        const numValue = typeof value === 'string' ? parseFloat(value) : value
        if (isNaN(numValue)) {
          errorMessage = `${label} must be a valid number`
        } else {
          if (min !== undefined && numValue < min) {
            errorMessage = `${label} must be at least ${min}`
          }
          if (max !== undefined && numValue > max) {
            errorMessage = `${label} must not exceed ${max}`
          }
        }
      } else if (type === 'email' && typeof value === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value.trim())) {
          errorMessage = `${label} must be a valid email address`
        }
      } else if (type === 'url' && typeof value === 'string') {
        try {
          new URL(value.trim())
        } catch {
          errorMessage = `${label} must be a valid URL`
        }
      } else if (typeof value === 'string') {
        if (maxLength && value.length > maxLength) {
          errorMessage = `${label} cannot exceed ${maxLength} characters`
        }
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = type === 'number' ? (e.target.value === '' ? 0 : parseFloat(e.target.value)) : e.target.value
    onChange(newValue)
  }

  const inputClassName = `${className} ${
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
      
      <Input
        id={field}
        type={type}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        maxLength={maxLength}
        disabled={disabled}
        className={inputClassName}
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
      
      {type === 'text' && maxLength && typeof value === 'string' && (
        <div className="text-xs text-right text-gray-400">
          {value.length}/{maxLength}
        </div>
      )}
    </div>
  )
}