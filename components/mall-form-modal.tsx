// components/mall-form-modal.tsx
"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
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
import { 
  Upload, X, Eye, MapPin, DollarSign, Building, Plus, Minus, AlertCircle, 
  ChevronLeft, ChevronRight, CheckCircle, ShoppingCart, Store, TrendingUp, 
  Users, Factory, Home, Hotel, Layers, Globe, FileText, Camera, Settings
} from "lucide-react"
import { InstantImageUpload, UploadedImage } from "@/components/ui/instant-image-upload"
import type { IMall, MallFormData, MallFormModalProps } from "@/types/mall"
import { validateMallFormData, validateField } from "@/lib/mall-validation"
import {
  saveMallFormDraft,
  loadMallFormDraft,
  clearMallFormDraft,
  hasSavedMallDraft,
  getMallDraftTimestamp,
  createDebouncedMallSave
} from "@/lib/mall-form-persistence"

// Character counter component
const CharacterCounter = ({ current, max }: { current: number; max: number }) => {
  const isNearLimit = current > max * 0.8
  const isOverLimit = current > max

  return (
    <div className={`text-xs mt-1 ${isOverLimit ? 'text-red-500' : isNearLimit ? 'text-yellow-500' : 'text-gray-400'}`}>
      {current}/{max}
    </div>
  )
}

// Enhanced Input with validation
const ValidatedInput = ({
  label,
  field,
  value,
  onChange,
  formData,
  errors,
  setErrors,
  type = "text",
  placeholder = "",
  required = false,
  maxLength,
  className = "",
  min,
  max,
  step
}: {
  label: string
  field: string
  value: string | number
  onChange: (value: string | number) => void
  formData: MallFormData
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  type?: string
  placeholder?: string
  required?: boolean
  maxLength?: number
  className?: string
  min?: number
  max?: number
  step?: number
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue: string | number = e.target.value

    if (type === 'number') {
      newValue = parseFloat(newValue) || 0
    }

    if (maxLength && typeof newValue === 'string' && newValue.length > maxLength) {
      return
    }

    onChange(newValue)

    const error = validateField(field, newValue, formData)
    setErrors(prev => ({ ...prev, [field]: error }))
  }

  return (
    <div className={className}>
      <Label htmlFor={field}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id={field}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className={`mt-1 ${errors[field] ? 'border-red-500' : ''}`}
        min={min}
        max={max}
        step={step}
      />
      {maxLength && typeof value === 'string' && (
        <CharacterCounter current={value.length} max={maxLength} />
      )}
      {errors[field] && (
        <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
          <AlertCircle className="h-3 w-3" />
          {errors[field]}
        </div>
      )}
    </div>
  )
}

// Enhanced Textarea with validation
const ValidatedTextarea = ({
  label,
  field,
  value,
  onChange,
  formData,
  errors,
  setErrors,
  placeholder = "",
  required = false,
  maxLength,
  rows = 3
}: {
  label: string
  field: string
  value: string
  onChange: (value: string) => void
  formData: MallFormData
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  placeholder?: string
  required?: boolean
  maxLength?: number
  rows?: number
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let newValue = e.target.value

    if (maxLength && newValue.length > maxLength) {
      return
    }

    onChange(newValue)

    const error = validateField(field, newValue, formData)
    setErrors(prev => ({ ...prev, [field]: error }))
  }

  return (
    <div>
      <Label htmlFor={field}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Textarea
        id={field}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        rows={rows}
        className={`mt-1 ${errors[field] ? 'border-red-500' : ''}`}
      />
      {maxLength && (
        <CharacterCounter current={value.length} max={maxLength} />
      )}
      {errors[field] && (
        <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
          <AlertCircle className="h-3 w-3" />
          {errors[field]}
        </div>
      )}
    </div>
  )
}

// Initial form data with all required defaults
const initialFormData: MallFormData = {
  name: "",
  subtitle: "",
  status: "",
  location: "",
  subLocation: "",
  ownership: "",
  price: {
    total: "",
    totalNumeric: 0,
    perSqft: 0,
    currency: "AED"
  },
  size: {
    totalArea: 0,
    retailArea: 0,
    totalSqm: 0,
    retailSqm: 0,
    floors: 1,
    parkingSpaces: 0
  },
  rentalDetails: {
    currentOccupancy: 0,
    averageRent: 0,
    totalStores: 0,
    maxStores: 1,
    vacantStores: 0,
    anchorTenants: []
  },
  financials: {
    annualRevenue: 0,
    noi: 0,
    operatingExpenses: 0,
    capRate: 0,
    roi: 0,
    appreciation: 0,
    payback: 0
  },
  saleInformation: {
    askingPrice: "",
    askingPriceNumeric: 0,
    valuationReports: [],
    saleStatus: "available",
    transactionHistory: [],
    dealStructure: "assetSale",
    saleConditions: [],
    preferredBuyerType: "any"
  },
  legalDetails: {
    titleDeedNumber: "",
    reraNumber: "",
    zoning: "",
    leaseholdExpiry: undefined,
    mortgageDetails: undefined
  },
  operationalDetails: {
    managementCompany: "",
    serviceCharges: 0,
    utilityCosts: 0,
    maintenanceStatus: "new",
    greenBuildingCertifications: []
  },
  leaseDetails: {
    leaseTermsSummary: {
      avgLeaseDuration: 0,
      escalationRate: 0
    },
    topTenants: [],
    leaseExpirySchedule: []
  },
  marketingMaterials: {
    brochure: "",
    videoTour: "",
    virtualTour3D: "",
    investmentHighlights: [],
    keySellingPoints: []
  },
  investorRelations: {
    brokerContact: undefined,
    ndaRequired: false,
    dataRoomAccessUrl: ""
  },
  amenities: {
    cinemas: false,
    foodCourt: false,
    hypermarket: false,
    departmentStore: false,
    entertainment: false,
    skiResort: false,
    aquarium: false,
    iceRink: false,
    hotel: false,
    offices: false,
    residential: false,
    mosque: false,
    clinic: false,
    bankingServices: false,
    vip_lounges: false,
    nursery: false
  },
  features: [],
  developer: {
    name: "",
    slug: "",
    established: new Date().getFullYear(),
    portfolio: []
  },
  yearBuilt: new Date().getFullYear(),
  yearOpened: new Date().getFullYear(),
  rating: 5,
  visitorsAnnually: 0,
  architecture: "",
  image: "",
  gallery: [],
  floorPlan: "",
  locationDetails: {
    description: "",
    coordinates: {
      latitude: 0,
      longitude: 0
    },
    connectivity: {
      metroStation: "",
      metroDistance: 0,
      highways: [],
      airports: [],
      publicTransport: []
    },
    demographics: {
      catchmentPopulation: 0,
      averageIncome: "",
      touristFootfall: 0
    }
  },
  verified: true,
  isActive: true,
  isAvailable: true,
  isOperational: false
}

