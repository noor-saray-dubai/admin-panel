import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number with commas for thousands separation
 * @param num - The number to format
 * @returns Formatted number string
 */
export function formatNumber(num: number): string {
  if (num === undefined || num === null || isNaN(num)) {
    return "0"
  }
  return num.toLocaleString()
}

/**
 * Format a currency amount with proper currency symbol and formatting
 * @param amount - The amount to format
 * @param currency - The currency code (default: "AED")
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = "AED"): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return `${currency} 0`
  }
  
  // For very large amounts, use abbreviated format
  if (amount >= 1000000000) {
    return `${currency} ${(amount / 1000000000).toFixed(1)}B`
  } else if (amount >= 1000000) {
    return `${currency} ${(amount / 1000000).toFixed(1)}M`
  } else if (amount >= 1000) {
    return `${currency} ${(amount / 1000).toFixed(1)}K`
  } else {
    return `${currency} ${amount.toLocaleString()}`
  }
}

/**
 * Format a price range with currency
 * @param min - Minimum price
 * @param max - Maximum price  
 * @param currency - The currency code (default: "AED")
 * @returns Formatted price range string
 */
export function formatPriceRange(min: number, max: number, currency: string = "AED"): string {
  if (min === max) {
    return formatCurrency(min, currency)
  }
  return `${formatCurrency(min, currency)} - ${formatCurrency(max, currency)}`
}

/**
 * Convert a string to a URL-friendly slug
 * @param text - The text to convert
 * @returns URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove duplicate hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Truncate text to a specified length
 * @param text - The text to truncate
 * @param length - Maximum length
 * @param suffix - Suffix to add when truncated (default: "...")
 * @returns Truncated text
 */
export function truncateText(text: string, length: number, suffix: string = "..."): string {
  if (!text || text.length <= length) {
    return text || ""
  }
  return text.substring(0, length).trim() + suffix
}

/**
 * Check if a string is a valid URL
 * @param url - The URL to validate
 * @returns True if valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return url.startsWith('http://') || url.startsWith('https://')
  } catch {
    return false
  }
}

/**
 * Get file extension from filename or URL
 * @param filename - The filename or URL
 * @returns File extension in lowercase
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

/**
 * Format file size in human readable format
 * @param bytes - Size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
