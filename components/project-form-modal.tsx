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

interface AmenityCategory {
  category: string;
  items: string[];
}

interface UnitType {
  type: string;
  size: string;
  price: string;
}



interface Developer {
  id: string;
  name: string;
  slug?: string;
}

interface IProject {
  _id: string;
  id: string;
  slug: string;
  name: string;
  location: string;
  locationSlug: string;
  type: string;
  status: string;
  statusSlug: string;
  developer: string;
  developerSlug: string;
  price: string;
  priceNumeric: number;
  image: string;
  description: string;
  overview: string;
  completionDate: string;
  totalUnits: number;
  amenities: AmenityCategory[];
  unitTypes: UnitType[];
  gallery: string[];
  paymentPlan: PaymentPlan;
  locationDetails: LocationDetails;
  categories: string[];
  featured: boolean;
  launchDate: string;
  registrationOpen: boolean;
  flags: {
    elite: boolean;
    exclusive: boolean;
    featured: boolean;
    highValue: boolean;
  };
  createdAt: string;
  updatedAt: string;
}
interface ProjectFormData {
  name: string
  location: string
  type: string
  status: string
  developer: string
  developerSlug: string
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
  amenities: AmenityCategory[]
  unitTypes: UnitType[]
  categories: string[]
  flags: {
    elite: boolean
    exclusive: boolean
    featured: boolean
    highValue: boolean
  }
}

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: any) => void;
  project?: IProject | null;
  mode: 'add' | 'edit';
}

const initialFormData: ProjectFormData = {
  name: "",
  location: "",
  type: "",
  status: "",
  developer: "",
  developerSlug: "",
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
  amenities: [{ category: "", items: [""] }],
  unitTypes: [{ type: "", size: "", price: "" }],
  categories: [],
  flags: {
    elite: false,
    exclusive: false,
    featured: false,
    highValue: false,
  },
}

