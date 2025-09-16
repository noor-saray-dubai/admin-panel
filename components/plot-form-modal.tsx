// components/plot-form-modal.tsx
"use client"

import type React from "react"
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
import { Upload, X, Eye, MapPin, DollarSign, Ruler, Building, Plus, Minus, AlertCircle, Factory, Users, Hotel, Home, Layers } from "lucide-react"
import { InstantImageUpload, UploadedImage } from "@/components/ui/instant-image-upload"
import type { IPlot, IPrice, ISize, IPermissions, IInvestment, ILocationDetails, PlotFormData, PlotFormModalProps } from "@/types/plot"
import { validatePlotFormData, validateField } from "@/lib/client-validation"
import {
    saveFormDraft,
    loadFormDraft,
    clearFormDraft,
    hasSavedDraft,
    getDraftTimestamp,
    createDebouncedSave
} from "@/lib/form-persistence"




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


const typeOptions = [
    { value: "industrial", label: "Industrial", icon: Factory },
    { value: "community", label: "Community", icon: Users },
    { value: "building", label: "Building", icon: Building }
]

const subtypeOptions = {
    building: [
        { value: "hotel", label: "Hotel", icon: Hotel },
        { value: "residential", label: "Residential", icon: Home },
        { value: "mixuse", label: "Mixed-Use", icon: Layers }
    ]
}

const ownershipOptions = [
    { value: "freehold", label: "Freehold" },
    { value: "leasehold", label: "Leasehold" }
]

const statusOptions = [
    "Ready for Development",
    "Infrastructure Complete",
    "Master Plan Approved",
    "Design Development Phase",
    "Permits Approved",
    "Foundation Ready",
    "Under Development",
    "Sold",
    "Reserved"
]

const currencyOptions = ["AED", "USD", "EUR"]

const predefinedFeatures = [
    "Direct airport connectivity",
    "24/7 customs clearance",
    "Tax-free environment",
    "Multi-modal transport hub",
    "Deep sea port access",
    "High-voltage power supply",
    "Industrial waste management",
    "Rail connectivity planned",
    "Golf course frontage",
    "Metro line connectivity",
    "Central park frontage",
    "Integrated retail district",
    "Waterfront frontage",
    "Marina development rights",
    "Cultural district integration",
    "Canal waterfront views",
    "DIFC proximity",
    "Hotel management pre-approved",
    "Private beach frontage",
    "Helicopter landing pad approved",
    "Marina berths included",
    "Resort licensing pre-cleared",
    "Unobstructed marina views",
    "Private beach access rights",
    "Underground parking",
    "Sky bridge connectivity",
    "Equestrian club access",
    "Private parks & lakes",
    "Championship polo field",
    "Burj Khalifa corridor",
    "Integrated metro station",
    "Grade A office specification",
    "Retail podium included"
]

const accessibilityOptions = [
    "Metro Access",
    "Bus Route",
    "Highway Access",
    "Airport Proximity",
    "Shopping Centers",
    "Schools Nearby",
    "Hospitals Nearby",
    "Business Districts",
    "Tourist Attractions",
    "Beach Access"
]

