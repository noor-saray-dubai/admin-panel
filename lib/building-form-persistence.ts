// lib/building-form-persistence.ts
import type { BuildingFormData } from "@/types/buildings";

const STORAGE_KEY = 'building_form_draft';
const STORAGE_TIMESTAMP_KEY = 'building_form_draft_timestamp';
const DRAFT_EXPIRY_DAYS = 7; // Expire drafts after 7 days

/**
 * Save building form data to local storage
 */
export function saveBuildingFormDraft(formData: BuildingFormData): void {
  try {
    // Create a clean draft data object
    const draftData = {
      ...formData,
    };

    // Debug logging to confirm data is being saved
    const hasData = !!(
      draftData.name || 
      draftData.location || 
      draftData.description || 
      draftData.units?.length || 
      draftData.features?.length
    );
    
    if (hasData) {
      console.log('💾 Building draft saved:', {
        name: draftData.name ? 'yes' : 'no',
        location: draftData.location ? 'yes' : 'no',
        category: draftData.category ? 'yes' : 'no',
        units: draftData.units?.length || 0,
        features: draftData.features?.length || 0,
        highlights: draftData.highlights?.length || 0
      });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(draftData));
    localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.warn('Failed to save building form draft to localStorage:', error);
  }
}

/**
 * Load building form data from local storage
 */
export function loadBuildingFormDraft(): BuildingFormData | null {
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
      clearBuildingFormDraft();
      return null;
    }

    const draftData = JSON.parse(draftString) as BuildingFormData;
    
    // Debug logging to confirm data was restored
    const hasData = !!(
      draftData.name || 
      draftData.location || 
      draftData.description || 
      draftData.units?.length || 
      draftData.features?.length
    );
    
    if (hasData) {
      console.log('📂 Building draft loaded:', {
        name: draftData.name ? 'yes' : 'no',
        location: draftData.location ? 'yes' : 'no',
        category: draftData.category ? 'yes' : 'no',
        units: draftData.units?.length || 0,
        features: draftData.features?.length || 0,
        highlights: draftData.highlights?.length || 0
      });
    }
    
    return draftData;
  } catch (error) {
    console.warn('Failed to load building form draft from localStorage:', error);
    return null;
  }
}

/**
 * Clear building form draft from local storage
 */
export function clearBuildingFormDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
  } catch (error) {
    console.warn('Failed to clear building form draft from localStorage:', error);
  }
}

/**
 * Check if there's a saved building draft
 */
export function hasSavedBuildingDraft(): boolean {
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
      clearBuildingFormDraft();
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Failed to check for saved building draft:', error);
    return false;
  }
}

/**
 * Get formatted building draft timestamp for display
 */
export function getBuildingDraftTimestamp(): string | null {
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
    console.warn('Failed to get building draft timestamp:', error);
    return null;
  }
}

/**
 * Create a debounced function for saving building drafts
 */
export function createDebouncedBuildingSave(delay: number = 1500) {
  let timeoutId: NodeJS.Timeout;
  
  return (formData: BuildingFormData) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      saveBuildingFormDraft(formData);
    }, delay);
  };
}