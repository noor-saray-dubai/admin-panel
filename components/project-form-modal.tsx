"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Upload, X, Eye, Plus, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

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
  developerSlug: string  // Added developer slug field
  price: string
  priceNumeric: number
  coverImage: File | null
  gallery: File[]
  description: string
  completionDate: string
  totalUnits: number
  registrationOpen: boolean
  launchDate: string
  featured: boolean
  locationDetails: LocationDetails
  paymentPlan: PaymentPlan
  overview: string
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
  developerSlug: "",  // Initialize developer slug
  price: "",
  priceNumeric: 0,
  coverImage: null,
  gallery: [],
  description: "",
  completionDate: "",
  totalUnits: 0,
  registrationOpen: false,
  launchDate: "",
  featured: false,
  locationDetails: {
    description: "",
    nearby: [],
    coordinates: { latitude: 0, longitude: 0 },
  },
  paymentPlan: {
    booking: "",
    construction: [{ milestone: "", percentage: "" }],
    handover: "",
  },
  overview: "",
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
  const [activeTab, setActiveTab] = useState("basic")
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [developers, setDevelopers] = useState([])
  const
    handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  // Handle cover image upload
  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file (PNG, JPEG, JPG)')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB')
        return
      }

      setFormData(prev => ({ ...prev, coverImage: file }))

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setCoverImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle gallery images upload
  const handleGalleryImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image file`)
        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`)
        return false
      }
      return true
    })

    if (validFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        gallery: [...prev.gallery, ...validFiles]
      }))

      // Create previews
      validFiles.forEach(file => {
        const reader = new FileReader()
        reader.onload = (e) => {
          setGalleryPreviews(prev => [...prev, e.target?.result as string])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  // Remove gallery image
  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index)
    }))
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index))
  }

  // Remove cover image
  const removeCoverImage = () => {
    setFormData(prev => ({ ...prev, coverImage: null }))
    setCoverImagePreview(null)
  }

  const updateLocationDetailsField = <K extends keyof LocationDetails>(
    field: K,
    value: LocationDetails[K]
  ) => {
    setFormData(prev => ({
      ...prev,
      locationDetails: {
        ...prev.locationDetails,
        [field]: value,
      },
    }))
  }

  const updatePaymentPlanField = <K extends keyof PaymentPlan>(
    field: K,
    value: PaymentPlan[K]
  ) => {
    setFormData(prev => ({
      ...prev,
      paymentPlan: {
        ...prev.paymentPlan,
        [field]: value,
      },
    }))
  }

  // Add nearby place
  const addNearbyPlace = () => {
    const newNearby = [...formData.locationDetails.nearby, { name: "", distance: "" }]
    updateLocationDetailsField("nearby", newNearby)
  }

  // Remove nearby place
  const removeNearbyPlace = (index: number) => {
    const newNearby = formData.locationDetails.nearby.filter((_, i) => i !== index)
    updateLocationDetailsField("nearby", newNearby)
  }
  const handleDeveloperChange = (selectedDeveloperId: string) => {
    const selectedDeveloper = developers.find(dev => dev?.id === selectedDeveloperId)
    if (selectedDeveloper) {
      setFormData(prev => ({
        ...prev,
        developer: selectedDeveloper.name,
        developerSlug: selectedDeveloper.slug || selectedDeveloper.name.toLowerCase().replace(/\s+/g, '-')
      }))
    }
  }

  // Update nearby place
  const updateNearbyPlace = (index: number, field: keyof NearbyPlace, value: string) => {
    const newNearby = [...formData.locationDetails.nearby]
    newNearby[index] = { ...newNearby[index], [field]: value }
    updateLocationDetailsField("nearby", newNearby)
  }

  // Add construction milestone
  const addConstructionMilestone = () => {
    const newConstruction = [...formData.paymentPlan.construction, { milestone: "", percentage: "" }]
    updatePaymentPlanField("construction", newConstruction)
  }

  // Remove construction milestone
  const removeConstructionMilestone = (index: number) => {
    const newConstruction = formData.paymentPlan.construction.filter((_, i) => i !== index)
    updatePaymentPlanField("construction", newConstruction)
  }

  // Update construction milestone
  const updateConstructionMilestone = (index: number, field: keyof PaymentMilestone, value: string) => {
    const newConstruction = [...formData.paymentPlan.construction]
    newConstruction[index] = { ...newConstruction[index], [field]: value }
    updatePaymentPlanField("construction", newConstruction)
  }

  const fillFakeData = () => {
    // Find a developer to use for fake data
    const fakeDeveloper = developers.length > 0 ? developers[0] : null

    setFormData({
      name: "Marina Luxury Residences",
      location: "Dubai Marina",
      type: "Luxury Apartments",
      status: "Under Construction",
      developer: fakeDeveloper?.name || "Elite Developers LLC",
      developerSlug: fakeDeveloper?.slug || "elite-developers-llc",
      price: "Starting from AED 1.2M",
      priceNumeric: 1200000,
      coverImage: null,
      gallery: [],
      description: "A premium residential development offering unparalleled luxury living with stunning marina views and world-class amenities.",
      completionDate: "2027-12-31",
      totalUnits: 350,
      registrationOpen: true,
      launchDate: "2025-08-01",
      featured: true,
      locationDetails: {
        description: "Strategically located in the heart of Dubai Marina with direct access to the beach, marina, and premium dining and entertainment options.",
        nearby: [
          { name: "Dubai Marina Mall", distance: "300m" },
          { name: "JBR Beach", distance: "500m" },
          { name: "Dubai Marina Metro", distance: "400m" }
        ],
        coordinates: {
          latitude: 25.0800,
          longitude: 55.1400
        }
      },
      paymentPlan: {
        booking: "20% down payment upon booking",
        construction: [
          { milestone: "Foundation completion", percentage: "20%" },
          { milestone: "Structure completion", percentage: "30%" },
          { milestone: "Finishing phase", percentage: "30%" }
        ],
        handover: "20% upon handover and completion"
      },
      overview: "Marina Luxury Residences represents the pinnacle of modern living, featuring state-of-the-art amenities including infinity pools, fitness centers, spa facilities, and 24/7 concierge services.",
      flags: {
        elite: true,
        exclusive: false,
        featured: true,
        highValue: true,
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
    if (!formData.coverImage) errors.push("Cover image is required")
    if (formData.gallery.length === 0) errors.push("At least one gallery image is required")

    if (!formData.locationDetails.description.trim()) {
      errors.push("Location details description is required")
    }
    if (!formData.paymentPlan.booking.trim()) {
      errors.push("Payment plan booking info is required")
    }
    if (formData.paymentPlan.construction.length === 0 ||
      formData.paymentPlan.construction.some(m => !m.milestone.trim() || !m.percentage.trim())) {
      errors.push("Payment plan construction milestones are required")
    }
    if (!formData.paymentPlan.handover.trim()) {
      errors.push("Payment plan handover info is required")
    }
    if (formData.priceNumeric <= 0) errors.push("Price must be greater than 0")
    if (formData.totalUnits <= 0) errors.push("Total units must be greater than 0")
    if (!formData.completionDate) errors.push("Completion date is required")
    if (!formData.launchDate) errors.push("Launch date is required")

    return errors
  }
  useEffect(() => {
    const fetchDevelopers = async () => {
      try {
        const res = await fetch("/api/developers/fetch")
        const json = await res.json()
        if (json.success) {
          setDevelopers(json.data)
          console.log(json.data)
        } else {
          console.error("Failed to fetch developers:", json.message)
        }
      } catch (err) {
        console.error("Error fetching developers:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchDevelopers()
  }, [])

  const handleSubmit = async () => {
    const errors = validateForm()
    if (errors.length > 0) {
      toast.error(`Please fix the following errors:\n${errors.join('\n')}`)
      return
    }

    setIsSubmitting(true)
    try {
      // Create FormData for file upload
      const submitData = new FormData()

      // Add cover image
      if (formData.coverImage) {
        submitData.append('coverImage', formData.coverImage)
      }

      // Add gallery images
      formData.gallery.forEach((file, index) => {
        submitData.append(`gallery_${index}`, file)
      })

      // Add other form data
      const formDataWithoutFiles = { ...formData }
      delete (formDataWithoutFiles as any).coverImage
      delete (formDataWithoutFiles as any).gallery

      submitData.append('projectData', JSON.stringify({
        ...formDataWithoutFiles,
        completionDate: new Date(formData.completionDate).toISOString(),
      }))

      const res = await fetch("/api/projects/add", {
        method: "POST",
        body: submitData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Something went wrong")

      toast.success("Project saved successfully!")
      handleClose()
    } catch (err: any) {
      console.error("Save failed:", err)
      toast.error(`Failed to save project: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData(initialFormData)
    setCoverImagePreview(null)
    setGalleryPreviews([])
    setActiveTab("basic")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <DialogTitle className="text-2xl font-bold">Add New Project</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0">
          <div className="space-y-8 py-4">

            {/* Basic Info Section */}
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Project Name *</Label>
                    <Input
                      id="name"
                      placeholder="Enter project name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="mt-1"
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
                      className="mt-1"
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
                      className="mt-1"
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
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="developer">Developer *</Label>
                    <Select
                      value={developers.find(dev => dev?.name === formData.developer)?.id || ""}
                      onValueChange={handleDeveloperChange}
                      disabled={loading}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder={loading ? "Loading developers..." : "Select a developer"} />
                      </SelectTrigger>
                      <SelectContent>
                        {developers.map((dev) => (
                          <SelectItem key={dev?.id} value={dev?.id}>
                            {dev?.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.developerSlug && (
                      <p className="text-xs text-gray-500 mt-1">Slug: {formData.developerSlug}</p>
                    )}
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
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="completionDate">Completion Date *</Label>
                    <Input
                      id="completionDate"
                      type="date"
                      name="completionDate"
                      value={formData.completionDate}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="launchDate">Launch Date *</Label>
                    <Input
                      id="launchDate"
                      type="date"
                      name="launchDate"
                      value={formData.launchDate}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing Information */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price Display Text *</Label>
                    <Input
                      id="price"
                      placeholder="e.g., Starting from AED 999K"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      className="mt-1"
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
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Descriptions */}
            <Card>
              <CardHeader>
                <CardTitle>Descriptions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="overview">Overview *</Label>
                  <Textarea
                    id="overview"
                    placeholder="Enter project overview"
                    name="overview"
                    value={formData.overview}
                    onChange={handleChange}
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Detailed Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter detailed project description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Project Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Project Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium">Status Settings</Label>
                    <div className="space-y-3 mt-2">
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

                  <div>
                    <Label className="text-sm font-medium">Project Flags</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {Object.entries(formData.flags).map(([flag, value]) => (
                        <div key={flag} className="flex items-center space-x-2">
                          <Checkbox
                            id={flag}
                            checked={value}
                            onCheckedChange={(checked) =>
                              handleCheckboxChange(flag as keyof ProjectFormData['flags'], !!checked)
                            }
                          />
                          <Label htmlFor={flag} className="capitalize text-sm">
                            {flag}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cover Image */}
            <Card>
              <CardHeader>
                <CardTitle>Cover Image *</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {!coverImagePreview ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <div>
                        <Label htmlFor="coverImage" className="cursor-pointer">
                          <span className="text-blue-600 hover:text-blue-500">Upload cover image</span>
                          <Input
                            id="coverImage"
                            type="file"
                            accept="image/png,image/jpeg,image/jpg"
                            onChange={handleCoverImageUpload}
                            className="hidden"
                          />
                        </Label>
                        <p className="text-gray-500 text-sm mt-1">PNG, JPEG, JPG (max 5MB)</p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <img
                        src={coverImagePreview}
                        alt="Cover preview"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={removeCoverImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Gallery Images */}
            <Card>
              <CardHeader>
                <CardTitle>Gallery Images *</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                    <div>
                      <Label htmlFor="galleryImages" className="cursor-pointer">
                        <span className="text-blue-600 hover:text-blue-500">Upload gallery images</span>
                        <Input
                          id="galleryImages"
                          type="file"
                          multiple
                          accept="image/png,image/jpeg,image/jpg"
                          onChange={handleGalleryImagesUpload}
                          className="hidden"
                        />
                      </Label>
                      <p className="text-gray-500 text-sm mt-1">Select multiple images (PNG, JPEG, JPG - max 5MB each)</p>
                    </div>
                  </div>

                  {galleryPreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                      {galleryPreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Gallery ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeGalleryImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Location Details */}
            <Card>
              <CardHeader>
                <CardTitle>Location Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="locationDescription">Location Description *</Label>
                  <Textarea
                    id="locationDescription"
                    placeholder="Describe the location and its advantages"
                    value={formData.locationDetails.description}
                    onChange={(e) => updateLocationDetailsField("description", e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude">Latitude *</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      placeholder="25.0800"
                      value={formData.locationDetails.coordinates.latitude || ''}
                      onChange={(e) =>
                        updateLocationDetailsField("coordinates", {
                          ...formData.locationDetails.coordinates,
                          latitude: Number(e.target.value),
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude">Longitude *</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      placeholder="55.1400"
                      value={formData.locationDetails.coordinates.longitude || ''}
                      onChange={(e) =>
                        updateLocationDetailsField("coordinates", {
                          ...formData.locationDetails.coordinates,
                          longitude: Number(e.target.value),
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Nearby Places */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Nearby Places
                  <Button type="button" onClick={addNearbyPlace} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Place
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {formData.locationDetails.nearby.map((place, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        placeholder="Place name"
                        value={place.name}
                        onChange={(e) => updateNearbyPlace(index, 'name', e.target.value)}
                      />
                      <Input
                        placeholder="Distance"
                        value={place.distance}
                        onChange={(e) => updateNearbyPlace(index, 'distance', e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeNearbyPlace(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Plan */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="booking">Booking Payment *</Label>
                  <Textarea
                    id="booking"
                    placeholder="Describe booking payment requirements"
                    value={formData.paymentPlan.booking}
                    onChange={(e) => updatePaymentPlanField("booking", e.target.value)}
                    rows={2}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="handover">Handover Payment *</Label>
                  <Textarea
                    id="handover"
                    placeholder="Describe handover payment requirements"
                    value={formData.paymentPlan.handover}
                    onChange={(e) => updatePaymentPlanField("handover", e.target.value)}
                    rows={2}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Construction Milestones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Construction Milestones *
                  <Button type="button" onClick={addConstructionMilestone} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Milestone
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {formData.paymentPlan.construction.map((milestone, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        placeholder="Milestone description"
                        value={milestone.milestone}
                        onChange={(e) => updateConstructionMilestone(index, 'milestone', e.target.value)}
                      />
                      <Input
                        placeholder="Percentage (e.g., 20%)"
                        value={milestone.percentage}
                        onChange={(e) => updateConstructionMilestone(index, 'percentage', e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeConstructionMilestone(index)}
                        disabled={formData.paymentPlan.construction.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
                  Project Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Project Header */}
                <div className="border-b pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-2xl font-bold">{formData.name || "Project Name"}</h3>
                      <p className="text-gray-600">{formData.location || "Location"}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {formData.featured && <Badge variant="secondary">Featured</Badge>}
                      {formData.registrationOpen && <Badge className="bg-green-500">Registration Open</Badge>}
                      {Object.entries(formData.flags).map(([flag, value]) =>
                        value && <Badge key={flag} variant="outline" className="capitalize">{flag}</Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Type:</span>
                      <p>{formData.type || "N/A"}</p>
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>
                      <p>{formData.status || "N/A"}</p>
                    </div>
                    <div>
                      <span className="font-medium">Developer:</span>
                      <p>{formData.developer || "N/A"}</p>
                    </div>
                    <div>
                      <span className="font-medium">Total Units:</span>
                      <p>{formData.totalUnits || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* Images Preview */}
                <div>
                  <h4 className="font-semibold mb-3">Images</h4>
                  <div className="space-y-4">
                    {coverImagePreview && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Cover Image:</p>
                        <img src={coverImagePreview} alt="Cover" className="w-full h-48 object-cover rounded-lg" />
                      </div>
                    )}

                    {galleryPreviews.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Gallery ({galleryPreviews.length} images):</p>
                        <div className="grid grid-cols-4 gap-2">
                          {galleryPreviews.slice(0, 8).map((preview, index) => (
                            <img key={index} src={preview} alt={`Gallery ${index + 1}`} className="w-full h-20 object-cover rounded" />
                          ))}
                          {galleryPreviews.length > 8 && (
                            <div className="flex items-center justify-center bg-gray-100 rounded h-20 text-sm text-gray-600">
                              +{galleryPreviews.length - 8} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing */}
                <div>
                  <h4 className="font-semibold mb-2">Pricing</h4>
                  <p className="text-lg font-medium text-blue-600">{formData.price || "Price not set"}</p>
                  {formData.priceNumeric > 0 && (
                    <p className="text-sm text-gray-600">Numeric value: AED {formData.priceNumeric.toLocaleString()}</p>
                  )}
                </div>

                {/* Descriptions */}
                <div>
                  <h4 className="font-semibold mb-2">Overview</h4>
                  <p className="text-gray-700">{formData.overview || "No overview provided"}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-gray-700">{formData.description || "No description provided"}</p>
                </div>

                {/* Location Details */}
                <div>
                  <h4 className="font-semibold mb-2">Location Details</h4>
                  <p className="text-gray-700 mb-3">{formData.locationDetails.description || "No location description"}</p>

                  {formData.locationDetails.nearby.length > 0 && (
                    <div>
                      <p className="font-medium mb-2">Nearby Places:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {formData.locationDetails.nearby.map((place, index) => (
                          place.name && (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{place.name}</span>
                              <span className="text-gray-600">{place.distance}</span>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}

                  {(formData.locationDetails.coordinates.latitude || formData.locationDetails.coordinates.longitude) && (
                    <div className="mt-3">
                      <p className="font-medium mb-1">Coordinates:</p>
                      <p className="text-sm text-gray-600">
                        {formData.locationDetails.coordinates.latitude}, {formData.locationDetails.coordinates.longitude}
                      </p>
                    </div>
                  )}
                </div>

                {/* Payment Plan */}
                <div>
                  <h4 className="font-semibold mb-2">Payment Plan</h4>

                  {formData.paymentPlan.booking && (
                    <div className="mb-3">
                      <p className="font-medium">Booking:</p>
                      <p className="text-sm text-gray-700">{formData.paymentPlan.booking}</p>
                    </div>
                  )}

                  {formData.paymentPlan.construction.length > 0 && formData.paymentPlan.construction.some(m => m.milestone) && (
                    <div className="mb-3">
                      <p className="font-medium">Construction Milestones:</p>
                      <div className="space-y-1">
                        {formData.paymentPlan.construction.map((milestone, index) => (
                          milestone.milestone && (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{milestone.milestone}</span>
                              <span className="font-medium">{milestone.percentage}</span>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.paymentPlan.handover && (
                    <div>
                      <p className="font-medium">Handover:</p>
                      <p className="text-sm text-gray-700">{formData.paymentPlan.handover}</p>
                    </div>
                  )}
                </div>

                {/* Timeline */}
                <div>
                  <h4 className="font-semibold mb-2">Timeline</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Launch Date:</span>
                      <p>{formData.launchDate ? new Date(formData.launchDate).toLocaleDateString() : "Not set"}</p>
                    </div>
                    <div>
                      <span className="font-medium">Completion Date:</span>
                      <p>{formData.completionDate ? new Date(formData.completionDate).toLocaleDateString() : "Not set"}</p>
                    </div>
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
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Project"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}