const initialFormData: PlotFormData = {
    title: "",
    subtitle: "",
    type: "",
    subtype: "",
    location: "",
    subLocation: "",
    ownership: "",
    price: {
        perSqft: 0,
        total: "",
        totalNumeric: 0,
        currency: "AED"
    },
    size: {
        sqft: 0,
        sqm: 0,
        acres: 0
    },
    permissions: {
        floors: "",
        usage: "",
        far: 0,
        coverage: 0
    },
    investment: {
        roi: 0,
        appreciation: 0,
        payback: 0
    },
    features: [],
    developer: "",
    status: "",
    image: "", // Changed from File to string URL
    gallery: [], // Changed from File[] to string[] URLs
    locationDetails: {
        description: "",
        coordinates: {
            latitude: 0,
            longitude: 0
        },
        accessibility: []
    },
    verified: true,
    isActive: true,
    isAvailable: true
}


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
    formData: PlotFormData
    errors: FieldErrors
    setErrors: React.Dispatch<React.SetStateAction<FieldErrors>>
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

    const handlePaste = (e: React.ClipboardEvent) => {
        const pastedText = e.clipboardData.getData('text')
        if (maxLength && pastedText.length > maxLength) {
            e.preventDefault()
            const trimmedText = pastedText.slice(0, maxLength)
            onChange(trimmedText)
            setErrors(prev => ({ ...prev, [field]: validateField(field, trimmedText, formData) }))
        }
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
                onPaste={handlePaste}
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
    formData: PlotFormData
    errors: FieldErrors
    setErrors: React.Dispatch<React.SetStateAction<FieldErrors>>
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


// Error Display Component
const ErrorDisplay = ({ submissionState, onRetry }: {
    submissionState: SubmissionState;
    onRetry: () => void;
}) => {
    if (!submissionState.apiError) return null;

    const { apiError, networkError } = submissionState;

    return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-red-800 mb-1">
                        {networkError ? 'Connection Error' : 'Submission Failed'}
                    </h4>
                    <p className="text-sm text-red-700 mb-3">
                        {apiError.message}
                    </p>

                    {apiError.errors && Object.keys(apiError.errors).length > 0 && (
                        <div className="mb-3">
                            <p className="text-xs font-medium text-red-800 mb-2">Details:</p>
                            <ul className="text-xs text-red-700 space-y-1">
                                {Object.entries(apiError.errors).map(([field, messages]) => (
                                    <li key={field} className="flex items-start gap-1">
                                        <span className="font-medium capitalize">{field}:</span>
                                        <span>{Array.isArray(messages) ? messages.join(', ') : messages}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onRetry}
                            className="text-red-700 border-red-300 hover:bg-red-100"
                        >
                            Try Again
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export function PlotFormModal({ isOpen, onClose, onSuccess, plot, mode }: PlotFormModalProps) {
    const [formData, setFormData] = useState<PlotFormData>(initialFormData)
    const [errors, setErrors] = useState<FieldErrors>({})
    const [submissionState, setSubmissionState] = useState<SubmissionState>({
        isSubmitting: false,
        apiError: null,
        networkError: false
    })

    // Draft persistence state (only for add mode)
    const [hasDraft, setHasDraft] = useState(false)
    const [showDraftRestoreDialog, setShowDraftRestoreDialog] = useState(false)
    const [draftTimestamp, setDraftTimestamp] = useState<string | null>(null)

    // Create debounced save function
    const debouncedSave = useCallback(
        createDebouncedSave(1500), // Save 1.5 seconds after user stops typing
        []
    )

    // Auto-calculate square meters and acres when square feet changes
    const updateSizeCalculations = useCallback((sqft: number) => {
        const sqm = Math.round(sqft * 0.092903 * 100) / 100 // Convert to sqm
        const acres = Math.round(sqft / 43560 * 100) / 100 // Convert to acres

        setFormData(prev => ({
            ...prev,
            size: {
                ...prev.size,
                sqft,
                sqm,
                acres
            }
        }))
    }, [])

    // Auto-calculate total price when per sqft or sqft changes
    const updatePriceCalculations = useCallback((perSqft: number, sqft: number) => {
        const totalNumeric = Math.round(perSqft * sqft)
        const total = formatPrice(totalNumeric, formData.price.currency)

        setFormData(prev => ({
            ...prev,
            price: {
                ...prev.price,
                perSqft,
                totalNumeric,
                total
            }
        }))
    }, [formData.price.currency])

    // Format price for display
    const formatPrice = (amount: number, currency: string) => {
        if (amount >= 1000000) {
            return `${currency} ${(amount / 1000000).toFixed(1)}M`
        } else if (amount >= 1000) {
            return `${currency} ${(amount / 1000).toFixed(1)}K`
        } else {
            return `${currency} ${amount.toLocaleString()}`
        }
    }

    // Initialize form data and handle draft restoration
    useEffect(() => {
        if (isOpen) {
            if (mode === "edit" && plot) {
                // Edit mode - load existing plot data
                setFormData({
                    title: plot.title || "",
                    subtitle: plot.subtitle || "",
                    type: plot.type || "",
                    subtype: plot.subtype || "",
                    location: plot.location || "",
                    subLocation: plot.subLocation || "",
                    ownership: plot.ownership || "",
                    price: plot.price || initialFormData.price,
                    size: plot.size || initialFormData.size,
                    permissions: plot.permissions || initialFormData.permissions,
                    investment: plot.investment || initialFormData.investment,
                    features: plot.features || [],
                    developer: plot.developer || "",
                    status: plot.status || "",
                    image: plot.image || "", // Store existing image URL
                    gallery: plot.gallery || [], // Store existing gallery URLs
                    locationDetails: plot.locationDetails || initialFormData.locationDetails,
                    verified: plot.verified ?? true,
                    isActive: plot.isActive ?? true,
                    isAvailable: plot.isAvailable ?? true
                })
                setHasDraft(false)
            } else {
                // Add mode - check for saved draft
                const savedDraft = hasSavedDraft()
                setHasDraft(savedDraft)

                if (savedDraft) {
                    const timestamp = getDraftTimestamp()
                    setDraftTimestamp(timestamp)
                    setShowDraftRestoreDialog(true)
                } else {
                    setFormData(initialFormData)
                }
            }

            setErrors({})
            setSubmissionState({
                isSubmitting: false,
                apiError: null,
                networkError: false
            })
        }
    }, [plot, mode, isOpen])

    // Restore draft data
    const restoreDraft = useCallback(() => {
        const draftData = loadFormDraft()
        if (draftData) {
            setFormData({
                ...draftData,
                image: "", // Don't restore images
                gallery: [] // Don't restore gallery
            })
            setShowDraftRestoreDialog(false)
            toast.success('Draft restored successfully!')
        }
    }, [])

    // Discard draft and start fresh
    const discardDraft = useCallback(() => {
        clearFormDraft()
        setFormData(initialFormData)
        setHasDraft(false)
        setShowDraftRestoreDialog(false)
        toast.info('Started with a fresh form')
    }, [])

    // Handle input changes with nested object support and draft saving
    const handleInputChange = (field: string, value: any) => {
        let updatedFormData: PlotFormData

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
        if (field === 'size.sqft' && typeof value === 'number') {
            updateSizeCalculations(value)
        }
        if (field === 'price.perSqft' && typeof value === 'number') {
            updatePriceCalculations(value, formData.size.sqft)
        }

        // Save draft automatically for add mode only
        if (mode === 'add') {
            // Use setTimeout to ensure state has been updated
            setTimeout(() => {
                setFormData(current => {
                    debouncedSave(current)
                    return current
                })
            }, 0)
        }
    }

    // Handle feature toggle
    const handleFeatureToggle = (feature: string) => {
        setFormData(prev => {
            const newData = {
                ...prev,
                features: prev.features.includes(feature)
                    ? prev.features.filter(f => f !== feature)
                    : [...prev.features, feature]
            }

            // Save draft for add mode
            if (mode === 'add') {
                setTimeout(() => debouncedSave(newData), 0)
            }

            return newData
        })
    }

    // Add custom feature
    const [customFeature, setCustomFeature] = useState("")
    const addCustomFeature = () => {
        if (customFeature.trim() && !formData.features.includes(customFeature.trim())) {
            const newFeatures = [...formData.features, customFeature.trim()]
            setFormData(prev => {
                const newData = {
                    ...prev,
                    features: newFeatures
                }

                // Save draft for add mode
                if (mode === 'add') {
                    setTimeout(() => debouncedSave(newData), 0)
                }

                return newData
            })
            setCustomFeature("")

            // Clear features error when adding a feature
            setErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors.features
                return newErrors
            })
        }
    }

    // Handle accessibility toggle
    const handleAccessibilityToggle = (item: string) => {
        setFormData(prev => {
            const newData = {
                ...prev,
                locationDetails: {
                    ...prev.locationDetails,
                    accessibility: prev.locationDetails.accessibility.includes(item)
                        ? prev.locationDetails.accessibility.filter(a => a !== item)
                        : [...prev.locationDetails.accessibility, item]
                }
            }

            // Save draft for add mode
            if (mode === 'add') {
                setTimeout(() => debouncedSave(newData), 0)
            }

            return newData
        })
    }

    // Handle cover image upload completion
    const handleCoverImageComplete = (result: UploadedImage | UploadedImage[]) => {
        const uploadedImage = result as UploadedImage
        setFormData(prev => ({ ...prev, image: uploadedImage.url }))

        // Auto-save draft if in add mode
        if (mode === 'add') {
            setTimeout(() => {
                setFormData(current => {
                    debouncedSave(current)
                    return current
                })
            }, 0)
        }
    }

    // Handle gallery images upload completion
    const handleGalleryImageComplete = (result: UploadedImage | UploadedImage[]) => {
        const uploadedImages = result as UploadedImage[]
        const newUrls = uploadedImages.map(img => img.url)
        setFormData(prev => ({ ...prev, gallery: [...prev.gallery, ...newUrls] }))

        // Auto-save draft if in add mode
        if (mode === 'add') {
            setTimeout(() => {
                setFormData(current => {
                    debouncedSave(current)
                    return current
                })
            }, 0)
        }
    }

    // Handle image replacement in edit mode
    const handleCoverImageReplace = (oldUrl: string, newResult: UploadedImage | UploadedImage[]) => {
        const newImage = newResult as UploadedImage
        setFormData(prev => ({ ...prev, image: newImage.url }))
    }

    // Handle image deletion
    const handleImageDelete = (imageUrl: string) => {
        setFormData(prev => {
            if (prev.image === imageUrl) {
                return { ...prev, image: "" }
            }
            return {
                ...prev,
                gallery: prev.gallery.filter(url => url !== imageUrl)
            }
        })

        // Auto-save draft if in add mode
        if (mode === 'add') {
            setTimeout(() => {
                setFormData(current => {
                    debouncedSave(current)
                    return current
                })
            }, 0)
        }
    }

    // Fill fake data for testing
    const fillFakeData = () => {
        setFormData({
            title: "Luxury Waterfront Development Site",
            subtitle: "Premium Mixed-Use Development Opportunity",
            type: "building",
            subtype: "mixuse",
            location: "Dubai Marina",
            subLocation: "Marina Walk Extension",
            ownership: "freehold",
            price: {
                perSqft: 980,
                total: "AED 73.5M",
                totalNumeric: 73500000,
                currency: "AED"
            },
            size: {
                sqft: 75000,
                sqm: 6968,
                acres: 1.72
            },
            permissions: {
                floors: "G+P+M+32",
                usage: "Mixed-Use Development",
                far: 12.5,
                coverage: 25
            },
            investment: {
                roi: 10.5,
                appreciation: 11.2,
                payback: 9.2
            },
            features: [
                "Unobstructed marina views",
                "Private beach access rights",
                "Underground parking",
                "Sky bridge connectivity",
                "Metro line connectivity",
                "Grade A office specification"
            ],
            developer: "select-group",
            status: "Ready for Development",
            image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop&crop=entropy&cs=tinysrgb",
            gallery: [
                "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop&crop=entropy&cs=tinysrgb",
                "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&crop=entropy&cs=tinysrgb",
                "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&h=600&fit=crop&crop=entropy&cs=tinysrgb"
            ],
            locationDetails: {
                description: "Prime waterfront location in the heart of Dubai Marina with direct access to beach and marina facilities.",
                coordinates: {
                    latitude: 25.0657,
                    longitude: 55.1413
                },
                accessibility: ["Metro Access", "Beach Access", "Highway Access", "Shopping Centers", "Business Districts"]
            },
            verified: true,
            isActive: true,
            isAvailable: true
        })
    }

    // Memoized validation status for performance
    const validationStatus = useMemo(() => {
        const validation = validatePlotFormData(formData, mode === 'edit');
        return {
            isValid: validation.isValid,
            hasErrors: Object.keys(validation.errors).length > 0,
            errorCount: Object.keys(validation.errors).length
        };
    }, [formData, mode])

    // Check if form is valid for submission
    const isFormValid = useCallback(() => {
        return validationStatus.isValid && !validationStatus.hasErrors;
    }, [validationStatus])

    // Validate entire form
    const validateForm = (): boolean => {
        const validation = validatePlotFormData(formData, mode === 'edit');
        setErrors(validation.errors);
        return validation.isValid;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            toast.error("Please fix all validation errors before submitting")
            return
        }

        setSubmissionState({
            isSubmitting: true,
            apiError: null,
            networkError: false
        })

        try {
      // Prepare JSON data instead of FormData
      const submitData: any = {
        title: formData.title,
        subtitle: formData.subtitle,
        type: formData.type,
        location: formData.location,
        subLocation: formData.subLocation,
        ownership: formData.ownership,
        price: formData.price,
        size: formData.size,
        permissions: formData.permissions,
        investment: formData.investment,
        features: formData.features,
        status: formData.status,
        locationDetails: formData.locationDetails,
        verified: formData.verified,
        isActive: formData.isActive,
        isAvailable: formData.isAvailable,
        // Send image URLs directly
        image: formData.image,
        gallery: formData.gallery
      }
      
      // Only include subtype if type is building AND subtype has a valid value
      if (formData.type === 'building' && formData.subtype && formData.subtype.trim() !== '') {
        submitData.subtype = formData.subtype
      }
      
      // Only include developer if it has a value
      if (formData.developer && formData.developer.trim() !== '') {
        submitData.developer = formData.developer
      }

            const endpoint = mode === 'add' ? '/api/plots/add' : `/api/plots/update/${plot?.slug}`
            const method = mode === 'add' ? 'POST' : 'PUT'

            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submitData),
            })

            const result = await response.json()

            if (!response.ok) {
                const apiError: ApiError = {
                    message: result.message || 'An error occurred',
                    error: result.error || 'UNKNOWN_ERROR',
                    errors: result.errors || {}
                }

                if (result.errors && typeof result.errors === 'object') {
                    const newFieldErrors: FieldErrors = {}

                    Object.entries(result.errors).forEach(([field, messages]) => {
                        if (Array.isArray(messages) && messages.length > 0) {
                            newFieldErrors[field] = messages[0]
                        }
                    })

                    setErrors(prev => ({ ...prev, ...newFieldErrors }))
                }

                setSubmissionState({
                    isSubmitting: false,
                    apiError,
                    networkError: false
                })

                toast.error(apiError.message)
                return
            }

            toast.success(`Plot ${mode === 'edit' ? 'updated' : 'created'} successfully!`)

            // Clear draft on successful submission (add mode only)
            if (mode === 'add') {
                clearFormDraft()
                setHasDraft(false)
            }

            onSuccess?.(result.plot)
            handleClose()

        } catch (error) {
            console.error('Error saving plot:', error)

            const isNetworkError = error instanceof TypeError && error.message.includes('fetch')
            const errorMessage = isNetworkError
                ? 'Network error. Please check your connection and try again.'
                : error instanceof Error ? error.message : 'An unexpected error occurred'

            setSubmissionState({
                isSubmitting: false,
                apiError: {
                    message: errorMessage,
                    error: isNetworkError ? 'NETWORK_ERROR' : 'UNEXPECTED_ERROR'
                },
                networkError: isNetworkError
            })

            toast.error(errorMessage)
        }
    }

    const handleClose = () => {
        setFormData(initialFormData)
        setErrors({})
        setSubmissionState({
            isSubmitting: false,
            apiError: null,
            networkError: false
        })
        setShowDraftRestoreDialog(false)
        onClose()
    }

    return (
        <>
            {/* Draft Restore Dialog */}
            {showDraftRestoreDialog && (
                <Dialog open={showDraftRestoreDialog} onOpenChange={() => setShowDraftRestoreDialog(false)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-blue-500" />
                                Draft Found
                            </DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <p className="text-sm text-gray-600 mb-4">
                                We found a saved draft from {draftTimestamp}. Would you like to restore it or start fresh?
                            </p>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                <div className="flex items-start gap-2">
                                    <div className="text-blue-600 mt-0.5">
                                        <Eye className="h-4 w-4" />
                                    </div>
                                    <div className="text-xs text-blue-700">
                                        <p className="font-medium">Draft includes:</p>
                                        <p>All form fields except images will be restored</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={discardDraft} className="flex-1">
                                Start Fresh
                            </Button>
                            <Button onClick={restoreDraft} className="flex-1">
                                Restore Draft
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* Main Modal */}
            <Dialog open={isOpen && !showDraftRestoreDialog} onOpenChange={handleClose}>
                <DialogContent className="max-w-7xl max-h-[95vh] p-0 flex flex-col">
                    <DialogHeader className="p-6 pb-0 flex-shrink-0">
                        <DialogTitle className="text-2xl font-bold">
                            {mode === "add" ? "Add New Plot" : "Edit Plot"}
                            {mode === "add" && hasDraft && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                    Draft Auto-Saved
                                </Badge>
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0">
                        <div className="space-y-8 py-4">

                            {/* Basic Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Basic Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <ValidatedInput
                                            label="Plot Title"
                                            field="title"
                                            value={formData.title}
                                            onChange={(value) => handleInputChange("title", value)}
                                            formData={formData}
                                            errors={errors}
                                            setErrors={setErrors}
                                            placeholder="Enter plot title"
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
                                            placeholder="Enter plot subtitle"
                                            required
                                            maxLength={150}
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="type">
                                                Type <span className="text-red-500">*</span>
                                            </Label>
                                            <Select
                                                value={formData.type}
                                                onValueChange={(value: "industrial" | "community" | "building") => {
                                                    handleInputChange("type", value)
                                                    if (value !== "building") {
                                                        // Clear subtype completely when type is not building
                                                        setFormData(prev => ({ ...prev, type: value, subtype: "" }))
                                                    } else {
                                                        // Just update type when building is selected
                                                        setFormData(prev => ({ ...prev, type: value }))
                                                    }
                                                    setErrors(prev => ({ ...prev, type: validateField("type", value, formData) }))
                                                }}
                                            >
                                                <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder="Select plot type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {typeOptions.map(option => {
                                                        const IconComponent = option.icon
                                                        return (
                                                            <SelectItem key={option.value} value={option.value}>
                                                                <div className="flex items-center gap-2">
                                                                    <IconComponent className="h-4 w-4" />
                                                                    {option.label}
                                                                </div>
                                                            </SelectItem>
                                                        )
                                                    })}
                                                </SelectContent>
                                            </Select>
                                            {errors.type && (
                                                <div className="flex items-center gap-1 text-red-500 text-xs">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {errors.type}
                                                </div>
                                            )}
                                        </div>

                                        {formData.type === "building" && (
                                            <div className="space-y-2">
                                                <Label htmlFor="subtype">
                                                    Subtype <span className="text-red-500">*</span>
                                                </Label>
                                                <Select
                                                    value={formData.subtype}
                                                    onValueChange={(value: "hotel" | "residential" | "mixuse") => {
                                                        handleInputChange("subtype", value)
                                                        setErrors(prev => ({ ...prev, subtype: validateField("subtype", value, formData) }))
                                                    }}
                                                >
                                                    <SelectTrigger className={errors.subtype ? 'border-red-500' : ''}>
                                                        <SelectValue placeholder="Select subtype" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {subtypeOptions.building.map(option => {
                                                            const IconComponent = option.icon
                                                            return (
                                                                <SelectItem key={option.value} value={option.value}>
                                                                    <div className="flex items-center gap-2">
                                                                        <IconComponent className="h-4 w-4" />
                                                                        {option.label}
                                                                    </div>
                                                                </SelectItem>
                                                            )
                                                        })}
                                                    </SelectContent>
                                                </Select>
                                                {errors.subtype && (
                                                    <div className="flex items-center gap-1 text-red-500 text-xs">
                                                        <AlertCircle className="h-3 w-3" />
                                                        {errors.subtype}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <Label htmlFor="ownership">
                                                Ownership <span className="text-red-500">*</span>
                                            </Label>
                                            <Select
                                                value={formData.ownership}
                                                onValueChange={(value: "freehold" | "leasehold") => {
                                                    handleInputChange("ownership", value)
                                                    setErrors(prev => ({ ...prev, ownership: validateField("ownership", value, formData) }))
                                                }}
                                            >
                                                <SelectTrigger className={errors.ownership ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder="Select ownership type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {ownershipOptions.map(option => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.ownership && (
                                                <div className="flex items-center gap-1 text-red-500 text-xs">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {errors.ownership}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Location Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Location Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
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
                                            placeholder="e.g., Marina Walk Extension"
                                            required
                                            maxLength={100}
                                        />
                                    </div>

                                    <ValidatedTextarea
                                        label="Location Description"
                                        field="locationDetails.description"
                                        value={formData.locationDetails.description}
                                        onChange={(value) => handleInputChange("locationDetails.description", value)}
                                        formData={formData}
                                        errors={errors}
                                        setErrors={setErrors}
                                        placeholder="Detailed location description (optional)"
                                        maxLength={500}
                                        rows={3}
                                    />

                                    {/* Coordinates */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <ValidatedInput
                                            label="Latitude"
                                            field="locationDetails.coordinates.latitude"
                                            type="number"
                                            value={formData.locationDetails.coordinates.latitude}
                                            onChange={(value) => handleInputChange("locationDetails.coordinates.latitude", value)}
                                            formData={formData}
                                            errors={errors}
                                            setErrors={setErrors}
                                            placeholder="25.0657"
                                            step={0.000001}
                                            min={-90}
                                            max={90}
                                        />
                                        <ValidatedInput
                                            label="Longitude"
                                            field="locationDetails.coordinates.longitude"
                                            type="number"
                                            value={formData.locationDetails.coordinates.longitude}
                                            onChange={(value) => handleInputChange("locationDetails.coordinates.longitude", value)}
                                            formData={formData}
                                            errors={errors}
                                            setErrors={setErrors}
                                            placeholder="55.1413"
                                            step={0.000001}
                                            min={-180}
                                            max={180}
                                        />
                                    </div>

                                    {/* Accessibility */}
                                    <div className="space-y-3">
                                        <Label>Accessibility Features</Label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {accessibilityOptions.map(item => (
                                                <Button
                                                    key={item}
                                                    type="button"
                                                    variant={formData.locationDetails.accessibility.includes(item) ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => handleAccessibilityToggle(item)}
                                                    className="justify-start"
                                                >
                                                    {item}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Size and Pricing */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Ruler className="h-5 w-5" />
                                        Size & Pricing
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-4 gap-4">
                                        <ValidatedInput
                                            label="Square Feet"
                                            field="size.sqft"
                                            type="number"
                                            value={formData.size.sqft}
                                            onChange={(value) => {
                                                const numValue = typeof value === 'number' ? value : parseFloat(value as string) || 0
                                                handleInputChange("size.sqft", numValue)
                                                updateSizeCalculations(numValue)
                                                updatePriceCalculations(formData.price.perSqft, numValue)
                                            }}
                                            formData={formData}
                                            errors={errors}
                                            setErrors={setErrors}
                                            placeholder="75000"
                                            required
                                            min={1}
                                        />
                                        <ValidatedInput
                                            label="Square Meters"
                                            field="size.sqm"
                                            type="number"
                                            value={formData.size.sqm}
                                            onChange={(value) => handleInputChange("size.sqm", value)}
                                            formData={formData}
                                            errors={errors}
                                            setErrors={setErrors}
                                            placeholder="Auto-calculated"
                                            required
                                            min={1}
                                        />
                                        <ValidatedInput
                                            label="Acres"
                                            field="size.acres"
                                            type="number"
                                            value={formData.size.acres}
                                            onChange={(value) => handleInputChange("size.acres", value)}
                                            formData={formData}
                                            errors={errors}
                                            setErrors={setErrors}
                                            placeholder="Auto-calculated"
                                            required
                                            min={0.01}
                                            step={0.01}
                                        />
                                        <div className="space-y-2">
                                            <Label htmlFor="currency">
                                                Currency <span className="text-red-500">*</span>
                                            </Label>
                                            <Select
                                                value={formData.price.currency}
                                                onValueChange={(value) => handleInputChange("price.currency", value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {currencyOptions.map(currency => (
                                                        <SelectItem key={currency} value={currency}>
                                                            {currency}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <ValidatedInput
                                            label="Price per Sq Ft"
                                            field="price.perSqft"
                                            type="number"
                                            value={formData.price.perSqft}
                                            onChange={(value) => {
                                                const numValue = typeof value === 'number' ? value : parseFloat(value as string) || 0
                                                handleInputChange("price.perSqft", numValue)
                                                updatePriceCalculations(numValue, formData.size.sqft)
                                            }}
                                            formData={formData}
                                            errors={errors}
                                            setErrors={setErrors}
                                            placeholder="980"
                                            required
                                            min={1}
                                        />
                                        <ValidatedInput
                                            label="Total Price (Display)"
                                            field="price.total"
                                            value={formData.price.total}
                                            onChange={(value) => handleInputChange("price.total", value)}
                                            formData={formData}
                                            errors={errors}
                                            setErrors={setErrors}
                                            placeholder="Auto-calculated"
                                            required
                                        />
                                        <ValidatedInput
                                            label="Total Price (Numeric)"
                                            field="price.totalNumeric"
                                            type="number"
                                            value={formData.price.totalNumeric}
                                            onChange={(value) => handleInputChange("price.totalNumeric", value)}
                                            formData={formData}
                                            errors={errors}
                                            setErrors={setErrors}
                                            placeholder="Auto-calculated"
                                            required
                                            min={1}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Development Permissions */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Development Permissions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <ValidatedInput
                                            label="Floor Permissions"
                                            field="permissions.floors"
                                            value={formData.permissions.floors}
                                            onChange={(value) => handleInputChange("permissions.floors", value)}
                                            formData={formData}
                                            errors={errors}
                                            setErrors={setErrors}
                                            placeholder="e.g., G+P+M+32"
                                            required
                                        />
                                        <ValidatedInput
                                            label="Usage Type"
                                            field="permissions.usage"
                                            value={formData.permissions.usage}
                                            onChange={(value) => handleInputChange("permissions.usage", value)}
                                            formData={formData}
                                            errors={errors}
                                            setErrors={setErrors}
                                            placeholder="e.g., Mixed-Use Development"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <ValidatedInput
                                            label="Floor Area Ratio (FAR)"
                                            field="permissions.far"
                                            type="number"
                                            value={formData.permissions.far}
                                            onChange={(value) => handleInputChange("permissions.far", value)}
                                            formData={formData}
                                            errors={errors}
                                            setErrors={setErrors}
                                            placeholder="12.5"
                                            required
                                            min={0}
                                            step={0.1}
                                        />
                                        <ValidatedInput
                                            label="Coverage (%)"
                                            field="permissions.coverage"
                                            type="number"
                                            value={formData.permissions.coverage}
                                            onChange={(value) => handleInputChange("permissions.coverage", value)}
                                            formData={formData}
                                            errors={errors}
                                            setErrors={setErrors}
                                            placeholder="25"
                                            required
                                            min={0}
                                            max={100}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Investment Metrics */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <DollarSign className="h-5 w-5" />
                                        Investment Metrics
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <ValidatedInput
                                            label="ROI (%)"
                                            field="investment.roi"
                                            type="number"
                                            value={formData.investment.roi}
                                            onChange={(value) => handleInputChange("investment.roi", value)}
                                            formData={formData}
                                            errors={errors}
                                            setErrors={setErrors}
                                            placeholder="10.5"
                                            required
                                            min={0}
                                            step={0.1}
                                        />
                                        <ValidatedInput
                                            label="Appreciation (%)"
                                            field="investment.appreciation"
                                            type="number"
                                            value={formData.investment.appreciation}
                                            onChange={(value) => handleInputChange("investment.appreciation", value)}
                                            formData={formData}
                                            errors={errors}
                                            setErrors={setErrors}
                                            placeholder="11.2"
                                            required
                                            min={0}
                                            step={0.1}
                                        />
                                        <ValidatedInput
                                            label="Payback Period (Years)"
                                            field="investment.payback"
                                            type="number"
                                            value={formData.investment.payback}
                                            onChange={(value) => handleInputChange("investment.payback", value)}
                                            formData={formData}
                                            errors={errors}
                                            setErrors={setErrors}
                                            placeholder="9.2"
                                            required
                                            min={0}
                                            step={0.1}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Developer & Status */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Developer & Status</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <ValidatedInput
                                            label="Developer (Optional)"
                                            field="developer"
                                            value={formData.developer}
                                            onChange={(value) => handleInputChange("developer", value)}
                                            formData={formData}
                                            errors={errors}
                                            setErrors={setErrors}
                                            placeholder="Developer slug (e.g., select-group)"
                                        />
                                        <div className="space-y-2">
                                            <Label htmlFor="status">
                                                Status <span className="text-red-500">*</span>
                                            </Label>
                                            <Select
                                                value={formData.status}
                                                onValueChange={(value) => {
                                                    handleInputChange("status", value)
                                                    setErrors(prev => ({ ...prev, status: validateField("status", value, formData) }))
                                                }}
                                            >
                                                <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {statusOptions.map(status => (
                                                        <SelectItem key={status} value={status}>
                                                            {status}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.status && (
                                                <div className="flex items-center gap-1 text-red-500 text-xs">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {errors.status}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status flags */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="verified"
                                                checked={formData.verified}
                                                onCheckedChange={(checked) => handleInputChange("verified", checked as boolean)}
                                            />
                                            <Label htmlFor="verified">Verified Plot</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="isActive"
                                                checked={formData.isActive}
                                                onCheckedChange={(checked) => handleInputChange("isActive", checked as boolean)}
                                            />
                                            <Label htmlFor="isActive">Active Listing</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="isAvailable"
                                                checked={formData.isAvailable}
                                                onCheckedChange={(checked) => handleInputChange("isAvailable", checked as boolean)}
                                            />
                                            <Label htmlFor="isAvailable">Available for Sale</Label>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Features */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Plot Features</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-3 gap-2">
                                        {predefinedFeatures.map(feature => (
                                            <Button
                                                key={feature}
                                                type="button"
                                                variant={formData.features.includes(feature) ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => handleFeatureToggle(feature)}
                                                className="justify-start text-xs"
                                            >
                                                {feature}
                                            </Button>
                                        ))}
                                    </div>

                                    <div className="flex gap-2">
                                        <Input
                                            value={customFeature}
                                            onChange={(e) => setCustomFeature(e.target.value)}
                                            placeholder="Add custom feature"
                                            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCustomFeature())}
                                        />
                                        <Button type="button" onClick={addCustomFeature} size="sm">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {formData.features.length > 0 && (
                                        <div className="space-y-2">
                                            <Label>Selected Features ({formData.features.length})</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {formData.features.map(feature => (
                                                    <Badge key={feature} variant="secondary" className="flex items-center gap-1">
                                                        {feature}
                                                        <X className="h-3 w-3 cursor-pointer" onClick={() => handleFeatureToggle(feature)} />
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {errors.features && (
                                        <div className="flex items-center gap-1 text-red-500 text-xs">
                                            <AlertCircle className="h-3 w-3" />
                                            {errors.features}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Images */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        Plot Images {mode === 'add' ? <span className="text-red-500">*</span> : '(Optional - uploads will replace existing)'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <InstantImageUpload
                                            mode="single"
                                            projectTitle={formData.title || "Plot"}
                                            imageType="cover"
                                            title="Cover Image"
                                            description={mode === 'add' ? "Required main image for the plot" : "Upload to replace existing cover image"}
                                            editMode={mode === 'edit'}
                                            existingImages={mode === 'edit' && formData.image ? formData.image : undefined}
                                            onUploadComplete={handleCoverImageComplete}
                                            onReplace={handleCoverImageReplace}
                                            onDelete={handleImageDelete}
                                            onError={(error) => {
                                                setErrors(prev => ({ ...prev, image: error }))
                                                toast.error(`Cover image error: ${error}`)
                                            }}
                                        />

                                        <InstantImageUpload
                                            mode="multiple"
                                            maxFiles={6}
                                            projectTitle={formData.title || "Plot"}
                                            imageType="gallery"
                                            title="Gallery Images"
                                            description={mode === 'add' ? "Optional additional images" : "Add more images or manage existing ones"}
                                            editMode={mode === 'edit'}
                                            existingImages={mode === 'edit' && formData.gallery.length > 0 ? formData.gallery : undefined}
                                            onUploadComplete={handleGalleryImageComplete}
                                            onDelete={handleImageDelete}
                                            onError={(error) => {
                                                toast.error(`Gallery image error: ${error}`)
                                            }}
                                        />
                                    </div>

                                    {errors.image && (
                                        <div className="flex items-center gap-1 text-red-500 text-xs">
                                            <AlertCircle className="h-3 w-3" />
                                            {errors.image}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Preview Section */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Eye className="h-5 w-5" />
                                        Plot Preview
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Header */}
                                    <div className="border-b pb-4">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-2xl font-bold">{formData.title || "Plot Title"}</h3>
                                                    {formData.verified && (
                                                        <Badge className="bg-green-500">
                                                            <span className="mr-1">✓</span> Verified
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-gray-600 mb-2">{formData.subtitle || "Plot subtitle"}</p>
                                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="h-4 w-4" />
                                                        {formData.location || "Location"}, {formData.subLocation || "Sub Location"}
                                                    </div>
                                                    <Badge variant="outline">{formData.ownership || "Ownership"}</Badge>
                                                    <Badge variant="outline">{formData.type || "Type"}</Badge>
                                                    {formData.subtype && <Badge variant="outline">{formData.subtype}</Badge>}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-green-600">
                                                    {formData.price.total || "Price"}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {formData.price.perSqft > 0 && `${formData.price.currency} ${formData.price.perSqft}/sqft`}
                                                </div>
                                            </div>
                                        </div>

                                        {formData.image && (
                                            <img src={formData.image} alt="Main" className="w-full h-48 object-cover rounded-lg" />
                                        )}
                                    </div>

                                    {/* Key Details */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                                            <Ruler className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                                            <div className="font-semibold">{formData.size.sqft.toLocaleString()} sqft</div>
                                            <div className="text-sm text-gray-500">{formData.size.acres} acres</div>
                                        </div>
                                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                                            <Building className="h-6 w-6 mx-auto mb-2 text-green-600" />
                                            <div className="font-semibold">{formData.permissions.floors || "N/A"}</div>
                                            <div className="text-sm text-gray-500">Floor Permissions</div>
                                        </div>
                                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                                            <DollarSign className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                                            <div className="font-semibold">{formData.investment.roi}%</div>
                                            <div className="text-sm text-gray-500">Expected ROI</div>
                                        </div>
                                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                                            <div className="font-semibold">{formData.status || "Status"}</div>
                                            <div className="text-sm text-gray-500">Current Status</div>
                                        </div>
                                    </div>

                                    {/* Features */}
                                    {formData.features.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold mb-3">Key Features</h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                {formData.features.slice(0, 6).map(feature => (
                                                    <div key={feature} className="flex items-center gap-2">
                                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                        <span className="text-sm">{feature}</span>
                                                    </div>
                                                ))}
                                                {formData.features.length > 6 && (
                                                    <div className="col-span-2 text-sm text-gray-500">
                                                        +{formData.features.length - 6} more features
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Investment Metrics */}
                                    <div>
                                        <h4 className="font-semibold mb-3">Investment Overview</h4>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="text-center p-3 border rounded-lg">
                                                <div className="font-semibold text-green-600">{formData.investment.roi}%</div>
                                                <div className="text-xs text-gray-500">ROI</div>
                                            </div>
                                            <div className="text-center p-3 border rounded-lg">
                                                <div className="font-semibold text-blue-600">{formData.investment.appreciation}%</div>
                                                <div className="text-xs text-gray-500">Appreciation</div>
                                            </div>
                                            <div className="text-center p-3 border rounded-lg">
                                                <div className="font-semibold text-purple-600">{formData.investment.payback}y</div>
                                                <div className="text-xs text-gray-500">Payback</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Developer */}
                                    {formData.developer && (
                                        <div>
                                            <h4 className="font-semibold mb-2">Developer</h4>
                                            <p className="text-gray-700">{formData.developer}</p>
                                        </div>
                                    )}

                                    {/* Location Details */}
                                    {formData.locationDetails.description && (
                                        <div>
                                            <h4 className="font-semibold mb-2">Location Details</h4>
                                            <p className="text-gray-700">{formData.locationDetails.description}</p>
                                        </div>
                                    )}

                                    {/* Accessibility */}
                                    {formData.locationDetails.accessibility.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold mb-3">Accessibility</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {formData.locationDetails.accessibility.map(item => (
                                                    <Badge key={item} variant="outline">
                                                        {item}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="border-t p-6 bg-gray-50 flex-shrink-0">
                        {/* Error Display */}
                        <ErrorDisplay
                            submissionState={submissionState}
                            onRetry={() => {
                                setSubmissionState(prev => ({ ...prev, apiError: null, networkError: false }))
                            }}
                        />

                        <div className="flex gap-2 justify-between">
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={fillFakeData} disabled={submissionState.isSubmitting}>
                                    Fill Test Data
                                </Button>
                                {mode === 'add' && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            saveFormDraft(formData)
                                            setHasDraft(true)
                                            toast.success('Draft saved!')
                                        }}
                                        disabled={submissionState.isSubmitting}
                                        className="text-xs"
                                    >
                                        💾 Save Draft
                                    </Button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={handleClose} disabled={submissionState.isSubmitting}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={submissionState.isSubmitting || !isFormValid()}
                                    className={!isFormValid() ? 'opacity-50 cursor-not-allowed' : ''}
                                >
                                    {submissionState.isSubmitting ?
                                        (mode === "edit" ? "Updating..." : "Creating...") :
                                        (mode === "edit" ? "Update Plot" : "Create Plot")
                                    }
                                </Button>
                            </div>
                        </div>

                        {/* Form validation status */}
                        {!isFormValid() && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
                                <div className="flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Form validation incomplete
                                </div>
                                <div className="text-xs mt-1">
                                    {validationStatus.hasErrors
                                        ? `${validationStatus.errorCount} validation error(s) need to be fixed`
                                        : 'Please complete all required fields to enable submission'
                                    }
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
