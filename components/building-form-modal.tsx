"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { X, Eye, Plus, AlertCircle, Building2, DollarSign, Home } from "lucide-react"
import type { IBuilding, BuildingFormData } from "@/types/buildings"

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

interface BuildingFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (building: IBuilding) => void
  building?: IBuilding | null
  mode: "add" | "edit"
}

const categoryOptions = ["residential", "commercial", "mixed"]
const statusOptions = ["Completed", "Under Construction", "Planned", "Renovation", "Iconic", "New", "Premium", "Exclusive", "Landmark", "Elite", "Historic", "Modern"]
const ownershipOptions = ["freehold", "leasehold"]
const unitTypeOptions = ["Studio", "1BR", "2BR", "3BR", "4BR", "5BR+", "Penthouse", "Office", "Retail", "Restaurant", "Showroom"]

const initialFormData: BuildingFormData = {
  name: "",
  subtitle: "",
  location: "",
  subLocation: "",
  category: "",
  type: "",
  price: { value: "", valueNumeric: 0, currency: "AED" },
  dimensions: { floors: 1 },
  year: new Date().getFullYear(),
  units: [],
  totalUnits: 0,
  amenities: {},
  features: [],
  highlights: [],
  mainImage: "",
  gallery: [],
  description: "",
  status: "",
  verified: true,
  isActive: true,
  isFeatured: false,
}

const validateField = (field: string, value: any): string => {
  switch (field) {
    case 'name':
      if (!value || typeof value !== 'string') return 'Building name is required'
      if (value.trim().length < 2) return 'Name must be at least 2 characters'
      if (value.trim().length > 200) return 'Name cannot exceed 200 characters'
      return ''
    case 'location':
      if (!value || typeof value !== 'string') return 'Location is required'
      if (value.trim().length < 2) return 'Location must be at least 2 characters'
      return ''
    case 'category':
      if (!value) return 'Category is required'
      return ''
    case 'type':
      if (!value || typeof value !== 'string') return 'Building type is required'
      return ''
    case 'status':
      if (!value) return 'Status is required'
      return ''
    case 'description':
      if (!value || typeof value !== 'string') return 'Description is required'
      if (value.trim().length < 10) return 'Description must be at least 10 characters'
      if (value.trim().length > 2000) return 'Description cannot exceed 2000 characters'
      return ''
    case 'year':
      const currentYear = new Date().getFullYear()
      if (typeof value !== 'number') return 'Year is required'
      if (value < 1800) return 'Year cannot be before 1800'
      if (value > currentYear + 10) return 'Year cannot be more than 10 years in the future'
      return ''
    default:
      return ''
  }
}

const CharacterCounter = ({ current, max }: { current: number; max: number }) => {
  const isOverLimit = current > max
  return (
    <div className={`text-xs mt-1 ${isOverLimit ? 'text-red-500' : current > max * 0.8 ? 'text-yellow-500' : 'text-gray-400'}`}>
      {current}/{max}
    </div>
  )
}

