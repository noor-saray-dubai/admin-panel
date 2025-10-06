//components/ui/instant-image-upload.tsx
"use client"

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast-system'
import { 
  Upload, 
  X, 
  Eye, 
  Copy,
  Download,
  AlertCircle,
  CheckCircle,
  Loader2,
  Image as ImageIcon,
  Trash2
} from 'lucide-react'

export interface UploadedImage {
  url: string
  publicId: string
  originalName: string
  size: number
  format: string
}

export interface InstantImageUploadProps {
  mode: 'single' | 'multiple'
  maxFiles?: number
  projectTitle: string // Required - used for folder organization
  imageType: 'cover' | 'gallery' // Required - used for identifier and validation
  existingImages?: string | string[] // URLs of existing images (for edit mode)
  editMode?: boolean // Explicitly indicate if this is edit mode
  onUploadComplete?: (result: UploadedImage | UploadedImage[]) => void
  onUploadStart?: () => void
  onError?: (error: string) => void
  onDelete?: (imageUrl: string) => void // Called when user removes an image
  onReplace?: (oldUrl: string, newResult: UploadedImage | UploadedImage[]) => void // Called when replacing in edit mode
  className?: string
  disabled?: boolean
  acceptedTypes?: string[]
  maxSize?: number // in MB
  title?: string
  description?: string
}

interface UploadingFile {
  file: File
  progress: number
  error?: string
  completed?: boolean
  result?: UploadedImage
}

