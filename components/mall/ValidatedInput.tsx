// components/mall/ValidatedInput.tsx
"use client"

import { Input } from "@/components/ui/input"
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

// Enhanced Input with validation
interface ValidatedInputProps {
  label: string
  field: string
  value: string | number
  onChange: (value: string | number) => void
  formData: MallFormData
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  type?: string
  placeholder?: string
  required?: boolean
  maxLength?: number
  className?: string
  min?: number
  max?: number
  step?: number
}

export function ValidatedInput({
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
  className = "",
  min,
  max,
  step
}: ValidatedInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue: string | number = e.target.value

    if (type === 'number') {
      newValue = parseFloat(newValue) || 0
    }

    if (maxLength && typeof newValue === 'string' && newValue.length > maxLength) {
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
        className={`mt-1 ${errors[field] ? 'border-red-500' : ''}`}
        min={min}
        max={max}
        step={step}
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