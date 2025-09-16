

import Project from "@/models/project";
import Plot from "@/models/plots";

/**
 * Create URL-friendly slug from text with advanced sanitization
 */
export function createSlug(text: string, options?: {
  maxLength?: number;
  preserveCase?: boolean;
  separator?: string;
}): string {
  const { maxLength = 100, preserveCase = false, separator = '-' } = options || {};
  
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid input: text must be a non-empty string');
  }

  let slug = text.trim();
  
  // Remove HTML tags if any
  slug = slug.replace(/<[^>]*>/g, '');
  
  // Convert to lowercase unless preserveCase is true
  if (!preserveCase) {
    slug = slug.toLowerCase();
  }
  
  // Replace special characters and accented characters
  slug = slug
    // Replace accented characters with their base equivalents
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Replace ampersands with 'and'
    .replace(/&/g, 'and')
    // Replace @ with 'at'
    .replace(/@/g, 'at')
    // Remove all non-alphanumeric characters except spaces and hyphens
    .replace(/[^\w\s-]/g, '')
    // Replace multiple spaces/underscores/hyphens with single separator
    .replace(/[\s_-]+/g, separator)
    // Remove leading/trailing separators
    .replace(new RegExp(`^${separator}+|${separator}+$`, 'g'), '');
  
  // Truncate if too long, ensuring we don't cut in the middle of a word
  if (slug.length > maxLength) {
    const truncated = slug.substring(0, maxLength);
    const lastSeparator = truncated.lastIndexOf(separator);
    
    // If we have a separator within reasonable distance, cut there
    if (lastSeparator > maxLength * 0.7) {
      slug = truncated.substring(0, lastSeparator);
    } else {
      slug = truncated;
    }
    
    // Remove trailing separator
    slug = slug.replace(new RegExp(`${separator}+$`), '');
  }
  
  // Ensure slug is not empty
  if (!slug) {
    slug = 'item';
  }
  
  return slug;
}

/**
 * Generate unique slug by checking database and appending number if needed
 */
export async function generateUniqueSlug(
  text: string, 
  excludeId?: string,
  options?: {
    maxLength?: number;
    maxAttempts?: number;
    separator?: string;
  }
): Promise<string> {
  const { maxLength = 100, maxAttempts = 100, separator = '-' } = options || {};
  
  // Create base slug
  const baseSlug = createSlug(text, { maxLength: maxLength - 10, separator }); // Reserve space for numbers
  
  let slug = baseSlug;
  let attempt = 1;
  
  while (attempt <= maxAttempts) {
    // Check if slug exists in database
    const query: any = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const existingProject = await Project.findOne(query);
    
    if (!existingProject) {
      return slug;
    }
    
    // Generate new slug with number
    attempt++;
    slug = `${baseSlug}${separator}${attempt}`;
  }
  
  throw new Error(`Could not generate unique slug after ${maxAttempts} attempts`);
}

/**
 * Generate slug for developer with consistency checks
 */
export async function generateDeveloperSlug(developerName: string): Promise<string> {
  const baseSlug = createSlug(developerName, { maxLength: 80 });
  
  // Check if we already have this developer slug
  const existing = await Project.findOne({ developerSlug: baseSlug });
  
  if (!existing) {
    return baseSlug;
  }
  
  // If it exists, return the existing one for consistency
  // All projects from the same developer should have the same developerSlug
  return existing.developerSlug;
}

/**
 * Generate status slug with predefined mappings for consistency
 */
export function generateStatusSlug(status: string): string {
  // Predefined mappings for common status values to ensure consistency
  const statusMappings: Record<string, string> = {
    'Pre-Launch': 'pre-launch',
    'Pre Launch': 'pre-launch',
    'PreLaunch': 'pre-launch',
    'Launched': 'launched',
    'Launch': 'launched',
    'Under Construction': 'under-construction',
    'Under-Construction': 'under-construction',
    'UnderConstruction': 'under-construction',
    'Construction': 'under-construction',
    'Ready to Move': 'ready-to-move',
    'Ready-to-Move': 'ready-to-move',
    'ReadyToMove': 'ready-to-move',
    'Ready': 'ready-to-move',
    'Completed': 'completed',
    'Complete': 'completed',
    'Sold Out': 'sold-out',
    'Sold-Out': 'sold-out',
    'SoldOut': 'sold-out'
  };
  
  // Check if we have a predefined mapping
  const normalizedStatus = status.trim();
  if (statusMappings[normalizedStatus]) {
    return statusMappings[normalizedStatus];
  }
  
  // Fallback to regular slug generation
  return createSlug(normalizedStatus, { maxLength: 50 });
}

/**
 * Generate location slug with special handling for common location formats
 */