export function InstantImageUpload({
  mode = 'single',
  maxFiles = 10,
  projectTitle,
  imageType,
  existingImages,
  editMode = false,
  onUploadComplete,
  onUploadStart,
  onError,
  onDelete,
  onReplace,
  className = '',
  disabled = false,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  maxSize = 10, // MB
  title,
  description
}: InstantImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]) // Track original existing URLs
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [deletingImages, setDeletingImages] = useState<Set<number>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  
  // Use custom toast system
  const { success, error, warning, info } = useToast()

  // Initialize existing images with better edit mode handling
  useEffect(() => {
    // Handle existing images for both add and edit modes
    if (existingImages) {
      if (mode === 'single' && typeof existingImages === 'string' && existingImages) {
        const img: UploadedImage = {
          url: existingImages,
          publicId: extractPublicIdFromUrl(existingImages) || '',
          originalName: getFilenameFromUrl(existingImages) || 'uploaded-image',
          size: 0,
          format: extractFormatFromUrl(existingImages) || 'webp'
        }
        setUploadedImages([img])
        
        // Only mark as existing if we're in edit mode
        if (editMode) {
          setExistingImageUrls([existingImages])
        } else {
          setExistingImageUrls([]) // Clear existing URLs in add mode
        }
      } else if (mode === 'multiple' && Array.isArray(existingImages) && existingImages.length > 0) {
        const imgs: UploadedImage[] = existingImages.map((url, index) => ({
          url,
          publicId: extractPublicIdFromUrl(url) || '',
          originalName: getFilenameFromUrl(url) || `uploaded-image-${index + 1}`,
          size: 0,
          format: extractFormatFromUrl(url) || 'webp'
        }))
        setUploadedImages(imgs)
        
        // Only mark as existing if we're in edit mode
        if (editMode) {
          setExistingImageUrls([...existingImages])
        } else {
          setExistingImageUrls([]) // Clear existing URLs in add mode
        }
      } else {
        // No valid images provided, clear everything
        setUploadedImages([])
        setExistingImageUrls([])
      }
    } else {
      // No images provided, clear everything
      setUploadedImages([])
      setExistingImageUrls([])
    }
  }, [existingImages, editMode, mode]) // React to changes in edit mode props

  const extractPublicIdFromUrl = (url: string): string | null => {
    try {
      const match = url.match(/\/v\d+\/(.+)\.(jpg|jpeg|png|webp|gif)$/)
      return match ? match[1] : null
    } catch {
      return null
    }
  }
  
  // Extract filename from URL for better display
  const getFilenameFromUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      const filename = pathname.split('/').pop() || null
      return filename
    } catch {
      return null
    }
  }
  
  // Extract format from URL for display
  const extractFormatFromUrl = (url: string): string | null => {
    try {
      const extension = url.split('.').pop()?.toLowerCase()
      if (extension && ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp'].includes(extension)) {
        return extension === 'jpeg' ? 'jpg' : extension
      }
      return null
    } catch {
      return null
    }
  }

  // Check if a string is a valid image URL
  const isImageUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname.toLowerCase()
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg']
      return imageExtensions.some(ext => pathname.endsWith(ext))
    } catch {
      return false
    }
  }

  // Convert URL to File object by downloading and processing
  const convertUrlToFile = async (url: string): Promise<void> => {
    info('Converting image URL...', undefined, 3000)
    
    try {
      // Validate URL format first
      try {
        new URL(url)
      } catch {
        throw new Error('Invalid URL format')
      }
      
      // Download the image with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
      
      const response = await fetch(url, { 
        mode: 'cors',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ImageUploader/1.0)'
        }
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Image not found (404). Please check the URL.')
        } else if (response.status === 403) {
          throw new Error('Access denied (403). The image may be protected.')
        } else {
          throw new Error(`Failed to download image (${response.status}): ${response.statusText}`)
        }
      }
      
      const blob = await response.blob()
      
      // Check if it's actually an image
      if (!blob.type.startsWith('image/')) {
        throw new Error(`URL contains ${blob.type || 'unknown file type'}, not an image. Please paste a direct image URL.`)
      }
      
      // Check file size
      const fileSizeMB = blob.size / (1024 * 1024)
      if (fileSizeMB > maxSize) {
        throw new Error(`Image from URL is too large (${fileSizeMB.toFixed(1)}MB). Maximum allowed: ${maxSize}MB`)
      }
      
      // Create file name from URL
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      let filename = pathname.split('/').pop() || `pasted-image-${Date.now()}`
      
      // Ensure proper extension
      const extension = blob.type.split('/')[1] || 'jpg'
      if (!filename.includes('.')) {
        filename = `${filename}.${extension}`
      }
      
      // Create File object
      const file = new File([blob], filename, { type: blob.type })
      
      success('✅ Image URL converted successfully!')
      
      // Process the file like any other upload
      await processFiles([file])
      
    } catch (err: any) {
      if (err.name === 'AbortError') {
        error('⏱️ Request timed out. Please try a different image URL.', undefined, 7000)
      } else if (err.message.includes('CORS')) {
        error('🚫 Cannot access image due to CORS restrictions. Try downloading the image and uploading it directly.', undefined, 7000)
      } else if (err.message.includes('Failed to fetch')) {
        error('🌐 Network error. Please check your connection and try again.', undefined, 7000)
      } else {
        error(`❌ Failed to process image URL: ${err.message}`, undefined, 7000)
      }
      
      console.error('Failed to convert URL to image:', err)
    }
  }

  // Enhanced validation with dimension and type checking
  const validateFile = async (file: File): Promise<string | null> => {
    // File type validation with better messaging
    if (!acceptedTypes.includes(file.type)) {
      const supportedFormats = acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')
      return `"${file.name}" is not a supported image format. Please use: ${supportedFormats}`
    }
    
    // File size validation with actionable advice
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxSize) {
      return `"${file.name}" is too large (${fileSizeMB.toFixed(1)}MB). Maximum allowed: ${maxSize}MB. Try compressing the image or using a smaller version.`
    }
    
    // Size warning for very large files with helpful suggestion
    if (fileSizeMB > 5) {
      console.warn(`Large file detected: ${file.name} (${fileSizeMB.toFixed(1)}MB)`) // Log but don't block
      // Don't return error for this - just a performance consideration
    }
    
    // Dimension validation
    try {
      const dimensions = await getImageDimensions(file)
      
      if (imageType === 'cover') {
        // Cover images should be landscape and have good dimensions
        if (dimensions.width < 1200 || dimensions.height < 600) {
          return `"${file.name}" is too small for a cover image. Required: minimum 1200×600px, Current: ${dimensions.width}×${dimensions.height}px. Please use a higher resolution image.`
        }
        
        if (dimensions.width / dimensions.height < 1.5) {
          const currentRatio = (dimensions.width / dimensions.height).toFixed(2)
          return `"${file.name}" should be landscape orientation for cover images. Current ratio: ${currentRatio}:1 (should be at least 1.5:1). Try using a wider image.`
        }
      } else if (imageType === 'gallery') {
        // Gallery images should have decent resolution
        if (dimensions.width < 800 || dimensions.height < 600) {
          return `"${file.name}" resolution is too low for gallery. Required: minimum 800×600px, Current: ${dimensions.width}×${dimensions.height}px. Please use a higher quality image.`
        }
      }
      
    } catch (error) {
      console.warn('Could not validate image dimensions:', error)
      // Don't block upload if dimension check fails
    }
    
    return null
  }
  
  // Helper function to get image dimensions
  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight })
        URL.revokeObjectURL(img.src)
      }
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  const uploadFile = async (file: File, index: number) => {
    // Create proper folder structure: projects/{projectTitle}
    const folder = `projects/${projectTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
    
    // Create identifier: {imageType}-{index} (e.g., "cover-0", "gallery-1")
    const identifier = mode === 'single' ? imageType : `${imageType}-${index}`
    
    // Process image client-side for optimization
    const processedFile = await processImageFile(file)
    
    const formData = new FormData()
    formData.append('file', processedFile)
    formData.append('mode', 'single')
    formData.append('folder', folder)
    formData.append('identifier', identifier)

    try {
      const response = await fetch('/api/upload/images', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Upload failed')
      }

      return result.data as UploadedImage

    } catch (error: any) {
      throw new Error(error.message || 'Network error during upload')
    }
  }
  
  // Add watermark to the canvas
  const addWatermark = async (ctx: CanvasRenderingContext2D, width: number, height: number): Promise<void> => {
    try {
      const watermarkText = 'Noor Saray Real Estate'
      
      // Validate dimensions
      if (width <= 0 || height <= 0) {
        throw new Error('Invalid canvas dimensions for watermark')
      }
      
      // Calculate font size based on image dimensions
      const baseFontSize = Math.min(width, height) * 0.03 // 3% of the smaller dimension
      const fontSize = Math.max(16, Math.min(baseFontSize, 48)) // Between 16px and 48px
      
      // Save current context state
      ctx.save()
      
      // Set text properties with fallbacks
      try {
        ctx.font = `bold ${fontSize}px Arial, sans-serif`
      } catch {
        ctx.font = `${fontSize}px Arial` // Fallback if bold fails
      }
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)' // Semi-transparent white
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)' // Semi-transparent black outline
      ctx.lineWidth = Math.max(1, fontSize * 0.05) // Outline width based on font size
      ctx.textAlign = 'right'
      ctx.textBaseline = 'bottom'
      
      // Position watermark in bottom-right corner with padding
      const padding = Math.max(20, fontSize * 0.5)
      const x = width - padding
      const y = height - padding
      
      // Add a subtle shadow for extra visibility
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2
      ctx.shadowBlur = 4
      
      // Draw text with outline for better visibility
      ctx.strokeText(watermarkText, x, y)
      ctx.fillText(watermarkText, x, y)
      
      // Restore context state
      ctx.restore()
      
    } catch (error) {
      console.error('Error adding watermark:', error)
      throw new Error(`Failed to add watermark: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Client-side image processing for compression and format optimization
  const processImageFile = async (file: File): Promise<File> => {
    let imgObjectUrl: string | null = null
    
    try {
      // Validate file before processing
      if (!file.type.startsWith('image/')) {
        throw new Error('File is not an image')
      }
      
      // Create canvas for image processing
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        console.warn('Canvas not supported, using original file')
        return file
      }
      
      // Load image with error handling
      const img = new Image()
      imgObjectUrl = URL.createObjectURL(file)
      
      const imageLoadPromise = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = (e) => {
          console.error('Failed to load image for processing:', e)
          reject(new Error('Failed to load image for processing'))
        }
        // Add timeout for image loading
        setTimeout(() => reject(new Error('Image loading timeout')), 10000)
      })
      
      img.src = imgObjectUrl
      await imageLoadPromise
      
      // Calculate optimal dimensions
      let { width, height } = img
      const maxWidth = imageType === 'cover' ? 1920 : 1200
      const maxHeight = imageType === 'cover' ? 1080 : 800
      
      // Resize if needed
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      
      // Set canvas size and draw image
      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)
      
      // Add watermark with error handling
      try {
        await addWatermark(ctx, width, height)
      } catch (watermarkError) {
        console.warn('Failed to add watermark, continuing without it:', watermarkError)
        // Continue with upload even if watermark fails
      }
      
      // Convert to WebP with compression
      const quality = imageType === 'cover' ? 0.85 : 0.8
      
      return new Promise<File>((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const processedFile = new File(
                [blob], 
                file.name.replace(/\.[^/.]+$/, '.webp'),
                { type: 'image/webp' }
              )
              resolve(processedFile)
            } else {
              // Fallback to original file if processing fails
              resolve(file)
            }
          },
          'image/webp',
          quality
        )
      })
      
    } catch (error) {
      console.warn('Image processing failed, using original:', error)
      return file
    } finally {
      if (imgObjectUrl) {
        URL.revokeObjectURL(imgObjectUrl)
      }
    }
  }

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    
    // Check file limit for multiple mode with better feedback
    if (mode === 'multiple') {
      const availableSlots = maxFiles - uploadedImages.length
      
      if (availableSlots === 0) {
        error(`You've reached the maximum limit of ${maxFiles} images. Please remove some images to add new ones.`, undefined, 5000)
        return
      }
      
      if (fileArray.length > availableSlots) {
        warning(`You can only add ${availableSlots} more image(s). Currently have ${uploadedImages.length}/${maxFiles}. Only the first ${availableSlots} file(s) will be uploaded.`, undefined, 6000)
        // Truncate files to available slots
        fileArray.splice(availableSlots)
      }
    }
    
    // For single mode, handle replacement gracefully
    if (mode === 'single') {
      if (uploadedImages.length > 0 && fileArray.length > 0) {
        info('Replacing existing image with new upload...', undefined, 3000)
      }
      
      if (fileArray.length > 1) {
        info('Single mode: Only the first file will be uploaded.', undefined, 3000)
      }
    }
    
    const filesToProcess = mode === 'single' ? fileArray.slice(0, 1) : fileArray

    // Validate all files first (now async)
    const validationResults = await Promise.all(
      filesToProcess.map(async (file, i) => ({
        file,
        error: await validateFile(file),
        index: i
      }))
    )
    
    const validationErrors = validationResults.filter(item => item.error)

    if (validationErrors.length > 0) {
      // Show a summary toast first if multiple errors
      if (validationErrors.length > 1) {
        error(`${validationErrors.length} files couldn't be uploaded due to validation errors. Check details below.`, undefined, 4000)
      }
      
      // Show detailed errors for each file
      validationErrors.forEach(({ error: validationError, index, file }) => {
        error(validationError!, undefined, 7000) // Longer duration for reading
      })
      
      // If all files failed validation, return early
      if (validationErrors.length === filesToProcess.length) {
        return
      }
      
      // Continue with valid files only
      const validFiles = filesToProcess.filter((_, index) => 
        !validationResults[index].error
      )
      
      if (validFiles.length === 0) {
        return
      }
      
      // Update filesToProcess to only include valid files
      filesToProcess.length = 0
      filesToProcess.push(...validFiles)
      
      success(`${validFiles.length} file(s) passed validation and will be uploaded.`, undefined, 3000)
    }

    // Initialize uploading state
    const initialUploadingFiles: UploadingFile[] = filesToProcess.map(file => ({
      file,
      progress: 0,
      completed: false
    }))

    setUploadingFiles(initialUploadingFiles)
    onUploadStart?.()

    // Handle replacement logic for edit mode
    let oldUrls: string[] = []
    if (editMode && mode === 'single') {
      // In single edit mode, store old URL for replacement callback
      oldUrls = uploadedImages.map(img => img.url)
      setUploadedImages([])
    } else if (!editMode && mode === 'single') {
      // In single add mode, clear existing images
      setUploadedImages([])
    }

    // Upload files
    const uploadPromises = filesToProcess.map(async (file, index) => {
      try {
        // Update progress to show upload started
        setUploadingFiles(prev => 
          prev.map((item, i) => 
            i === index ? { ...item, progress: 10 } : item
          )
        )

        const result = await uploadFile(file, index)

        // Update progress to completed
        setUploadingFiles(prev => 
          prev.map((item, i) => 
            i === index ? { ...item, progress: 100, completed: true, result } : item
          )
        )

        return result

      } catch (error: any) {
        // Update with error
        setUploadingFiles(prev => 
          prev.map((item, i) => 
            i === index ? { ...item, error: error.message, completed: true } : item
          )
        )

        onError?.(error.message)
        error(`Failed to upload ${file.name}: ${error.message}`, undefined, 7000)
        return null
      }
    })

    // Wait for all uploads to complete
    const results = await Promise.all(uploadPromises)
    const successfulUploads = results.filter((result): result is UploadedImage => result !== null)

    if (successfulUploads.length > 0) {
      setUploadedImages(prev => [...prev, ...successfulUploads])
      
      // Handle callbacks based on mode and edit status
      if (editMode) {
        // In edit mode, call replacement callback if available, otherwise normal callback
        if (mode === 'single' && successfulUploads[0] && oldUrls.length > 0) {
          onReplace?.(oldUrls[0], successfulUploads[0])
          success('Image replaced successfully')
        } else if (mode === 'multiple') {
          // For multiple mode in edit, this is adding to existing
          onUploadComplete?.(successfulUploads)
          success(`Successfully added ${successfulUploads.length} file(s)`)
        } else {
          onUploadComplete?.(mode === 'single' ? successfulUploads[0] : successfulUploads)
          success(`Successfully uploaded ${successfulUploads.length} file(s)`)
        }
      } else {
        // In add mode, use normal completion callback
        if (mode === 'single' && successfulUploads[0]) {
          onUploadComplete?.(successfulUploads[0])
        } else if (mode === 'multiple') {
          onUploadComplete?.(successfulUploads)
        }
        success(`Successfully uploaded ${successfulUploads.length} file(s)`)
      }
    }

    // Clear uploading state after a delay to show completion
    setTimeout(() => {
      setUploadingFiles([])
    }, 2000)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      processFiles(files)
    }
    // Reset input value to allow re-selecting the same file
    event.target.value = ''
  }

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)

    const files = event.dataTransfer.files
    if (files && files.length > 0) {
      processFiles(files)
    }
  }, [])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    // Only set drag over to false if we're leaving the drop zone itself
    if (!dropZoneRef.current?.contains(event.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }, [])

  const handlePaste = useCallback(async (event: ClipboardEvent) => {
    // Don't interfere if user is typing in an input field
    const activeElement = document.activeElement
    if (activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' || 
      activeElement.getAttribute('contenteditable') === 'true'
    )) {
      return // Let the default paste behavior work
    }

    const items = event.clipboardData?.items
    if (!items) return

    const imageFiles: File[] = []
    let urlText = ''
    
    // Check for image files first
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          imageFiles.push(file)
        }
      } else if (item.type === 'text/plain') {
        // Get text content to check for URLs
        urlText = await new Promise(resolve => {
          item.getAsString(resolve)
        })
      }
    }

    // Process image files if found
    if (imageFiles.length > 0) {
      event.preventDefault()
      info('📋 Pasted image from clipboard', undefined, 2000)
      processFiles(imageFiles)
      return
    }

    // Process URL if it looks like an image URL
    if (urlText && isImageUrl(urlText)) {
      event.preventDefault()
      info('🔗 Pasting image from URL', undefined, 2000)
      await convertUrlToFile(urlText)
    }
  }, [])

  // Add paste event listener
  useEffect(() => {
    if (!disabled) {
      document.addEventListener('paste', handlePaste)
      return () => document.removeEventListener('paste', handlePaste)
    }
  }, [handlePaste, disabled])

  const deleteImage = async (image: UploadedImage, index: number) => {
    const isExistingImage = existingImageUrls.includes(image.url)
    
    // Instant UI feedback - remove from UI immediately
    setDeletingImages(prev => new Set(prev).add(index))
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
    
    // Call delete callback immediately for instant form update
    onDelete?.(image.url)
    
    if (isExistingImage && editMode) {
      // For existing images in edit mode, we typically don't delete from Cloudinary
      // The parent component should handle the removal from their data
      success('Image removed from selection')
      
      // Clean up deletion state
      setDeletingImages(prev => {
        const newSet = new Set(prev)
        newSet.delete(index)
        return newSet
      })
      return
    }
    
    // For newly uploaded images, attempt to delete from Cloudinary
    try {
      if (image.publicId) {
        const response = await fetch(`/api/upload/images?publicId=${encodeURIComponent(image.publicId)}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          const result = await response.json()
          throw new Error(result.message || 'Failed to delete from cloud storage')
        }
        
        success('Image deleted successfully')
      } else {
        // If no publicId, just remove from UI (shouldn't happen for uploaded images)
        success('Image removed')
      }

    } catch (err: any) {
      // If deletion from Cloudinary fails, add image back to UI
      console.error('Failed to delete from Cloudinary:', err)
      setUploadedImages(prev => {
        const newImages = [...prev]
        newImages.splice(index, 0, image) // Add back at original position
        return newImages
      })
      
      error('Failed to delete from cloud storage, but removed from form')
    } finally {
      setDeletingImages(prev => {
        const newSet = new Set(prev)
        newSet.delete(index)
        return newSet
      })
    }
  }


  const copyImageUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    success('Image URL copied to clipboard')
  }

  const downloadImage = (url: string, name: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = name || 'image'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Title and Description */}
      {(title || description) && (
        <div>
          {title && (
            <h3 className="text-lg font-semibold mb-1">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {/* Upload Area */}
      <div
        ref={dropZoneRef}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/10' 
            : mode === 'multiple' && uploadedImages.length >= maxFiles
              ? 'border-red-300 bg-red-50 dark:bg-red-950/10 cursor-not-allowed'
              : 'border-gray-300 hover:border-gray-400 cursor-pointer'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => {
          if (disabled) return
          if (mode === 'multiple' && uploadedImages.length >= maxFiles) {
            error(`Maximum ${maxFiles} images reached. Remove some images to add new ones.`)
            return
          }
          fileInputRef.current?.click()
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          multiple={mode === 'multiple'}
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
        />

        <div className="flex flex-col items-center space-y-2">
          <div className={`
            p-3 rounded-full transition-colors
            ${isDragOver 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
            }
          `}>
            <Upload className="h-6 w-6" />
          </div>
          
          <div>
            <p className="text-sm font-medium">
              {isDragOver 
                ? 'Drop files here' 
                : mode === 'multiple' && uploadedImages.length >= maxFiles
                  ? `Maximum ${maxFiles} files reached`
                  : 'Click to upload or drag & drop'
              }
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {mode === 'multiple' && uploadedImages.length >= maxFiles 
                ? 'Remove some images to add new ones'
                : `${acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')} up to ${maxSize}MB each`
              }
              {mode === 'multiple' && uploadedImages.length < maxFiles && ` (${uploadedImages.length}/${maxFiles} files)`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {imageType === 'cover' 
                ? 'Cover images: Minimum 1200×600px, landscape orientation preferred'
                : 'Gallery images: Minimum 800×600px, any orientation'
              }
            </p>
            {!(mode === 'multiple' && uploadedImages.length >= maxFiles) && (
              <p className="text-xs text-muted-foreground mt-1">
                ✨ Drag & drop, click to browse, or paste anywhere (Ctrl+V) for images/URLs
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Uploading Files Progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploading...</h4>
          {uploadingFiles.map((uploadingFile, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <ImageIcon className="h-8 w-8 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium truncate">{uploadingFile.file.name}</p>
                  <div className="flex items-center space-x-2">
                    {uploadingFile.completed && !uploadingFile.error && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {uploadingFile.error && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    {!uploadingFile.completed && !uploadingFile.error && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Progress value={uploadingFile.progress} className="flex-1" />
                  <span className="text-xs text-muted-foreground">
                    {uploadingFile.progress}%
                  </span>
                </div>
                
                {uploadingFile.error && (
                  <p className="text-xs text-red-500 mt-1">{uploadingFile.error}</p>
                )}
                
                {uploadingFile.completed && uploadingFile.result && (
                  <p className="text-xs text-green-600 mt-1">
                    Upload successful • {formatFileSize(uploadingFile.result.size)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Images */}
      {uploadedImages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              Uploaded Images ({uploadedImages.length})
            </h4>
            {mode === 'multiple' && uploadedImages.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {uploadedImages.length}/{maxFiles}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {uploadedImages.map((image, index) => {
              const isExistingImage = existingImageUrls.includes(image.url)
              return (
                <div key={index} className={`relative group rounded-lg overflow-hidden ${
                  isExistingImage 
                    ? 'border-2 border-blue-200 dark:border-blue-700' 
                    : 'border border-gray-200 dark:border-gray-700'
                }`}>
                  <div className="aspect-square relative">
                    <img
                      src={image.url}
                      alt={image.originalName}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Existing image badge */}
                    {isExistingImage && editMode && (
                      <Badge 
                        variant="secondary" 
                        className="absolute top-2 left-2 bg-blue-100 text-blue-800 text-xs"
                      >
                        Existing
                      </Badge>
                    )}
                    
                    {/* New image badge */}
                    {!isExistingImage && editMode && (
                      <Badge 
                        variant="secondary" 
                        className="absolute top-2 left-2 bg-green-100 text-green-800 text-xs"
                      >
                        New
                      </Badge>
                    )}
                    
                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setPreviewImage(image.url)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => copyImageUrl(image.url)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => downloadImage(image.url, image.originalName)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteImage(image, index)}
                          title={isExistingImage && editMode ? 'Remove from selection' : 'Delete permanently'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Delete button always visible on mobile */}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 h-6 w-6 p-0 sm:hidden"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteImage(image, index)
                      }}
                      title={isExistingImage && editMode ? 'Remove from selection' : 'Delete permanently'}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {/* Image info */}
                  <div className="p-2">
                    <p className="text-xs font-medium truncate">{image.originalName}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground">
                        {image.size > 0 ? formatFileSize(image.size) : 'Size unknown'}
                      </p>
                      <div className="flex items-center space-x-1">
                        <Badge variant="outline" className="text-xs">
                          {image.format.toUpperCase()}
                        </Badge>
                        {isExistingImage && editMode && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600">
                            Existing
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <Button
            variant="secondary"
            className="absolute top-4 right-4 z-10"
            onClick={() => setPreviewImage(null)}
          >
            <X className="h-4 w-4" />
          </Button>
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}