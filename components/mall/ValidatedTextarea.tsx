// components/mall/ValidatedTextarea.tsx
"use client"

import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"
import type { MallFormData } from "@/types/mall"

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

// Enhanced Textarea with validation
interface ValidatedTextareaProps {
  label: string
  field: string
  value: string
  onChange: (value: string) => void
  formData: MallFormData
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  placeholder?: string
  required?: boolean
  maxLength?: number
  rows?: number
}

export function ValidatedTextarea({
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
}: ValidatedTextareaProps) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let newValue = e.target.value

    if (maxLength && newValue.length > maxLength) {
      return
    }

    onChange(newValue)

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
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