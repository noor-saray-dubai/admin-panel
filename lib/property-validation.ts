// lib/property-validation.ts

import type { PropertyFormData } from "@/types/properties"

export interface PropertyValidationResult {
  isValid: boolean
  fieldErrors: Record<string, string>
  globalErrors: string[]
}

export interface PropertyStepValidationResult {
  isValid: boolean
  errors: Record<string, string>
  missingFields: string[]
}

// Helper functions for validation
const isValidEmail = (email: string): boolean => {
  if (!email) return true // Optional field
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const isValidPhoneNumber = (phone: string): boolean => {
  if (!phone) return false
  // Allow international phone numbers with optional + and spaces/dashes
  return /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/i.test(phone)
}

const isValidUrl = (url: string): boolean => {
  if (!url) return false
  return /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(url)
}

const isValidSlug = (slug: string): boolean => {
  if (!slug) return false
  return /^[a-z0-9-]+$/.test(slug)
}

const isValidCoordinates = (lat: number, lng: number): boolean => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

const isValidPrice = (priceStr: string, priceNumeric: number): boolean => {
  return priceStr.trim().length > 0 && priceNumeric > 0
}

const isValidArea = (area: string): boolean => {
  if (!area) return false
  // Should contain numbers and "sq ft" specifically (we enforce sq ft only)
  return /^\d+(\.\d+)?\s*sq\s*ft$/i.test(area.trim())
}

// Property type validation
const VALID_PROPERTY_TYPES = ['Apartment', 'Villa', 'Penthouse', 'Condo', 'Townhouse', 'Studio', 'Duplex', 'Loft']
const VALID_FURNISHING_STATUS = ['Unfurnished', 'Semi-Furnished', 'Fully Furnished']
const VALID_FACING_DIRECTIONS = ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West']
const VALID_OWNERSHIP_TYPES = ['Primary', 'Secondary']
const VALID_AVAILABILITY_STATUS = ['Available', 'Reserved', 'Sold']

// Individual field validators
export const validatePropertyField = (fieldName: string, value: any, formData: PropertyFormData): string | null => {
  switch (fieldName) {
    case 'name':
      if (!value || value.trim().length === 0) return 'Property name is required'
      if (value.trim().length > 200) return 'Property name must be less than 200 characters'
      return null

    case 'propertyType':
      if (!value) return 'Property type is required'
      if (!VALID_PROPERTY_TYPES.includes(value)) return `Property type must be one of: ${VALID_PROPERTY_TYPES.join(', ')}`
      return null

    case 'bedrooms':
      if (value === undefined || value === null) return 'Number of bedrooms is required'
      if (!Number.isInteger(value) || value < 0 || value > 20) return 'Bedrooms must be between 0 and 20'
      return null

    case 'bathrooms':
      if (value === undefined || value === null) return 'Number of bathrooms is required'
      if (!Number.isInteger(value) || value < 0 || value > 20) return 'Bathrooms must be between 0 and 20'
      return null

    case 'builtUpArea':
      if (value === undefined || value === null) return 'Built-up area is required'
      if (typeof value !== 'number' || value <= 0) return 'Built-up area must be a positive number'
      if (value > 100000) return 'Built-up area cannot exceed 100,000'
      return null

    case 'carpetArea':
      if (value !== undefined && value !== null) {
        if (typeof value !== 'number' || value <= 0) return 'Carpet area must be a positive number'
        if (value > 100000) return 'Carpet area cannot exceed 100,000'
      }
      return null

    case 'suiteArea':
      if (value !== undefined && value !== null) {
        if (typeof value !== 'number' || value <= 0) return 'Suite area must be a positive number'
        if (value > 100000) return 'Suite area cannot exceed 100,000'
      }
      return null

    case 'balconyArea':
      if (value !== undefined && value !== null) {
        if (typeof value !== 'number' || value <= 0) return 'Balcony area must be a positive number'
        if (value > 100000) return 'Balcony area cannot exceed 100,000'
      }
      return null

    case 'terracePoolArea':
      if (value !== undefined && value !== null) {
        if (typeof value !== 'number' || value <= 0) return 'Terrace & pool area must be a positive number'
        if (value > 100000) return 'Terrace & pool area cannot exceed 100,000'
      }
      return null

    case 'totalArea':
      if (value === undefined || value === null) return 'Total area is required'
      if (typeof value !== 'number' || value <= 0) return 'Total area must be a positive number'
      if (value > 100000) return 'Total area cannot exceed 100,000'
      return null

    case 'areaUnit':
      if (!value || value.trim().length === 0) return 'Area unit is required'
      if (!['sq ft', 'sq m'].includes(value)) return 'Area unit must be "sq ft" or "sq m"'
      return null

    case 'furnishingStatus':
      if (!value) return 'Furnishing status is required'
      if (!VALID_FURNISHING_STATUS.includes(value)) return `Furnishing status must be one of: ${VALID_FURNISHING_STATUS.join(', ')}`
      return null

    case 'facingDirection':
      if (!value) return 'Facing direction is required'
      if (!VALID_FACING_DIRECTIONS.includes(value)) return `Facing direction must be one of: ${VALID_FACING_DIRECTIONS.join(', ')}`
      return null

    case 'floorLevel':
      // Floor level is now optional
      if (value !== undefined && value !== null) {
        if (!Number.isInteger(value) || value < -5 || value > 200) return 'Floor level must be between -5 and 200'
      }
      return null

    case 'ownershipType':
      if (!value) return 'Ownership type is required'
      if (!VALID_OWNERSHIP_TYPES.includes(value)) return `Ownership type must be one of: ${VALID_OWNERSHIP_TYPES.join(', ')}`
      return null

    case 'availabilityStatus':
      if (!value) return 'Availability status is required'
      if (!VALID_AVAILABILITY_STATUS.includes(value)) return `Availability status must be one of: ${VALID_AVAILABILITY_STATUS.join(', ')}`
      return null

    case 'address':
      if (!value || value.trim().length === 0) return 'Address is required'
      return null

    case 'area':
      if (!value || value.trim().length === 0) return 'Area is required'
      return null

    case 'city':
      if (!value || value.trim().length === 0) return 'City is required'
      return null

    case 'country':
      if (!value || value.trim().length === 0) return 'Country is required'
      return null

    case 'latitude':
      if (value === undefined || value === null) return 'Latitude is required'
      if (typeof value !== 'number' || value < -90 || value > 90) return 'Latitude must be between -90 and 90'
      return null

    case 'longitude':
      if (value === undefined || value === null) return 'Longitude is required'
      if (typeof value !== 'number' || value < -180 || value > 180) return 'Longitude must be between -180 and 180'
      return null

    case 'price':
      if (!value || value.trim().length === 0) return 'Price is required'
      return null

    case 'priceNumeric':
      if (value === undefined || value === null) return 'Numeric price is required'
      if (typeof value !== 'number' || value <= 0) return 'Price must be greater than 0'
      return null

    case 'pricePerSqFt':
      if (value !== undefined && value !== null && (typeof value !== 'number' || value < 0)) {
        return 'Price per sq ft must be a positive number'
      }
      return null

    case 'description':
      if (!value || value.trim().length === 0) return 'Description is required'
      if (value.trim().length > 2000) return 'Description must be less than 2000 characters'
      return null

    case 'overview':
      if (!value || value.trim().length === 0) return 'Overview is required'
      if (value.trim().length > 5000) return 'Overview must be less than 5000 characters'
      return null

    case 'coverImage':
      if (!value || value.trim().length === 0) return 'Cover image is required'
      if (!isValidUrl(value)) return 'Cover image must be a valid URL ending with an image extension'
      return null

    case 'gallery':
      if (!value || !Array.isArray(value) || value.length === 0) return 'At least one gallery image is required'
      for (let i = 0; i < value.length; i++) {
        if (!isValidUrl(value[i])) return `Gallery image ${i + 1} must be a valid URL ending with an image extension`
      }
      return null

    case 'amenities':
      if (!value || !Array.isArray(value) || value.length === 0) return 'At least one amenity category is required'
      for (let i = 0; i < value.length; i++) {
        const amenity = value[i]
        if (!amenity.category || amenity.category.trim().length === 0) {
          return `Amenity category ${i + 1} name is required`
        }
        if (!amenity.items || !Array.isArray(amenity.items) || amenity.items.length === 0) {
          return `Amenity category ${i + 1} must have at least one item`
        }
        for (let j = 0; j < amenity.items.length; j++) {
          if (!amenity.items[j] || amenity.items[j].trim().length === 0) {
            return `All amenity items in category ${i + 1} must be non-empty`
          }
        }
      }
      return null

    // Agent validation (optional)
    case 'agentPhone':
      if (value && value.trim().length > 0 && !isValidPhoneNumber(value)) {
        return 'Please provide a valid phone number'
      }
      return null

    case 'agentEmail':
      if (value && value.trim().length > 0 && !isValidEmail(value)) {
        return 'Please provide a valid email address'
      }
      return null

    // Payment plan validation (optional, mainly for primary market)
    case 'paymentPlan':
      if (formData.hasPaymentPlan && value) {
        if (!value.booking || value.booking.trim().length === 0) {
          return 'Booking percentage is required for payment plan'
        }
        if (!value.handover || value.handover.trim().length === 0) {
          return 'Handover percentage is required for payment plan'
        }
        if (!value.construction || !Array.isArray(value.construction) || value.construction.length === 0) {
          return 'At least one construction milestone is required for payment plan'
        }
        for (let i = 0; i < value.construction.length; i++) {
          const milestone = value.construction[i]
          if (!milestone.milestone || milestone.milestone.trim().length === 0) {
            return `Construction milestone ${i + 1} name is required`
          }
          if (!milestone.percentage || milestone.percentage.trim().length === 0) {
            return `Construction milestone ${i + 1} percentage is required`
          }
        }
      }
      return null

    default:
      return null
  }
}

// Step-by-step validation for multi-step forms
export const validatePropertyStep = (step: string, formData: PropertyFormData): PropertyStepValidationResult => {
  const errors: Record<string, string> = {}
  const missingFields: string[] = []

  const addError = (field: string, message: string) => {
    errors[field] = message
    missingFields.push(field)
  }

  switch (step) {
    case 'basic':
      // Basic property information
      const nameError = validatePropertyField('name', formData.name, formData)
      if (nameError) addError('name', nameError)

      const propertyTypeError = validatePropertyField('propertyType', formData.propertyType, formData)
      if (propertyTypeError) addError('propertyType', propertyTypeError)

      const bedroomsError = validatePropertyField('bedrooms', formData.bedrooms, formData)
      if (bedroomsError) addError('bedrooms', bedroomsError)

      const bathroomsError = validatePropertyField('bathrooms', formData.bathrooms, formData)
      if (bathroomsError) addError('bathrooms', bathroomsError)

      const builtUpAreaError = validatePropertyField('builtUpArea', formData.builtUpArea, formData)
      if (builtUpAreaError) addError('builtUpArea', builtUpAreaError)

      const carpetAreaError = validatePropertyField('carpetArea', formData.carpetArea, formData)
      if (carpetAreaError) addError('carpetArea', carpetAreaError)

      const suiteAreaError = validatePropertyField('suiteArea', formData.suiteArea, formData)
      if (suiteAreaError) addError('suiteArea', suiteAreaError)

      const balconyAreaError = validatePropertyField('balconyArea', formData.balconyArea, formData)
      if (balconyAreaError) addError('balconyArea', balconyAreaError)

      const terracePoolAreaError = validatePropertyField('terracePoolArea', formData.terracePoolArea, formData)
      if (terracePoolAreaError) addError('terracePoolArea', terracePoolAreaError)

      const totalAreaError = validatePropertyField('totalArea', formData.totalArea, formData)
      if (totalAreaError) addError('totalArea', totalAreaError)

      const furnishingError = validatePropertyField('furnishingStatus', formData.furnishingStatus, formData)
      if (furnishingError) addError('furnishingStatus', furnishingError)

      const facingError = validatePropertyField('facingDirection', formData.facingDirection, formData)
      if (facingError) addError('facingDirection', facingError)

      // Floor level is now optional
      const floorError = validatePropertyField('floorLevel', formData.floorLevel, formData)
      if (floorError) addError('floorLevel', floorError)

      break

    case 'ownership':
      // Ownership and availability
      const ownershipError = validatePropertyField('ownershipType', formData.ownershipType, formData)
      if (ownershipError) addError('ownershipType', ownershipError)

      const availabilityError = validatePropertyField('availabilityStatus', formData.availabilityStatus, formData)
      if (availabilityError) addError('availabilityStatus', availabilityError)

      break

    case 'location':
      // Location details
      const addressError = validatePropertyField('address', formData.address, formData)
      if (addressError) addError('address', addressError)

      const areaError = validatePropertyField('area', formData.area, formData)
      if (areaError) addError('area', areaError)

      const cityError = validatePropertyField('city', formData.city, formData)
      if (cityError) addError('city', cityError)

      const countryError = validatePropertyField('country', formData.country, formData)
      if (countryError) addError('country', countryError)

      const latError = validatePropertyField('latitude', formData.latitude, formData)
      if (latError) addError('latitude', latError)

      const lngError = validatePropertyField('longitude', formData.longitude, formData)
      if (lngError) addError('longitude', lngError)

      break

    case 'pricing':
      // Pricing information
      const priceError = validatePropertyField('price', formData.price, formData)
      if (priceError) addError('price', priceError)

      const priceNumericError = validatePropertyField('priceNumeric', formData.priceNumeric, formData)
      if (priceNumericError) addError('priceNumeric', priceNumericError)

      const pricePerSqFtError = validatePropertyField('pricePerSqFt', formData.pricePerSqFt, formData)
      if (pricePerSqFtError) addError('pricePerSqFt', pricePerSqFtError)

      break

    case 'description':
      // Description and overview
      const descriptionError = validatePropertyField('description', formData.description, formData)
      if (descriptionError) addError('description', descriptionError)

      const overviewError = validatePropertyField('overview', formData.overview, formData)
      if (overviewError) addError('overview', overviewError)

      break

    case 'media':
      // Images and media
      const coverImageError = validatePropertyField('coverImage', formData.coverImage, formData)
      if (coverImageError) addError('coverImage', coverImageError)

      const galleryError = validatePropertyField('gallery', formData.gallery, formData)
      if (galleryError) addError('gallery', galleryError)

      break

    case 'amenities':
      // Amenities
      const amenitiesError = validatePropertyField('amenities', formData.amenities, formData)
      if (amenitiesError) addError('amenities', amenitiesError)

      break

    case 'links':
      // Optional agent linking
      if (formData.agentPhone) {
        const phoneError = validatePropertyField('agentPhone', formData.agentPhone, formData)
        if (phoneError) addError('agentPhone', phoneError)
      }

      if (formData.agentEmail) {
        const emailError = validatePropertyField('agentEmail', formData.agentEmail, formData)
        if (emailError) addError('agentEmail', emailError)
      }

      break

    case 'payment':
      // Payment plan (optional)
      if (formData.hasPaymentPlan) {
        const paymentPlanError = validatePropertyField('paymentPlan', formData.paymentPlan, formData)
        if (paymentPlanError) addError('paymentPlan', paymentPlanError)
      }

      break

    default:
      break
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    missingFields
  }
}

// Complete form validation
export const validatePropertyFormData = (formData: PropertyFormData): PropertyValidationResult => {
  const fieldErrors: Record<string, string> = {}
  const globalErrors: string[] = []

  // Validate all steps
  const steps = ['basic', 'ownership', 'location', 'pricing', 'description', 'media', 'amenities', 'links', 'payment']
  
  for (const step of steps) {
    const stepValidation = validatePropertyStep(step, formData)
    Object.assign(fieldErrors, stepValidation.errors)
  }

  // Additional cross-field validations
  if (formData.carpetArea && formData.builtUpArea) {
    // Check that carpet area is not larger than built-up area
    const carpetAreaNum = formData.carpetArea // Already a number
    const builtUpAreaNum = formData.builtUpArea // Already a number
    if (carpetAreaNum > builtUpAreaNum) {
      fieldErrors.carpetArea = 'Carpet area cannot be larger than built-up area'
    }
  }

  // Validate coordinates combination
  if (formData.latitude !== undefined && formData.longitude !== undefined) {
    if (!isValidCoordinates(formData.latitude, formData.longitude)) {
      globalErrors.push('Invalid coordinate combination')
    }
  }

  // Agent validation - if agent ID is provided, name and phone should also be provided
  if (formData.agentId && formData.agentId.trim().length > 0) {
    if (!formData.agentName || formData.agentName.trim().length === 0) {
      fieldErrors.agentName = 'Agent name is required when agent ID is provided'
    }
    if (!formData.agentPhone || formData.agentPhone.trim().length === 0) {
      fieldErrors.agentPhone = 'Agent phone is required when agent ID is provided'
    }
  }

  return {
    isValid: Object.keys(fieldErrors).length === 0 && globalErrors.length === 0,
    fieldErrors,
    globalErrors
  }
}

// Real-time validation for individual fields
export const validatePropertyFieldLive = (fieldName: string, value: any, formData: PropertyFormData): { isValid: boolean; error?: string } => {
  const error = validatePropertyField(fieldName, value, formData)
  return {
    isValid: !error,
    error: error || undefined
  }
}

// Get validation status for all steps
export const getPropertyStepValidationStatus = (formData: PropertyFormData): Record<string, boolean> => {
  const steps = ['basic', 'ownership', 'location', 'pricing', 'description', 'media', 'amenities', 'links', 'payment']
  const status: Record<string, boolean> = {}
  
  for (const step of steps) {
    const validation = validatePropertyStep(step, formData)
    status[step] = validation.isValid
  }
  
  return status
}

// Export validation constants for use in components
export const PROPERTY_VALIDATION_CONSTANTS = {
  PROPERTY_TYPES: VALID_PROPERTY_TYPES,
  FURNISHING_STATUS: VALID_FURNISHING_STATUS,
  FACING_DIRECTIONS: VALID_FACING_DIRECTIONS,
  OWNERSHIP_TYPES: VALID_OWNERSHIP_TYPES,
  AVAILABILITY_STATUS: VALID_AVAILABILITY_STATUS,
  MAX_NAME_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 2000,
  MAX_OVERVIEW_LENGTH: 5000,
  MIN_BEDROOMS: 0,
  MAX_BEDROOMS: 20,
  MIN_BATHROOMS: 0,
  MAX_BATHROOMS: 20,
  MIN_FLOOR_LEVEL: -5,
  MAX_FLOOR_LEVEL: 200,
  MIN_LATITUDE: -90,
  MAX_LATITUDE: 90,
  MIN_LONGITUDE: -180,
  MAX_LONGITUDE: 180
}