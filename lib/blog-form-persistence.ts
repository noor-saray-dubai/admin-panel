"use client"

interface BlogFormData {
  title: string
  excerpt: string
  contentBlocks: any[]
  featuredImage: File | null
  author: string
  category: string
  tags: string[]
  status: "Published" | "Draft"
  publishDate: string
  featured: boolean
}

const STORAGE_KEY = 'blog_form_draft'
const TIMESTAMP_KEY = 'blog_form_draft_timestamp'

/**
 * Save blog form draft to localStorage
 */
export function saveBlogFormDraft(data: BlogFormData): void {
  try {
    // Create a serializable version of the data (without File objects)
    const serializableData = {
      ...data,
      featuredImage: null, // Don't persist File objects
      contentBlocks: data.contentBlocks.map(block => ({
        ...block,
        file: undefined // Remove File objects from image blocks
      }))
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializableData))
    localStorage.setItem(TIMESTAMP_KEY, new Date().toISOString())
  } catch (error) {
    console.error('Failed to save blog form draft:', error)
  }
}

/**
 * Load blog form draft from localStorage
 */
export function loadBlogFormDraft(): BlogFormData | null {
  try {
    const draftData = localStorage.getItem(STORAGE_KEY)
    if (!draftData) return null
    
    return JSON.parse(draftData)
  } catch (error) {
    console.error('Failed to load blog form draft:', error)
    return null
  }
}

/**
 * Clear blog form draft from localStorage
 */
export function clearBlogFormDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(TIMESTAMP_KEY)
  } catch (error) {
    console.error('Failed to clear blog form draft:', error)
  }
}

/**
 * Check if there's a saved blog form draft
 */
export function hasSavedBlogDraft(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null
  } catch (error) {
    console.error('Failed to check for blog form draft:', error)
    return false
  }
}

/**
 * Get the timestamp when the draft was last saved
 */
export function getBlogDraftTimestamp(): Date | null {
  try {
    const timestamp = localStorage.getItem(TIMESTAMP_KEY)
    return timestamp ? new Date(timestamp) : null
  } catch (error) {
    console.error('Failed to get blog draft timestamp:', error)
    return null
  }
}

/**
 * Create a debounced save function for auto-saving drafts
 */
export function createDebouncedBlogSave(delay: number = 3000) {
  let timeoutId: NodeJS.Timeout

  return (data: BlogFormData) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      saveBlogFormDraft(data)
    }, delay)
  }
}

/**
 * Convert Blog model data to form data format
 */
export function blogToFormData(blog: any): BlogFormData {
  return {
    title: blog.title || '',
    excerpt: blog.excerpt || '',
    contentBlocks: blog.contentBlocks || [],
    featuredImage: null, // Files can't be restored from saved data
    author: blog.author || '',
    category: blog.category || '',
    tags: blog.tags || [],
    status: blog.status || 'Published',
    publishDate: blog.publishDate ? blog.publishDate.slice(0, 16) : new Date().toISOString().slice(0, 16),
    featured: blog.featured || false
  }
}

/**
 * Check if form data has changed significantly (for unsaved changes detection)
 */
export function hasFormDataChanged(current: BlogFormData, initial: BlogFormData): boolean {
  // Compare key fields that indicate meaningful changes
  const fieldsToCompare: (keyof BlogFormData)[] = [
    'title', 'excerpt', 'author', 'category', 'status', 'featured'
  ]
  
  // Check simple fields
  for (const field of fieldsToCompare) {
    if (current[field] !== initial[field]) {
      return true
    }
  }
  
  // Check arrays
  if (JSON.stringify(current.tags) !== JSON.stringify(initial.tags)) {
    return true
  }
  
  if (JSON.stringify(current.contentBlocks) !== JSON.stringify(initial.contentBlocks)) {
    return true
  }
  
  // Check if featured image was added/removed
  if (Boolean(current.featuredImage) !== Boolean(initial.featuredImage)) {
    return true
  }
  
  return false
}