const ErrorDisplay = ({ submissionState, onRetry }: { submissionState: SubmissionState; onRetry: () => void }) => {
  if (!submissionState.apiError) return null
  const { apiError, networkError } = submissionState
  
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-red-800 mb-1">
            {networkError ? 'Connection Error' : 'Submission Failed'}
          </h4>
          <p className="text-sm text-red-700 mb-3">{apiError.message}</p>
          {apiError.errors && Object.keys(apiError.errors).length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-red-800 mb-2">Details:</p>
              <ul className="text-xs text-red-700 space-y-1">
                {Object.entries(apiError.errors).map(([field, messages]) => (
                  <li key={field}>
                    <span className="font-medium capitalize">{field}:</span> {Array.isArray(messages) ? messages.join(', ') : messages}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={onRetry} className="text-red-700 border-red-300 hover:bg-red-100">
            Try Again
          </Button>
        </div>
      </div>
    </div>
  )
}

export function BuildingFormModal({ isOpen, onClose, onSuccess, building, mode }: BuildingFormModalProps) {
  const [formData, setFormData] = useState<BuildingFormData>(initialFormData)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    isSubmitting: false,
    apiError: null,
    networkError: false
  })
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && building) {
        setFormData({
          name: building.name || "",
          subtitle: building.subtitle || "",
          location: building.location || "",
          subLocation: building.subLocation || "",
          category: building.category || "",
          type: building.type || "",
          price: building.price || { value: "", valueNumeric: 0, currency: "AED" },
          priceRange: building.priceRange,
          dimensions: building.dimensions || { floors: 1 },
          year: building.year || new Date().getFullYear(),
          yearBuilt: building.yearBuilt,
          units: building.units || [],
          totalUnits: building.totalUnits || 0,
          availableUnits: building.availableUnits,
          amenities: building.amenities || {},
          features: building.features || [],
          highlights: building.highlights || [],
          financials: building.financials,
          saleInformation: building.saleInformation,
          legalDetails: building.legalDetails,
          developer: building.developer,
          architect: building.architect,
          architecture: building.architecture,
          mainImage: building.mainImage || "",
          gallery: building.gallery || [],
          description: building.description || "",
          status: building.status || "",
          verified: building.verified ?? true,
          isActive: building.isActive ?? true,
          isFeatured: building.isFeatured ?? false,
        })
      } else {
        setFormData(initialFormData)
      }
      setErrors({})
      setSubmissionState({ isSubmitting: false, apiError: null, networkError: false })
      setHasUnsavedChanges(false)
    }
  }, [building, mode, isOpen])

  const handleInputChange = (field: keyof BuildingFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setHasUnsavedChanges(true)
    const error = validateField(field as string, value)
    if (error) setErrors((prev) => ({ ...prev, [field]: error }))
    else setErrors((prev) => { const newErrors = { ...prev }; delete newErrors[field]; return newErrors })
  }

  const addUnit = () => {
    const newUnits = [...formData.units, { type: "1BR", count: 1 }]
    handleInputChange('units', newUnits)
  }

  const removeUnit = (index: number) => {
    const newUnits = formData.units.filter((_, i) => i !== index)
    handleInputChange('units', newUnits)
  }

  const updateUnit = (index: number, field: string, value: any) => {
    const newUnits = formData.units.map((unit, i) => 
      i === index ? { ...unit, [field]: value } : unit
    )
    handleInputChange('units', newUnits)
  }

  const addFeature = () => {
    const newFeatures = [...(formData.features || []), ""]
    handleInputChange('features', newFeatures)
  }

  const removeFeature = (index: number) => {
    const newFeatures = formData.features!.filter((_, i) => i !== index)
    handleInputChange('features', newFeatures)
  }

  const updateFeature = (index: number, value: string) => {
    const newFeatures = formData.features!.map((f, i) => i === index ? value : f)
    handleInputChange('features', newFeatures)
  }

  const addHighlight = () => {
    const newHighlights = [...(formData.highlights || []), ""]
    handleInputChange('highlights', newHighlights)
  }

  const removeHighlight = (index: number) => {
    const newHighlights = formData.highlights!.filter((_, i) => i !== index)
    handleInputChange('highlights', newHighlights)
  }

  const updateHighlight = (index: number, value: string) => {
    const newHighlights = formData.highlights!.map((h, i) => i === index ? value : h)
    handleInputChange('highlights', newHighlights)
  }

  const addGalleryImage = () => {
    const newGallery = [...(formData.gallery || []), ""]
    handleInputChange('gallery', newGallery)
  }

  const removeGalleryImage = (index: number) => {
    const newGallery = formData.gallery!.filter((_, i) => i !== index)
    handleInputChange('gallery', newGallery)
  }

  const updateGalleryImage = (index: number, value: string) => {
    const newGallery = formData.gallery!.map((img, i) => i === index ? value : img)
    handleInputChange('gallery', newGallery)
  }

  const handleModalClose = () => {
    if (submissionState.isSubmitting) return
    if (hasUnsavedChanges) {
      setShowUnsavedChangesDialog(true)
    } else {
      onClose()
      resetForm()
    }
  }

  const resetForm = () => {
    setHasUnsavedChanges(false)
    setFormData(initialFormData)
    setErrors({})
  }

  const fillFakeData = () => {
    const newFormData: BuildingFormData = {
      name: "Burj Khalifa",
      subtitle: "The World's Tallest Building",
      location: "Downtown Dubai",
      subLocation: "Sheikh Mohammed bin Rashid Boulevard",
      category: "mixed",
      type: "Ultra-Luxury Tower",
      price: { value: "AED 3.5B", valueNumeric: 3500000000, currency: "AED" },
      priceRange: { display: "5M - 100M AED", min: 5000000, max: 100000000, currency: "AED" },
      dimensions: { floors: 163, height: "828m", heightNumeric: 828, totalArea: 309473, floorPlateSize: 2000 },
      year: 2010,
      yearBuilt: 2010,
      units: [
        { type: "Studio", count: 50 },
        { type: "1BR", count: 300 },
        { type: "2BR", count: 400 },
        { type: "Penthouse", count: 10 }
      ],
      totalUnits: 760,
      availableUnits: 45,
      amenities: {
        privateElevator: true,
        skyLounge: true,
        concierge: true,
        infinityPool: true,
        gym: true,
        spa: true,
        parking: true,
        security247: true,
        highSpeedElevators: true
      },
      features: ["World's tallest building", "Observation deck on 148th floor", "Armani Hotel"],
      highlights: ["Iconic landmark", "Prime location", "Luxury amenities"],
      mainImage: "https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5",
      gallery: ["https://images.unsplash.com/photo-1512453979798-5ea266f8880c"],
      description: "The Burj Khalifa is a megatall skyscraper in Dubai, United Arab Emirates. It is the world's tallest structure and building, standing at 828 meters.",
      status: "Iconic",
      verified: true,
      isActive: true,
      isFeatured: true,
    }
    setFormData(newFormData)
    setHasUnsavedChanges(true)
  }

  const validateForm = (): boolean => {
    const newErrors: FieldErrors = {}
    
    if (!formData.name.trim()) newErrors.name = 'Building name is required'
    if (!formData.location.trim()) newErrors.location = 'Location is required'
    if (!formData.category) newErrors.category = 'Category is required'
    if (!formData.type.trim()) newErrors.type = 'Type is required'
    if (!formData.status) newErrors.status = 'Status is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (!formData.mainImage.trim()) newErrors.mainImage = 'Main image is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error("Please fix all validation errors")
      return
    }

    setSubmissionState({ isSubmitting: true, apiError: null, networkError: false })

    try {
      const endpoint = mode === 'add' ? '/api/buildings/add' : `/api/buildings/update/${building?.slug}`
      const method = mode === 'add' ? 'POST' : 'PUT'

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        const apiError: ApiError = {
          message: result.message || 'An error occurred',
          error: result.error || 'UNKNOWN_ERROR',
          errors: result.errors || {}
        }

        if (result.errors) {
          const newFieldErrors: FieldErrors = {}
          Object.entries(result.errors).forEach(([field, messages]) => {
            if (Array.isArray(messages) && messages.length > 0) {
              newFieldErrors[field] = messages[0]
            }
          })
          setErrors(prev => ({ ...prev, ...newFieldErrors }))
        }

        setSubmissionState({ isSubmitting: false, apiError, networkError: false })
        toast.error(apiError.message)
        return
      }

      toast.success(`Building ${mode === 'edit' ? 'updated' : 'created'} successfully!`)
      setHasUnsavedChanges(false)
      
      if (onSuccess) onSuccess(result.building)
      onClose()
      resetForm()

    } catch (error) {
      console.error('Error saving building:', error)
      const isNetworkError = error instanceof TypeError && error.message.includes('fetch')
      const errorMessage = isNetworkError 
        ? 'Network error. Please check your connection.' 
        : 'An unexpected error occurred'

      setSubmissionState({
        isSubmitting: false,
        apiError: { message: errorMessage, error: isNetworkError ? 'NETWORK_ERROR' : 'UNEXPECTED_ERROR' },
        networkError: isNetworkError
      })
      toast.error(errorMessage)
    }
  }

  return (
    <>
      <Dialog open={showUnsavedChangesDialog} onOpenChange={setShowUnsavedChangesDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Unsaved Changes
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              You have unsaved changes. Are you sure you want to close?
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowUnsavedChangesDialog(false)}>
                Continue Editing
              </Button>
              <Button variant="destructive" onClick={() => {
                setShowUnsavedChangesDialog(false)
                onClose()
                resetForm()
              }}>
                Discard Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isOpen} onOpenChange={submissionState.isSubmitting ? undefined : handleModalClose}>
        <DialogContent className="max-w-6xl max-h-[95vh] p-0 flex flex-col">
          <DialogHeader className="p-6 pb-0 flex-shrink-0">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              {mode === "add" ? "Add New Building" : "Edit Building"}
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                  Unsaved Changes
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0">
            <div className="space-y-6 py-4">

              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Building Name <span className="text-red-500">*</span></Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Enter building name"
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    <CharacterCounter current={formData.name.length} max={200} />
                    {errors.name && <div className="text-red-500 text-xs mt-1">{errors.name}</div>}
                  </div>

                  <div>
                    <Label>Subtitle</Label>
                    <Input
                      value={formData.subtitle || ''}
                      onChange={(e) => handleInputChange("subtitle", e.target.value)}
                      placeholder="Enter subtitle"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Location <span className="text-red-500">*</span></Label>
                      <Input
                        value={formData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        placeholder="e.g., Downtown Dubai"
                        className={errors.location ? 'border-red-500' : ''}
                      />
                      {errors.location && <div className="text-red-500 text-xs mt-1">{errors.location}</div>}
                    </div>
                    <div>
                      <Label>Sub Location</Label>
                      <Input
                        value={formData.subLocation || ''}
                        onChange={(e) => handleInputChange("subLocation", e.target.value)}
                        placeholder="e.g., Sheikh Mohammed Boulevard"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Category <span className="text-red-500">*</span></Label>
                      <Select value={formData.category} onValueChange={(v) => handleInputChange("category", v)}>
                        <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryOptions.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && <div className="text-red-500 text-xs mt-1">{errors.category}</div>}
                    </div>

                    <div>
                      <Label>Status <span className="text-red-500">*</span></Label>
                      <Select value={formData.status} onValueChange={(v) => handleInputChange("status", v)}>
                        <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.status && <div className="text-red-500 text-xs mt-1">{errors.status}</div>}
                    </div>

                    <div>
                      <Label>Type <span className="text-red-500">*</span></Label>
                      <Input
                        value={formData.type}
                        onChange={(e) => handleInputChange("type", e.target.value)}
                        placeholder="e.g., Luxury Tower"
                        className={errors.type ? 'border-red-500' : ''}
                      />
                      {errors.type && <div className="text-red-500 text-xs mt-1">{errors.type}</div>}
                    </div>
                  </div>

                  <div>
                    <Label>Description <span className="text-red-500">*</span></Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Enter building description"
                      rows={4}
                      className={errors.description ? 'border-red-500' : ''}
                    />
                    <CharacterCounter current={formData.description.length} max={2000} />
                    {errors.description && <div className="text-red-500 text-xs mt-1">{errors.description}</div>}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      placeholder="Display (e.g., AED 2.8B)"
                      value={formData.price.value}
                      onChange={(e) => handleInputChange("price", { ...formData.price, value: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="Numeric value"
                      value={formData.price.valueNumeric}
                      onChange={(e) => handleInputChange("price", { ...formData.price, valueNumeric: parseFloat(e.target.value) || 0 })}
                    />
                    <Input
                      placeholder="Currency"
                      value={formData.price.currency}
                      onChange={(e) => handleInputChange("price", { ...formData.price, currency: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dimensions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label>Floors</Label>
                      <Input
                        type="number"
                        value={formData.dimensions.floors}
                        onChange={(e) => handleInputChange("dimensions", { ...formData.dimensions, floors: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Height</Label>
                      <Input
                        placeholder="e.g., 321m"
                        value={formData.dimensions.height || ''}
                        onChange={(e) => handleInputChange("dimensions", { ...formData.dimensions, height: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Total Area (sqm)</Label>
                      <Input
                        type="number"
                        value={formData.dimensions.totalArea || ''}
                        onChange={(e) => handleInputChange("dimensions", { ...formData.dimensions, totalArea: parseInt(e.target.value) || undefined })}
                      />
                    </div>
                    <div>
                      <Label>Floor Plate (sqm)</Label>
                      <Input
                        type="number"
                        value={formData.dimensions.floorPlateSize || ''}
                        onChange={(e) => handleInputChange("dimensions", { ...formData.dimensions, floorPlateSize: parseInt(e.target.value) || undefined })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Home className="h-5 w-5" />
                      Units
                    </span>
                    <Button type="button" variant="outline" size="sm" onClick={addUnit}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Unit
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Total Units</Label>
                      <Input
                        type="number"
                        value={formData.totalUnits}
                        onChange={(e) => handleInputChange("totalUnits", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>Available Units</Label>
                      <Input
                        type="number"
                        value={formData.availableUnits || ''}
                        onChange={(e) => handleInputChange("availableUnits", parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  {formData.units.map((unit, index) => (
                    <div key={index} className="border p-4 rounded-lg space-y-3">
                      <div className="flex justify-between items-center">
                        <Label>Unit {index + 1}</Label>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeUnit(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Type</Label>
                          <Select value={unit.type} onValueChange={(v) => updateUnit(index, 'type', v)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {unitTypeOptions.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Count</Label>
                          <Input
                            type="number"
                            value={unit.count || ''}
                            onChange={(e) => updateUnit(index, 'count', parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Features & Highlights
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                        <Plus className="h-4 w-4 mr-1" />
                        Feature
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={addHighlight}>
                        <Plus className="h-4 w-4 mr-1" />
                        Highlight
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.features && formData.features.length > 0 && (
                    <div className="space-y-2">
                      <Label>Features</Label>
                      {formData.features.map((feature, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder="Feature description"
                            value={feature}
                            onChange={(e) => updateFeature(index, e.target.value)}
                          />
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeFeature(index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {formData.highlights && formData.highlights.length > 0 && (
                    <div className="space-y-2">
                      <Label>Highlights</Label>
                      {formData.highlights.map((highlight, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder="Highlight description"
                            value={highlight}
                            onChange={(e) => updateHighlight(index, e.target.value)}
                          />
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeHighlight(index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Amenities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {['privateElevator', 'skyLounge', 'concierge', 'infinityPool', 'skyBridge', 'privateCinema', 'skyPool', 'panoramicViews', 'valetService', 'marinaAccess', 'beachClub', 'golfCourse', 'executiveLounges', 'helipad', 'fiveStarHotel', 'tradingFloors', 'conferenceCenters', 'fineDining', 'exhibitionHalls', 'conventionCenter', 'retailSpaces', 'marinaViews', 'gym', 'spa', 'parking', 'security247', 'smartHome', 'highSpeedElevators', 'businessCenter', 'cafeteria', 'landscapedGardens', 'childrenPlayArea', 'petFriendly', 'wheelchairAccessible'].map(amenity => (
                      <div key={amenity} className="flex items-center space-x-2">
                        <Checkbox
                          id={amenity}
                          checked={formData.amenities[amenity as keyof typeof formData.amenities] || false}
                          onCheckedChange={(checked) => handleInputChange("amenities", { ...formData.amenities, [amenity]: checked })}
                        />
                        <Label htmlFor={amenity} className="text-sm capitalize">
                          {amenity.replace(/([A-Z])/g, ' $1').trim()}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Images
                    <Button type="button" variant="outline" size="sm" onClick={addGalleryImage}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Gallery Image
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Main Image <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="https://example.com/image.jpg"
                      value={formData.mainImage}
                      onChange={(e) => handleInputChange("mainImage", e.target.value)}
                      className={errors.mainImage ? 'border-red-500' : ''}
                    />
                    {formData.mainImage && (
                      <div className="mt-2">
                        <img src={formData.mainImage} alt="Main preview" className="w-full h-32 object-cover rounded-lg" />
                      </div>
                    )}
                    {errors.mainImage && <div className="text-red-500 text-xs mt-1">{errors.mainImage}</div>}
                  </div>

                  {formData.gallery && formData.gallery.length > 0 && (
                    <div className="space-y-2">
                      <Label>Gallery Images</Label>
                      {formData.gallery.map((img, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Image URL"
                              value={img}
                              onChange={(e) => updateGalleryImage(index, e.target.value)}
                            />
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeGalleryImage(index)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          {img && (
                            <img src={img} alt={`Gallery ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Year & Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Year Completed <span className="text-red-500">*</span></Label>
                      <Input
                        type="number"
                        value={formData.year}
                        onChange={(e) => handleInputChange("year", parseInt(e.target.value) || new Date().getFullYear())}
                        className={errors.year ? 'border-red-500' : ''}
                      />
                      {errors.year && <div className="text-red-500 text-xs mt-1">{errors.year}</div>}
                    </div>
                    <div>
                      <Label>Year Built</Label>
                      <Input
                        type="number"
                        placeholder="If different from completion"
                        value={formData.yearBuilt || ''}
                        onChange={(e) => handleInputChange("yearBuilt", parseInt(e.target.value) || undefined)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="verified"
                        checked={formData.verified}
                        onCheckedChange={(checked) => handleInputChange("verified", checked)}
                      />
                      <Label htmlFor="verified">Verified</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => handleInputChange("isActive", checked)}
                      />
                      <Label htmlFor="isActive">Active</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isFeatured"
                        checked={formData.isFeatured}
                        onCheckedChange={(checked) => handleInputChange("isFeatured", checked)}
                      />
                      <Label htmlFor="isFeatured">Featured</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Building Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-b pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-2xl font-bold">{formData.name || "Building Name"}</h3>
                      {formData.verified && <Badge className="bg-blue-500">✓ Verified</Badge>}
                      {formData.isFeatured && <Badge className="bg-yellow-500">Featured</Badge>}
                    </div>
                    {formData.subtitle && <p className="text-gray-600">{formData.subtitle}</p>}
                    <div className="flex gap-2 mt-2">
                      <Badge>{formData.status || "Status"}</Badge>
                      <Badge>{formData.category || "Category"}</Badge>
                    </div>
                  </div>

                  {formData.mainImage && (
                    <img src={formData.mainImage} alt="Main" className="w-full h-48 object-cover rounded-lg" />
                  )}

                  {formData.description && (
                    <div>
                      <h4 className="font-semibold mb-2">Description</h4>
                      <p className="text-gray-700 text-sm">{formData.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Location:</span> {formData.location || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Floors:</span> {formData.dimensions.floors}
                    </div>
                    <div>
                      <span className="font-medium">Total Units:</span> {formData.totalUnits}
                    </div>
                    <div>
                      <span className="font-medium">Year:</span> {formData.year}
                    </div>
                  </div>

                  {formData.features && formData.features.length > 0 && formData.features.some(f => f.trim()) && (
                    <div>
                      <h4 className="font-semibold mb-2">Features</h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.features.filter(f => f.trim()).map((feature, i) => (
                          <Badge key={i} variant="outline">{feature}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.highlights && formData.highlights.length > 0 && formData.highlights.some(h => h.trim()) && (
                    <div>
                      <h4 className="font-semibold mb-2">Highlights</h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.highlights.filter(h => h.trim()).map((highlight, i) => (
                          <Badge key={i} variant="outline" className="bg-yellow-50">{highlight}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          </div>

          <div className="border-t p-6 bg-gray-50 flex-shrink-0">
            <ErrorDisplay 
              submissionState={submissionState}
              onRetry={() => setSubmissionState(prev => ({ ...prev, apiError: null, networkError: false }))}
            />
            
            <div className="flex gap-2 justify-between">
              <Button variant="outline" onClick={fillFakeData} disabled={submissionState.isSubmitting}>
                Fill Test Data
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleModalClose} disabled={submissionState.isSubmitting}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={submissionState.isSubmitting || Object.keys(errors).some(key => errors[key])}
                >
                  {submissionState.isSubmitting ? 
                    (mode === "edit" ? "Updating..." : "Creating...") : 
                    (mode === "edit" ? "Update Building" : "Create Building")
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