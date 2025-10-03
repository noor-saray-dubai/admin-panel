// lib/building-form-persistence.ts
import type { BuildingFormData } from "@/types/buildings";

const STORAGE_KEY = 'building_form_draft';
const STORAGE_TIMESTAMP_KEY = 'building_form_draft_timestamp';
const DRAFT_EXPIRY_DAYS = 7; // Expire drafts after 7 days

/**
 * Save building form data to local storage (only if it has meaningful data)
 */
export function saveBuildingFormDraft(formData: BuildingFormData): void {
  try {
    // Check for meaningful form data (not just default/empty values)
    const hasMeaningfulData = !!(
      (formData.name && formData.name.trim().length > 0) ||
      (formData.location && formData.location.trim().length > 0) ||
      (formData.description && formData.description.trim().length > 0) ||
      formData.category ||
      (formData.type && formData.type.trim().length > 0) ||
      (formData.status && formData.status.trim().length > 0) ||
      (formData.mainImage && formData.mainImage.trim().length > 0) ||
      (formData.units && formData.units.length > 0) ||
      (formData.features && formData.features.length > 0) ||
      (formData.highlights && formData.highlights.length > 0) ||
      (formData.gallery && formData.gallery.length > 0) ||
      (formData.price && formData.price.valueNumeric > 0) ||
      (formData.totalUnits > 0) ||
      (formData.dimensions && formData.dimensions.floors > 1)
    );

    if (!hasMeaningfulData) {
      // Don't save empty/default data as draft
      console.log('⏭️ Skipping empty building draft save');
      return;
    }

    // Create a clean draft data object
    const draftData = {
      ...formData,
    };

    // Debug logging to confirm data is being saved
    console.log('💾 Building draft saved:', {
      name: draftData.name ? 'yes' : 'no',
      location: draftData.location ? 'yes' : 'no',
      category: draftData.category ? 'yes' : 'no',
      units: draftData.units?.length || 0,
      features: draftData.features?.length || 0,
      highlights: draftData.highlights?.length || 0
    });

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
 * Check if there's a saved building draft with meaningful data
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

    // Parse the draft and check if it has meaningful data
    const draftData = JSON.parse(draftString) as BuildingFormData;
    
    // Check for meaningful form data (not just default/empty values)
    const hasMeaningfulData = !!(
      (draftData.name && draftData.name.trim().length > 0) ||
      (draftData.location && draftData.location.trim().length > 0) ||
      (draftData.description && draftData.description.trim().length > 0) ||
      (draftData.category && draftData.category.trim().length > 0) ||
      (draftData.type && draftData.type.trim().length > 0) ||
      (draftData.status && draftData.status.trim().length > 0) ||
      (draftData.mainImage && draftData.mainImage.trim().length > 0) ||
      (draftData.units && draftData.units.length > 0) ||
      (draftData.features && draftData.features.length > 0) ||
      (draftData.highlights && draftData.highlights.length > 0) ||
      (draftData.gallery && draftData.gallery.length > 0) ||
      (draftData.price && draftData.price.valueNumeric > 0) ||
      (draftData.totalUnits > 0) ||
      (draftData.dimensions && draftData.dimensions.floors > 1)
    );

    if (!hasMeaningfulData) {
      // Clean up empty draft
      console.log('🗑️ Clearing empty building draft');
      clearBuildingFormDraft();
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Failed to check for saved building draft:', error);
    // Clear corrupted draft
    clearBuildingFormDraft();
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

/**
 * Clean up any empty or meaningless drafts from localStorage
 * Call this on app initialization to remove stale empty drafts
 */
export function cleanupEmptyBuildingDrafts(): void {
  try {
    const hasValidDraft = hasSavedBuildingDraft(); // This already checks and cleans empty drafts
    if (!hasValidDraft) {
      console.log('🧹 Empty building drafts cleaned up');
    }
  } catch (error) {
    console.warn('Failed to cleanup empty building drafts:', error);
    clearBuildingFormDraft(); // Clear any corrupted data
  }
}
