// lib/mall-form-persistence.ts
import type { MallFormData } from "@/types/mall";

const STORAGE_KEY = 'mall_form_draft';
const STORAGE_TIMESTAMP_KEY = 'mall_form_draft_timestamp';
const DRAFT_EXPIRY_DAYS = 7; // Expire drafts after 7 days

/**
 * Save mall form data to local storage (including image URLs)
 */
export function saveMallFormDraft(formData: MallFormData): void {
  try {
    const draftData: MallFormData = {
      ...formData, // Include all form data including image URLs
    };

    // Debug logging to confirm image URLs are being saved
    const hasImages = !!(draftData.image || (draftData.gallery?.length) || draftData.floorPlan)
    if (hasImages) {
      console.log('🖼️ Draft saved with images:', {
        mainImage: draftData.image ? 'yes' : 'no',
        galleryCount: draftData.gallery?.length || 0,
        floorPlan: draftData.floorPlan ? 'yes' : 'no'
      })
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(draftData));
    localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.warn('Failed to save mall form draft to localStorage:', error);
  }
}

/**
 * Load mall form data from local storage
 */
export function loadMallFormDraft(): MallFormData | null {
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

    const draftData = JSON.parse(draftString) as MallFormData;
    
    // Debug logging to confirm images were restored
    const hasImages = !!(draftData.image || (draftData.gallery?.length) || draftData.floorPlan)
    if (hasImages) {
      console.log('🖼️ Draft loaded with images:', {
        mainImage: draftData.image ? 'yes' : 'no',
        galleryCount: draftData.gallery?.length || 0,
        floorPlan: draftData.floorPlan ? 'yes' : 'no'
      })
    }
    
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