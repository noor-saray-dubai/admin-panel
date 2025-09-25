// lib/developer-form-persistence.ts
import type { DeveloperFormData } from "@/components/developer-form-modal";

const STORAGE_KEY = 'developer_form_draft';
const STORAGE_TIMESTAMP_KEY = 'developer_form_draft_timestamp';
const DRAFT_EXPIRY_DAYS = 7; // Expire drafts after 7 days

/**
 * Save developer form data to local storage
 */
export function saveDeveloperFormDraft(formData: DeveloperFormData): void {
  try {
    // Create a clean draft data object (excluding File objects as they can't be serialized)
    const draftData = {
      ...formData,
      logo: null, // Files can't be stored in localStorage
      coverImage: null, // Files can't be stored in localStorage
    };

    // Debug logging to confirm data is being saved
    const hasData = !!(draftData.name || draftData.overview || draftData.location || draftData.description?.some(d => d.description))
    if (hasData) {
      console.log('💾 Developer draft saved:', {
        name: draftData.name ? 'yes' : 'no',
        overview: draftData.overview ? 'yes' : 'no',
        descriptionSections: draftData.description?.length || 0,
        awards: draftData.awards?.length || 0,
        specializations: draftData.specialization?.length || 0
      })
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(draftData));
    localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.warn('Failed to save developer form draft to localStorage:', error);
  }
}

/**
 * Load developer form data from local storage
 */
export function loadDeveloperFormDraft(): DeveloperFormData | null {
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
      clearDeveloperFormDraft();
      return null;
    }

    const draftData = JSON.parse(draftString) as DeveloperFormData;
    
    // Debug logging to confirm data was restored
    const hasData = !!(draftData.name || draftData.overview || draftData.location || draftData.description?.some((d: { description: any; }) => d.description))
    if (hasData) {
      console.log('📂 Developer draft loaded:', {
        name: draftData.name ? 'yes' : 'no',
        overview: draftData.overview ? 'yes' : 'no',
        descriptionSections: draftData.description?.length || 0,
        awards: draftData.awards?.length || 0,
        specializations: draftData.specialization?.length || 0
      })
    }
    
    return draftData;
  } catch (error) {
    console.warn('Failed to load developer form draft from localStorage:', error);
    return null;
  }
}

/**
 * Clear developer form draft from local storage
 */
export function clearDeveloperFormDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
  } catch (error) {
    console.warn('Failed to clear developer form draft from localStorage:', error);
  }
}

/**
 * Check if there's a saved developer draft
 */
export function hasSavedDeveloperDraft(): boolean {
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
      clearDeveloperFormDraft();
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Failed to check for saved developer draft:', error);
    return false;
  }
}

/**
 * Get formatted developer draft timestamp for display
 */
export function getDeveloperDraftTimestamp(): string | null {
  try {
    const timestampString = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
    if (!timestampString) return null;
    
    const timestamp = parseInt(timestampString, 10);
    
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
    console.warn('Failed to get developer draft timestamp:', error);
    return null;
  }
}

/**
 * Create a debounced function for saving developer drafts
 */
export function createDebouncedDeveloperSave(delay: number = 1500) {
  let timeoutId: NodeJS.Timeout;
  
  return (formData: DeveloperFormData) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      saveDeveloperFormDraft(formData);
    }, delay);
  };
}