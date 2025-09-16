// lib/form-persistence.ts
import type { PlotFormData } from "@/types/plot";

const STORAGE_KEY = 'plot_form_draft';
const STORAGE_TIMESTAMP_KEY = 'plot_form_draft_timestamp';
const DRAFT_EXPIRY_DAYS = 7; // Expire drafts after 7 days

export interface FormDraftData {
  title: string;
  subtitle: string;
  type: "" | "industrial" | "community" | "building";
  subtype: "" | "hotel" | "residential" | "mixuse";
  location: string;
  subLocation: string;
  ownership: "" | "freehold" | "leasehold";
  price: {
    perSqft: number;
    total: string;
    totalNumeric: number;
    currency: string;
  };
  size: {
    sqft: number;
    sqm: number;
    acres: number;
  };
  permissions: {
    floors: string;
    usage: string;
    far: number;
    coverage: number;
  };
  investment: {
    roi: number;
    appreciation: number;
    payback: number;
  };
  features: string[];
  developer: string;
  status: string;
  locationDetails: {
    description: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    accessibility: string[];
  };
  verified: boolean;
  isActive: boolean;
  isAvailable: boolean;
}

/**
 * Save form data to local storage (excluding images)
 */
export function saveFormDraft(formData: PlotFormData): void {
  try {
    const draftData: FormDraftData = {
      title: formData.title,
      subtitle: formData.subtitle,
      type: formData.type,
      subtype: formData.subtype,
      location: formData.location,
      subLocation: formData.subLocation,
      ownership: formData.ownership,
      price: formData.price,
      size: formData.size,
      permissions: formData.permissions,
      investment: formData.investment,
      features: formData.features,
      developer: formData.developer,
      status: formData.status,
      locationDetails: formData.locationDetails,
      verified: formData.verified,
      isActive: formData.isActive,
      isAvailable: formData.isAvailable,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(draftData));
    localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.warn('Failed to save form draft to localStorage:', error);
  }
}

/**
 * Load form data from local storage
 */
export function loadFormDraft(): FormDraftData | null {
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
      clearFormDraft();
      return null;
    }

    const draftData = JSON.parse(draftString) as FormDraftData;
    return draftData;
  } catch (error) {
    console.warn('Failed to load form draft from localStorage:', error);
    return null;
  }
}

/**
 * Clear form draft from local storage
 */
export function clearFormDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
  } catch (error) {
    console.warn('Failed to clear form draft from localStorage:', error);
  }
}

/**
 * Check if there's a saved draft
 */
export function hasSavedDraft(): boolean {
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
      clearFormDraft();
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Failed to check for saved draft:', error);
    return false;
  }
}

/**
 * Get formatted draft timestamp for display
 */
export function getDraftTimestamp(): string | null {
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
    console.warn('Failed to get draft timestamp:', error);
    return null;
  }
}

/**
 * Create a debounced function for saving drafts
 */
export function createDebouncedSave(delay: number = 1000) {
  let timeoutId: NodeJS.Timeout;
  
  return (formData: PlotFormData) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      saveFormDraft(formData);
    }, delay);
  };
}