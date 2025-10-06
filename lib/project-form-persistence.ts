// lib/project-form-persistence.ts

import type { ProjectFormData } from "@/types/projects";

const DRAFT_KEY_PREFIX = "project_form_draft";
const DRAFT_TIMESTAMP_KEY = "project_form_draft_timestamp";
const DRAFT_EXPIRY_HOURS = 24; // Drafts expire after 24 hours

// Get storage key for a specific project (or new project)
function getStorageKey(projectId?: string): string {
  return projectId ? `${DRAFT_KEY_PREFIX}_${projectId}` : `${DRAFT_KEY_PREFIX}_new`;
}

function getTimestampKey(projectId?: string): string {
  return projectId ? `${DRAFT_TIMESTAMP_KEY}_${projectId}` : `${DRAFT_TIMESTAMP_KEY}_new`;
}

// Check if we're in a browser environment
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

// Save draft to localStorage
export function saveProjectFormDraft(data: ProjectFormData, projectId?: string): void {
  if (!isBrowser()) return;

  try {
    const storageKey = getStorageKey(projectId);
    const timestampKey = getTimestampKey(projectId);
    
    localStorage.setItem(storageKey, JSON.stringify(data));
    localStorage.setItem(timestampKey, new Date().toISOString());
  } catch (error) {
    console.warn('Failed to save project form draft:', error);
  }
}

// Load draft from localStorage
export function loadProjectFormDraft(projectId?: string): ProjectFormData | null {
  if (!isBrowser()) return null;

  try {
    const storageKey = getStorageKey(projectId);
    const timestampKey = getTimestampKey(projectId);
    
    const draftData = localStorage.getItem(storageKey);
    const timestamp = localStorage.getItem(timestampKey);
    
    if (!draftData || !timestamp) return null;

    // Check if draft has expired
    const draftTime = new Date(timestamp);
    const now = new Date();
    const hoursDiff = (now.getTime() - draftTime.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff > DRAFT_EXPIRY_HOURS) {
      clearProjectFormDraft(projectId);
      return null;
    }

    return JSON.parse(draftData) as ProjectFormData;
  } catch (error) {
    console.warn('Failed to load project form draft:', error);
    return null;
  }
}

// Clear draft from localStorage
export function clearProjectFormDraft(projectId?: string): void {
  if (!isBrowser()) return;

  try {
    const storageKey = getStorageKey(projectId);
    const timestampKey = getTimestampKey(projectId);
    
    localStorage.removeItem(storageKey);
    localStorage.removeItem(timestampKey);
  } catch (error) {
    console.warn('Failed to clear project form draft:', error);
  }
}

// Check if there's a saved draft
export function hasSavedProjectDraft(projectId?: string): boolean {
  if (!isBrowser()) return false;

  try {
    const storageKey = getStorageKey(projectId);
    const timestampKey = getTimestampKey(projectId);
    
    const draftData = localStorage.getItem(storageKey);
    const timestamp = localStorage.getItem(timestampKey);
    
    if (!draftData || !timestamp) return false;

    // Check if draft has expired
    const draftTime = new Date(timestamp);
    const now = new Date();
    const hoursDiff = (now.getTime() - draftTime.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff > DRAFT_EXPIRY_HOURS) {
      clearProjectFormDraft(projectId);
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Failed to check for project form draft:', error);
    return false;
  }
}

// Get draft timestamp for display
export function getProjectDraftTimestamp(projectId?: string): Date | null {
  if (!isBrowser()) return null;

  try {
    const timestampKey = getTimestampKey(projectId);
    const timestamp = localStorage.getItem(timestampKey);
    
    return timestamp ? new Date(timestamp) : null;
  } catch (error) {
    console.warn('Failed to get project draft timestamp:', error);
    return null;
  }
}

// Create debounced save function for auto-saving while typing
export function createDebouncedProjectSave(
  projectId?: string,
  delay: number = 2000
): (data: ProjectFormData) => void {
  let timeoutId: NodeJS.Timeout;

  return (data: ProjectFormData) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      saveProjectFormDraft(data, projectId);
    }, delay);
  };
}

