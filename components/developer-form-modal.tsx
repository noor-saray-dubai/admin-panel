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
import { toast } from "sonner"
import { Upload, X, Eye, Star, MapPin, Calendar, Building, Phone, Mail, Globe } from "lucide-react"

interface Developer {
  _id?: string
  name: string
  slug?: string
  logo: string
  coverImage?: string
  description: string
  location: string
  establishedYear: number
  totalProjects: number
  activeProjects: number
  completedProjects: number
  website: string
  email: string
  phone: string
  specialization: string[]
  rating: number
  verified: boolean
}

interface DeveloperFormData {
  name: string
  logo: File | null
  coverImage: File | null
  description: string
  location: string
  establishedYear: number
  totalProjects: number
  activeProjects: number
  completedProjects: number
  website: string
  email: string
  phone: string
  specialization: string[]
  rating: number
  verified: boolean
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
  description: "",
  location: "",
  establishedYear: new Date().getFullYear(),
  totalProjects: 0,
  activeProjects: 0,
  completedProjects: 0,
  website: "",
  email: "",
  phone: "",
  specialization: [],
  rating: 0,
  verified: false,
}

// Image upload component
const ImageUpload = ({ 
  label, 
  value, 
  onChange, 
  preview,
  onRemove,
  accept = "image/*",
  required = false
}: { 
  label: string
  value: File | null
  onChange: (file: File | null) => void
  preview: string | null
  onRemove: () => void
  accept?: string
  required?: boolean
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file (PNG, JPEG, JPG)')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB')
        return
      }
      onChange(file)
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label} {required && '*'}</Label>
      {!preview ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
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
            <p className="text-gray-500 text-xs mt-1">PNG, JPEG, JPG (max 5MB)</p>
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
    </div>
  )
}