export function ProjectFormModal({ isOpen, onClose, onSave, project, mode }: ProjectFormModalProps) {
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [developers, setDevelopers] = useState<Developer[]>([])
  const [newCategory, setNewCategory] = useState("")

  // Convert project data to form data format
  const convertProjectToFormData = (project: IProject): ProjectFormData => {
    return {
      name: project.name || "",
      location: project.location || "",
      type: project.type || "",
      status: project.status || "",
      developer: project.developer || "",
      developerSlug: project.developerSlug || "",
      price: project.price || "",
      priceNumeric: project.priceNumeric || 0,
      coverImage: null, // Will be handled separately for existing images
      gallery: [], // Will be handled separately for existing images
      description: project.description || "",
      completionDate: project.completionDate ? project.completionDate.split('T')[0] : "",
      totalUnits: project.totalUnits || 0,
      registrationOpen: project.registrationOpen || false,
      launchDate: project.launchDate ? project.launchDate.split('T')[0] : "",
      featured: project.featured || false,
      locationDetails: {
        description: project.locationDetails?.description || "",
        nearby: project.locationDetails?.nearby || [],
        coordinates: {
          latitude: project.locationDetails?.coordinates?.latitude || 0,
          longitude: project.locationDetails?.coordinates?.longitude || 0,
        },
      },
      paymentPlan: {
        booking: project.paymentPlan?.booking || "",
        construction: project.paymentPlan?.construction || [{ milestone: "", percentage: "" }],
        handover: project.paymentPlan?.handover || "",
      },
      overview: project.overview || "",
      amenities: project.amenities && project.amenities.length > 0 ? project.amenities : [{ category: "", items: [""] }],
      unitTypes: project.unitTypes && project.unitTypes.length > 0 ? project.unitTypes : [{ type: "", size: "", price: "" }],
      categories: project.categories || [],
      flags: {
        elite: project.flags?.elite || false,
        exclusive: project.flags?.exclusive || false,
        featured: project.flags?.featured || false,
        highValue: project.flags?.highValue || false,
      },
    }
  }

  // Initialize form data based on mode
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && project) {
        const convertedData = convertProjectToFormData(project)
        setFormData(convertedData)
        
        // Set image previews for existing project
        if (project.image) {
          setCoverImagePreview(project.image)
        }
        if (project.gallery && project.gallery.length > 0) {
          setGalleryPreviews(project.gallery)
        }
      } else {
        // Reset form for add mode
        setFormData(initialFormData)
        setCoverImagePreview(null)
        setGalleryPreviews([])
      }
      setActiveTab("basic")
    }
  }, [isOpen, mode, project])

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
    const selectedDeveloper = developers.find(dev => dev.id === selectedDeveloperId)
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

  // Amenities functions
  const addAmenityCategory = () => {
    setFormData(prev => ({
      ...prev,
      amenities: [...prev.amenities, { category: "", items: [""] }]
    }))
  }

  const removeAmenityCategory = (index: number) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index)
    }))
  }

  const updateAmenityCategory = (index: number, category: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.map((amenity, i) => 
        i === index ? { ...amenity, category } : amenity
      )
    }))
  }

  const addAmenityItem = (categoryIndex: number) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.map((amenity, i) => 
        i === categoryIndex ? { ...amenity, items: [...amenity.items, ""] } : amenity
      )
    }))
  }

  const removeAmenityItem = (categoryIndex: number, itemIndex: number) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.map((amenity, i) => 
        i === categoryIndex 
          ? { ...amenity, items: amenity.items.filter((_, j) => j !== itemIndex) }
          : amenity
      )
    }))
  }

  const updateAmenityItem = (categoryIndex: number, itemIndex: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.map((amenity, i) => 
        i === categoryIndex 
          ? { 
              ...amenity, 
              items: amenity.items.map((item, j) => j === itemIndex ? value : item)
            }
          : amenity
      )
    }))
  }

  // Unit Types functions
  const addUnitType = () => {
    setFormData(prev => ({
      ...prev,
      unitTypes: [...prev.unitTypes, { type: "", size: "", price: "" }]
    }))
  }

  const removeUnitType = (index: number) => {
    setFormData(prev => ({
      ...prev,
      unitTypes: prev.unitTypes.filter((_, i) => i !== index)
    }))
  }

  const updateUnitType = (index: number, field: keyof UnitType, value: string) => {
    setFormData(prev => ({
      ...prev,
      unitTypes: prev.unitTypes.map((unit, i) => 
        i === index ? { ...unit, [field]: value } : unit
      )
    }))
  }

  // Categories functions
  const addCategory = () => {
    if (newCategory.trim() && !formData.categories.includes(newCategory.trim())) {
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, newCategory.trim()]
      }))
      setNewCategory("")
    }
  }

  const removeCategory = (index: number) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== index)
    }))
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
      amenities: [
        {
          category: "Recreation",
          items: ["Swimming Pool", "Gymnasium", "Tennis Court", "Kids Play Area"]
        },
        {
          category: "Convenience",
          items: ["24/7 Security", "Concierge Service", "Parking", "Elevators"]
        },
        {
          category: "Lifestyle",
          items: ["Spa & Wellness Center", "Business Center", "Restaurant", "Retail Shops"]
        }
      ],
      unitTypes: [
        { type: "Studio", size: "500-600 sq ft", price: "Starting from AED 800K" },
        { type: "1 Bedroom", size: "700-900 sq ft", price: "Starting from AED 1.2M" },
        { type: "2 Bedroom", size: "1200-1500 sq ft", price: "Starting from AED 1.8M" },
        { type: "3 Bedroom", size: "1800-2200 sq ft", price: "Starting from AED 2.5M" }
      ],
      categories: ["Luxury", "Waterfront", "High-Rise", "Modern"],
      flags: {
        elite: true,
        exclusive: false,
        featured: true,
        highValue: true,
      },
    })
  }

  // const validateForm = (): string[] => {
  //   const errors: string[] = []

  //   if (!formData.name.trim()) errors.push("Project name is required")
  //   if (!formData.location.trim()) errors.push("Location is required")
  //   if (!formData.type.trim()) errors.push("Project type is required")
  //   if (!formData.status.trim()) errors.push("Status is required")
  //   if (!formData.developer.trim()) errors.push("Developer is required")
  //   if (!formData.description.trim()) errors.push("Description is required")
  //   if (!formData.overview.trim()) errors.push("Overview is required")
    
  //   // For add mode, cover image and gallery are required
  //   // For edit mode, they're optional (can keep existing images)
  //   if (mode === 'add') {
  //     if (!formData.coverImage) errors.push("Cover image is required")
  //     if (formData.gallery.length === 0) errors.push("At least one gallery image is required")
  //   }

  //   if (!formData.locationDetails.description.trim()) {
  //     errors.push("Location details description is required")
  //   }
  //   if (!formData.paymentPlan.booking.trim()) {
  //     errors.push("Payment plan booking info is required")
  //   }
  //   if (formData.paymentPlan.construction.length === 0 ||
  //     formData.paymentPlan.construction.some(m => !m.milestone.trim() || !m.percentage.trim())) {
  //     errors.push("Payment plan construction milestones are required")
  //   }
  //   if (!formData.paymentPlan.handover.trim()) {
  //     errors.push("Payment plan handover info is required")
  //   }
  //   if (formData.priceNumeric <= 0) errors.push("Price must be greater than 0")
  //   if (formData.totalUnits <= 0) errors.push("Total units must be greater than 0")
  //   if (!formData.completionDate) errors.push("Completion date is required")
  //   if (!formData.launchDate) errors.push("Launch date is required")

  //   // Validate amenities
  //   if (formData.amenities.length === 0 || 
  //       formData.amenities.some(amenity => !amenity.category.trim() || amenity.items.length === 0 || amenity.items.some(item => !item.trim()))) {
  //     errors.push("At least one amenity category with items is required")
  //   }

  //   // Validate unit types
  //   if (formData.unitTypes.length === 0 || 
  //       formData.unitTypes.some(unit => !unit.type.trim() || !unit.size.trim() || !unit.price.trim())) {
  //     errors.push("At least one complete unit type is required")
  //   }

  //   return errors
  // }

  useEffect(() => {
    const fetchDevelopers = async () => {
      try {
        const res = await fetch("/api/developers/fetch")
        const json = await res.json()
        if (json.success) {
          setDevelopers(json.data)
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

// Enhanced handleSubmit function with detailed debugging and validation
const handleSubmit = async () => {
  console.log("🚀 Starting form submission...");
  
  // Debug form data first
  debugFormData();
  
  // Client-side validation with detailed logging
  const errors = validateForm()
  if (errors.length > 0) {
    console.error("❌ Client-side validation failed:", errors);
    toast.error(`Please fix the following errors:\n${errors.join('\n')}`)
    return
  }

  console.log("✅ Client-side validation passed");

  setIsSubmitting(true)
  try {
    // Log the form data before submission
    console.log("📋 Form data being submitted:", {
      name: formData.name,
      location: formData.location,
      type: formData.type,
      status: formData.status,
      developer: formData.developer,
      developerSlug: formData.developerSlug,
      price: formData.price,
      priceNumeric: formData.priceNumeric,
      description: formData.description?.length,
      overview: formData.overview?.length,
      completionDate: formData.completionDate,
      launchDate: formData.launchDate,
      totalUnits: formData.totalUnits,
      registrationOpen: formData.registrationOpen,
      featured: formData.featured,
      locationDetails: {
        description: formData.locationDetails.description?.length,
        nearby: formData.locationDetails.nearby?.length,
        coordinates: formData.locationDetails.coordinates
      },
      paymentPlan: {
        booking: formData.paymentPlan.booking?.length,
        construction: formData.paymentPlan.construction?.length,
        handover: formData.paymentPlan.handover?.length
      },
      amenities: formData.amenities?.length,
      unitTypes: formData.unitTypes?.length,
      categories: formData.categories?.length,
      flags: formData.flags,
      coverImage: formData.coverImage ? `${formData.coverImage.name} (${formData.coverImage.size} bytes)` : 'null',
      gallery: `${formData.gallery?.length} images`
    });

    // Create FormData for file upload
    const submitData = new FormData()

    // Add cover image only if a new file was selected
    if (formData.coverImage) {
      console.log("📸 Adding cover image:", formData.coverImage.name);
      submitData.append('coverImage', formData.coverImage)
    } else if (mode === 'add') {
      console.error("❌ No cover image provided for new project");
      toast.error("Cover image is required for new projects");
      return;
    }

    // Add gallery images only if new files were selected
    if (formData.gallery && formData.gallery.length > 0) {
      console.log("🖼️ Adding gallery images:", formData.gallery.length);
      formData.gallery.forEach((file, index) => {
        submitData.append(`gallery_${index}`, file)
      })
    } else if (mode === 'add') {
      console.error("❌ No gallery images provided for new project");
      toast.error("At least one gallery image is required for new projects");
      return;
    }

    // Prepare project data (remove files from the object)
    const formDataWithoutFiles = { ...formData }
    delete (formDataWithoutFiles as any).coverImage
    delete (formDataWithoutFiles as any).gallery

    // Enhanced data validation before sending
    const projectDataToSend = {
      ...formDataWithoutFiles,
      completionDate: new Date(formData.completionDate).toISOString(),
      launchDate: new Date(formData.launchDate).toISOString(),
      // Ensure all required fields are properly formatted
      name: formData.name?.trim(),
      location: formData.location?.trim(),
      type: formData.type?.trim(),
      status: formData.status?.trim(),
      developer: formData.developer?.trim(),
      developerSlug: formData.developerSlug?.trim(),
      price: formData.price?.trim(),
      description: formData.description?.trim(),
      overview: formData.overview?.trim(),
      // Clean up arrays
      categories: formData.categories?.filter(cat => cat?.trim()) || [],
      amenities: formData.amenities?.filter(amenity => 
        amenity.category?.trim() && 
        amenity.items?.length > 0 && 
        amenity.items.some(item => item?.trim())
      ).map(amenity => ({
        category: amenity.category.trim(),
        items: amenity.items.filter(item => item?.trim()).map(item => item.trim())
      })) || [],
      unitTypes: formData.unitTypes?.filter(unit => 
        unit.type?.trim() && 
        unit.size?.trim() && 
        unit.price?.trim()
      ).map(unit => ({
        type: unit.type.trim(),
        size: unit.size.trim(),
        price: unit.price.trim()
      })) || [],
      // Clean up nested objects
      locationDetails: {
        ...formData.locationDetails,
        description: formData.locationDetails.description?.trim(),
        nearby: formData.locationDetails.nearby?.filter(place => 
          place.name?.trim() && place.distance?.trim()
        ).map(place => ({
          name: place.name.trim(),
          distance: place.distance.trim()
        })) || []
      },
      paymentPlan: {
        ...formData.paymentPlan,
        booking: formData.paymentPlan.booking?.trim(),
        handover: formData.paymentPlan.handover?.trim(),
        construction: formData.paymentPlan.construction?.filter(milestone => 
          milestone.milestone?.trim() && milestone.percentage?.trim()
        ).map(milestone => ({
          milestone: milestone.milestone.trim(),
          percentage: milestone.percentage.trim()
        })) || []
      }
    };

    console.log("📤 Cleaned project data to send:", projectDataToSend);

    // Additional validation checks
    const validationIssues = [];
    
    if (!projectDataToSend.name) validationIssues.push("Name is empty");
    if (!projectDataToSend.location) validationIssues.push("Location is empty");
    if (!projectDataToSend.developer) validationIssues.push("Developer is empty");
    if (!projectDataToSend.description) validationIssues.push("Description is empty");
    if (!projectDataToSend.overview) validationIssues.push("Overview is empty");
    if (projectDataToSend.priceNumeric <= 0) validationIssues.push("Price numeric must be > 0");
    if (projectDataToSend.totalUnits <= 0) validationIssues.push("Total units must be > 0");
    if (!projectDataToSend.locationDetails.description) validationIssues.push("Location description is empty");
    if (projectDataToSend.locationDetails.nearby.length === 0) validationIssues.push("No nearby places");
    if (projectDataToSend.paymentPlan.construction.length === 0) validationIssues.push("No construction milestones");
    if (projectDataToSend.amenities.length === 0) validationIssues.push("No amenities");
    if (projectDataToSend.unitTypes.length === 0) validationIssues.push("No unit types");

    if (validationIssues.length > 0) {
      console.error("❌ Pre-submission validation issues:", validationIssues);
      toast.error(`Validation issues: ${validationIssues.join(', ')}`);
      return;
    }

    submitData.append('projectData', JSON.stringify(projectDataToSend));

    // Log FormData contents (for debugging)
    console.log("📦 FormData contents:");
    for (let [key, value] of submitData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File - ${value.name} (${value.size} bytes, ${value.type})`);
      } else {
        console.log(`${key}: ${typeof value === 'string' && value.length > 100 ? 
          value.substring(0, 100) + '...' : value}`);
      }
    }

    // Use different endpoints based on mode
    const url = mode === 'edit' && project 
      ? `/api/projects/update/${project.slug}` 
      : "/api/projects/add"
    
    const method = mode === 'edit' ? 'PUT' : 'POST'

    console.log(`🌐 Making ${method} request to ${url}`);

    const res = await fetch(url, {
      method: method,
      body: submitData,
    })

    console.log(`📡 Response status: ${res.status} ${res.statusText}`);

    let data;
    try {
      data = await res.json();
      console.log("📥 Response data:", data);
    } catch (parseError) {
      console.error("❌ Failed to parse response JSON:", parseError);
      const textResponse = await res.text();
      console.error("Raw response:", textResponse);
      throw new Error("Invalid response format from server");
    }

    if (!res.ok) {
      // Enhanced error handling
      console.error("❌ Server responded with error:", {
        status: res.status,
        statusText: res.statusText,
        data: data
      });

      let errorMessage = data?.message || "Something went wrong";
      
      if (data?.errors && Array.isArray(data.errors)) {
        errorMessage += "\n\nValidation errors:\n" + data.errors.join('\n');
      }
      
      if (data?.warnings && Array.isArray(data.warnings)) {
        console.warn("⚠️ Warnings:", data.warnings);
      }

      throw new Error(errorMessage);
    }

    console.log("✅ Project saved successfully!");
    toast.success(`Project ${mode === 'edit' ? 'updated' : 'created'} successfully!`)
    
    // Call the onSave callback to refresh the parent component
    if (onSave) {
      onSave(data)
    }
    
    handleClose()

  } catch (err: any) {
    console.error("❌ Save failed with error:", err);
    console.error("Error stack:", err.stack);
    
    let userMessage = `Failed to ${mode === 'edit' ? 'update' : 'create'} project: `;
    
    if (err.message.includes('fetch')) {
      userMessage += "Network error. Please check your connection.";
    } else if (err.message.includes('Validation')) {
      userMessage += err.message;
    } else {
      userMessage += err.message || "Unknown error occurred";
    }
    
    toast.error(userMessage);
  } finally {
    setIsSubmitting(false)
  }
}

// Debug helper function to log all form data
const debugFormData = () => {
  console.group("🐛 Form Data Debug Info");
  
  console.log("Basic Info:", {
    name: `"${formData.name}" (length: ${formData.name?.length})`,
    location: `"${formData.location}" (length: ${formData.location?.length})`,
    type: `"${formData.type}"`,
    status: `"${formData.status}"`,
    developer: `"${formData.developer}" (length: ${formData.developer?.length})`,
    developerSlug: `"${formData.developerSlug}"`,
    price: `"${formData.price}"`,
    priceNumeric: formData.priceNumeric,
    totalUnits: formData.totalUnits
  });

  console.log("Dates:", {
    completionDate: formData.completionDate,
    launchDate: formData.launchDate,
    completionDateValid: !isNaN(new Date(formData.completionDate).getTime()),
    launchDateValid: !isNaN(new Date(formData.launchDate).getTime())
  });

  console.log("Content:", {
    descriptionLength: formData.description?.length,
    overviewLength: formData.overview?.length,
    categories: formData.categories,
    categoriesLength: formData.categories?.length
  });

  console.log("Location Details:", {
    description: formData.locationDetails.description?.length,
    nearbyCount: formData.locationDetails.nearby?.length,
    coordinates: formData.locationDetails.coordinates,
    nearbyPlaces: formData.locationDetails.nearby?.map(p => ({
      name: `"${p.name}"`,
      distance: `"${p.distance}"`
    }))
  });

  console.log("Payment Plan:", {
    booking: formData.paymentPlan.booking?.length,
    handover: formData.paymentPlan.handover?.length,
    constructionCount: formData.paymentPlan.construction?.length,
    constructionMilestones: formData.paymentPlan.construction?.map((m, i) => ({
      index: i,
      milestone: `"${m.milestone}"`,
      percentage: `"${m.percentage}"`
    }))
  });

  console.log("Amenities:", {
    count: formData.amenities?.length,
    amenities: formData.amenities?.map((a, i) => ({
      index: i,
      category: `"${a.category}"`,
      itemCount: a.items?.length,
      items: a.items?.map(item => `"${item}"`)
    }))
  });

  console.log("Unit Types:", {
    count: formData.unitTypes?.length,
    unitTypes: formData.unitTypes?.map((u, i) => ({
      index: i,
      type: `"${u.type}"`,
      size: `"${u.size}"`,
      price: `"${u.price}"`
    }))
  });

  console.log("Files:", {
    coverImage: formData.coverImage ? {
      name: formData.coverImage.name,
      size: formData.coverImage.size,
      type: formData.coverImage.type
    } : null,
    galleryCount: formData.gallery?.length,
    galleryImages: formData.gallery?.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type
    }))
  });

  console.log("Flags:", formData.flags);

  console.groupEnd();
};

// Enhanced validateForm function with more detailed checks
const validateForm = (): string[] => {
  const errors: string[] = []

  // Basic required fields
  if (!formData.name?.trim()) errors.push("Project name is required")
  if (!formData.location?.trim()) errors.push("Location is required")
  if (!formData.type?.trim()) errors.push("Project type is required")
  if (!formData.status?.trim()) errors.push("Status is required")
  if (!formData.developer?.trim()) errors.push("Developer is required")
  if (!formData.developerSlug?.trim()) errors.push("Developer slug is required")
  if (!formData.price?.trim()) errors.push("Price is required")
  if (!formData.description?.trim()) errors.push("Description is required")
  if (!formData.overview?.trim()) errors.push("Overview is required")
  
  // Numeric validations
  if (typeof formData.priceNumeric !== 'number' || formData.priceNumeric <= 0) {
    errors.push("Price numeric must be a positive number")
  }
  if (typeof formData.totalUnits !== 'number' || formData.totalUnits <= 0) {
    errors.push("Total units must be a positive number")
  }

  // Date validations
  if (!formData.completionDate) {
    errors.push("Completion date is required")
  } else {
    const completionDate = new Date(formData.completionDate)
    if (isNaN(completionDate.getTime())) {
      errors.push("Completion date must be a valid date")
    }
  }

  if (!formData.launchDate) {
    errors.push("Launch date is required")
  } else {
    const launchDate = new Date(formData.launchDate)
    if (isNaN(launchDate.getTime())) {
      errors.push("Launch date must be a valid date")
    }
    
    // Check if launch date is before completion date
    if (formData.completionDate) {
      const completionDate = new Date(formData.completionDate)
      if (!isNaN(completionDate.getTime()) && !isNaN(launchDate.getTime()) && launchDate > completionDate) {
        errors.push("Launch date cannot be after completion date")
      }
    }
  }

  // File validations for add mode
  if (mode === 'add') {
    if (!formData.coverImage) errors.push("Cover image is required for new projects")
    if (!formData.gallery || formData.gallery.length === 0) {
      errors.push("At least one gallery image is required for new projects")
    }
  }

  // Location details validation
  if (!formData.locationDetails?.description?.trim()) {
    errors.push("Location description is required")
  }
  
  if (!formData.locationDetails?.nearby || formData.locationDetails.nearby.length === 0) {
    errors.push("At least one nearby place is required")
  } else {
    formData.locationDetails.nearby.forEach((place, index) => {
      if (!place.name?.trim()) errors.push(`Nearby place ${index + 1} name is required`)
      if (!place.distance?.trim()) errors.push(`Nearby place ${index + 1} distance is required`)
    })
  }

  // Coordinates validation
  if (typeof formData.locationDetails?.coordinates?.latitude !== 'number' || 
      formData.locationDetails.coordinates.latitude < -90 || 
      formData.locationDetails.coordinates.latitude > 90) {
    errors.push("Valid latitude (-90 to 90) is required")
  }
  
  if (typeof formData.locationDetails?.coordinates?.longitude !== 'number' || 
      formData.locationDetails.coordinates.longitude < -180 || 
      formData.locationDetails.coordinates.longitude > 180) {
    errors.push("Valid longitude (-180 to 180) is required")
  }

  // Payment plan validation
  if (!formData.paymentPlan?.booking?.trim()) {
    errors.push("Payment plan booking information is required")
  }
  
  if (!formData.paymentPlan?.handover?.trim()) {
    errors.push("Payment plan handover information is required")
  }
  
  if (!formData.paymentPlan?.construction || formData.paymentPlan.construction.length === 0) {
    errors.push("At least one construction milestone is required")
  } else {
    formData.paymentPlan.construction.forEach((milestone, index) => {
      if (!milestone.milestone?.trim()) {
        errors.push(`Construction milestone ${index + 1} description is required`)
      }
      if (!milestone.percentage?.trim()) {
        errors.push(`Construction milestone ${index + 1} percentage is required`)
      }
    })
  }

  // Amenities validation
  if (!formData.amenities || formData.amenities.length === 0) {
    errors.push("At least one amenity category is required")
  } else {
    formData.amenities.forEach((amenity, index) => {
      if (!amenity.category?.trim()) {
        errors.push(`Amenity category ${index + 1} name is required`)
      }
      if (!amenity.items || amenity.items.length === 0) {
        errors.push(`Amenity category ${index + 1} must have at least one item`)
      } else {
        const validItems = amenity.items.filter(item => item?.trim())
        if (validItems.length === 0) {
          errors.push(`Amenity category ${index + 1} must have at least one valid item`)
        }
      }
    })
  }

  // Unit types validation
  if (!formData.unitTypes || formData.unitTypes.length === 0) {
    errors.push("At least one unit type is required")
  } else {
    formData.unitTypes.forEach((unit, index) => {
      if (!unit.type?.trim()) errors.push(`Unit type ${index + 1} name is required`)
      if (!unit.size?.trim()) errors.push(`Unit type ${index + 1} size is required`)
      if (!unit.price?.trim()) errors.push(`Unit type ${index + 1} price is required`)
    })
  }

  return errors
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
          <DialogTitle className="text-2xl font-bold">
            {mode === 'edit' ? 'Edit Project' : 'Add New Project'}
          </DialogTitle>
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

            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Project Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a category (e.g., Luxury, Waterfront)"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                  />
                  <Button type="button" onClick={addCategory}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {formData.categories.map((category, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {category}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeCategory(index)}
                      />
                    </Badge>
                  ))}
                </div>
                
                {formData.categories.length === 0 && (
                  <p className="text-sm text-gray-500">No categories added yet</p>
                )}
              </CardContent>
            </Card>

            {/* Unit Types */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Unit Types *
                  <Button type="button" onClick={addUnitType} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Unit Type
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {formData.unitTypes.map((unit, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">Unit Type {index + 1}</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeUnitType(index)}
                          disabled={formData.unitTypes.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label>Unit Type</Label>
                          <Input
                            placeholder="e.g., Studio, 1BR, 2BR"
                            value={unit.type}
                            onChange={(e) => updateUnitType(index, 'type', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Size</Label>
                          <Input
                            placeholder="e.g., 500-600 sq ft"
                            value={unit.size}
                            onChange={(e) => updateUnitType(index, 'size', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Price Range</Label>
                          <Input
                            placeholder="e.g., Starting from AED 800K"
                            value={unit.price}
                            onChange={(e) => updateUnitType(index, 'price', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Amenities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Amenities *
                  <Button type="button" onClick={addAmenityCategory} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Category
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {formData.amenities.map((amenity, categoryIndex) => (
                    <div key={categoryIndex} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex-1 mr-3">
                          <Label>Category Name</Label>
                          <Input
                            placeholder="e.g., Recreation, Convenience, Lifestyle"
                            value={amenity.category}
                            onChange={(e) => updateAmenityCategory(categoryIndex, e.target.value)}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeAmenityCategory(categoryIndex)}
                          disabled={formData.amenities.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <Label className="text-sm">Amenity Items</Label>
                      <div className="space-y-2 mt-2">
                        {amenity.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex gap-2 items-center">
                            <Input
                              placeholder="e.g., Swimming Pool, Gymnasium"
                              value={item}
                              onChange={(e) => updateAmenityItem(categoryIndex, itemIndex, e.target.value)}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeAmenityItem(categoryIndex, itemIndex)}
                              disabled={amenity.items.length === 1}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addAmenityItem(categoryIndex)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Item
                        </Button>
                      </div>
                    </div>
                  ))}
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
                <CardTitle>
                  Cover Image {mode === 'add' ? '*' : '(Optional - leave blank to keep existing)'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {!coverImagePreview ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <div>
                        <Label htmlFor="coverImage" className="cursor-pointer">
                          <span className="text-blue-600 hover:text-blue-500">
                            {mode === 'edit' ? 'Upload new cover image' : 'Upload cover image'}
                          </span>
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
                <CardTitle>
                  Gallery Images {mode === 'add' ? '*' : '(Optional - leave blank to keep existing)'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                    <div>
                      <Label htmlFor="galleryImages" className="cursor-pointer">
                        <span className="text-blue-600 hover:text-blue-500">
                          {mode === 'edit' ? 'Upload additional gallery images' : 'Upload gallery images'}
                        </span>
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

                {/* Categories */}
                {formData.categories.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Categories</h4>
                    <div className="flex flex-wrap gap-2">
                      {formData.categories.map((category, index) => (
                        <Badge key={index} variant="outline">{category}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Unit Types */}
                {formData.unitTypes.length > 0 && formData.unitTypes.some(unit => unit.type) && (
                  <div>
                    <h4 className="font-semibold mb-3">Available Unit Types</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {formData.unitTypes.filter(unit => unit.type).map((unit, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <h5 className="font-medium">{unit.type}</h5>
                          <p className="text-sm text-gray-600">Size: {unit.size}</p>
                          <p className="text-sm font-medium text-blue-600">{unit.price}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Amenities */}
                {formData.amenities.length > 0 && formData.amenities.some(amenity => amenity.category) && (
                  <div>
                    <h4 className="font-semibold mb-3">Amenities</h4>
                    <div className="space-y-3">
                      {formData.amenities.filter(amenity => amenity.category).map((amenity, index) => (
                        <div key={index}>
                          <h5 className="font-medium mb-2">{amenity.category}</h5>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {amenity.items.filter(item => item.trim()).map((item, itemIndex) => (
                              <div key={itemIndex} className="text-sm text-gray-700">
                                • {item}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                {isSubmitting ? 
                  (mode === 'edit' ? "Updating..." : "Saving...") : 
                  (mode === 'edit' ? "Update Project" : "Save Project")
                }
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}