export function generateLocationSlug(location: string): string {
  let cleanLocation = location.trim();
  
  // Handle common location format patterns
  cleanLocation = cleanLocation
    // Remove common prefixes/suffixes
    .replace(/^(Greater |New |Old |North |South |East |West )/i, '')
    .replace(/ (City|Town|Area|Region|District|Zone)$/i, '')
    // Handle parenthetical information
    .replace(/\s*\([^)]*\)/g, '')
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
  
  return createSlug(cleanLocation, { maxLength: 60 });
}

/**
 * Validate slug format
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') {
    return false;
  }
  
  // Check format: only lowercase letters, numbers, and hyphens
  const slugRegex = /^[a-z0-9-]+$/;
  if (!slugRegex.test(slug)) {
    return false;
  }
  
  // Check length
  if (slug.length < 1 || slug.length > 150) {
    return false;
  }
  
  // Should not start or end with hyphen
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return false;
  }
  
  // Should not have consecutive hyphens
  if (slug.includes('--')) {
    return false;
  }
  
  return true;
}

/**
 * Update all related slugs when project data changes
 */
export async function updateProjectSlugs(
  projectData: any,
  existingProject?: any
): Promise<{
  slug: string;
  statusSlug: string;
  locationSlug: string;
  developerSlug: string;
}> {
  const updates: any = {};
  
  // Update main slug if name changed
  if (!existingProject || existingProject.name !== projectData.name) {
    updates.slug = await generateUniqueSlug(
      projectData.name, 
      existingProject?._id?.toString()
    );
    updates.id = updates.slug; // Keep id in sync with slug
  } else {
    updates.slug = existingProject.slug;
    updates.id = existingProject.id;
  }
  
  // Update status slug if status changed
  if (!existingProject || existingProject.status !== projectData.status) {
    updates.statusSlug = generateStatusSlug(projectData.status);
  } else {
    updates.statusSlug = existingProject.statusSlug;
  }
  
  // Update location slug if location changed
  if (!existingProject || existingProject.location !== projectData.location) {
    updates.locationSlug = generateLocationSlug(projectData.location);
  } else {
    updates.locationSlug = existingProject.locationSlug;
  }
  
  // Update developer slug (with consistency check)
  if (!existingProject || existingProject.developer !== projectData.developer) {
    updates.developerSlug = await generateDeveloperSlug(projectData.developer);
  } else {
    updates.developerSlug = existingProject.developerSlug;
  }
  
  return updates;
}

/**
 * Batch update slugs for existing projects (useful for migrations)
 */
/**
 * Generate unique plot slug by checking database
 */
export async function generateUniquePlotSlug(
  text: string, 
  excludeId?: string,
  options?: {
    maxLength?: number;
    maxAttempts?: number;
    separator?: string;
  }
): Promise<string> {
  const { maxLength = 100, maxAttempts = 100, separator = '-' } = options || {};
  
  // Create base slug
  const baseSlug = createSlug(text, { maxLength: maxLength - 10, separator }); // Reserve space for numbers
  
  let slug = baseSlug;
  let attempt = 1;
  
  while (attempt <= maxAttempts) {
    // Check if slug exists in database
    const query: any = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const existingPlot = await Plot.findOne(query);
    
    if (!existingPlot) {
      return slug;
    }
    
    // Generate new slug with number
    attempt++;
    slug = `${baseSlug}${separator}${attempt}`;
  }
  
  throw new Error(`Could not generate unique plot slug after ${maxAttempts} attempts`);
}

/**
 * Update all related slugs when plot data changes
 */
export async function updatePlotSlugs(
  plotData: any,
  existingPlot?: any
): Promise<{
  slug: string;
}> {
  const updates: any = {};
  
  // Update main slug if title changed (plots use title instead of name)
  if (!existingPlot || existingPlot.title !== plotData.title) {
    updates.slug = await generateUniquePlotSlug(
      plotData.title || plotData.plotNumber || plotData.plotId, 
      existingPlot?._id?.toString()
    );
  } else {
    updates.slug = existingPlot.slug;
  }
  
  return updates;
}

export async function batchUpdateSlugs(limit: number = 50): Promise<{
  updated: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let updated = 0;
  
  try {
    const projects = await Project.find({}).limit(limit);
    
    for (const project of projects) {
      try {
        const updates = await updateProjectSlugs(project, project);
        
        // Only update if something changed
        const slugKeys: Array<keyof typeof updates> = ['slug', 'statusSlug', 'locationSlug', 'developerSlug'];
        const hasChanges = slugKeys.some(
          key => updates[key] !== project[key]
        );
        
        if (hasChanges) {
          await Project.updateOne({ _id: project._id }, updates);
          updated++;
        }
      } catch (error: any) {
        errors.push(`Project ${project._id}: ${error.message}`);
      }
    }
  } catch (error: any) {
    errors.push(`Batch operation failed: ${error.message}`);
  }
  
  return { updated, errors };
}
