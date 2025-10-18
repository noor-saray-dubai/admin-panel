// lib/property-form-persistence.ts
import type { PropertyFormData, IProperty } from "@/types/properties"

const DRAFT_KEY = 'property-form-draft'
const DRAFT_TIMESTAMP_KEY = 'property-form-draft-timestamp'

export function savePropertyFormDraft(data: PropertyFormData, propertySlug?: string): void {
  try {
    const key = propertySlug ? `${DRAFT_KEY}-${propertySlug}` : DRAFT_KEY
    const timestampKey = propertySlug ? `${DRAFT_TIMESTAMP_KEY}-${propertySlug}` : DRAFT_TIMESTAMP_KEY
    
    console.log(`🟢 Saving property draft with key: ${key}`, { propertySlug })
    localStorage.setItem(key, JSON.stringify(data))
    localStorage.setItem(timestampKey, new Date().toISOString())
  } catch (error) {
    console.warn('Failed to save property form draft:', error)
  }
}

export function loadPropertyFormDraft(propertySlug?: string): PropertyFormData | null {
  try {
    const key = propertySlug ? `${DRAFT_KEY}-${propertySlug}` : DRAFT_KEY
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : null
  } catch (error) {
    console.warn('Failed to load property form draft:', error)
    return null
  }
}

export function clearPropertyFormDraft(propertySlug?: string): void {
  try {
    const key = propertySlug ? `${DRAFT_KEY}-${propertySlug}` : DRAFT_KEY
    const timestampKey = propertySlug ? `${DRAFT_TIMESTAMP_KEY}-${propertySlug}` : DRAFT_TIMESTAMP_KEY
    
    console.log(`🔴 Clearing property draft with key: ${key}`, { propertySlug })
    localStorage.removeItem(key)
    localStorage.removeItem(timestampKey)
  } catch (error) {
    console.warn('Failed to clear property form draft:', error)
  }
}

export function hasSavedPropertyDraft(propertySlug?: string): boolean {
  try {
    const key = propertySlug ? `${DRAFT_KEY}-${propertySlug}` : DRAFT_KEY
    const hasData = localStorage.getItem(key) !== null
    console.log(`🔍 Checking property draft with key: ${key}`, { propertySlug, hasData })
    return hasData
  } catch (error) {
    return false
  }
}

export function getPropertyDraftTimestamp(propertySlug?: string): Date | null {
  try {
    const timestampKey = propertySlug ? `${DRAFT_TIMESTAMP_KEY}-${propertySlug}` : DRAFT_TIMESTAMP_KEY
    const timestamp = localStorage.getItem(timestampKey)
    return timestamp ? new Date(timestamp) : null
  } catch (error) {
    return null
  }
}

export function createDebouncedPropertySave(propertySlug?: string, delay: number = 1000) {
  let timeoutId: NodeJS.Timeout

  return (data: PropertyFormData) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      savePropertyFormDraft(data, propertySlug)
    }, delay)
  }
}

export function formatDraftAge(timestamp: Date | string | null): string {
  if (!timestamp) return "unknown time"
  
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  } else if (diffMins > 0) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  } else {
    return "just now"
  }
}

export function propertyToFormData(property: IProperty): PropertyFormData {
  return {
    name: property.name || "",
    
    // Optional linking
    projectName: property.project?.projectName || "",
    projectSlug: property.project?.projectSlug || "",
    developerName: property.developer?.developerName || "",
    developerSlug: property.developer?.developerSlug || "",
    communityName: property.community?.communityName || "",
    communitySlug: property.community?.communitySlug || "",
    agentId: property.agent?.agentId || "",
    agentName: property.agent?.agentName || "",
    agentPhone: property.agent?.phoneNumber || "",
    agentEmail: property.agent?.email || "",
    
    // Property specifications
    propertyType: property.propertyType || "",
    bedrooms: property.bedrooms || 0,
    bathrooms: property.bathrooms || 0,
    builtUpArea: property.builtUpArea || undefined,
    suiteArea: property.suiteArea || undefined,
    balconyArea: property.balconyArea || undefined,
    terracePoolArea: property.terracePoolArea || undefined,
    totalArea: property.totalArea || undefined,
    areaUnit: property.areaUnit || "sq ft",
    furnishingStatus: property.furnishingStatus || "",
    facingDirection: property.facingDirection || "",
    floorLevel: property.floorLevel || { type: 'single', value: 0 }, // Default to ground floor
    
    // Ownership & Availability
    ownershipType: property.ownershipType || "",
    propertyStatus: property.propertyStatus || "",
    availabilityStatus: property.availabilityStatus || "Ready",
    
    // Location
    address: property.location?.address || "",
    area: property.location?.area || "",
    city: property.location?.city || "",
    country: property.location?.country || "UAE",
    latitude: property.location?.coordinates?.latitude || 25.2048,
    longitude: property.location?.coordinates?.longitude || 55.2708,
    
    // Pricing
    price: property.price || "",
    priceNumeric: property.priceNumeric || 0,
    pricePerSqFt: property.pricePerSqFt || 0,
    
    // Description
    description: property.description || "",
    overview: property.overview || "",
    
    // Media
    coverImage: property.coverImage || "",
    gallery: property.gallery || [],
    
    // Amenities
    amenities: property.amenities || [],
    
    // Payment Plan (for primary market)
    hasPaymentPlan: Boolean(property.paymentPlan),
    paymentPlan: property.paymentPlan || {
      booking: "10%",
      construction: [{ milestone: "Foundation", percentage: "20%" }],
      handover: "70%"
    },
    
    // Flags
    flags: property.flags || {
      elite: false,
      exclusive: false,
      featured: false,
      highValue: false
    },
    
    // Metadata
    tags: property.tags || [],
    isActive: property.isActive !== undefined ? property.isActive : true
  }
}
