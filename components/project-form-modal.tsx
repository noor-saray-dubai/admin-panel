"use client"

import { useEffect, useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Upload, X, Eye, Plus, Trash2, Search, AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Enums from schema
const PROJECT_TYPES = ['Residential', 'Commercial', 'Mixed Use', 'Industrial', 'Hospitality', 'Retail']
const PROJECT_STATUSES = ['Pre-Launch', 'Launched', 'Under Construction', 'Ready to Move', 'Completed', 'Sold Out']
type AmenityCategoryType = 'Recreation' | 'Convenience' | 'Lifestyle' | 'Utilities' | 'Outdoor'
// Predefined amenity categories with their items
const AMENITY_CATEGORIES = {
  'Recreation': ['Swimming Pool', 'Gymnasium', 'Tennis Court', 'Basketball Court', 'Kids Play Area', 'Jogging Track', 'Cycling Track', 'Sports Club', 'Game Room', 'Billiards Room'],
  'Convenience': ['24/7 Security', 'Concierge Service', 'Parking', 'Elevators', 'Reception', 'Maintenance Service', 'Housekeeping', 'Laundry Service', 'Dry Cleaning'],
  'Lifestyle': ['Spa & Wellness Center', 'Business Center', 'Restaurant', 'Retail Shops', 'Coffee Shop', 'Library', 'Meeting Rooms', 'Event Hall', 'Rooftop Terrace', 'BBQ Area'],
  'Utilities': ['High-speed Internet', 'Cable TV', 'Central Air Conditioning', 'Backup Power', 'Water Supply', 'Waste Management', 'Fire Safety', 'CCTV'],
  'Outdoor': ['Garden', 'Landscaping', 'Water Features', 'Outdoor Seating', 'Children\'s Playground', 'Pet Area', 'Parking Shade', 'Walking Paths']
}

// Field validation rules based on schema
const VALIDATION_RULES = {
  name: { required: true, maxLength: 200, minLength: 3 },
  location: { required: true, maxLength: 100, minLength: 2 },
  developer: { required: true, maxLength: 150, minLength: 2 },
  price: { required: true, maxLength: 100, minLength: 5 },
  description: { required: true, maxLength: 2000, minLength: 50 },
  overview: { required: true, maxLength: 5000, minLength: 100 },
  totalUnits: { required: true, min: 1, max: 10000 },
  priceNumeric: { required: true, min: 0 },
  locationDescription: { required: true, maxLength: 1000, minLength: 20 },
  paymentBooking: { required: true, maxLength: 500, minLength: 10 },
  paymentHandover: { required: true, maxLength: 500, minLength: 10 },
  milestone: { required: true, maxLength: 200, minLength: 5 },
  percentage: { required: true, maxLength: 10, minLength: 2 },
  nearbyName: { required: true, maxLength: 100, minLength: 2 },
  nearbyDistance: { required: true, maxLength: 20, minLength: 2 },
  unitType: { required: true, maxLength: 50, minLength: 2 },
  unitSize: { required: true, maxLength: 50, minLength: 5 },
  unitPrice: { required: true, maxLength: 100, minLength: 5 },
  latitude: { required: true, min: -90, max: 90 },
  longitude: { required: true, min: -180, max: 180 }
}

// Enhanced interfaces
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

interface FormErrors {
  [key: string]: string | undefined;
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

// Validation helper functions
const validateField = (value: any, rules: any, fieldName?: string): string | undefined => {
  if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
    return `${fieldName || 'This field'} is required`
  }
  
  if (typeof value === 'string' && value.trim()) {
    if (rules.minLength && value.trim().length < rules.minLength) {
      return `${fieldName || 'This field'} must be at least ${rules.minLength} characters`
    }
    if (rules.maxLength && value.trim().length > rules.maxLength) {
      return `${fieldName || 'This field'} cannot exceed ${rules.maxLength} characters`
    }
  }
  
  if (typeof value === 'number') {
    if (rules.min !== undefined && value < rules.min) {
      return `${fieldName || 'This field'} must be at least ${rules.min}`
    }
    if (rules.max !== undefined && value > rules.max) {
      return `${fieldName || 'This field'} cannot exceed ${rules.max}`
    }
  }
  
  return undefined
}

const trimToLimit = (value: string, limit: number): string => {
  return value.length > limit ? value.substring(0, limit) : value
}

// Enhanced Input Component with validation
const ValidatedInput = ({ 
  label, 
  value, 
  onChange, 
  rules, 
  fieldName,
  error,
  type = "text",
  placeholder = "",
  disabled = false,
  ...props 
}: any) => {
  const charCount = typeof value === 'string' ? value.length : 0
  const maxLength = rules?.maxLength

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value
    if (type === 'text' && maxLength) {
      newValue = trimToLimit(newValue, maxLength)
    }
    onChange(newValue)
  }

  return (
    <div>
      <Label htmlFor={fieldName}>
        {label} {rules?.required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id={fieldName}
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`mt-1 ${error ? 'border-red-500 focus:border-red-500' : ''}`}
        {...props}
      />
      <div className="flex justify-between mt-1">
        {error && (
          <span className="text-red-500 text-xs flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {error}
          </span>
        )}
        {maxLength && (
          <span className={`text-xs ml-auto ${charCount > maxLength * 0.9 ? 'text-amber-600' : 'text-gray-500'}`}>
            {charCount}/{maxLength}
          </span>
        )}
      </div>
    </div>
  )
}

