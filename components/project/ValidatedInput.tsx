// components/project/ValidatedInput.tsx
"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ValidatedInputProps {
  label: string
  field: string
  value: string | number
  onChange: (value: string | number) => void
  formData: any
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  type?: 'text' | 'number' | 'email' | 'tel' | 'url' | 'date' | 'time' | 'datetime-local'
  placeholder?: string
  required?: boolean
  maxLength?: number
  minLength?: number
  min?: number
  max?: number
  step?: string
  disabled?: boolean
  description?: string
  className?: string
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
  placeholder = '',
  required = false,
  maxLength,
  minLength,
  min,
  max,
  step,
  disabled = false,
  description,
  className
}: ValidatedInputProps) {
  const error = errors[field]
  const hasValue = value !== undefined && value !== null && value !== ''
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = type === 'number' ? Number(e.target.value) : e.target.value
    onChange(newValue)
    
    // Clear error when user starts typing
    if (error) {
      const newErrors = { ...errors }
      delete newErrors[field]
      setErrors(newErrors)
    }
  }

  const handleBlur = () => {
    // Perform validation on blur if needed
    if (required && !hasValue) {
      setErrors(prev => ({
        ...prev,
        [field]: `${label} is required`
      }))
    } else if (type === 'email' && hasValue && typeof value === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        setErrors(prev => ({
          ...prev,
          [field]: 'Please enter a valid email address'
        }))
      }
    } else if (type === 'url' && hasValue && typeof value === 'string') {
      const urlRegex = /^https?:\/\/.+/
      if (!urlRegex.test(value)) {
        setErrors(prev => ({
          ...prev,
          [field]: 'Please enter a valid URL (must start with http:// or https://)'
        }))
      }
    } else if (minLength && typeof value === 'string' && value.length < minLength) {
      setErrors(prev => ({
        ...prev,
        [field]: `${label} must be at least ${minLength} characters`
      }))
    } else if (type === 'number' && typeof value === 'number') {
      if (min !== undefined && value < min) {
        setErrors(prev => ({
          ...prev,
          [field]: `${label} must be at least ${min}`
        }))
      } else if (max !== undefined && value > max) {
        setErrors(prev => ({
          ...prev,
          [field]: `${label} cannot exceed ${max}`
        }))
      }
    }
  }

  const getCharacterCount = () => {
    if (typeof value === 'string' && maxLength) {
      return `${value.length}/${maxLength}`
    }
    return null
  }

  const isNearLimit = () => {
    if (typeof value === 'string' && maxLength) {
      return value.length > maxLength * 0.8
    }
    return false
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={field} className="flex items-center gap-1.5">
        {hasValue && !error && (
          <CheckCircle className="h-3.5 w-3.5 text-green-600" />
        )}
        {error && (
          <AlertCircle className="h-3.5 w-3.5 text-red-600" />
        )}
        <span className={cn(
          "font-medium",
          hasValue && !error && "text-green-700",
          error && "text-red-700"
        )}>
          {label}
        </span>
        {required && <span className="text-red-500 text-sm">*</span>}
      </Label>
      
      <Input
        id={field}
        name={field}
        type={type}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        minLength={minLength}
        min={min}
        max={max}
        step={step}
        className={cn(
          "transition-colors",
          error && "border-red-500 focus:border-red-500 bg-red-50",
          hasValue && !error && "border-green-500 bg-green-50",
          !hasValue && required && "bg-amber-50 border-amber-200"
        )}
      />
      
      <div className="flex items-center justify-between min-h-[1.25rem]">
        {error ? (
          <span className="text-red-600 text-xs flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {error}
          </span>
        ) : description ? (
          <span className="text-muted-foreground text-xs">
            {description}
          </span>
        ) : (
          <span></span>
        )}
        
        {getCharacterCount() && (
          <span className={cn(
            "text-xs ml-auto",
            isNearLimit() ? "text-amber-600" : "text-muted-foreground"
          )}>
            {getCharacterCount()}
          </span>
        )}
      </div>
    </div>
  )
}