export function DeveloperFormModal({ isOpen, onClose, onSuccess, developer, mode }: DeveloperFormModalProps) {
  const [formData, setFormData] = useState<DeveloperFormData>(initialFormData)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>("")

  // Convert developer to form data
  const convertDeveloperToFormData = (developer: Developer): DeveloperFormData => {
    return {
      name: developer.name || "",
      logo: null,
      coverImage: null,
      description: developer.description || "",
      location: developer.location || "",
      establishedYear: developer.establishedYear || new Date().getFullYear(),
      totalProjects: developer.totalProjects || 0,
      activeProjects: developer.activeProjects || 0,
      completedProjects: developer.completedProjects || 0,
      website: developer.website || "",
      email: developer.email || "",
      phone: developer.phone || "",
      specialization: developer.specialization || [],
      rating: developer.rating || 0,
      verified: developer.verified || false,
    }
  }

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && developer) {
        const convertedData = convertDeveloperToFormData(developer)
        setFormData(convertedData)
        
        // Set image previews for existing developer
        if (developer.logo) {
          setLogoPreview(developer.logo)
        }
        if (developer.coverImage) {
          setCoverImagePreview(developer.coverImage)
        }
      } else {
        // Reset form for add mode
        setFormData(initialFormData)
        setLogoPreview(null)
        setCoverImagePreview(null)
      }
      setError("")
    }
  }, [developer, mode, isOpen])

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleInputChange = (field: keyof DeveloperFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSpecializationChange = (spec: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      specialization: checked 
        ? [...prev.specialization, spec] 
        : prev.specialization.filter((s) => s !== spec),
    }))
  }

  // Handle logo upload
  const handleLogoUpload = (file: File | null) => {
    setFormData(prev => ({ ...prev, logo: file }))
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
    setFormData(prev => ({ ...prev, coverImage: file }))
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setCoverImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Remove logo
  const removeLogo = () => {
    setFormData(prev => ({ ...prev, logo: null }))
    setLogoPreview(null)
  }

  // Remove cover image
  const removeCoverImage = () => {
    setFormData(prev => ({ ...prev, coverImage: null }))
    setCoverImagePreview(null)
  }

  // Fill fake data for testing
  const fillFakeData = () => {
    setFormData({
      name: "Elite Developers LLC",
      logo: null,
      coverImage: null,
      description: "A premium real estate development company specializing in luxury residential and commercial projects across Dubai. With over 15 years of experience, we deliver exceptional quality and innovative designs that exceed expectations.",
      location: "Dubai, UAE",
      establishedYear: 2008,
      totalProjects: 45,
      activeProjects: 8,
      completedProjects: 37,
      website: "https://www.elitedevelopers.ae",
      email: "info@elitedevelopers.ae",
      phone: "+971 4 123 4567",
      specialization: ["Luxury Residential", "Premium Apartments", "Commercial", "Mixed-Use"],
      rating: 4.7,
      verified: true,
    })
  }

  // Validate form
  const validateForm = (): string[] => {
    const errors: string[] = []

    if (!formData.name.trim()) errors.push("Developer name is required")
    if (!formData.description.trim()) errors.push("Description is required")
    if (!formData.location.trim()) errors.push("Location is required")
    if (!formData.email.trim()) errors.push("Email is required")
    if (!formData.phone.trim()) errors.push("Phone is required")
    if (formData.establishedYear < 1900 || formData.establishedYear > new Date().getFullYear()) {
      errors.push("Please enter a valid established year")
    }
    if (formData.rating < 0 || formData.rating > 5) {
      errors.push("Rating must be between 0 and 5")
    }
    if (formData.totalProjects < 0) errors.push("Total projects cannot be negative")
    if (formData.activeProjects < 0) errors.push("Active projects cannot be negative")
    if (formData.completedProjects < 0) errors.push("Completed projects cannot be negative")
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.push("Please enter a valid email address")
    }

    // Website validation
    if (formData.website && !formData.website.startsWith('http')) {
      errors.push("Website URL must start with http:// or https://")
    }

    // For add mode, images are required
    if (mode === 'add') {
      if (!formData.logo) errors.push("Logo is required")
      if (!formData.coverImage) errors.push("Cover image is required")
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const errors = validateForm()
    if (errors.length > 0) {
      toast.error(`Please fix the following errors:\n${errors.join('\n')}`)
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      // Generate slug from name
      const slug = generateSlug(formData.name)
      
      // Create FormData for file upload
      const submitData = new FormData()
      
      // Add all form fields
      submitData.append('name', formData.name)
      submitData.append('slug', slug)
      submitData.append('description', formData.description)
      submitData.append('location', formData.location)
      submitData.append('establishedYear', formData.establishedYear.toString())
      submitData.append('totalProjects', formData.totalProjects.toString())
      submitData.append('activeProjects', formData.activeProjects.toString())
      submitData.append('completedProjects', formData.completedProjects.toString())
      submitData.append('website', formData.website)
      submitData.append('email', formData.email)
      submitData.append('phone', formData.phone)
      submitData.append('rating', formData.rating.toString())
      submitData.append('verified', formData.verified.toString())
      submitData.append('specialization', JSON.stringify(formData.specialization))

      // Add files if provided
      if (formData.logo) {
        submitData.append('logoFile', formData.logo)
      }
      if (formData.coverImage) {
        submitData.append('coverImageFile', formData.coverImage)
      }

      // Add existing URLs for edit mode
      if (mode === 'edit' && developer) {
        submitData.append('existingLogo', developer.logo || '')
        submitData.append('existingCoverImage', developer.coverImage || '')
        if (developer._id) {
          submitData.append('_id', developer._id)
        }
      }

      const endpoint = mode === 'add' ? '/api/developers/add' : `/api/developers/${developer?._id}`
      const method = mode === 'add' ? 'POST' : 'PUT'

      const response = await fetch(endpoint, {
        method,
        body: submitData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save developer')
      }

      toast.success(`Developer ${mode === 'edit' ? 'updated' : 'created'} successfully!`)
      onSuccess?.(result)
      handleClose()
    } catch (error) {
      console.error('Error saving developer:', error)
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      setError(errorMessage)
      toast.error(`Failed to ${mode === 'edit' ? 'update' : 'create'} developer: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData(initialFormData)
    setLogoPreview(null)
    setCoverImagePreview(null)
    setError("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <DialogTitle className="text-2xl font-bold">
            {mode === "add" ? "Add New Developer" : "Edit Developer"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0">
          <div className="space-y-8 py-4">

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Developer Name *</Label>
                    <Input
                      id="name"
                      placeholder="Enter developer name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      placeholder="e.g., Dubai, UAE"
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter developer description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={4}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Company Details */}
            <Card>
              <CardHeader>
                <CardTitle>Company Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="establishedYear">Established Year *</Label>
                    <Input
                      id="establishedYear"
                      type="number"
                      min="1900"
                      max={new Date().getFullYear()}
                      value={formData.establishedYear}
                      onChange={(e) => handleInputChange("establishedYear", Number.parseInt(e.target.value) || new Date().getFullYear())}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rating">Rating (0-5) *</Label>
                    <Input
                      id="rating"
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={formData.rating}
                      onChange={(e) => handleInputChange("rating", Number.parseFloat(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="totalProjects">Total Projects</Label>
                    <Input
                      id="totalProjects"
                      type="number"
                      min="0"
                      value={formData.totalProjects}
                      onChange={(e) => handleInputChange("totalProjects", Number.parseInt(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="activeProjects">Active Projects</Label>
                    <Input
                      id="activeProjects"
                      type="number"
                      min="0"
                      value={formData.activeProjects}
                      onChange={(e) => handleInputChange("activeProjects", Number.parseInt(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="completedProjects">Completed Projects</Label>
                    <Input
                      id="completedProjects"
                      type="number"
                      min="0"
                      value={formData.completedProjects}
                      onChange={(e) => handleInputChange("completedProjects", Number.parseInt(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="verified"
                    checked={formData.verified}
                    onCheckedChange={(checked) => handleInputChange("verified", checked as boolean)}
                  />
                  <Label htmlFor="verified">Verified Developer</Label>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      placeholder="https://www.example.com"
                      value={formData.website}
                      onChange={(e) => handleInputChange("website", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="info@example.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      placeholder="+971 4 123 4567"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Images {mode === 'add' ? '*' : '(Optional - leave blank to keep existing)'}
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
                  />
                  <ImageUpload
                    label="Cover Image"
                    value={formData.coverImage}
                    onChange={handleCoverImageUpload}
                    preview={coverImagePreview}
                    onRemove={removeCoverImage}
                    required={mode === 'add'}
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
                        {formData.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            {formData.rating}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {coverImagePreview && (
                    <img src={coverImagePreview} alt="Cover" className="w-full h-48 object-cover rounded-lg" />
                  )}
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-semibold mb-2">About</h4>
                  <p className="text-gray-700">{formData.description || "No description provided"}</p>
                </div>

                {/* Stats */}
                <div>
                  <h4 className="font-semibold mb-3">Projects Overview</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{formData.totalProjects}</div>
                      <div className="text-sm text-gray-600">Total Projects</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{formData.activeProjects}</div>
                      <div className="text-sm text-gray-600">Active Projects</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{formData.completedProjects}</div>
                      <div className="text-sm text-gray-600">Completed Projects</div>
                    </div>
                  </div>
                </div>

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
          <div className="flex gap-2 justify-between">
            <Button variant="outline" onClick={fillFakeData}>
              Fill Test Data
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 
                  (mode === "edit" ? "Updating..." : "Creating...") : 
                  (mode === "edit" ? "Update Developer" : "Create Developer")
                }
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}