// Step configuration
const steps = [
  { id: "basic", title: "Basic Information", icon: Building, description: "Name, location, type" },
  { id: "size-price", title: "Size & Pricing", icon: DollarSign, description: "Areas, pricing, financials" },
  { id: "rental", title: "Rental & Operations", icon: Store, description: "Tenants, operations" },
  { id: "sale-legal", title: "Sale & Legal", icon: FileText, description: "Sale info, legal details" },
  { id: "features", title: "Features & Amenities", icon: Users, description: "Mall amenities, features" },
  { id: "location", title: "Location Details", icon: MapPin, description: "Detailed location info" },
  { id: "marketing", title: "Marketing & Media", icon: Camera, description: "Images, marketing materials" },
  { id: "settings", title: "Settings & Review", icon: Settings, description: "Final settings, review" }
]

export function MallFormModal({ isOpen, onClose, onSuccess, mall, mode }: MallFormModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<MallFormData>(initialFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Draft persistence state (only for add mode)
  const [hasDraft, setHasDraft] = useState(false)
  const [showDraftRestoreDialog, setShowDraftRestoreDialog] = useState(false)
  const [draftTimestamp, setDraftTimestamp] = useState<string | null>(null)
  
  // Unsaved changes state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false)
  const [pendingClose, setPendingClose] = useState(false)

  // Create debounced save function
  const debouncedSave = useMemo(
    () => createDebouncedMallSave(1500), // Save 1.5 seconds after user stops typing
    []
  )

  // Auto-calculate square meters when square feet changes
  const updateSizeCalculations = useCallback((totalArea: number, retailArea?: number) => {
    const totalSqm = Math.round(totalArea * 0.092903 * 100) / 100
    const retailSqm = retailArea ? Math.round(retailArea * 0.092903 * 100) / 100 : Math.round(totalArea * 0.7 * 0.092903 * 100) / 100

    setFormData(prev => ({
      ...prev,
      size: {
        ...prev.size,
        totalArea,
        retailArea: retailArea || Math.round(totalArea * 0.7), // Default to 70% retail
        totalSqm,
        retailSqm
      }
    }))
  }, [])

  // Auto-calculate pricing when per sqft or area changes
  const updatePriceCalculations = useCallback((perSqft: number, totalArea: number) => {
    const totalNumeric = Math.round(perSqft * totalArea)
    const currency = formData.price?.currency ?? "AED"
    const total = formatPrice(totalNumeric, currency)

    setFormData(prev => ({
      ...prev,
      price: {
        ...prev.price,
        perSqft,
        totalNumeric,
        total
      }
    }))
  }, [formData.price?.currency])

  // Format price for display
  const formatPrice = (amount: number, currency: string) => {
    if (amount >= 1000000000) {
      return `${currency} ${(amount / 1000000000).toFixed(1)}B`
    } else if (amount >= 1000000) {
      return `${currency} ${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `${currency} ${(amount / 1000).toFixed(1)}K`
    } else {
      return `${currency} ${amount.toLocaleString()}`
    }
  }

  // Handle keyboard events (Escape key)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !showDraftRestoreDialog && !showUnsavedChangesDialog && !isSubmitting) {
        handleModalClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, showDraftRestoreDialog, showUnsavedChangesDialog, isSubmitting])

  // Initialize form data and handle draft restoration
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && mall) {
        // Edit mode - load existing mall data
        setFormData({
          name: mall.name || "",
          subtitle: mall.subtitle || "",
          status: mall.status || "",
          location: mall.location || "",
          subLocation: mall.subLocation || "",
          ownership: mall.ownership || "",
          price: mall.price || initialFormData.price,
          size: mall.size || initialFormData.size,
          rentalDetails: mall.rentalDetails || initialFormData.rentalDetails,
          financials: mall.financials || initialFormData.financials,
          saleInformation: mall.saleInformation || initialFormData.saleInformation,
          legalDetails: mall.legalDetails || initialFormData.legalDetails,
          operationalDetails: mall.operationalDetails || initialFormData.operationalDetails,
          leaseDetails: mall.leaseDetails || initialFormData.leaseDetails,
          marketingMaterials: mall.marketingMaterials || initialFormData.marketingMaterials,
          investorRelations: mall.investorRelations || initialFormData.investorRelations,
          amenities: mall.amenities || initialFormData.amenities,
          features: mall.features || [],
          developer: mall.developer || initialFormData.developer,
          yearBuilt: mall.yearBuilt || new Date().getFullYear(),
          yearOpened: mall.yearOpened || new Date().getFullYear(),
          rating: mall.rating || 5,
          visitorsAnnually: mall.visitorsAnnually || 0,
          architecture: mall.architecture || "",
          image: mall.image || "",
          gallery: mall.gallery || [],
          floorPlan: mall.floorPlan || "",
          locationDetails: mall.locationDetails || initialFormData.locationDetails,
          verified: mall.verified ?? true,
          isActive: mall.isActive ?? true,
          isAvailable: mall.isAvailable ?? true,
          isOperational: mall.isOperational ?? false
        })
        setHasDraft(false)
      } else {
        // Add mode - check for saved draft
        const savedDraft = hasSavedMallDraft()
        setHasDraft(savedDraft)

        if (savedDraft) {
          const timestamp = getMallDraftTimestamp()
          setDraftTimestamp(timestamp)
          setShowDraftRestoreDialog(true)
        } else {
          setFormData(initialFormData)
        }
      }

      setErrors({})
      setIsSubmitting(false)
      setCurrentStep(0)
    }
  }, [mall, mode, isOpen])

  // Handle input changes with auto-save and validation
  const handleInputChange = (field: string, value: any) => {
    let updatedFormData: MallFormData

    if (field.includes('.')) {
      const keys = field.split('.')
      setFormData((prev) => {
        const newData = { ...prev }
        let current: any = newData

        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]]
        }
        current[keys[keys.length - 1]] = value
        updatedFormData = newData
        return newData
      })
    } else {
      setFormData((prev) => {
        const newData = { ...prev, [field]: value }
        updatedFormData = newData
        return newData
      })
    }

    // Auto-calculate related fields
    if (field === 'size.totalArea' && typeof value === 'number') {
      updateSizeCalculations(value)
    }
    if (field === 'price.perSqft' && typeof value === 'number') {
      const totalArea = formData.size?.totalArea ?? 0
      updatePriceCalculations(value, totalArea)
    }

    // Trigger validation for current step after a delay
    setTimeout(() => {
      const currentStepId = steps[currentStep].id
      validateStep(currentStepId)
    }, 100)

    // Update unsaved changes flag
    setTimeout(() => {
      setHasUnsavedChanges(hasFormChanges())
    }, 0)

    // Save draft automatically for add mode only
    if (mode === 'add') {
      setTimeout(() => {
        setFormData(current => {
          debouncedSave(current)
          return current
        })
      }, 0)
    }
  }

  // Step navigation (allow free movement between steps)
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      // Validate current step for visual feedback but don't block navigation
      const currentStepId = steps[currentStep].id
      validateStep(currentStepId)
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = (stepIndex: number) => {
    // Validate current step before allowing navigation
    if (stepIndex !== currentStep) {
      const currentStepId = steps[currentStep].id
      validateStep(currentStepId) // Update validation state
    }
    setCurrentStep(stepIndex)
  }

  // Step validation functions (pure function that doesn't update state)
  const getStepErrors = useCallback((stepId: string): Record<string, string> => {
    const stepErrors: Record<string, string> = {}
    
    switch (stepId) {
      case "basic":
        if (!formData.name.trim()) stepErrors.name = "Mall name is required"
        else if (formData.name.length < 3) stepErrors.name = "Mall name must be at least 3 characters"
        else if (formData.name.length > 100) stepErrors.name = "Mall name cannot exceed 100 characters"
        
        if (!formData.subtitle.trim()) stepErrors.subtitle = "Subtitle is required"
        else if (formData.subtitle.length < 5) stepErrors.subtitle = "Subtitle must be at least 5 characters"
        else if (formData.subtitle.length > 200) stepErrors.subtitle = "Subtitle cannot exceed 200 characters"
        
        if (!formData.status) stepErrors.status = "Status is required"
        if (!formData.location.trim()) stepErrors.location = "Location is required"
        else if (formData.location.length < 2) stepErrors.location = "Location must be at least 2 characters"
        
        if (!formData.subLocation.trim()) stepErrors.subLocation = "Sub location is required"
        else if (formData.subLocation.length < 2) stepErrors.subLocation = "Sub location must be at least 2 characters"
        
        if (!formData.ownership) stepErrors.ownership = "Ownership type is required"
        break
        
      case "size-price":
        // Size validations - all required
        const totalArea = formData.size?.totalArea ?? 0
        const retailArea = formData.size?.retailArea ?? 0
        const floors = formData.size?.floors ?? 1
        
        if (totalArea <= 0) stepErrors['size.totalArea'] = "Total area is required and must be greater than 0"
        if (retailArea <= 0) stepErrors['size.retailArea'] = "Retail area is required and must be greater than 0"
        if (floors < 1) stepErrors['size.floors'] = "Floors must be at least 1"
        
        // Price validations - all required
        const perSqft = formData.price?.perSqft ?? 0
        const totalPrice = formData.price?.total?.trim() ?? ""
        const currency = formData.price?.currency ?? ""
        
        if (perSqft <= 0) stepErrors['price.perSqft'] = "Price per sqft is required and must be greater than 0"
        if (!totalPrice) stepErrors['price.total'] = "Total price display is required"
        if (!currency) stepErrors['price.currency'] = "Currency is required"
        
        // Financial validations - required fields
        const capRate = formData.financials?.capRate ?? 0
        const roi = formData.financials?.roi ?? 0
        const appreciation = formData.financials?.appreciation ?? 0
        const payback = formData.financials?.payback ?? 0
        
        if (capRate < 0) stepErrors['financials.capRate'] = "Cap rate is required and cannot be negative"
        if (roi < 0) stepErrors['financials.roi'] = "ROI is required and cannot be negative"
        if (appreciation < 0) stepErrors['financials.appreciation'] = "Appreciation rate is required and cannot be negative"
        if (payback < 0) stepErrors['financials.payback'] = "Payback period is required and cannot be negative"
        break
        
      case "rental":
        // Rental details validations - required fields
        const maxStores = formData.rentalDetails.maxStores ?? 0
        const totalStores = formData.rentalDetails.totalStores ?? 0
        const vacantStores = formData.rentalDetails.vacantStores ?? 0
        const occupancy = formData.rentalDetails.currentOccupancy ?? 0
        const averageRent = formData.rentalDetails.averageRent ?? 0
        
        if (maxStores < 1) stepErrors['rentalDetails.maxStores'] = "Maximum stores capacity is required and must be at least 1"
        if (totalStores < 0) stepErrors['rentalDetails.totalStores'] = "Total stores cannot be negative"
        if (vacantStores < 0) stepErrors['rentalDetails.vacantStores'] = "Vacant stores cannot be negative"
        if (occupancy < 0 || occupancy > 100) stepErrors['rentalDetails.currentOccupancy'] = "Occupancy must be between 0 and 100%"
        if (averageRent < 0) stepErrors['rentalDetails.averageRent'] = "Average rent cannot be negative"
        
        // Operational details validations
        const maintenanceStatus = formData.operationalDetails?.maintenanceStatus ?? ""
        if (!maintenanceStatus) stepErrors['operationalDetails.maintenanceStatus'] = "Maintenance status is required"
        break
        
      case "sale-legal":
        // Sale information validations
        const saleStatus = formData.saleInformation?.saleStatus ?? ""
        const dealStructure = formData.saleInformation?.dealStructure ?? ""
        const preferredBuyerType = formData.saleInformation?.preferredBuyerType ?? ""
        const askingPrice = formData.saleInformation?.askingPriceNumeric ?? 0
        
        if (!saleStatus) stepErrors['saleInformation.saleStatus'] = "Sale status is required"
        if (!dealStructure) stepErrors['saleInformation.dealStructure'] = "Deal structure is required"
        if (!preferredBuyerType) stepErrors['saleInformation.preferredBuyerType'] = "Preferred buyer type is required"
        if (askingPrice < 0) stepErrors['saleInformation.askingPriceNumeric'] = "Asking price cannot be negative"
        
        // Legal details validations - required fields
        const zoning = formData.legalDetails?.zoning?.trim() ?? ""
        if (!zoning) stepErrors['legalDetails.zoning'] = "Zoning is required"
        else if (zoning.length < 2) stepErrors['legalDetails.zoning'] = "Zoning must be at least 2 characters"
        break
        
      case "features":
        // Developer information - required fields
        const devName = formData.developer?.name?.trim() ?? ""
        const devSlug = formData.developer?.slug?.trim() ?? ""
        
        if (!devName) stepErrors['developer.name'] = "Developer name is required"
        else if (devName.length < 2) stepErrors['developer.name'] = "Developer name must be at least 2 characters"
        
        if (!devSlug) stepErrors['developer.slug'] = "Developer slug is required"
        
        // Year validations - required fields
        const yearBuilt = formData.yearBuilt ?? new Date().getFullYear()
        const yearOpened = formData.yearOpened ?? new Date().getFullYear()
        const currentYear = new Date().getFullYear()
        
        if (yearBuilt < 1900 || yearBuilt > 2050) {
          stepErrors.yearBuilt = "Year built is required and must be between 1900 and 2050"
        }
        if (yearOpened < 1900 || yearOpened > 2050) {
          stepErrors.yearOpened = "Year opened is required and must be between 1900 and 2050"
        }
        
        // Architecture is required
        const architecture = formData.architecture?.trim() ?? ""
        if (!architecture) stepErrors.architecture = "Architecture description is required"
        else if (architecture.length < 3) stepErrors.architecture = "Architecture description must be at least 3 characters"
        break
        
      case "location":
        const lat = formData.locationDetails?.coordinates?.latitude ?? 0
        const lng = formData.locationDetails?.coordinates?.longitude ?? 0
        
        if (lat !== 0 && (lat < -90 || lat > 90)) {
          stepErrors['locationDetails.coordinates.latitude'] = "Latitude must be between -90 and 90"
        }
        if (lng !== 0 && (lng < -180 || lng > 180)) {
          stepErrors['locationDetails.coordinates.longitude'] = "Longitude must be between -180 and 180"
        }
        break
        
      case "marketing":
        // Main image is required
        if (!formData.image || !formData.image.trim()) {
          stepErrors.image = "Main mall image is required"
        }
        break
        
      case "settings":
        const rating = formData.rating ?? 5
        if (rating < 1 || rating > 5) {
          stepErrors.rating = "Rating must be between 1 and 5"
        }
        break
    }
    
    return stepErrors
  }, [formData])

  // Validate step and update errors state
  const validateStep = useCallback((stepId: string): boolean => {
    const stepErrors = getStepErrors(stepId)
    
    // Update errors for this step only
    setErrors(prev => {
      const newErrors = { ...prev }
      
      // Remove old errors for this step first
      const stepErrorKeys = Object.keys(stepErrors)
      Object.keys(newErrors).forEach(key => {
        if (stepErrorKeys.includes(key) || stepErrors[key] !== undefined) {
          delete newErrors[key]
        }
      })
      
      // Add new errors
      Object.assign(newErrors, stepErrors)
      
      return newErrors
    })
    
    return Object.keys(stepErrors).length === 0
  }, [getStepErrors])

  // Get step validation status without causing re-renders
  const getStepStatus = useCallback((stepId: string): 'valid' | 'invalid' | 'incomplete' => {
    const stepErrors = getStepErrors(stepId)
    const isValid = Object.keys(stepErrors).length === 0
    return isValid ? 'valid' : 'invalid'
  }, [getStepErrors])

  // Check if entire form is valid for submission
  const isFormValid = useCallback((): boolean => {
    const requiredSteps = ['basic', 'size-price', 'rental', 'sale-legal', 'features', 'marketing'] // All required steps
    return requiredSteps.every(stepId => {
      const stepErrors = getStepErrors(stepId)
      return Object.keys(stepErrors).length === 0
    })
  }, [getStepErrors])

  // Check if form has meaningful changes from initial state
  const hasFormChanges = useCallback((): boolean => {
    // For edit mode, compare with original mall data
    if (mode === 'edit' && mall) {
      return (
        formData.name !== (mall.name || '') ||
        formData.subtitle !== (mall.subtitle || '') ||
        formData.status !== (mall.status || '') ||
        formData.location !== (mall.location || '') ||
        formData.subLocation !== (mall.subLocation || '') ||
        formData.ownership !== (mall.ownership || '') ||
        (formData.size?.totalArea || 0) !== (mall.size?.totalArea || 0) ||
        (formData.price?.perSqft || 0) !== (mall.price?.perSqft || 0) ||
        (formData.rentalDetails?.totalStores || 0) !== (mall.rentalDetails?.totalStores || 0) ||
        (formData.developer?.name || '') !== (mall.developer?.name || '')
      )
    }
    
    // For add mode, check if any meaningful data has been entered
    return (
      formData.name.trim() !== '' ||
      formData.subtitle.trim() !== '' ||
      formData.status !== '' ||
      formData.location.trim() !== '' ||
      formData.subLocation.trim() !== '' ||
      formData.ownership !== '' ||
      (formData.size?.totalArea || 0) > 0 ||
      (formData.price?.perSqft || 0) > 0 ||
      (formData.rentalDetails?.totalStores || 0) > 0 ||
      (formData.developer?.name || '').trim() !== '' ||
      formData.image !== '' ||
      (formData.gallery || []).length > 0
    )
  }, [formData, mode, mall])

  // Handle image upload completion for main image
  const handleMainImageComplete = (result: UploadedImage | UploadedImage[]) => {
    const uploadedImage = result as UploadedImage
    handleInputChange("image", uploadedImage.url)
  }

  // Handle floor plan upload completion
  const handleFloorPlanComplete = (result: UploadedImage | UploadedImage[]) => {
    const uploadedImage = result as UploadedImage
    handleInputChange("floorPlan", uploadedImage.url)
  }

  // Handle gallery images upload completion
  const handleGalleryImageComplete = (result: UploadedImage | UploadedImage[]) => {
    const uploadedImages = Array.isArray(result) ? result : [result]
    const newUrls = uploadedImages.map(img => img.url)
    const currentGallery = formData.gallery || []
    handleInputChange("gallery", [...currentGallery, ...newUrls])
  }

  // Handle image deletion
  const handleImageDelete = (imageUrl: string) => {
    if (formData.image === imageUrl) {
      handleInputChange("image", "")
    } else if (formData.floorPlan === imageUrl) {
      handleInputChange("floorPlan", "")
    } else if (formData.gallery?.includes(imageUrl)) {
      handleInputChange("gallery", formData.gallery.filter(url => url !== imageUrl))
    }
  }

  // Handle draft restoration
  const handleRestoreDraft = () => {
    try {
      const draft = loadMallFormDraft()
      if (draft) {
        setFormData({
          ...draft,
          image: "", // Reset image fields as they're not persisted
          gallery: [],
          floorPlan: ""
        })
        toast.success("Draft restored successfully")
      }
    } catch (error) {
      toast.error("Failed to restore draft")
    }
    setShowDraftRestoreDialog(false)
  }

  const handleDiscardDraft = () => {
    clearMallFormDraft()
    setFormData(initialFormData)
    setHasDraft(false)
    setShowDraftRestoreDialog(false)
    toast.success("Draft discarded")
  }

  // Handle modal close - always show confirmation
  const handleModalClose = () => {
    if (isSubmitting) {
      // Don't allow closing during submission
      return
    }
    
    // Always show confirmation dialog
    setPendingClose(true)
    setShowUnsavedChangesDialog(true)
  }

  // Handle unsaved changes dialog actions
  const handleContinueEditing = () => {
    setShowUnsavedChangesDialog(false)
    setPendingClose(false)
  }

  const handleSaveDraftAndClose = () => {
    if (mode === 'add') {
      debouncedSave(formData)
      toast.success("Draft saved successfully")
    }
    setShowUnsavedChangesDialog(false)
    setPendingClose(false)
    onClose()
    resetForm()
  }

  const handleDiscardAndClose = () => {
    if (mode === 'add') {
      clearMallFormDraft()
    }
    setShowUnsavedChangesDialog(false)
    setPendingClose(false)
    onClose()
    resetForm()
  }

  // Reset form state
  const resetForm = () => {
    setHasUnsavedChanges(false)
    setCurrentStep(0)
    setErrors({})
  }

  // Form submission
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)

      // Final validation
      const validationResult = validateMallFormData(formData)
      if (!validationResult.isValid) {
        setErrors(validationResult.errors)
        toast.error("Please fix all validation errors before submitting")
        return
      }

      // Prepare submission data
      const submissionData = {
        ...formData,
        // Clean up any undefined values
        legalDetails: {
          ...(formData.legalDetails || {}),
          leaseholdExpiry: formData.legalDetails?.leaseholdExpiry || undefined,
          mortgageDetails: formData.legalDetails?.mortgageDetails || undefined
        },
        investorRelations: {
          ...(formData.investorRelations || {}),
          brokerContact: formData.investorRelations?.brokerContact || undefined
        }
      }

      // Submit based on mode
      const endpoint = mode === "edit" && mall ? `/api/malls/update/${mall.slug}` : "/api/malls/add"
      const method = mode === "edit" ? "PUT" : "POST"

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || `Failed to ${mode === "edit" ? "update" : "create"} mall`)
      }

      // Clear draft on successful submission for add mode
      if (mode === "add") {
        clearMallFormDraft()
      }

      toast.success(`Mall ${mode === "edit" ? "updated" : "created"} successfully!`)
      
      // Clear unsaved changes flag on successful submission
      setHasUnsavedChanges(false)
      
      // Call success callback and close modal
      if (onSuccess) {
        onSuccess(result.mall)
      }
      onClose()
      resetForm()
      
    } catch (error) {
      console.error("Form submission error:", error)
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render current step content
  const renderStepContent = () => {
    const currentStepId = steps[currentStep].id

    switch (currentStepId) {
      case "basic":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mall Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <ValidatedInput
                    label="Mall Name"
                    field="name"
                    value={formData.name}
                    onChange={(value) => handleInputChange("name", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    placeholder="Enter mall name"
                    required
                    maxLength={100}
                  />
                  <ValidatedInput
                    label="Subtitle"
                    field="subtitle"
                    value={formData.subtitle}
                    onChange={(value) => handleInputChange("subtitle", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    placeholder="Mall subtitle or tagline"
                    required
                    maxLength={200}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">
                      Status <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleInputChange("status", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Operational">Operational</SelectItem>
                        <SelectItem value="Under Construction">Under Construction</SelectItem>
                        <SelectItem value="Planned">Planned</SelectItem>
                        <SelectItem value="Design Phase">Design Phase</SelectItem>
                        <SelectItem value="Permits Approved">Permits Approved</SelectItem>
                        <SelectItem value="Foundation Ready">Foundation Ready</SelectItem>
                        <SelectItem value="Partially Operational">Partially Operational</SelectItem>
                        <SelectItem value="Renovation">Renovation</SelectItem>
                        <SelectItem value="For Sale">For Sale</SelectItem>
                        <SelectItem value="Sold">Sold</SelectItem>
                        <SelectItem value="Reserved">Reserved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <ValidatedInput
                    label="Location"
                    field="location"
                    value={formData.location}
                    onChange={(value) => handleInputChange("location", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    placeholder="e.g., Dubai Marina"
                    required
                    maxLength={100}
                  />

                  <ValidatedInput
                    label="Sub Location"
                    field="subLocation"
                    value={formData.subLocation}
                    onChange={(value) => handleInputChange("subLocation", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    placeholder="Specific area"
                    required
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownership">
                    Ownership <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.ownership}
                    onValueChange={(value) => handleInputChange("ownership", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ownership type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="freehold">Freehold</SelectItem>
                      <SelectItem value="leasehold">Leasehold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "size-price":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Size & Area Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <ValidatedInput
                    label="Total Area (sqft)"
                    field="size.totalArea"
                    value={formData.size?.totalArea ?? 0}
                    onChange={(value) => handleInputChange("size.totalArea", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    type="number"
                    placeholder="0"
                    required
                    min={0}
                  />
                  <ValidatedInput
                    label="Retail Area (sqft)"
                    field="size.retailArea"
                    value={formData.size?.retailArea ?? 0}
                    onChange={(value) => handleInputChange("size.retailArea", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    type="number"
                    placeholder="0"
                    min={0}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Total Area (sqm)</Label>
                    <Input value={formData.size?.totalSqm ?? 0} disabled className="bg-gray-50" />
                  </div>
                  <div>
                    <Label>Retail Area (sqm)</Label>
                    <Input value={formData.size?.retailSqm ?? 0} disabled className="bg-gray-50" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <ValidatedInput
                    label="Floors"
                    field="size.floors"
                    value={formData.size?.floors ?? 1}
                    onChange={(value) => handleInputChange("size.floors", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    type="number"
                    min={1}
                  />
                  <ValidatedInput
                    label="Parking Spaces"
                    field="size.parkingSpaces"
                    value={formData.size?.parkingSpaces ?? 0}
                    onChange={(value) => handleInputChange("size.parkingSpaces", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    type="number"
                    min={0}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pricing & Financials</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select
                      value={formData.price?.currency ?? "AED"}
                      onValueChange={(value) => handleInputChange("price.currency", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AED">AED</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <ValidatedInput
                    label="Price per sqft"
                    field="price.perSqft"
                    value={formData.price?.perSqft ?? 0}
                    onChange={(value) => handleInputChange("price.perSqft", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    type="number"
                    min={0}
                    step={0.01}
                  />
                  <div>
                    <Label>Total Price</Label>
                    <Input value={formData.price?.total ?? ""} disabled className="bg-gray-50" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <ValidatedInput
                    label="Annual Revenue"
                    field="financials.annualRevenue"
                    value={formData.financials?.annualRevenue ?? 0}
                    onChange={(value) => handleInputChange("financials.annualRevenue", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    type="number"
                    min={0}
                  />
                  <ValidatedInput
                    label="NOI (Net Operating Income)"
                    field="financials.noi"
                    value={formData.financials?.noi ?? 0}
                    onChange={(value) => handleInputChange("financials.noi", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    type="number"
                    min={0}
                  />
                  <ValidatedInput
                    label="Cap Rate (%)"
                    field="financials.capRate"
                    value={formData.financials?.capRate ?? 0}
                    onChange={(value) => handleInputChange("financials.capRate", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "rental":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Rental & Store Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <ValidatedInput
                    label="Total Stores"
                    field="rentalDetails.totalStores"
                    value={formData.rentalDetails.totalStores ?? 0}
                    onChange={(value) => handleInputChange("rentalDetails.totalStores", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    type="number"
                    min={0}
                  />
                  <ValidatedInput
                    label="Max Stores Capacity"
                    field="rentalDetails.maxStores"
                    value={formData.rentalDetails.maxStores ?? 1}
                    onChange={(value) => handleInputChange("rentalDetails.maxStores", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    type="number"
                    min={1}
                  />
                  <ValidatedInput
                    label="Vacant Stores"
                    field="rentalDetails.vacantStores"
                    value={formData.rentalDetails.vacantStores ?? 0}
                    onChange={(value) => handleInputChange("rentalDetails.vacantStores", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    type="number"
                    min={0}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <ValidatedInput
                    label="Current Occupancy (%)"
                    field="rentalDetails.currentOccupancy"
                    value={formData.rentalDetails.currentOccupancy ?? 0}
                    onChange={(value) => handleInputChange("rentalDetails.currentOccupancy", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                  />
                  <ValidatedInput
                    label="Average Rent (per sqft)"
                    field="rentalDetails.averageRent"
                    value={formData.rentalDetails.averageRent ?? 0}
                    onChange={(value) => handleInputChange("rentalDetails.averageRent", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    type="number"
                    min={0}
                    step={0.01}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operational Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ValidatedInput
                  label="Management Company"
                  field="operationalDetails.managementCompany"
                  value={formData.operationalDetails?.managementCompany ?? ""}
                  onChange={(value) => handleInputChange("operationalDetails.managementCompany", value)}
                  formData={formData}
                  errors={errors}
                  setErrors={setErrors}
                  placeholder="Management company name"
                  maxLength={200}
                />

                <div className="grid grid-cols-2 gap-4">
                  <ValidatedInput
                    label="Service Charges (annual)"
                    field="operationalDetails.serviceCharges"
                    value={formData.operationalDetails?.serviceCharges ?? 0}
                    onChange={(value) => handleInputChange("operationalDetails.serviceCharges", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    type="number"
                    min={0}
                  />
                  <ValidatedInput
                    label="Utility Costs (annual)"
                    field="operationalDetails.utilityCosts"
                    value={formData.operationalDetails?.utilityCosts ?? 0}
                    onChange={(value) => handleInputChange("operationalDetails.utilityCosts", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    type="number"
                    min={0}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Maintenance Status</Label>
                  <Select
                    value={formData.operationalDetails?.maintenanceStatus ?? "new"}
                    onValueChange={(value) => handleInputChange("operationalDetails.maintenanceStatus", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                      <SelectItem value="under-renovation">Under Renovation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "sale-legal":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sale Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <ValidatedInput
                    label="Asking Price"
                    field="saleInformation.askingPrice"
                    value={formData.saleInformation?.askingPrice ?? ""}
                    onChange={(value) => handleInputChange("saleInformation.askingPrice", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    placeholder="e.g., AED 100M"
                    maxLength={50}
                  />
                  <ValidatedInput
                    label="Asking Price (Numeric)"
                    field="saleInformation.askingPriceNumeric"
                    value={formData.saleInformation?.askingPriceNumeric ?? 0}
                    onChange={(value) => handleInputChange("saleInformation.askingPriceNumeric", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    type="number"
                    min={0}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sale Status</Label>
                    <Select
                      value={formData.saleInformation?.saleStatus ?? "available"}
                      onValueChange={(value) => handleInputChange("saleInformation.saleStatus", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="under-offer">Under Offer</SelectItem>
                        <SelectItem value="sold">Sold</SelectItem>
                        <SelectItem value="withdrawn">Withdrawn</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Deal Structure</Label>
                    <Select
                      value={formData.saleInformation?.dealStructure ?? "assetSale"}
                      onValueChange={(value) => handleInputChange("saleInformation.dealStructure", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assetSale">Asset Sale</SelectItem>
                        <SelectItem value="shareSale">Share Sale</SelectItem>
                        <SelectItem value="leaseback">Sale & Leaseback</SelectItem>
                        <SelectItem value="jointVenture">Joint Venture</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Legal Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <ValidatedInput
                    label="Title Deed Number"
                    field="legalDetails.titleDeedNumber"
                    value={formData.legalDetails?.titleDeedNumber ?? ""}
                    onChange={(value) => handleInputChange("legalDetails.titleDeedNumber", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    placeholder="Deed number"
                    maxLength={100}
                  />
                  <ValidatedInput
                    label="RERA Number"
                    field="legalDetails.reraNumber"
                    value={formData.legalDetails?.reraNumber ?? ""}
                    onChange={(value) => handleInputChange("legalDetails.reraNumber", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    placeholder="RERA registration number"
                    maxLength={100}
                  />
                </div>

                <ValidatedInput
                  label="Zoning"
                  field="legalDetails.zoning"
                  value={formData.legalDetails?.zoning ?? ""}
                  onChange={(value) => handleInputChange("legalDetails.zoning", value)}
                  formData={formData}
                  errors={errors}
                  setErrors={setErrors}
                  placeholder="Zoning classification"
                  maxLength={100}
                />
              </CardContent>
            </Card>
          </div>
        )

      case "features":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mall Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {Object.entries(formData.amenities || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={value || false}
                        onCheckedChange={(checked) => 
                          handleInputChange(`amenities.${key}`, checked)
                        }
                      />
                      <Label htmlFor={key} className="text-sm capitalize">
                        {key.replace(/([A-Z])/g, ' $1').replace('_', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Developer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <ValidatedInput
                    label="Developer Name"
                    field="developer.name"
                    value={formData.developer?.name ?? ""}
                    onChange={(value) => handleInputChange("developer.name", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    placeholder="Developer company name"
                    maxLength={200}
                  />
                  <ValidatedInput
                    label="Year Established"
                    field="developer.established"
                    value={formData.developer?.established ?? new Date().getFullYear()}
                    onChange={(value) => handleInputChange("developer.established", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    type="number"
                    min={1900}
                    max={new Date().getFullYear()}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <ValidatedInput
                    label="Year Built"
                    field="yearBuilt"
                    value={formData.yearBuilt ?? new Date().getFullYear()}
                    onChange={(value) => handleInputChange("yearBuilt", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    type="number"
                    min={1900}
                    max={new Date().getFullYear() + 10}
                  />
                  <ValidatedInput
                    label="Year Opened"
                    field="yearOpened"
                    value={formData.yearOpened ?? new Date().getFullYear()}
                    onChange={(value) => handleInputChange("yearOpened", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    type="number"
                    min={1900}
                    max={new Date().getFullYear() + 10}
                  />
                  <ValidatedInput
                    label="Annual Visitors"
                    field="visitorsAnnually"
                    value={formData.visitorsAnnually ?? 0}
                    onChange={(value) => handleInputChange("visitorsAnnually", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    type="number"
                    min={0}
                  />
                </div>

                <ValidatedTextarea
                  label="Architecture Description"
                  field="architecture"
                  value={formData.architecture ?? ""}
                  onChange={(value) => handleInputChange("architecture", value)}
                  formData={formData}
                  errors={errors}
                  setErrors={setErrors}
                  placeholder="Describe the architectural style and features"
                  maxLength={1000}
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>
        )

      case "location":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Location Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ValidatedTextarea
                  label="Location Description"
                  field="locationDetails.description"
                  value={formData.locationDetails?.description ?? ""}
                  onChange={(value) => handleInputChange("locationDetails.description", value)}
                  formData={formData}
                  errors={errors}
                  setErrors={setErrors}
                  placeholder="Detailed location description"
                  maxLength={2000}
                  rows={4}
                />

                <div className="grid grid-cols-2 gap-4">
                  <ValidatedInput
                    label="Latitude"
                    field="locationDetails.coordinates.latitude"
                    value={formData.locationDetails?.coordinates?.latitude ?? 0}
                    onChange={(value) => handleInputChange("locationDetails.coordinates.latitude", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    type="number"
                    step={0.000001}
                    placeholder="25.2048"
                  />
                  <ValidatedInput
                    label="Longitude"
                    field="locationDetails.coordinates.longitude"
                    value={formData.locationDetails?.coordinates?.longitude ?? 0}
                    onChange={(value) => handleInputChange("locationDetails.coordinates.longitude", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    type="number"
                    step={0.000001}
                    placeholder="55.2708"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Connectivity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <ValidatedInput
                    label="Metro Station"
                    field="locationDetails.connectivity.metroStation"
                    value={formData.locationDetails?.connectivity?.metroStation ?? ""}
                    onChange={(value) => handleInputChange("locationDetails.connectivity.metroStation", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    placeholder="Nearest metro station"
                    maxLength={200}
                  />
                  <ValidatedInput
                    label="Metro Distance (km)"
                    field="locationDetails.connectivity.metroDistance"
                    value={formData.locationDetails?.connectivity?.metroDistance ?? 0}
                    onChange={(value) => handleInputChange("locationDetails.connectivity.metroDistance", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    type="number"
                    min={0}
                    step={0.1}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Demographics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <ValidatedInput
                    label="Catchment Population"
                    field="locationDetails.demographics.catchmentPopulation"
                    value={formData.locationDetails?.demographics?.catchmentPopulation ?? 0}
                    onChange={(value) => handleInputChange("locationDetails.demographics.catchmentPopulation", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    type="number"
                    min={0}
                  />
                  <ValidatedInput
                    label="Average Income"
                    field="locationDetails.demographics.averageIncome"
                    value={formData.locationDetails?.demographics?.averageIncome ?? ""}
                    onChange={(value) => handleInputChange("locationDetails.demographics.averageIncome", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    placeholder="e.g., AED 120K"
                    maxLength={50}
                  />
                  <ValidatedInput
                    label="Tourist Footfall (annual)"
                    field="locationDetails.demographics.touristFootfall"
                    value={formData.locationDetails?.demographics?.touristFootfall ?? 0}
                    onChange={(value) => handleInputChange("locationDetails.demographics.touristFootfall", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    type="number"
                    min={0}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "marketing":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Images & Media</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label>Main Image</Label>
                    <InstantImageUpload
                      mode="single"
                      projectTitle={formData.name || "Mall"}
                      imageType="cover"
                      existingImages={formData.image ?? ""}
                      editMode={mode === "edit" && !!(formData.image)}
                      onUploadComplete={handleMainImageComplete}
                      onDelete={() => handleImageDelete(formData.image ?? "")}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Floor Plan</Label>
                    <InstantImageUpload
                      mode="single"
                      projectTitle={formData.name || "Mall"}
                      imageType="gallery"
                      existingImages={formData.floorPlan ?? ""}
                      editMode={mode === "edit" && !!(formData.floorPlan)}
                      onUploadComplete={handleFloorPlanComplete}
                      onDelete={() => handleImageDelete(formData.floorPlan ?? "")}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Gallery Images</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {(formData.gallery || []).map((imageUrl, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={imageUrl} 
                            alt={`Gallery ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => handleImageDelete(imageUrl)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <InstantImageUpload
                      mode="multiple"
                      projectTitle={formData.name || "Mall"}
                      imageType="gallery"
                      existingImages={formData.gallery || []}
                      editMode={mode === "edit" && (formData.gallery?.length || 0) > 0}
                      onUploadComplete={handleGalleryImageComplete}
                      onDelete={handleImageDelete}
                      className="mt-2"
                      maxFiles={10}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Marketing Materials</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ValidatedInput
                  label="Brochure URL"
                  field="marketingMaterials.brochure"
                  value={formData.marketingMaterials?.brochure ?? ""}
                  onChange={(value) => handleInputChange("marketingMaterials.brochure", value)}
                  formData={formData}
                  errors={errors}
                  setErrors={setErrors}
                  placeholder="https://..."
                  maxLength={500}
                />

                <div className="grid grid-cols-2 gap-4">
                  <ValidatedInput
                    label="Video Tour URL"
                    field="marketingMaterials.videoTour"
                    value={formData.marketingMaterials?.videoTour ?? ""}
                    onChange={(value) => handleInputChange("marketingMaterials.videoTour", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    placeholder="https://..."
                    maxLength={500}
                  />
                  <ValidatedInput
                    label="3D Virtual Tour URL"
                    field="marketingMaterials.virtualTour3D"
                    value={formData.marketingMaterials?.virtualTour3D ?? ""}
                    onChange={(value) => handleInputChange("marketingMaterials.virtualTour3D", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    placeholder="https://..."
                    maxLength={500}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Investor Relations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ndaRequired"
                    checked={formData.investorRelations?.ndaRequired ?? false}
                    onCheckedChange={(checked) => 
                      handleInputChange("investorRelations.ndaRequired", checked)
                    }
                  />
                  <Label htmlFor="ndaRequired">NDA Required for Data Room Access</Label>
                </div>

                <ValidatedInput
                  label="Data Room Access URL"
                  field="investorRelations.dataRoomAccessUrl"
                  value={formData.investorRelations?.dataRoomAccessUrl ?? ""}
                  onChange={(value) => handleInputChange("investorRelations.dataRoomAccessUrl", value)}
                  formData={formData}
                  errors={errors}
                  setErrors={setErrors}
                  placeholder="https://..."
                  maxLength={500}
                />
              </CardContent>
            </Card>
          </div>
        )

      case "settings":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mall Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <ValidatedInput
                    label="Mall Rating (1-5)"
                    field="rating"
                    value={formData.rating ?? 5}
                    onChange={(value) => handleInputChange("rating", value)}
                    formData={formData}
                    errors={errors}
                    setErrors={setErrors}
                    type="number"
                    min={1}
                    max={5}
                    step={0.1}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="verified"
                      checked={formData.verified ?? true}
                      onCheckedChange={(checked) => handleInputChange("verified", checked)}
                    />
                    <Label htmlFor="verified">Verified Mall</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isActive"
                      checked={formData.isActive ?? true}
                      onCheckedChange={(checked) => handleInputChange("isActive", checked)}
                    />
                    <Label htmlFor="isActive">Active on Platform</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isAvailable"
                      checked={formData.isAvailable ?? true}
                      onCheckedChange={(checked) => handleInputChange("isAvailable", checked)}
                    />
                    <Label htmlFor="isAvailable">Available for Sale/Investment</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isOperational"
                      checked={formData.isOperational ?? false}
                      onCheckedChange={(checked) => handleInputChange("isOperational", checked)}
                    />
                    <Label htmlFor="isOperational">Currently Operational</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Form Preview & Validation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Mall Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Name:</span> {formData.name || "Not set"}
                      </div>
                      <div>
                        <span className="font-medium">Location:</span> {formData.location || "Not set"}
                      </div>
                      <div>
                        <span className="font-medium">Status:</span> {formData.status || "Not set"}
                      </div>
                      <div>
                        <span className="font-medium">Total Area:</span> {formData.size?.totalArea || 0} sqft
                      </div>
                      <div>
                        <span className="font-medium">Price:</span> {formData.price?.total || "Not calculated"}
                      </div>
                      <div>
                        <span className="font-medium">Stores:</span> {formData.rentalDetails?.totalStores || 0}
                      </div>
                    </div>
                  </div>

                  {Object.keys(errors).length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-medium text-red-800 mb-2">Validation Errors</h4>
                      <ul className="text-sm text-red-600 space-y-1">
                        {Object.entries(errors).map(([field, error]) => (
                          <li key={field}>• {field}: {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return <div>Step content for {currentStepId}</div>
    }
  }

  return (
    <>
      {/* Draft Restoration Dialog */}
      <Dialog open={showDraftRestoreDialog} onOpenChange={setShowDraftRestoreDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Restore Saved Draft?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              You have a saved draft from {draftTimestamp}. Would you like to restore it or start fresh?
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleDiscardDraft}>
                Start Fresh
              </Button>
              <Button onClick={handleRestoreDraft}>
                Restore Draft
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Close Confirmation Dialog */}
      <Dialog open={showUnsavedChangesDialog} onOpenChange={(open) => !open && handleContinueEditing()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className={`h-5 w-5 ${hasUnsavedChanges ? 'text-amber-500' : 'text-blue-500'}`} />
              {hasUnsavedChanges ? 'Unsaved Changes' : 'Confirm Close'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {hasUnsavedChanges 
                ? 'You have unsaved changes in the mall form. What would you like to do?'
                : 'Are you sure you want to close the mall form?'
              }
            </p>
            <div className="grid gap-2">
              <Button 
                variant="outline" 
                onClick={handleContinueEditing}
                className="justify-start"
              >
                {hasUnsavedChanges ? 'Continue Editing' : 'Cancel'}
              </Button>
              {hasUnsavedChanges && mode === 'add' && (
                <Button 
                  variant="outline" 
                  onClick={handleSaveDraftAndClose}
                  className="justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  Save Draft & Close
                </Button>
              )}
              <Button 
                variant={hasUnsavedChanges ? "destructive" : "default"}
                onClick={handleDiscardAndClose}
                className="justify-start"
              >
                {hasUnsavedChanges ? 'Discard Changes & Close' : 'Yes, Close Form'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Form Modal */}
      <Dialog open={isOpen} onOpenChange={isSubmitting ? undefined : handleModalClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            {mode === "add" ? "Add New Mall" : "Edit Mall"}
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                Unsaved Changes
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Step Navigation */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium">
              Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
            </div>
            <div className="text-xs text-gray-500">
              Form Progress: {Math.round((steps.filter(step => getStepStatus(step.id) === 'valid').length / steps.length) * 100)}% Complete
            </div>
          </div>
          <div className="flex items-center space-x-2 overflow-x-auto">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === index
              const isVisited = currentStep > index
              const stepStatus = getStepStatus(step.id)
              const isValid = stepStatus === 'valid'
              const isInvalid = stepStatus === 'invalid' && isVisited

              return (
                <div
                  key={step.id}
                  className={`flex items-center space-x-2 cursor-pointer px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                    isActive 
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' 
                      : isValid && isVisited
                        ? 'bg-green-100 text-green-700 border-2 border-green-300' 
                        : isInvalid
                        ? 'bg-red-100 text-red-700 border-2 border-red-300'
                        : 'hover:bg-gray-100 border-2 border-transparent'
                  }`}
                  onClick={() => goToStep(index)}
                >
                  <Icon className={`h-4 w-4 ${
                    isActive 
                      ? 'text-blue-500' 
                      : isValid && isVisited
                      ? 'text-green-500' 
                      : isInvalid
                      ? 'text-red-500'
                      : 'text-gray-400'
                  }`} />
                  <span className="text-sm font-medium">{step.title}</span>
                  {isValid && isVisited && !isActive && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  {isInvalid && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {renderStepContent()}
        </div>

        {/* Navigation Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            {currentStep < steps.length - 1 ? (
              <Button onClick={nextStep}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !isFormValid()}
              >
                {isSubmitting ? "Saving..." : mode === "edit" ? "Update Mall" : "Create Mall"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