// Get all saved drafts (for cleanup or management)
export function getAllProjectDrafts(): Array<{ key: string; timestamp: Date; data: ProjectFormData }> {
  if (!isBrowser()) return [];

  const drafts: Array<{ key: string; timestamp: Date; data: ProjectFormData }> = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(DRAFT_KEY_PREFIX) && !key.includes('timestamp')) {
        const data = localStorage.getItem(key);
        const timestampKey = key.replace(DRAFT_KEY_PREFIX, DRAFT_TIMESTAMP_KEY);
        const timestamp = localStorage.getItem(timestampKey);
        
        if (data && timestamp) {
          try {
            const parsedData = JSON.parse(data) as ProjectFormData;
            const parsedTimestamp = new Date(timestamp);
            
            drafts.push({
              key,
              timestamp: parsedTimestamp,
              data: parsedData
            });
          } catch (parseError) {
            // Skip invalid drafts
            console.warn(`Invalid draft data for key ${key}:`, parseError);
          }
        }
      }
    }
  } catch (error) {
    console.warn('Failed to get all project drafts:', error);
  }

  return drafts;
}

// Clean up expired drafts
export function cleanupExpiredProjectDrafts(): void {
  if (!isBrowser()) return;

  try {
    const now = new Date();
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(DRAFT_TIMESTAMP_KEY)) {
        const timestamp = localStorage.getItem(key);
        if (timestamp) {
          const draftTime = new Date(timestamp);
          const hoursDiff = (now.getTime() - draftTime.getTime()) / (1000 * 60 * 60);
          
          if (hoursDiff > DRAFT_EXPIRY_HOURS) {
            // Remove both timestamp and data
            localStorage.removeItem(key);
            const dataKey = key.replace(DRAFT_TIMESTAMP_KEY, DRAFT_KEY_PREFIX);
            localStorage.removeItem(dataKey);
          }
        }
      }
    }
  } catch (error) {
    console.warn('Failed to cleanup expired project drafts:', error);
  }
}

// Utility to format draft age for display
export function formatDraftAge(timestamp: Date | string): string {
  const now = new Date();
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return 'unknown time';
  }
  
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }
}

// Convert project data to form data format
export function projectToFormData(project: any): ProjectFormData {
  console.log('Converting project to form data:', project); // Debug log
  
  return {
    name: project.name || "",
    subtitle: "", // Not in model, always empty
    location: project.location || "",
    subLocation: "", // Not in model, always empty
    type: project.type || "",
    status: project.status || "",
    developer: project.developer || "",
    developerSlug: project.developerSlug || "",
    
    // Pricing - Convert from flat structure to object
    price: {
      total: project.price || "",
      totalNumeric: project.priceNumeric || 0,
      currency: "AED"
    },
    
    // Payment Plan - Ensure proper structure
    paymentPlan: {
      booking: project.paymentPlan?.booking || "",
      construction: project.paymentPlan?.construction && Array.isArray(project.paymentPlan.construction) 
        ? project.paymentPlan.construction 
        : [{ milestone: "", percentage: "" }],
      handover: project.paymentPlan?.handover || ""
    },
    
    // Details
    description: project.description || "",
    overview: project.overview || "",
    completionDate: project.completionDate ? 
      (project.completionDate instanceof Date ? 
        project.completionDate.toISOString().split('T')[0] : 
        typeof project.completionDate === 'string' ? project.completionDate.split('T')[0] :
        project.completionDate) : "",
    launchDate: project.launchDate ? 
      (project.launchDate instanceof Date ? 
        project.launchDate.toISOString().split('T')[0] : 
        typeof project.launchDate === 'string' ? project.launchDate.split('T')[0] :
        project.launchDate) : "",
    totalUnits: project.totalUnits || 0,
    
    // Features - Handle arrays properly
    amenities: Array.isArray(project.amenities) ? project.amenities : [],
    unitTypes: Array.isArray(project.unitTypes) ? project.unitTypes : [],
    features: Array.isArray(project.tags) ? project.tags : [], // Map tags to features if exists
    
    // Media
    image: project.image || "",
    gallery: Array.isArray(project.gallery) ? project.gallery : [],
    floorPlan: "", // Not in model
    brochure: "", // Not in model
    
    // Location Details - Ensure proper nested structure
    locationDetails: {
      description: project.locationDetails?.description || "",
      nearby: Array.isArray(project.locationDetails?.nearby) 
        ? project.locationDetails.nearby 
        : [],
      coordinates: {
        latitude: project.locationDetails?.coordinates?.latitude || 0,
        longitude: project.locationDetails?.coordinates?.longitude || 0
      }
    },
    
    // Settings
    categories: Array.isArray(project.categories) ? project.categories : [],
    registrationOpen: project.registrationOpen || false,
    featured: project.featured || false,
    flags: project.flags || {
      elite: false,
      exclusive: false,
      featured: false,
      highValue: false
    },
    
    // System fields
    verified: false, // Not in model
    isActive: project.isActive !== undefined ? project.isActive : true,
    isAvailable: true // Not in model
  };
}