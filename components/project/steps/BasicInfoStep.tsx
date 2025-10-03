// components/project/steps/BasicInfoStep.tsx
"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building, CheckCircle, AlertCircle, Search, X } from "lucide-react"
import { ValidatedInput } from "../ValidatedInput"
import type { ProjectFormData } from "@/types/projects"

interface Developer {
  id: string
  name: string
  slug?: string
}

interface BasicInfoStepProps {
  formData: ProjectFormData
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  onInputChange: (field: string, value: any) => void
}

const PROJECT_TYPES = ['Residential', 'Commercial', 'Mixed Use', 'Industrial', 'Hospitality', 'Retail']
const PROJECT_STATUSES = ['Pre-Launch', 'Launched', 'Under Construction', 'Ready to Move', 'Completed', 'Sold Out']

// Developer Search Component (matching old form exactly)
const DeveloperSearch = ({ 
  developers, 
  value, 
  onChange, 
  error,
  onBlur 
}: {
  developers: Developer[];
  value: string;
  onChange: (developer: Developer) => void;
  error?: string;
  onBlur?: () => void;
}) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const filteredDevelopers = useMemo(() => {
    if (!searchTerm.trim()) return developers
    return developers.filter(dev => 
      dev.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [developers, searchTerm])

  const selectedDeveloper = developers.find(dev => dev.name === value)
  const hasValue = selectedDeveloper && selectedDeveloper.name

  return (
    <div className="relative">
      <Label className={`flex items-center gap-1 ${hasValue ? 'text-green-600' : ''}`}>
        {hasValue && <CheckCircle className="h-3 w-3" />}
        Developer <span className="text-red-500">*</span>
      </Label>
      <div className="relative mt-1">
        <div className="flex">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onBlur={() => {
              setTimeout(() => setIsOpen(false), 200)
              if (onBlur) onBlur()
            }}
            placeholder="Search developers..."
            className={`pr-10 ${error ? 'border-red-500' : hasValue ? 'border-green-500' : ''} ${!hasValue ? 'bg-red-50 border-red-200' : ''}`}
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        
        {isOpen && filteredDevelopers.length > 0 && (
          <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto mt-1">
            {filteredDevelopers.map((developer) => (
              <button
                key={developer.id}
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50"
                onMouseDown={() => {
                  onChange(developer)
                  setSearchTerm("")
                  setIsOpen(false)
                }}
              >
                {developer.name}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {selectedDeveloper && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded flex justify-between items-center">
          <span className="text-sm">Selected: {selectedDeveloper.name}</span>
          <button
            type="button"
            onClick={() => onChange({ id: "", name: "", slug: "" })}
            className="text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
      {error && (
        <span className="text-red-500 text-xs flex items-center gap-1 mt-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </span>
      )}
    </div>
  )
}

export function BasicInfoStep({ formData, errors, setErrors, onInputChange }: BasicInfoStepProps) {
  const [developers, setDevelopers] = useState<Developer[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch developers from API - exactly like in old form
  useEffect(() => {
    const fetchDevelopers = async () => {
      try {
        const res = await fetch("/api/developers/fetch")
        const json = await res.json()
        if (json.success) {
          setDevelopers(json.data)
        }
      } catch (err) {
        console.error("Error fetching developers:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchDevelopers()
  }, [])

  const handleDeveloperChange = (developer: Developer) => {
    onInputChange('developer', developer.name)
    onInputChange('developerSlug', developer.slug || developer.name.toLowerCase().replace(/\s+/g, '-'))
  }

  return (
    <div className="space-y-6">
      {/* Project Details - matching old form exactly */}
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <ValidatedInput
              label="Project Name"
              field="name"
              value={formData.name}
              onChange={(value) => onInputChange('name', value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              required
              maxLength={200}
              minLength={3}
              placeholder="Enter project name"
            />
            <ValidatedInput
              label="Location"
              field="location"
              value={formData.location}
              onChange={(value) => onInputChange('location', value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              required
              maxLength={100}
              minLength={2}
              placeholder="Enter location"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type" className={`flex items-center gap-1 ${formData.type ? 'text-green-600' : ''}`}>
                {formData.type && <CheckCircle className="h-3 w-3" />}
                Project Type <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => onInputChange('type', value)}
              >
                <SelectTrigger className={`mt-1 ${errors.type ? 'border-red-500' : formData.type ? 'border-green-500' : ''} ${!formData.type ? 'bg-red-50 border-red-200' : ''}`}>
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <span className="text-red-500 text-xs flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.type}
                </span>
              )}
            </div>

            <div>
              <Label htmlFor="status" className={`flex items-center gap-1 ${formData.status ? 'text-green-600' : ''}`}>
                {formData.status && <CheckCircle className="h-3 w-3" />}
                Status <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => onInputChange('status', value)}
              >
                <SelectTrigger className={`mt-1 ${errors.status ? 'border-red-500' : formData.status ? 'border-green-500' : ''} ${!formData.status ? 'bg-red-50 border-red-200' : ''}`}>
                  <SelectValue placeholder="Select project status" />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && (
                <span className="text-red-500 text-xs flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.status}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DeveloperSearch
              developers={developers}
              value={formData.developer}
              onChange={handleDeveloperChange}
              error={errors.developer}
            />
            
            <ValidatedInput
              label="Total Units"
              field="totalUnits"
              value={formData.totalUnits?.toString() || ''}
              onChange={(value) => onInputChange('totalUnits', Number(value) || 0)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              type="number"
              required
              min={1}
              max={10000}
              placeholder="250"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="completionDate" className={`flex items-center gap-1 ${formData.completionDate ? 'text-green-600' : ''}`}>
                {formData.completionDate && <CheckCircle className="h-3 w-3" />}
                Completion Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="completionDate"
                type="date"
                value={formData.completionDate}
                onChange={(e) => onInputChange('completionDate', e.target.value)}
                className={`mt-1 ${errors.completionDate ? 'border-red-500' : formData.completionDate ? 'border-green-500' : ''} ${!formData.completionDate ? 'bg-red-50 border-red-200' : ''}`}
              />
              {errors.completionDate && (
                <span className="text-red-500 text-xs flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.completionDate}
                </span>
              )}
            </div>
            
            <div>
              <Label htmlFor="launchDate" className={`flex items-center gap-1 ${formData.launchDate ? 'text-green-600' : ''}`}>
                {formData.launchDate && <CheckCircle className="h-3 w-3" />}
                Launch Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="launchDate"
                type="date"
                value={formData.launchDate}
                onChange={(e) => onInputChange('launchDate', e.target.value)}
                className={`mt-1 ${errors.launchDate ? 'border-red-500' : formData.launchDate ? 'border-green-500' : ''} ${!formData.launchDate ? 'bg-red-50 border-red-200' : ''}`}
              />
              {errors.launchDate && (
                <span className="text-red-500 text-xs flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.launchDate}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Information - matching old form exactly */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <ValidatedInput
              label="Price Display Text"
              field="price"
              value={formData.price?.total || ''}
              onChange={(value) => onInputChange('price.total', value)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              required
              maxLength={100}
              minLength={5}
              placeholder="e.g., Starting from AED 999K"
            />
            
            <ValidatedInput
              label="Numeric Price (AED)"
              field="priceNumeric"
              value={formData.price?.totalNumeric?.toString() || ''}
              onChange={(value) => onInputChange('price.totalNumeric', Number(value) || 0)}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              type="number"
              required
              min={0}
              placeholder="999000"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
