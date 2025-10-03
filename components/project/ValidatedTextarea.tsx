// components/project/ValidatedTextarea.tsx
"use client"

import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ValidatedTextareaProps {
  label: string
  field: string
  value: string
  onChange: (value: string) => void
  formData: any
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  placeholder?: string
  required?: boolean
  maxLength?: number
  minLength?: number
  rows?: number
  disabled?: boolean
  description?: string
  className?: string
}

export function ValidatedTextarea({
  label,
  field,
  value,
  onChange,
  formData,
  errors,
  setErrors,
  placeholder = '',
  required = false,
  maxLength,
  minLength,
  rows = 4,
  disabled = false,
  description,
  className
}: ValidatedTextareaProps) {
  const error = errors[field]
  const hasValue = value !== undefined && value !== null && value !== ''
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
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
    } else if (minLength && value.length < minLength) {
      setErrors(prev => ({
        ...prev,
        [field]: `${label} must be at least ${minLength} characters`
      }))
    } else if (maxLength && value.length > maxLength) {
      setErrors(prev => ({
        ...prev,
        [field]: `${label} cannot exceed ${maxLength} characters`
      }))
    }
  }

  const getCharacterCount = () => {
    if (maxLength) {
      return `${value.length}/${maxLength}`
    }
    return null
  }

  const isNearLimit = () => {
    if (maxLength) {
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
      
      <Textarea
        id={field}
        name={field}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        rows={rows}
        className={cn(
          "transition-colors resize-none",
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