// Enhanced Textarea Component with validation
const ValidatedTextarea = ({ 
  label, 
  value, 
  onChange, 
  rules, 
  fieldName,
  error,
  placeholder = "",
  rows = 3,
  ...props 
}: any) => {
  const charCount = value.length
  const maxLength = rules?.maxLength

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let newValue = e.target.value
    if (maxLength) {
      newValue = trimToLimit(newValue, maxLength)
    }
    onChange(newValue)
  }

  return (
    <div>
      <Label htmlFor={fieldName}>
        {label} {rules?.required && <span className="text-red-500">*</span>}
      </Label>
      <Textarea
        id={fieldName}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        className={`mt-1 ${error ? 'border-red-500 focus:border-red-500' : ''}`}
        {...props}
      />
      <div className="flex justify-between mt-1">
        {error && (
          <span className="text-red-500 text-xs flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {error}
          </span>
        )}
        {maxLength && (
          <span className={`text-xs ml-auto ${charCount > maxLength * 0.9 ? 'text-amber-600' : 'text-gray-500'}`}>
            {charCount}/{maxLength}
          </span>
        )}
      </div>
    </div>
  )
}

// Developer Search Component
const DeveloperSearch = ({ 
  developers, 
  value, 
  onChange, 
  error 
}: {
  developers: Developer[];
  value: string;
  onChange: (developer: Developer) => void;
  error?: string;
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

  return (
    <div className="relative">
      <Label>
        Developer <span className="text-red-500">*</span>
      </Label>
      <div className="relative mt-1">
        <div className="flex">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            placeholder="Search developers..."
            className={`pr-10 ${error ? 'border-red-500' : ''}`}
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
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded flex justify-between items-center">
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

export function ProjectFormModal({ isOpen, onClose, onSave, project, mode }: ProjectFormModalProps) {
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [developers, setDevelopers] = useState<Developer[]>([])
  const [newCategory, setNewCategory] = useState("")

  // Comprehensive validation
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {}

    // Basic fields validation
    const basicFieldsErrors = validateField(formData.name, VALIDATION_RULES.name, 'Project name')
    if (basicFieldsErrors) newErrors.name = basicFieldsErrors

    const locationError = validateField(formData.location, VALIDATION_RULES.location, 'Location')
    if (locationError) newErrors.location = locationError

    if (!formData.type) newErrors.type = 'Project type is required'
    if (!formData.status) newErrors.status = 'Status is required'

    const developerError = validateField(formData.developer, VALIDATION_RULES.developer, 'Developer')
    if (developerError) newErrors.developer = developerError

    const priceError = validateField(formData.price, VALIDATION_RULES.price, 'Price')
    if (priceError) newErrors.price = priceError

    const priceNumericError = validateField(formData.priceNumeric, VALIDATION_RULES.priceNumeric, 'Numeric price')
    if (priceNumericError) newErrors.priceNumeric = priceNumericError

    const totalUnitsError = validateField(formData.totalUnits, VALIDATION_RULES.totalUnits, 'Total units')
    if (totalUnitsError) newErrors.totalUnits = totalUnitsError

    const descriptionError = validateField(formData.description, VALIDATION_RULES.description, 'Description')
    if (descriptionError) newErrors.description = descriptionError

    const overviewError = validateField(formData.overview, VALIDATION_RULES.overview, 'Overview')
    if (overviewError) newErrors.overview = overviewError

    // Date validations
    if (!formData.completionDate) {
      newErrors.completionDate = 'Completion date is required'
    } else {
      const completionDate = new Date(formData.completionDate)
      if (isNaN(completionDate.getTime())) {
        newErrors.completionDate = 'Invalid completion date'
      } else if (completionDate < new Date('2020-01-01')) {
        newErrors.completionDate = 'Completion date must be after 2020'
      }
    }

    if (!formData.launchDate) {
      newErrors.launchDate = 'Launch date is required'
    } else {
      const launchDate = new Date(formData.launchDate)
      if (isNaN(launchDate.getTime())) {
        newErrors.launchDate = 'Invalid launch date'
      }
      
      if (formData.completionDate && !newErrors.completionDate) {
        const completionDate = new Date(formData.completionDate)
        if (launchDate > completionDate) {
          newErrors.launchDate = 'Launch date cannot be after completion date'
        }
      }
    }

    // File validations for add mode
    if (mode === 'add') {
      if (!formData.coverImage) newErrors.coverImage = 'Cover image is required'
      if (formData.gallery.length === 0) newErrors.gallery = 'At least one gallery image is required'
    }

    // Location details validation
    const locationDescError = validateField(formData.locationDetails.description, VALIDATION_RULES.locationDescription, 'Location description')
    if (locationDescError) newErrors.locationDescription = locationDescError

    const latError = validateField(formData.locationDetails.coordinates.latitude, VALIDATION_RULES.latitude, 'Latitude')
    if (latError) newErrors.latitude = latError

    const lngError = validateField(formData.locationDetails.coordinates.longitude, VALIDATION_RULES.longitude, 'Longitude')
    if (lngError) newErrors.longitude = lngError

    // Nearby places validation
    if (formData.locationDetails.nearby.length === 0) {
      newErrors.nearby = 'At least one nearby place is required'
    } else {
      formData.locationDetails.nearby.forEach((place, index) => {
        const nameError = validateField(place.name, VALIDATION_RULES.nearbyName)
        if (nameError) newErrors[`nearby_${index}_name`] = nameError

        const distanceError = validateField(place.distance, VALIDATION_RULES.nearbyDistance)
        if (distanceError) newErrors[`nearby_${index}_distance`] = distanceError
      })
    }

    // Payment plan validation
    const bookingError = validateField(formData.paymentPlan.booking, VALIDATION_RULES.paymentBooking, 'Booking payment')
    if (bookingError) newErrors.paymentBooking = bookingError

    const handoverError = validateField(formData.paymentPlan.handover, VALIDATION_RULES.paymentHandover, 'Handover payment')
    if (handoverError) newErrors.paymentHandover = handoverError

    if (formData.paymentPlan.construction.length === 0) {
      newErrors.constructionMilestones = 'At least one construction milestone is required'
    } else {
      formData.paymentPlan.construction.forEach((milestone, index) => {
        const milestoneError = validateField(milestone.milestone, VALIDATION_RULES.milestone)
        if (milestoneError) newErrors[`milestone_${index}`] = milestoneError

        const percentageError = validateField(milestone.percentage, VALIDATION_RULES.percentage)
        if (percentageError) newErrors[`percentage_${index}`] = percentageError
      })
    }

    // Amenities validation
    if (formData.amenities.length === 0) {
      newErrors.amenities = 'At least one amenity category is required'
    } else {
      formData.amenities.forEach((amenity, index) => {
        if (!amenity.category) {
          newErrors[`amenity_category_${index}`] = 'Category is required'
        }
        if (amenity.items.length === 0 || !amenity.items.some(item => item.trim())) {
          newErrors[`amenity_items_${index}`] = 'At least one item is required'
        }
      })
    }

    // Unit types validation
    if (formData.unitTypes.length === 0) {
      newErrors.unitTypes = 'At least one unit type is required'
    } else {
      formData.unitTypes.forEach((unit, index) => {
        const typeError = validateField(unit.type, VALIDATION_RULES.unitType)
        if (typeError) newErrors[`unit_type_${index}`] = typeError

        const sizeError = validateField(unit.size, VALIDATION_RULES.unitSize)
        if (sizeError) newErrors[`unit_size_${index}`] = sizeError

        const unitPriceError = validateField(unit.price, VALIDATION_RULES.unitPrice)
        if (unitPriceError) newErrors[`unit_price_${index}`] = unitPriceError
      })
    }

    return newErrors
  }

  // Check if form is valid
  const isFormValid = useMemo(() => {
    const formErrors = validateForm()
    return Object.keys(formErrors).length === 0
  }, [formData, mode])

  // Update errors whenever form data changes
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const newErrors = validateForm()
      setErrors(newErrors)
    }
  }, [formData])

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
      coverImage: null,
      gallery: [],
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
        
        if (project.image) {
          setCoverImagePreview(project.image)
        }
        if (project.gallery && project.gallery.length > 0) {
          setGalleryPreviews(project.gallery)
        }
      } else {
        setFormData(initialFormData)
        setCoverImagePreview(null)
        setGalleryPreviews([])
      }
      setErrors({})
    }
  }, [isOpen, mode, project])

  // Fetch developers
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

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleDeveloperChange = (developer: Developer) => {
    setFormData(prev => ({
      ...prev,
      developer: developer.name,
      developerSlug: developer.slug || developer.name.toLowerCase().replace(/\s+/g, '-')
    }))
    
    if (errors.developer) {
      setErrors(prev => ({ ...prev, developer: undefined }))
    }
  }

  // Enhanced amenity handling with predefined categories
  const addAmenityCategory = () => {
    setFormData(prev => ({
      ...prev,
      amenities: [...prev.amenities, { category: "", items: [] }]
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
        i === index ? { category, items: [] } : amenity
      )
    }))
  }

  const toggleAmenityItem = (categoryIndex: number, item: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.map((amenity, i) => 
        i === categoryIndex ? {
          ...amenity,
          items: amenity.items.includes(item)
            ? amenity.items.filter(existingItem => existingItem !== item)
            : [...amenity.items, item]
        } : amenity
      )
    }))
  }

  // Get available amenity categories (not already selected)
  const getAvailableCategories = () => {
    const selectedCategories = formData.amenities.map(a => a.category).filter(c => c)
    return Object.keys(AMENITY_CATEGORIES).filter(cat => !selectedCategories.includes(cat))
  }

  // Handle cover image upload
  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB')
        return
      }

      setFormData(prev => ({ ...prev, coverImage: file }))
      
      if (errors.coverImage) {
        setErrors(prev => ({ ...prev, coverImage: undefined }))
      }

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

      if (errors.gallery) {
        setErrors(prev => ({ ...prev, gallery: undefined }))
      }

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

  // Location and payment plan helpers
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

  const addNearbyPlace = () => {
    const newNearby = [...formData.locationDetails.nearby, { name: "", distance: "" }]
    updateLocationDetailsField("nearby", newNearby)
  }

  const removeNearbyPlace = (index: number) => {
    const newNearby = formData.locationDetails.nearby.filter((_, i) => i !== index)
    updateLocationDetailsField("nearby", newNearby)
  }

  const updateNearbyPlace = (index: number, field: keyof NearbyPlace, value: string) => {
    const newNearby = [...formData.locationDetails.nearby]
    newNearby[index] = { ...newNearby[index], [field]: value }
    updateLocationDetailsField("nearby", newNearby)
    
    // Clear specific error
    const errorKey = `nearby_${index}_${field}`
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: undefined }))
    }
  }

  const addConstructionMilestone = () => {
    const newConstruction = [...formData.paymentPlan.construction, { milestone: "", percentage: "" }]
    updatePaymentPlanField("construction", newConstruction)
  }

  const removeConstructionMilestone = (index: number) => {
    const newConstruction = formData.paymentPlan.construction.filter((_, i) => i !== index)
    updatePaymentPlanField("construction", newConstruction)
  }

  const updateConstructionMilestone = (index: number, field: keyof PaymentMilestone, value: string) => {
    let trimmedValue = value
    if (field === 'milestone') {
      trimmedValue = trimToLimit(value, VALIDATION_RULES.milestone.maxLength)
    } else if (field === 'percentage') {
      trimmedValue = trimToLimit(value, VALIDATION_RULES.percentage.maxLength)
    }

    const newConstruction = [...formData.paymentPlan.construction]
    newConstruction[index] = { ...newConstruction[index], [field]: trimmedValue }
    updatePaymentPlanField("construction", newConstruction)
    
    // Clear specific error
    const errorKey = `${field}_${index}`
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: undefined }))
    }
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
    let trimmedValue = value
    if (field === 'type') {
      trimmedValue = trimToLimit(value, VALIDATION_RULES.unitType.maxLength)
    } else if (field === 'size') {
      trimmedValue = trimToLimit(value, VALIDATION_RULES.unitSize.maxLength)
    } else if (field === 'price') {
      trimmedValue = trimToLimit(value, VALIDATION_RULES.unitPrice.maxLength)
    }

    setFormData(prev => ({
      ...prev,
      unitTypes: prev.unitTypes.map((unit, i) => 
        i === index ? { ...unit, [field]: trimmedValue } : unit
      )
    }))
    
    // Clear specific error
    const errorKey = `unit_${field}_${index}`
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: undefined }))
    }
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
    const fakeDeveloper = developers.length > 0 ? developers[0] : null

    setFormData({
      name: "Marina Luxury Residences",
      location: "Dubai Marina",
      type: "Residential",
      status: "Under Construction",
      developer: fakeDeveloper?.name || "Elite Developers LLC",
      developerSlug: fakeDeveloper?.slug || "elite-developers-llc",
      price: "Starting from AED 1.2M",
      priceNumeric: 1200000,
      coverImage: null,
      gallery: [],
      description: "A premium residential development offering unparalleled luxury living with stunning marina views and world-class amenities. This exclusive project features state-of-the-art architecture, premium finishes, and an unbeatable location in the heart of Dubai Marina.",
      completionDate: "2027-12-31",
      totalUnits: 350,
      registrationOpen: true,
      launchDate: "2025-08-01",
      featured: true,
      locationDetails: {
        description: "Strategically located in the heart of Dubai Marina with direct access to the beach, marina, and premium dining and entertainment options. This prime location offers residents the perfect blend of urban sophistication and waterfront tranquility.",
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
        booking: "20% down payment upon booking confirmation with developer",
        construction: [
          { milestone: "Foundation completion", percentage: "20%" },
          { milestone: "Structure completion", percentage: "30%" },
          { milestone: "Finishing phase", percentage: "30%" }
        ],
        handover: "20% upon handover and completion of all documentation"
      },
      overview: "Marina Luxury Residences represents the pinnacle of modern living, featuring state-of-the-art amenities including infinity pools, fitness centers, spa facilities, and 24/7 concierge services. The development offers a perfect blend of luxury, comfort, and convenience in one of Dubai's most prestigious neighborhoods. With panoramic views of the marina and Arabian Gulf, residents will experience the ultimate waterfront lifestyle with world-class dining, shopping, and entertainment options right at their doorstep.",
      amenities: [
        {
          category: "Recreation",
          items: ["Swimming Pool", "Gymnasium", "Tennis Court", "Kids Play Area"]
        },
        {
          category: "Convenience",
          items: ["24/7 Security", "Concierge Service", "Parking", "Elevators"]
        }
      ],
      unitTypes: [
        { type: "Studio", size: "500-600 sq ft", price: "Starting from AED 800K" },
        { type: "1 Bedroom", size: "700-900 sq ft", price: "Starting from AED 1.2M" },
        { type: "2 Bedroom", size: "1200-1500 sq ft", price: "Starting from AED 1.8M" }
      ],
      categories: ["Luxury", "Waterfront", "High-Rise", "Modern"],
      flags: {
        elite: true,
        exclusive: false,
        featured: true,
        highValue: true,
      },
    })
    setErrors({})
  }

  const handleSubmit = async () => {
    // Validate form
    const formErrors = validateForm()
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      toast.error('Please fix all validation errors before submitting')
      return
    }

    setIsSubmitting(true)
    try {
      const submitData = new FormData()

      if (formData.coverImage) {
        submitData.append('coverImage', formData.coverImage)
      } else if (mode === 'add') {
        toast.error("Cover image is required for new projects")
        return
      }

      if (formData.gallery && formData.gallery.length > 0) {
        formData.gallery.forEach((file, index) => {
          submitData.append(`gallery_${index}`, file)
        })
      } else if (mode === 'add') {
        toast.error("At least one gallery image is required for new projects")
        return
      }

      const formDataWithoutFiles = { ...formData }
      delete (formDataWithoutFiles as any).coverImage
      delete (formDataWithoutFiles as any).gallery

      const projectDataToSend = {
        ...formDataWithoutFiles,
        completionDate: new Date(formData.completionDate).toISOString(),
        launchDate: new Date(formData.launchDate).toISOString(),
        // Clean up arrays and objects
        categories: formData.categories.filter(cat => cat.trim()),
        amenities: formData.amenities.filter(amenity => 
          amenity.category.trim() && amenity.items.length > 0
        ).map(amenity => ({
          category: amenity.category.trim(),
          items: amenity.items.filter(item => item.trim())
        })),
        unitTypes: formData.unitTypes.filter(unit => 
          unit.type.trim() && unit.size.trim() && unit.price.trim()
        ),
        locationDetails: {
          ...formData.locationDetails,
          nearby: formData.locationDetails.nearby.filter(place => 
            place.name.trim() && place.distance.trim()
          )
        },
        paymentPlan: {
          ...formData.paymentPlan,
          construction: formData.paymentPlan.construction.filter(milestone => 
            milestone.milestone.trim() && milestone.percentage.trim()
          )
        }
      }

      submitData.append('projectData', JSON.stringify(projectDataToSend))

      const url = mode === 'edit' && project 
        ? `/api/projects/update/${project.slug}` 
        : "/api/projects/add"
      
      const method = mode === 'edit' ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method: method,
        body: submitData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || "Something went wrong")
      }

      toast.success(`Project ${mode === 'edit' ? 'updated' : 'created'} successfully!`)
      if (onSave) {
        onSave(data)
      }
      handleClose()

    } catch (err: any) {
      toast.error(`Failed to ${mode === 'edit' ? 'update' : 'create'} project: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }
  const isValidAmenityCategory = (category: string): category is AmenityCategoryType => {
  return category in AMENITY_CATEGORIES
}


  const handleClose = () => {
    setFormData(initialFormData)
    setCoverImagePreview(null)
    setGalleryPreviews([])
    setErrors({})
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
                  <ValidatedInput
                    label="Project Name"
                    value={formData.name}
                    onChange={(value: string) => handleFieldChange('name', value)}
                    rules={VALIDATION_RULES.name}
                    fieldName="name"
                    error={errors.name}
                    placeholder="Enter project name"
                  />
                  <ValidatedInput
                    label="Location"
                    value={formData.location}
                    onChange={(value: string) => handleFieldChange('location', value)}
                    rules={VALIDATION_RULES.location}
                    fieldName="location"
                    error={errors.location}
                    placeholder="Enter location"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">
                      Project Type <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value) => handleFieldChange('type', value)}
                    >
                      <SelectTrigger className={`mt-1 ${errors.type ? 'border-red-500' : ''}`}>
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
                    <Label htmlFor="status">
                      Status <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value) => handleFieldChange('status', value)}
                    >
                      <SelectTrigger className={`mt-1 ${errors.status ? 'border-red-500' : ''}`}>
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
                    value={formData.totalUnits || ''}
                    onChange={(value: string) => handleFieldChange('totalUnits', Number(value))}
                    rules={VALIDATION_RULES.totalUnits}
                    fieldName="totalUnits"
                    error={errors.totalUnits}
                    type="number"
                    placeholder="250"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="completionDate">
                      Completion Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="completionDate"
                      type="date"
                      value={formData.completionDate}
                      onChange={(e) => handleFieldChange('completionDate', e.target.value)}
                      className={`mt-1 ${errors.completionDate ? 'border-red-500' : ''}`}
                    />
                    {errors.completionDate && (
                      <span className="text-red-500 text-xs flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.completionDate}
                      </span>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="launchDate">
                      Launch Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="launchDate"
                      type="date"
                      value={formData.launchDate}
                      onChange={(e) => handleFieldChange('launchDate', e.target.value)}
                      className={`mt-1 ${errors.launchDate ? 'border-red-500' : ''}`}
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

            {/* Pricing Information */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <ValidatedInput
                    label="Price Display Text"
                    value={formData.price}
                    onChange={(value: string) => handleFieldChange('price', value)}
                    rules={VALIDATION_RULES.price}
                    fieldName="price"
                    error={errors.price}
                    placeholder="e.g., Starting from AED 999K"
                  />
                  
                  <ValidatedInput
                    label="Numeric Price (AED)"
                    value={formData.priceNumeric || ''}
                    onChange={(value: string) => handleFieldChange('priceNumeric', Number(value))}
                    rules={VALIDATION_RULES.priceNumeric}
                    fieldName="priceNumeric"
                    error={errors.priceNumeric}
                    type="number"
                    placeholder="999000"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Descriptions */}
            <Card>
              <CardHeader>
                <CardTitle>Descriptions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ValidatedTextarea
                  label="Overview"
                  value={formData.overview}
                  onChange={(value: string) => handleFieldChange('overview', value)}
                  rules={VALIDATION_RULES.overview}
                  fieldName="overview"
                  error={errors.overview}
                  placeholder="Enter project overview"
                  rows={3}
                />

                <ValidatedTextarea
                  label="Detailed Description"
                  value={formData.description}
                  onChange={(value: string) => handleFieldChange('description', value)}
                  rules={VALIDATION_RULES.description}
                  fieldName="description"
                  error={errors.description}
                  placeholder="Enter detailed project description"
                  rows={4}
                />
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
              </CardContent>
            </Card>

            {/* Enhanced Amenities Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Amenities <span className="text-red-500">*</span>
                  <Button 
                    type="button" 
                    onClick={addAmenityCategory} 
                    size="sm"
                    disabled={getAvailableCategories().length === 0}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Category
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {errors.amenities && (
                  <div className="text-red-500 text-sm mb-4 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.amenities}
                  </div>
                )}
                
                <div className="space-y-4">
                  {formData.amenities.map((amenity, categoryIndex) => (
                    <div key={categoryIndex} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex-1 mr-3">
                          <Label>
                            Category Name <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={amenity.category}
                            onValueChange={(value) => updateAmenityCategory(categoryIndex, value)}
                          >
                            <SelectTrigger className={`mt-1 ${errors[`amenity_category_${categoryIndex}`] ? 'border-red-500' : ''}`}>
                              <SelectValue placeholder="Select amenity category" />
                            </SelectTrigger>
                            <SelectContent>
                              {(amenity.category ? [amenity.category, ...getAvailableCategories()] : getAvailableCategories()).map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors[`amenity_category_${categoryIndex}`] && (
                            <span className="text-red-500 text-xs flex items-center gap-1 mt-1">
                              <AlertCircle className="h-3 w-3" />
                              {errors[`amenity_category_${categoryIndex}`]}
                            </span>
                          )}
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
                      
                      {amenity.category && isValidAmenityCategory(amenity.category) && (
                        <div>
                          <Label className="text-sm">
                            Available Items <span className="text-red-500">*</span>
                          </Label>
                          {errors[`amenity_items_${categoryIndex}`] && (
                            <div className="text-red-500 text-xs flex items-center gap-1 mt-1 mb-2">
                              <AlertCircle className="h-3 w-3" />
                              {errors[`amenity_items_${categoryIndex}`]}
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto p-2 border rounded">
                            {AMENITY_CATEGORIES[amenity.category].map((item) => (
                              <div key={item} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${categoryIndex}-${item}`}
                                  checked={amenity.items.includes(item)}
                                  onCheckedChange={() => toggleAmenityItem(categoryIndex, item)}
                                />
                                <Label htmlFor={`${categoryIndex}-${item}`} className="text-sm">
                                  {item}
                                </Label>
                              </div>
                            ))}
                          </div>
                          
                          {amenity.items.length > 0 && (
                            <div className="mt-2">
                              <Label className="text-sm text-gray-600">Selected ({amenity.items.length}):</Label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {amenity.items.map((item, itemIndex) => (
                                  <Badge key={itemIndex} variant="outline" className="text-xs">
                                    {item}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Unit Types */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Unit Types <span className="text-red-500">*</span>
                  <Button type="button" onClick={addUnitType} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Unit Type
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {errors.unitTypes && (
                  <div className="text-red-500 text-sm mb-4 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.unitTypes}
                  </div>
                )}
                
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
                        <ValidatedInput
                          label="Unit Type"
                          value={unit.type}
                          onChange={(value: string) => updateUnitType(index, 'type', value)}
                          rules={VALIDATION_RULES.unitType}
                          error={errors[`unit_type_${index}`]}
                          placeholder="e.g., Studio, 1BR, 2BR"
                        />
                        
                        <ValidatedInput
                          label="Size"
                          value={unit.size}
                          onChange={(value: string) => updateUnitType(index, 'size', value)}
                          rules={VALIDATION_RULES.unitSize}
                          error={errors[`unit_size_${index}`]}
                          placeholder="e.g., 500-600 sq ft"
                        />
                        
                        <ValidatedInput
                          label="Price Range"
                          value={unit.price}
                          onChange={(value: string) => updateUnitType(index, 'price', value)}
                          rules={VALIDATION_RULES.unitPrice}
                          error={errors[`unit_price_${index}`]}
                          placeholder="e.g., Starting from AED 800K"
                        />
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
                            handleFieldChange('registrationOpen', !!checked)
                          }
                        />
                        <Label htmlFor="registrationOpen">Registration Open</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="featured"
                          checked={formData.featured}
                          onCheckedChange={(checked) =>
                            handleFieldChange('featured', !!checked)
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
                            onCheckedChange={(checked) => {
                              setFormData(prev => ({
                                ...prev,
                                flags: { ...prev.flags, [flag]: !!checked }
                              }))
                            }}
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
                  Cover Image {mode === 'add' ? <span className="text-red-500">*</span> : '(Optional - leave blank to keep existing)'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {errors.coverImage && (
                  <div className="text-red-500 text-sm mb-4 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.coverImage}
                  </div>
                )}
                
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
                  Gallery Images {mode === 'add' ? <span className="text-red-500">*</span> : '(Optional - leave blank to keep existing)'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {errors.gallery && (
                  <div className="text-red-500 text-sm mb-4 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.gallery}
                  </div>
                )}
                
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
                <ValidatedTextarea
                  label="Location Description"
                  value={formData.locationDetails.description}
                  onChange={(value: string) => {
                    updateLocationDetailsField("description", value)
                    if (errors.locationDescription) {
                      setErrors(prev => ({ ...prev, locationDescription: undefined }))
                    }
                  }}
                  rules={VALIDATION_RULES.locationDescription}
                  fieldName="locationDescription"
                  error={errors.locationDescription}
                  placeholder="Describe the location and its advantages"
                  rows={3}
                />

                <div className="grid grid-cols-2 gap-4">
                  <ValidatedInput
                    label="Latitude"
                    value={formData.locationDetails.coordinates.latitude || ''}
                    onChange={(value: string) => {
                      updateLocationDetailsField("coordinates", {
                        ...formData.locationDetails.coordinates,
                        latitude: Number(value),
                      })
                      if (errors.latitude) {
                        setErrors(prev => ({ ...prev, latitude: undefined }))
                      }
                    }}
                    rules={VALIDATION_RULES.latitude}
                    fieldName="latitude"
                    error={errors.latitude}
                    type="number"
                    placeholder="25.0800"
                  />
                  
                  <ValidatedInput
                    label="Longitude"
                    value={formData.locationDetails.coordinates.longitude || ''}
                    onChange={(value: string) => {
                      updateLocationDetailsField("coordinates", {
                        ...formData.locationDetails.coordinates,
                        longitude: Number(value),
                      })
                      if (errors.longitude) {
                        setErrors(prev => ({ ...prev, longitude: undefined }))
                      }
                    }}
                    rules={VALIDATION_RULES.longitude}
                    fieldName="longitude"
                    error={errors.longitude}
                    type="number"
                    placeholder="55.1400"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Nearby Places */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Nearby Places <span className="text-red-500">*</span>
                  <Button type="button" onClick={addNearbyPlace} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Place
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {errors.nearby && (
                  <div className="text-red-500 text-sm mb-4 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.nearby}
                  </div>
                )}
                
                <div className="space-y-3">
                  {formData.locationDetails.nearby.map((place, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <ValidatedInput
                          label=""
                          value={place.name}
                          onChange={(value: string) => updateNearbyPlace(index, 'name', value)}
                          rules={VALIDATION_RULES.nearbyName}
                          error={errors[`nearby_${index}_name`]}
                          placeholder="Place name"
                        />
                      </div>
                      <div className="flex-1">
                        <ValidatedInput
                          label=""
                          value={place.distance}
                          onChange={(value: string) => updateNearbyPlace(index, 'distance', value)}
                          rules={VALIDATION_RULES.nearbyDistance}
                          error={errors[`nearby_${index}_distance`]}
                          placeholder="Distance"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeNearbyPlace(index)}
                        className="mt-1"
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
                <ValidatedTextarea
                  label="Booking Payment"
                  value={formData.paymentPlan.booking}
                  onChange={(value: string) => {
                    updatePaymentPlanField("booking", value)
                    if (errors.paymentBooking) {
                      setErrors(prev => ({ ...prev, paymentBooking: undefined }))
                    }
                  }}
                  rules={VALIDATION_RULES.paymentBooking}
                  fieldName="paymentBooking"
                  error={errors.paymentBooking}
                  placeholder="Describe booking payment requirements"
                  rows={2}
                />

                <ValidatedTextarea
                  label="Handover Payment"
                  value={formData.paymentPlan.handover}
                  onChange={(value: string) => {
                    updatePaymentPlanField("handover", value)
                    if (errors.paymentHandover) {
                      setErrors(prev => ({ ...prev, paymentHandover: undefined }))
                    }
                  }}
                  rules={VALIDATION_RULES.paymentHandover}
                  fieldName="paymentHandover"
                  error={errors.paymentHandover}
                  placeholder="Describe handover payment requirements"
                  rows={2}
                />
              </CardContent>
            </Card>

            {/* Construction Milestones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Construction Milestones <span className="text-red-500">*</span>
                  <Button type="button" onClick={addConstructionMilestone} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Milestone
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {errors.constructionMilestones && (
                  <div className="text-red-500 text-sm mb-4 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.constructionMilestones}
                  </div>
                )}
                
                <div className="space-y-3">
                  {formData.paymentPlan.construction.map((milestone, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <ValidatedInput
                          label=""
                          value={milestone.milestone}
                          onChange={(value: string) => updateConstructionMilestone(index, 'milestone', value)}
                          rules={VALIDATION_RULES.milestone}
                          error={errors[`milestone_${index}`]}
                          placeholder="Milestone description"
                        />
                      </div>
                      <div className="w-32">
                        <ValidatedInput
                          label=""
                          value={milestone.percentage}
                          onChange={(value: string) => updateConstructionMilestone(index, 'percentage', value)}
                          rules={VALIDATION_RULES.percentage}
                          error={errors[`percentage_${index}`]}
                          placeholder="Percentage"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeConstructionMilestone(index)}
                        disabled={formData.paymentPlan.construction.length === 1}
                        className="mt-1"
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

                {/* Amenities Preview */}
                {formData.amenities.length > 0 && formData.amenities.some(amenity => amenity.category && amenity.items.length > 0) && (
                  <div>
                    <h4 className="font-semibold mb-3">Amenities</h4>
                    <div className="space-y-3">
                      {formData.amenities.filter(amenity => amenity.category && amenity.items.length > 0).map((amenity, index) => (
                        <div key={index}>
                          <h5 className="font-medium mb-2">{amenity.category}</h5>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {amenity.items.map((item, itemIndex) => (
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
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !isFormValid}
                className={!isFormValid ? 'opacity-50 cursor-not-allowed' : ''}
              >
                {isSubmitting ? 
                  (mode === 'edit' ? "Updating..." : "Saving...") : 
                  (mode === 'edit' ? "Update Project" : "Save Project")
                }
              </Button>
            </div>
          </div>
          
          {!isFormValid && Object.keys(validateForm()).length > 0 && (
            <div className="mt-3 text-sm text-red-600">
              <p className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Please fix {Object.keys(validateForm()).length} validation error(s) before submitting
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}