// lib/mall-form-persistence.ts
import type { MallFormData } from "@/types/mall";

const STORAGE_KEY = 'mall_form_draft';
const STORAGE_TIMESTAMP_KEY = 'mall_form_draft_timestamp';
const DRAFT_EXPIRY_DAYS = 7; // Expire drafts after 7 days

export interface MallFormDraftData extends Omit<MallFormData, 'image' | 'gallery' | 'floorPlan'> {
  // Exclude image fields from persistence to avoid large localStorage usage
}

/**
 * Save mall form data to local storage (excluding images)
 */
export function saveMallFormDraft(formData: MallFormData): void {
  try {
    const draftData: MallFormDraftData = {
      name: formData.name,
      subtitle: formData.subtitle,
      status: formData.status,
      location: formData.location,
      subLocation: formData.subLocation,
      ownership: formData.ownership,
      price: formData.price,
      size: formData.size,
      rentalDetails: formData.rentalDetails,
      financials: formData.financials,
      saleInformation: formData.saleInformation,
      legalDetails: formData.legalDetails,
      operationalDetails: formData.operationalDetails,
      leaseDetails: formData.leaseDetails,
      marketingMaterials: formData.marketingMaterials,
      investorRelations: formData.investorRelations,
      amenities: formData.amenities,
      features: formData.features,
      developer: formData.developer,
      yearBuilt: formData.yearBuilt,
      yearOpened: formData.yearOpened,
      rating: formData.rating,
      visitorsAnnually: formData.visitorsAnnually,
      architecture: formData.architecture,
      locationDetails: formData.locationDetails,
      verified: formData.verified,
      isActive: formData.isActive,
      isAvailable: formData.isAvailable,
      isOperational: formData.isOperational,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(draftData));
    localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.warn('Failed to save mall form draft to localStorage:', error);
  }
}

/**
 * Load mall form data from local storage
 */
export function loadMallFormDraft(): MallFormDraftData | null {
  try {
    const draftString = localStorage.getItem(STORAGE_KEY);
    const timestampString = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
    
    if (!draftString || !timestampString) {
      return null;
    }

    // Check if draft has expired
    const timestamp = parseInt(timestampString, 10);
    const now = Date.now();
    const expiryTime = DRAFT_EXPIRY_DAYS * 24 * 60 * 60 * 1000; // Convert days to milliseconds
    
    if (now - timestamp > expiryTime) {
      // Draft has expired, clean it up
      clearMallFormDraft();
      return null;
    }

    const draftData = JSON.parse(draftString) as MallFormDraftData;
    return draftData;
  } catch (error) {
    console.warn('Failed to load mall form draft from localStorage:', error);
    return null;
  }
}

/**
 * Clear mall form draft from local storage
 */
export function clearMallFormDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
  } catch (error) {
    console.warn('Failed to clear mall form draft from localStorage:', error);
  }
}

/**
 * Check if there's a saved mall draft
 */
export function hasSavedMallDraft(): boolean {
  try {
    const draftString = localStorage.getItem(STORAGE_KEY);
    const timestampString = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
    
    if (!draftString || !timestampString) {
      return false;
    }

    // Check if draft has expired
    const timestamp = parseInt(timestampString, 10);
    const now = Date.now();
    const expiryTime = DRAFT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    
    if (now - timestamp > expiryTime) {
      clearMallFormDraft();
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Failed to check for saved mall draft:', error);
    return false;
  }
}

/**
 * Get formatted mall draft timestamp for display
 */
export function getMallDraftTimestamp(): string | null {
  try {
    const timestampString = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
    if (!timestampString) return null;
    
    const timestamp = parseInt(timestampString, 10);
    const date = new Date(timestamp);
    
    // Format as relative time
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) {
      return 'Just now';
    } else if (minutes < 60) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  } catch (error) {
    console.warn('Failed to get mall draft timestamp:', error);
    return null;
  }
}

/**
 * Create a debounced function for saving mall drafts
 */
export function createDebouncedMallSave(delay: number = 1000) {
  let timeoutId: NodeJS.Timeout;
  
  return (formData: MallFormData) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      saveMallFormDraft(formData);
    }, delay);
  };
}