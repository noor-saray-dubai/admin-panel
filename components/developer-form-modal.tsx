"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ImageUpload } from "./image-upload"

interface Developer {
  id?: number
  name: string
  logo: string[]
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
  onSave: (developer: Developer) => void
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

export function DeveloperFormModal({ isOpen, onClose, onSave, developer, mode }: DeveloperFormModalProps) {
  const [formData, setFormData] = useState<Developer>({
    name: "",
    logo: [],
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

  useEffect(() => {
    if (developer && mode === "edit") {
      setFormData(developer)
    } else {
      setFormData({
        name: "",
        logo: [],
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
  }, [developer, mode, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    onClose()
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSpecializationChange = (spec: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      specialization: checked ? [...prev.specialization, spec] : prev.specialization.filter((s) => s !== spec),
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Add New Developer" : "Edit Developer"}</DialogTitle>
        </DialogHeader>

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
                placeholder="www.example.com"
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

          <ImageUpload
            label="Company Logo"
            value={formData.logo}
            onChange={(images) => handleInputChange("logo", images)}
            multiple={false}
          />

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
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{mode === "add" ? "Add Developer" : "Save Changes"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
