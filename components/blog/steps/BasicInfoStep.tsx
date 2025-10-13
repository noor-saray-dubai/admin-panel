"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle } from "lucide-react"

// Character limits from schema
const LIMITS = {
  title: 200,
  excerpt: 500,
}

const categories = ["Investment", "Development", "Legal", "Sustainability", "Market Analysis", "Lifestyle", "News"]

// Character counter component
const CharCounter = ({ current, max, className = "" }: { current: number, max: number, className?: string }) => {
  const isNearLimit = current > max * 0.8
  const isOverLimit = current > max
  
  return (
    <div className={`text-xs ${isOverLimit ? 'text-red-500' : isNearLimit ? 'text-yellow-600' : 'text-gray-500'} ${className}`}>
      {current}/{max}
    </div>
  )
}

// Text input with character limit and field-level validation
const LimitedInput = ({ 
  value, 
  onChange, 
  maxLength, 
  placeholder, 
  className = "", 
  multiline = false,
  rows = 3,
  label,
  required = false,
  error,
  type = "text"
}: {
  value: string | number
  onChange: (value: string) => void
  maxLength: number
  placeholder?: string
  className?: string
  multiline?: boolean
  rows?: number
  label?: string
  required?: boolean
  error?: string
  type?: string
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let newValue = e.target.value
    if (typeof newValue === 'string' && newValue.length > maxLength) {
      newValue = newValue.substring(0, maxLength)
    }
    onChange(newValue)
  }

  const InputComponent = multiline ? Textarea : Input

  return (
    <div>
      {label && (
        <Label className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <div className="relative">
        <InputComponent
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={`${className} ${error ? 'border-red-500' : ''}`}
          rows={multiline ? rows : undefined}
          type={type}
        />
        <CharCounter 
          current={value.toString().length} 
          max={maxLength} 
          className="absolute -bottom-5 right-0"
        />
      </div>
      {error && (
        <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}
    </div>
  )
}

// Import types from main component
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

interface BasicInfoStepProps {
  formData: BlogFormData
  errors: FieldErrors
  onFieldChange: (field: keyof BlogFormData, value: any) => void
}

export function BasicInfoStep({ formData, errors, onFieldChange }: BasicInfoStepProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <LimitedInput
              value={formData.title}
              onChange={(value) => onFieldChange("title", value)}
              maxLength={LIMITS.title}
              placeholder="Enter blog post title"
              label="Title"
              required
              error={errors.title}
            />
            <div className="space-y-2">
              <Label htmlFor="author">Author <span className="text-red-500">*</span></Label>
              <Input
                value={formData.author}
                onChange={(e) => onFieldChange("author", e.target.value)}
                placeholder="Enter author name"
                className={errors.author ? 'border-red-500' : ''}
              />
              {errors.author && (
                <div className="flex items-center gap-1 text-red-500 text-xs">
                  <AlertCircle className="h-3 w-3" />
                  {errors.author}
                </div>
              )}
            </div>
          </div>

          <LimitedInput
            value={formData.excerpt}
            onChange={(value) => onFieldChange("excerpt", value)}
            maxLength={LIMITS.excerpt}
            placeholder="Brief description of the blog post..."
            multiline
            rows={3}
            label="Excerpt"
            required
            error={errors.excerpt}
          />

          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
              <Select value={formData.category} onValueChange={(value) => onFieldChange("category", value)}>
                <SelectTrigger className={`mt-1 ${errors.category ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.category}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}