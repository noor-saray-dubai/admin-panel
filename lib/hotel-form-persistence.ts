// lib/hotel-form-persistence.ts
import type { HotelFormData } from "@/types/hotels";

const STORAGE_KEY = 'hotel_form_draft';
const STORAGE_TIMESTAMP_KEY = 'hotel_form_draft_timestamp';
const DRAFT_EXPIRY_DAYS = 7; // Expire drafts after 7 days

/**
 * Save hotel form data to local storage (only if it has meaningful data)
 */
export function saveHotelFormDraft(formData: HotelFormData): void {
  try {
    // Check for meaningful form data (not just default/empty values)
    const hasMeaningfulData = !!(
      (formData.name && formData.name.trim().length > 0) ||
      (formData.location && formData.location.trim().length > 0) ||
      (formData.description && formData.description.trim().length > 0) ||
      (formData.type && formData.type.trim().length > 0 && formData.type !== '') ||
      (formData.status && formData.status.trim().length > 0 && formData.status !== '') ||
      (formData.mainImage && formData.mainImage.trim().length > 0) ||
      (formData.roomsSuites && formData.roomsSuites.length > 0) ||
      (formData.dining && formData.dining.length > 0) ||
      (formData.features && formData.features.length > 0) ||
      (formData.facts && formData.facts.length > 0) ||
      (formData.gallery && formData.gallery.length > 0) ||
      (formData.price && formData.price.totalNumeric > 0) ||
      (formData.totalRooms && formData.totalRooms > 0) ||
      (formData.dimensions && formData.dimensions.heightNumeric > 0)
    );

    if (!hasMeaningfulData) {
      // Don't save empty/default data as draft
      console.log('⏭️ Skipping empty hotel draft save');
      return;
    }

    // Create a clean draft data object
    const draftData = {
      ...formData,
    };

    // Debug logging to confirm data is being saved
    console.log('💾 Hotel draft saved:', {
      name: draftData.name ? 'yes' : 'no',
      location: draftData.location ? 'yes' : 'no',
      type: draftData.type ? 'yes' : 'no',
      roomsSuites: draftData.roomsSuites?.length || 0,
      dining: draftData.dining?.length || 0,
      features: draftData.features?.length || 0,
      facts: draftData.facts?.length || 0
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(draftData));
    localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.warn('Failed to save hotel form draft to localStorage:', error);
  }
}

/**
 * Load hotel form data from local storage
 */
export function loadHotelFormDraft(): HotelFormData | null {
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
      clearHotelFormDraft();
      return null;
    }

    const draftData = JSON.parse(draftString) as HotelFormData;
    
    // Debug logging to confirm data was restored
    const hasData = !!(
      draftData.name || 
      draftData.location || 
      draftData.description || 
      draftData.roomsSuites?.length || 
      draftData.dining?.length
    );
    
    if (hasData) {
      console.log('📂 Hotel draft loaded:', {
        name: draftData.name ? 'yes' : 'no',
        location: draftData.location ? 'yes' : 'no',
        type: draftData.type ? 'yes' : 'no',
        roomsSuites: draftData.roomsSuites?.length || 0,
        dining: draftData.dining?.length || 0,
        features: draftData.features?.length || 0,
        facts: draftData.facts?.length || 0
      });
    }
    
    return draftData;
  } catch (error) {
    console.warn('Failed to load hotel form draft from localStorage:', error);
    return null;
  }
}

/**
 * Clear hotel form draft from local storage
 */
export function clearHotelFormDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
  } catch (error) {
    console.warn('Failed to clear hotel form draft from localStorage:', error);
  }
}

/**
 * Check if there's a saved hotel draft with meaningful data
 */
export function hasSavedHotelDraft(): boolean {
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
      clearHotelFormDraft();
      return false;
    }

    // Parse the draft and check if it has meaningful data
    const draftData = JSON.parse(draftString) as HotelFormData;
    
    // Check for meaningful form data (not just default/empty values)
    const hasMeaningfulData = !!(
      (draftData.name && draftData.name.trim().length > 0) ||
      (draftData.location && draftData.location.trim().length > 0) ||
      (draftData.description && draftData.description.trim().length > 0) ||
      (draftData.type && draftData.type.trim().length > 0 && draftData.type !== '') ||
      (draftData.status && draftData.status.trim().length > 0 && draftData.status !== '') ||
      (draftData.mainImage && draftData.mainImage.trim().length > 0) ||
      (draftData.roomsSuites && draftData.roomsSuites.length > 0) ||
      (draftData.dining && draftData.dining.length > 0) ||
      (draftData.features && draftData.features.length > 0) ||
      (draftData.facts && draftData.facts.length > 0) ||
      (draftData.gallery && draftData.gallery.length > 0) ||
      (draftData.price && draftData.price.totalNumeric > 0) ||
      (draftData.totalRooms && draftData.totalRooms > 0) ||
      (draftData.dimensions && draftData.dimensions.heightNumeric > 0)
    );

    if (!hasMeaningfulData) {
      // Clean up empty draft
      console.log('🗑️ Clearing empty hotel draft');
      clearHotelFormDraft();
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Failed to check for saved hotel draft:', error);
    // Clear corrupted draft
    clearHotelFormDraft();
    return false;
  }
}

/**
 * Get formatted hotel draft timestamp for display
 */
export function getHotelDraftTimestamp(): string | null {
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
    console.warn('Failed to get hotel draft timestamp:', error);
    return null;
  }
}

/**
 * Create a debounced function for saving hotel drafts
 */
export function createDebouncedHotelSave(delay: number = 1500) {
  let timeoutId: NodeJS.Timeout;
  
  return (formData: HotelFormData) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      saveHotelFormDraft(formData);
    }, delay);
  };
}

/**
 * Clean up any empty or meaningless drafts from localStorage
 * Call this on app initialization to remove stale empty drafts
 */
export function cleanupEmptyHotelDrafts(): void {
  try {
    const hasValidDraft = hasSavedHotelDraft(); // This already checks and cleans empty drafts
    if (!hasValidDraft) {
      console.log('🧹 Empty hotel drafts cleaned up');
    }
  } catch (error) {
    console.warn('Failed to cleanup empty hotel drafts:', error);
    clearHotelFormDraft(); // Clear any corrupted data
  }
}