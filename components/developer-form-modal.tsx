"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

interface Developer {
  _id?: string
  name: string
  slug: string
  logo: string
  coverImage: string
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

// Simple image upload component
const ImageUpload = ({ 
  label, 
  value, 
  onChange, 
  accept = "image/*" 
}: { 
  label: string
  value: File | null
  onChange: (file: File | null) => void
  accept?: string
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    onChange(file)
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="cursor-pointer"
      />
      {value && (
        <p className="text-sm text-gray-600">
          Selected: {value.name}
        </p>
      )}
    </div>
  )
}

export function DeveloperFormModal({ isOpen, onClose, onSuccess, developer, mode }: DeveloperFormModalProps) {
  const [formData, setFormData] = useState<Omit<Developer, '_id'>>({
    name: "",
    slug: "",
    logo: "",
    coverImage: "",
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
  })

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    if (developer && mode === "edit") {
      setFormData({
        name: developer.name,
        slug: developer.slug,
        logo: developer.logo,
        coverImage: developer.coverImage,
        description: developer.description,
        location: developer.location,
        establishedYear: developer.establishedYear,
        totalProjects: developer.totalProjects,
        activeProjects: developer.activeProjects,
        completedProjects: developer.completedProjects,
        website: developer.website,
        email: developer.email,
        phone: developer.phone,
        specialization: developer.specialization,
        rating: developer.rating,
        verified: developer.verified,
      })
    } else {
      setFormData({
        name: "",
        slug: "",
        logo: "",
        coverImage: "",
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
      })
    }
    setLogoFile(null)
    setCoverImageFile(null)
    setError("")
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      // Generate slug from name
      const slug = generateSlug(formData.name)
      
      // Create FormData for file upload
      const submitData = new FormData()
      console.log(slug)
      
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
      if (logoFile) {
        submitData.append('logoFile', logoFile)
      }
      if (coverImageFile) {
        submitData.append('coverImageFile', coverImageFile)
      }

      // Add existing URLs for edit mode
      if (mode === 'edit') {
        submitData.append('existingLogo', formData.logo)
        submitData.append('existingCoverImage', formData.coverImage)
        if (developer?._id) {
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

      onSuccess?.(result)
      onClose()
    } catch (error) {
      console.error('Error saving developer:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Add New Developer" : "Edit Developer"}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Developer Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="establishedYear">Established Year</Label>
              <Input
                id="establishedYear"
                type="number"
                value={formData.establishedYear}
                onChange={(e) => handleInputChange("establishedYear", Number.parseInt(e.target.value) || 0)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating">Rating (0-5)</Label>
              <Input
                id="rating"
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={formData.rating}
                onChange={(e) => handleInputChange("rating", Number.parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div className="space-y-2 flex items-end">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="verified"
                  checked={formData.verified}
                  onCheckedChange={(checked) => handleInputChange("verified", checked as boolean)}
                />
                <Label htmlFor="verified">Verified Developer</Label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalProjects">Total Projects</Label>
              <Input
                id="totalProjects"
                type="number"
                value={formData.totalProjects}
                onChange={(e) => handleInputChange("totalProjects", Number.parseInt(e.target.value) || 0)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="activeProjects">Active Projects</Label>
              <Input
                id="activeProjects"
                type="number"
                value={formData.activeProjects}
                onChange={(e) => handleInputChange("activeProjects", Number.parseInt(e.target.value) || 0)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="completedProjects">Completed Projects</Label>
              <Input
                id="completedProjects"
                type="number"
                value={formData.completedProjects}
                onChange={(e) => handleInputChange("completedProjects", Number.parseInt(e.target.value) || 0)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
                placeholder="https://www.example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ImageUpload
              label="Company Logo"
              value={logoFile}
              onChange={setLogoFile}
            />

            <ImageUpload
              label="Cover Image"
              value={coverImageFile}
              onChange={setCoverImageFile}
            />
          </div>

          <div className="space-y-2">
            <Label>Specialization</Label>
            <div className="grid grid-cols-3 gap-2">
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
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : mode === "add" ? "Add Developer" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}