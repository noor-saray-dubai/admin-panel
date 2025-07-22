"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

// Define the project interface for better type safety
interface PaymentMilestone {
  milestone: string;
  percentage: string;
}

interface PaymentPlan {
  booking: string;
  construction: PaymentMilestone[];
  handover: string;
}

interface NearbyPlace {
  name: string;
  distance: string;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface LocationDetails {
  description: string;
  nearby: NearbyPlace[];
  coordinates: Coordinates;
}

interface ProjectFormData {
  name: string
  location: string
  type: string
  status: string
  developer: string
  price: string
  priceNumeric: number
  coverImage: string[]
  gallery: string[]
  description: string
  completionDate: string
  totalUnits: number
  // Additional required fields from your model
  registrationOpen: boolean
  launchDate: string
  featured: boolean
  locationDetails: LocationDetails
  paymentPlan: PaymentPlan
  overview: string
  image: string
  flags: {
    elite: boolean
    exclusive: boolean
    featured: boolean
    highValue: boolean
  }
}

const initialFormData: ProjectFormData = {
  name: "",
  location: "",
  type: "",
  status: "",
  developer: "",
  price: "",
  priceNumeric: 0,
  coverImage: [],
  gallery: [],
  description: "",
  completionDate: "",
  totalUnits: 0,
  // Additional required fields
  registrationOpen: false,
  launchDate: "",
  featured: false,
  locationDetails: {
    description: "",
    nearby: [],            // you can add UI inputs to add nearby places later
    coordinates: { latitude: 0, longitude: 0 },
  },
  paymentPlan: {
    booking: "",
    construction: [],      // UI to add milestone objects
    handover: "",
  },
  overview: "",
  image: "",
  flags: {
    elite: false,
    exclusive: false,
    featured: false,
    highValue: false,
  },
}

export function ProjectFormModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target

    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: Number(value) }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleCheckboxChange = (flagName: keyof ProjectFormData['flags'], checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      flags: { ...prev.flags, [flagName]: checked }
    }))
  }

  const handleImageArrayChange = (field: 'coverImage' | 'gallery', value: string) => {
    const urls = value.split(',').map(url => url.trim()).filter(url => url)
    setFormData(prev => ({ ...prev, [field]: urls }))
  }

  const fillFakeData = () => {
    const projectName = "Fake Marina View"
    setFormData({
      name: projectName,
      location: "Dubai Marina",
      type: "Luxury Apartments",
      status: "Under Construction",
      developer: "Fake Developer LLC",
      price: "Starting from AED 999K",
      priceNumeric: 999000,
      coverImage: ["https://via.placeholder.com/600x400"],
      gallery: [
        "https://via.placeholder.com/300x200",
        "https://via.placeholder.com/300x200",
      ],
      description: "A beautiful fake project for testing purposes. This luxurious development offers stunning marina views and world-class amenities.",
      completionDate: "2027-12-31",
      totalUnits: 250,
      // Additional required fields
      registrationOpen: true,
      launchDate: "2025-08-01",
      featured: true,
      locationDetails: {
        description: "Located in the heart of Dubai Marina with direct access to the beach and marina. Close to restaurants, shopping, and entertainment.",
        nearby: [
          { name: "Mall", distance: "2km" },
          { name: "Metro Station", distance: "500m" }
        ],
        coordinates: {
          latitude: 25.0800,
          longitude: 55.1400
        }
      },

      paymentPlan: {
        booking: "20% down payment",
        construction: [
          { milestone: "During construction", percentage: "60%" }
        ],
        handover: "20% on completion"
      },
      overview: "Premium residential development offering luxury living with marina views and world-class amenities including gym, pool, and concierge services.",
      image: "https://via.placeholder.com/800x600",
      flags: {
        elite: true,
        exclusive: false,
        featured: true,
        highValue: false,
      },
    })
  }

  const validateForm = (): string[] => {
    const errors: string[] = []

    if (!formData.name.trim()) errors.push("Project name is required")
    if (!formData.location.trim()) errors.push("Location is required")
    if (!formData.type.trim()) errors.push("Project type is required")
    if (!formData.status.trim()) errors.push("Status is required")
    if (!formData.developer.trim()) errors.push("Developer is required")
    if (!formData.description.trim()) errors.push("Description is required")
    if (!formData.overview.trim()) errors.push("Overview is required")
    // Validate locationDetails object
    if (
      !formData.locationDetails ||
      !formData.locationDetails.description ||
      formData.locationDetails.description.trim() === ""
    ) {
      errors.push("Location details description is required")
    }
    if (
      !formData.paymentPlan ||
      !formData.paymentPlan.booking ||
      formData.paymentPlan.booking.trim() === ""
    ) {
      errors.push("Payment plan booking info is required")
    }
    if (!formData.paymentPlan?.construction || formData.paymentPlan.construction.length === 0) {
      errors.push("Payment plan construction milestones are required")
    }

    if (
      !formData.paymentPlan ||
      !formData.paymentPlan.handover ||
      formData.paymentPlan.handover.trim() === ""
    ) {
      errors.push("Payment plan handover info is required")
    }
    if (!formData.image.trim()) errors.push("Main image URL is required")
    if (formData.priceNumeric <= 0) errors.push("Price must be greater than 0")
    if (formData.totalUnits <= 0) errors.push("Total units must be greater than 0")
    if (!formData.completionDate) errors.push("Completion date is required")
    if (!formData.launchDate) errors.push("Launch date is required")

    return errors
  }

  const handleSubmit = async () => {
    const errors = validateForm()
    if (errors.length > 0) {
      toast.error(`Please fix the following errors:\n${errors.join('\n')}`)
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/projects/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          completionDate: new Date(formData.completionDate).toISOString(),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Something went wrong")

      toast.success("Project saved successfully!")
      setFormData(initialFormData) // Reset form
      onClose()
    } catch (err: any) {
      console.error("Save failed:", err)
      toast.error(`Failed to save project: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData(initialFormData) // Reset form when closing
    onClose()
  }
  // Helper: update nested object for locationDetails
  function updateLocationDetailsField<K extends keyof LocationDetails>(
    field: K,
    value: LocationDetails[K]
  ) {
    setFormData(prev => ({
      ...prev,
      locationDetails: {
        ...prev.locationDetails,
        [field]: value,
      },
    }));
  }

  // Helper: update nested object for paymentPlan
  function updatePaymentPlanField<K extends keyof PaymentPlan>(
    field: K,
    value: PaymentPlan[K]
  ) {
    setFormData(prev => ({
      ...prev,
      paymentPlan: {
        ...prev.paymentPlan,
        [field]: value,
      },
    }));
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                placeholder="Enter project name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                placeholder="Enter location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Project Type *</Label>
              <Input
                id="type"
                placeholder="e.g., Luxury Apartments"
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="status">Status *</Label>
              <Input
                id="status"
                placeholder="e.g., Under Construction"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="developer">Developer *</Label>
              <Input
                id="developer"
                placeholder="Enter developer name"
                name="developer"
                value={formData.developer}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="completionDate">Completion Date *</Label>
              <Input
                id="completionDate"
                type="date"
                name="completionDate"
                value={formData.completionDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="launchDate">Launch Date *</Label>
            <Input
              id="launchDate"
              type="date"
              name="launchDate"
              value={formData.launchDate}
              onChange={handleChange}
              required
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price Display Text *</Label>
              <Input
                id="price"
                placeholder="e.g., Starting from AED 999K"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="priceNumeric">Numeric Price (AED) *</Label>
              <Input
                id="priceNumeric"
                type="number"
                placeholder="999000"
                name="priceNumeric"
                value={formData.priceNumeric || ''}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="totalUnits">Total Units *</Label>
            <Input
              id="totalUnits"
              type="number"
              placeholder="250"
              name="totalUnits"
              value={formData.totalUnits || ''}
              onChange={handleChange}
              required
            />
          </div>

          {/* Main Image */}
          <div>
            <Label htmlFor="image">Main Image URL *</Label>
            <Input
              id="image"
              placeholder="Enter main image URL"
              name="image"
              value={formData.image}
              onChange={handleChange}
              required
            />
          </div>

          {/* Additional Images */}
          <div>
            <Label htmlFor="coverImage">Cover Image URLs</Label>
            <Input
              id="coverImage"
              placeholder="Enter URLs separated by commas"
              value={formData.coverImage.join(', ')}
              onChange={(e) => handleImageArrayChange('coverImage', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="gallery">Gallery Image URLs</Label>
            <Input
              id="gallery"
              placeholder="Enter URLs separated by commas"
              value={formData.gallery.join(', ')}
              onChange={(e) => handleImageArrayChange('gallery', e.target.value)}
            />
          </div>

          {/* Text Fields */}
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Enter project description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="overview">Overview *</Label>
            <Textarea
              id="overview"
              placeholder="Enter project overview"
              name="overview"
              value={formData.overview}
              onChange={handleChange}
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="locationDetailsDescription">Location Description *</Label>
            <Textarea
              id="locationDetailsDescription"
              placeholder="Enter detailed location description"
              value={formData.locationDetails.description}
              onChange={(e) => updateLocationDetailsField("description", e.target.value)}
              rows={3}
              required
            />
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">Latitude *</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.locationDetails.coordinates.latitude}
                onChange={(e) =>
                  updateLocationDetailsField("coordinates", {
                    ...formData.locationDetails.coordinates,
                    latitude: Number(e.target.value),
                  })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="longitude">Longitude *</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.locationDetails.coordinates.longitude}
                onChange={(e) =>
                  updateLocationDetailsField("coordinates", {
                    ...formData.locationDetails.coordinates,
                    longitude: Number(e.target.value),
                  })
                }
                required
              />
            </div>
          </div>

          {/* Nearby Places (you could make this dynamic; here just one example) */}
          <div>
            <Label>Nearby Place 1</Label>
            <Input
              placeholder="Place Name"
              value={formData.locationDetails.nearby[0]?.name || ""}
              onChange={(e) => {
                const newNearby = [...formData.locationDetails.nearby];
                newNearby[0] = { ...newNearby[0], name: e.target.value };
                updateLocationDetailsField("nearby", newNearby);
              }}
            />
            <Input
              placeholder="Distance"
              value={formData.locationDetails.nearby[0]?.distance || ""}
              onChange={(e) => {
                const newNearby = [...formData.locationDetails.nearby];
                newNearby[0] = { ...newNearby[0], distance: e.target.value };
                updateLocationDetailsField("nearby", newNearby);
              }}
            />
          </div>

          {/* Payment Plan Section */}
          <div>
            <Label htmlFor="paymentPlanBooking">Booking *</Label>
            <Textarea
              id="paymentPlanBooking"
              placeholder="Enter booking payment details"
              value={formData.paymentPlan.booking}
              onChange={(e) => updatePaymentPlanField("booking", e.target.value)}
              rows={2}
              required
            />
          </div>

          {/* Construction milestones (example for first milestone) */}
          <div>
            <Label>Construction Milestone 1</Label>
            <Input
              placeholder="Milestone"
              value={formData.paymentPlan.construction[0]?.milestone || ""}
              onChange={(e) => {
                const newConstruction = [...formData.paymentPlan.construction];
                newConstruction[0] = { ...newConstruction[0], milestone: e.target.value };
                updatePaymentPlanField("construction", newConstruction);
              }}
            />
            <Input
              placeholder="Percentage"
              value={formData.paymentPlan.construction[0]?.percentage || ""}
              onChange={(e) => {
                const newConstruction = [...formData.paymentPlan.construction];
                newConstruction[0] = { ...newConstruction[0], percentage: e.target.value };
                updatePaymentPlanField("construction", newConstruction);
              }}
            />
          </div>

          <div>
            <Label htmlFor="paymentPlanHandover">Handover *</Label>
            <Textarea
              id="paymentPlanHandover"
              placeholder="Enter handover payment details"
              value={formData.paymentPlan.handover}
              onChange={(e) => updatePaymentPlanField("handover", e.target.value)}
              rows={2}
              required
            />
          </div>

          {/* Boolean Flags */}
          <div>
            <Label>Registration & Status</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="registrationOpen"
                  checked={formData.registrationOpen}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({ ...prev, registrationOpen: !!checked }))
                  }
                />
                <Label htmlFor="registrationOpen">Registration Open</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({ ...prev, featured: !!checked }))
                  }
                />
                <Label htmlFor="featured">Featured Project</Label>
              </div>
            </div>
          </div>

          {/* Project Flags */}
          <div>
            <Label>Project Flags</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              {Object.entries(formData.flags).map(([flag, value]) => (
                <div key={flag} className="flex items-center space-x-2">
                  <Checkbox
                    id={flag}
                    checked={value}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange(flag as keyof ProjectFormData['flags'], !!checked)
                    }
                  />
                  <Label htmlFor={flag} className="capitalize">
                    {flag}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={fillFakeData}>
              Fill Test Data
            </Button>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Project"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}