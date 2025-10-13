"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback, JSX } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
  Upload, X, Eye, Star, Calendar, User, Tag, FileText, 
  GripVertical, Plus, Bold, Italic, Link, Type, Image as ImageIcon,
  Quote, List, Hash, Trash2, Copy, AlertCircle, MoveUp, MoveDown,
  ChevronLeft, ChevronRight, Info, Settings, Palette
} from "lucide-react"

// Import new step components
import { BlogFormStepNavigation } from "./blog/BlogFormStepNavigation"
import { BasicInfoStep } from "./blog/steps/BasicInfoStep"
import { ContentCreationStep } from "./blog/steps/ContentCreationStep"
import { MediaTagsStep } from "./blog/steps/MediaTagsStep"
import { PublishingStep } from "./blog/steps/PublishingStep"

// Import dialog components
import { DraftRestoreDialog } from "./blog/DraftRestoreDialog"
import { ConfirmationDialogs } from "./blog/ConfirmationDialogs"

// Import draft management utilities
import {
  saveBlogFormDraft,
  loadBlogFormDraft,
  clearBlogFormDraft,
  hasSavedBlogDraft,
  getBlogDraftTimestamp,
  createDebouncedBlogSave,
  blogToFormData,
  hasFormDataChanged
} from "@/lib/blog-form-persistence"
interface ApiError {
  message: string
  error: string
  errors?: Record<string, string[]>
}
// Types matching your schema
interface ITextFormatting {
  bold: boolean
  italic: boolean
  color: string
}

interface ITextSegment extends ITextFormatting {
  type: "text"
  content: string
}

interface ILinkSegment extends ITextFormatting {
  type: "link"
  content: string
  url: string
}

type IContentSegment = ITextSegment | ILinkSegment

interface IListItem {
  text: string
  subItems?: string[]
}

interface IParagraphBlock {
  type: "paragraph"
  order: number
  content: IContentSegment[]
}

interface IHeadingBlock extends ITextFormatting {
  type: "heading"
  order: number
  level: 1 | 2 | 3 | 4 | 5 | 6
  content: string
}

interface IImageBlock {
  type: "image"
  order: number
  url: string
  alt: string
  caption?: string
  file?: File // For new uploads
}

interface ILinkBlock extends ITextFormatting {
  type: "link"
  order: number
  url: string
  coverText: string
}

interface IQuoteBlock {
  type: "quote"
  order: number
  content: IContentSegment[]
  author?: string
  source?: string
}

interface IListBlock extends ITextFormatting {
  type: "list"
  order: number
  listType: "ordered" | "unordered" | "plain" // Aligned with schema
  title: string
  items: IListItem[]
}

type IContentBlock = IParagraphBlock | IHeadingBlock | IImageBlock | ILinkBlock | IQuoteBlock | IListBlock

interface Blog {
  _id?: string
  title: string
  slug?: string
  excerpt: string
  contentBlocks: IContentBlock[]
  featuredImage?: string
  author: string
  category: string
  tags: string[]
  status: "Published" | "Draft" | "Scheduled" // Aligned with schema and API
  publishDate: string | Date
  readTime: number // This will be auto-calculated by API
  views: number // Include views field
  featured: boolean
  createdBy: {
    email: string
    timestamp: Date | string
    ipAddress?: string
    userAgent?: string
  }
  updatedBy: {
    email: string
    timestamp: Date | string
    ipAddress?: string
    userAgent?: string
  }
  version: number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

interface BlogFormData {
  title: string
  excerpt: string
  contentBlocks: IContentBlock[]
  featuredImage: File | null
  author: string
  category: string
  tags: string[]
  status: "Published" | "Draft" // Aligned with schema and API
  publishDate: string
  // readTime removed - will be auto-calculated by API
  featured: boolean
}

interface BlogFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (blog: Blog) => void
  blog?: Blog | null
  mode: "add" | "edit"
}

interface FieldErrors {
  [key: string]: string
}

const categories = ["Investment", "Development", "Legal", "Sustainability", "Market Analysis", "Lifestyle", "News"]

// Step configuration for multi-step form
interface BlogFormStep {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

const blogFormSteps: BlogFormStep[] = [
  { id: "basic", title: "Basic Info", icon: Info, description: "Title, excerpt, author, category" },
  { id: "content", title: "Content Creation", icon: FileText, description: "Create your blog content blocks" },
  { id: "media", title: "Media & Tags", icon: Palette, description: "Featured image and tags" },
  { id: "publishing", title: "Publishing", icon: Settings, description: "Status, publish date, featured" }
]

// Character limits from schema
const LIMITS = {
  title: 200,
  excerpt: 500,
  headingContent: 200,
  textSegmentContent: 2000, // Aligned with schema limit
  linkSegmentContent: 2000, // Aligned with schema limit
  imageAlt: 200,
  imageCaption: 300,
  linkBlockCoverText: 200,
  quoteAuthor: 100,
  quoteSource: 200,
  listTitle: 200,
  listItemText: 300,
  listSubItemText: 300
}

const MAX_BLOCKS = 50 // Aligned with schema limit
const MAX_PARAGRAPH_SEGMENTS = 50
const MAX_QUOTE_SEGMENTS = 30
const MAX_LIST_ITEMS = 20

// Validation functions
const validateField = (field: string, value: any, formData?: BlogFormData): string => {
  switch (field) {
    case 'title':
      if (!value || !value.toString().trim()) return 'Title is required'
      if (value.toString().length > LIMITS.title) return `Title cannot exceed ${LIMITS.title} characters`
      return ''
    case 'excerpt':
      if (!value || !value.toString().trim()) return 'Excerpt is required'
      if (value.toString().length > LIMITS.excerpt) return `Excerpt cannot exceed ${LIMITS.excerpt} characters`
      return ''
    case 'author':
      if (!value || !value.toString().trim()) return 'Author is required'
      return ''
    case 'category':
      if (!value || !value.toString().trim()) return 'Category is required'
      return ''
    // readTime removed - auto-calculated by API
    case 'publishDate':
      if (!value) return 'Publish date is required'
      return ''
    case 'featuredImage':
      if (!value) return 'Featured image is required'
      return ''
    default:
      return ''
  }
}

// Character counter component
const CharCounter = ({ current, max, className = "" }: { current: number, max: number, className?: string }) => {
  const isNearLimit = current > max * 0.8
  const isOverLimit = current > max
  
  return (
    <div className={`text-xs ${isOverLimit ? 'text-red-500' : isNearLimit ? 'text-yellow-600' : 'text-gray-500'} ${className}`}>
      {current}/{max}
    </div>
  )
}

// Text input with character limit and field-level validation
const LimitedInput = ({ 
  value, 
  onChange, 
  maxLength, 
  placeholder, 
  className = "", 
  multiline = false,
  rows = 3,
  label,
  required = false,
  error,
  type = "text"
}: {
  value: string | number
  onChange: (value: string) => void
  maxLength: number
  placeholder?: string
  className?: string
  multiline?: boolean
  rows?: number
  label?: string
  required?: boolean
  error?: string
  type?: string
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let newValue = e.target.value
    if (typeof newValue === 'string' && newValue.length > maxLength) {
      newValue = newValue.substring(0, maxLength)
      toast.warning(`Text trimmed to ${maxLength} characters`)
    }
    onChange(newValue)
  }

  const InputComponent = multiline ? Textarea : Input

  return (
    <div>
      {label && (
        <Label className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <div className="relative">
        <InputComponent
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={`${className} ${error ? 'border-red-500' : ''}`}
          rows={multiline ? rows : undefined}
          type={type}
        />
        <CharCounter 
          current={value.toString().length} 
          max={maxLength} 
          className="absolute -bottom-5 right-0"
        />
      </div>
      {error && (
        <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}
    </div>
  )
}

// Enhanced image upload with clipboard paste support
const ImageUpload = ({ 
  file,
  url,
  onChange,
  onRemove,
  label = "Image",
  required = false,
  preview = true,
  error
}: { 
  file?: File | null
  url?: string | null
  onChange: (file: File) => void
  onRemove: () => void
  label?: string
  required?: boolean
  preview?: boolean
  error?: string
}) => {
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const previewUrl = file ? URL.createObjectURL(file) : url

  const handleFileChange = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPEG, JPG)')
      return
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB')
      return
    }
    onChange(selectedFile)
  }

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile()
        if (file) {
          handleFileChange(file)
          break
        }
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileChange(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  return (
    <div className="space-y-2">
      <Label>{label} {required && <span className="text-red-500">*</span>}</Label>
      
      {!previewUrl ? (
        <div 
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver ? 'border-blue-500 bg-blue-50' : error ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onPaste={handlePaste}
          tabIndex={0}
        >
          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <div>
            <Button
              type="button"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 hover:text-blue-500"
            >
              Upload {label.toLowerCase()}
            </Button>
            <p className="text-gray-500 text-xs mt-1">
              PNG, JPEG, JPG (max 5MB) • Drag & drop, paste, or click to upload
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
            className="hidden"
          />
        </div>
      ) : (
        <div className="relative">
          {preview && (
            <img
              src={previewUrl}
              alt={`${label} preview`}
              className="w-full h-32 object-cover rounded-lg"
            />
          )}
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {error && (
        <div className="flex items-center gap-1 text-red-500 text-xs">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}
    </div>
  )
}

// Content segment editor with live validation
const ContentSegmentEditor = ({ 
  segments, 
  onChange, 
  maxSegments, 
  blockType = "paragraph",
  errors = {},
  setErrors
}: {
  segments: IContentSegment[]
  onChange: (segments: IContentSegment[]) => void
  maxSegments: number
  blockType?: string
  errors?: FieldErrors
  setErrors?: (errors: FieldErrors) => void
}) => {
  const addTextSegment = () => {
    if (segments.length >= maxSegments) {
      toast.error(`Cannot add more than ${maxSegments} segments`)
      return
    }
    
    const newSegment: ITextSegment = {
      type: "text",
      content: "",
      bold: false,
      italic: false,
      color: "#000000"
    }
    onChange([...segments, newSegment])
  }

  const addLinkSegment = () => {
    if (segments.length >= maxSegments) {
      toast.error(`Cannot add more than ${maxSegments} segments`)
      return
    }
    
    const newSegment: ILinkSegment = {
      type: "link",
      content: "",
      url: "",
      bold: false,
      italic: false,
      color: "#0aa83f"
    }
    onChange([...segments, newSegment])
  }

 const updateSegment = (index: number, updates: Partial<IContentSegment>) => {
  const newSegments = [...segments]
  const currentSegment = newSegments[index]
  
  // Type-safe update based on segment type
  if (currentSegment.type === 'text') {
    newSegments[index] = {
      ...currentSegment,
      ...updates,
      type: 'text' // Ensure type remains 'text'
    } as ITextSegment
  } else if (currentSegment.type === 'link') {
    newSegments[index] = {
      ...currentSegment,
      ...updates,
      type: 'link' // Ensure type remains 'link'
    } as ILinkSegment
  }
  
  onChange(newSegments)
  
  // Validate segment
  if (setErrors) {
    const segment = newSegments[index]
    const segmentErrors: FieldErrors = {}
    
    if (!segment.content.trim()) {
      segmentErrors[`segment-${index}-content`] = 'Content is required'
    } else if (segment.content.length > LIMITS.textSegmentContent) {
      segmentErrors[`segment-${index}-content`] = `Content cannot exceed ${LIMITS.textSegmentContent} characters`
    }
    
    if (segment.type === 'link') {
      const linkSegment = segment as ILinkSegment
      if (!linkSegment.url.trim()) {
        segmentErrors[`segment-${index}-url`] = 'URL is required'
      } else if (!/^(\/[a-zA-Z0-9\-\/]+|https?:\/\/.+)$/.test(linkSegment.url)) {
        segmentErrors[`segment-${index}-url`] = 'Invalid URL format'
      }
    }
    
    setErrors(segmentErrors)
  }
}

  const removeSegment = (index: number) => {
    onChange(segments.filter((_, i) => i !== index))
  }

  const moveSegment = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === segments.length - 1)) {
      return
    }
    
    const newSegments = [...segments]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    const temp = newSegments[index]
    newSegments[index] = newSegments[newIndex]
    newSegments[newIndex] = temp
    onChange(newSegments)
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium">Content Segments</Label>
        <div className="flex gap-2">
          <Button 
            type="button" 
            size="sm" 
            variant="outline"
            onClick={addTextSegment}
            disabled={segments.length >= maxSegments}
          >
            <Type className="h-3 w-3 mr-1" />
            Text
          </Button>
          <Button 
            type="button" 
            size="sm" 
            variant="outline"
            onClick={addLinkSegment}
            disabled={segments.length >= maxSegments}
          >
            <Link className="h-3 w-3 mr-1" />
            Link
          </Button>
        </div>
      </div>
      
      <CharCounter current={segments.length} max={maxSegments} />
      
      <div className="space-y-2">
        {segments.map((segment, index) => (
          <Card key={index} className="p-3">
            <div className="flex items-start gap-2">
              <div className="flex flex-col gap-1 mt-2">
                <Button 
                  type="button" 
                  size="sm" 
                  variant="ghost"
                  onClick={() => moveSegment(index, 'up')}
                  disabled={index === 0}
                  className="h-6 w-6 p-0"
                >
                  <MoveUp className="h-3 w-3" />
                </Button>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="ghost"
                  onClick={() => moveSegment(index, 'down')}
                  disabled={index === segments.length - 1}
                  className="h-6 w-6 p-0"
                >
                  <MoveDown className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{segment.type}</Badge>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeSegment(index)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  <LimitedInput
                    value={segment.content}
                    onChange={(value) => updateSegment(index, { content: value })}
                    maxLength={LIMITS.textSegmentContent}
                    placeholder={segment.type === "text" ? "Enter text content..." : "Enter link display text..."}
                    multiline
                    rows={2}
                    error={errors[`segment-${index}-content`]}
                  />
                  
                  {segment.type === "link" && (
                    <LimitedInput
                      value={(segment as ILinkSegment).url}
                      onChange={(value) => updateSegment(index, { url: value })}
                      maxLength={500}
                      placeholder="Enter URL (e.g., /path or https://example.com)"
                      error={errors[`segment-${index}-url`]}
                    />
                  )}
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={segment.bold ? "default" : "outline"}
                        onClick={() => updateSegment(index, { bold: !segment.bold })}
                        className="h-7 w-7 p-0"
                      >
                        <Bold className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={segment.italic ? "default" : "outline"}
                        onClick={() => updateSegment(index, { italic: !segment.italic })}
                        className="h-7 w-7 p-0"
                      >
                        <Italic className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Color:</Label>
                      <input
                        type="color"
                        value={segment.color}
                        onChange={(e) => updateSegment(index, { color: e.target.value })}
                        className="w-8 h-7 border border-gray-300 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
        
        {segments.length === 0 && (
          <div className="text-center py-4 text-gray-500 text-sm">
            No segments added yet. Click "Text" or "Link" to add content.
          </div>
        )}
      </div>
    </div>
  )
}

// Blog content preview component
const BlogPreview = ({ formData }: { formData: BlogFormData }) => {
  const renderContentBlock = (block: IContentBlock, index: number) => {
    switch (block.type) {
      case "paragraph":
        return (
          <div key={index} className="mb-4">
            {block.content.map((segment, segIndex) => {
              const style = {
                fontWeight: segment.bold ? 'bold' : 'normal',
                fontStyle: segment.italic ? 'italic' : 'normal',
                color: segment.color
              }
              
              if (segment.type === 'link') {
                const linkSegment = segment as ILinkSegment
                return (
                  <a 
                    key={segIndex}
                    href={linkSegment.url}
                    style={style}
                    className="hover:underline"
                    target={linkSegment.url.startsWith('http') ? '_blank' : undefined}
                    rel={linkSegment.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {segment.content}
                  </a>
                )
              }
              
              return (
                <span key={segIndex} style={style}>
                  {segment.content}
                </span>
              )
            })}
          </div>
        )
      
      case "heading":
        const HeadingTag = `h${block.level}` as keyof JSX.IntrinsicElements
        const style = {
          fontWeight: block.bold ? 'bold' : 'normal',
          fontStyle: block.italic ? 'italic' : 'normal',
          color: block.color
        }
        
        return (
          <HeadingTag key={index} style={style} className={`mb-4 ${
            block.level === 1 ? 'text-3xl' :
            block.level === 2 ? 'text-2xl' :
            block.level === 3 ? 'text-xl' :
            block.level === 4 ? 'text-lg' :
            block.level === 5 ? 'text-base' : 'text-sm'
          } font-semibold`}>
            {block.content}
          </HeadingTag>
        )
      
      case "image":
        const imageUrl = block.file ? URL.createObjectURL(block.file) : block.url
        return (
          <div key={index} className="mb-6">
            {imageUrl ? (
              <div>
                <img 
                  src={imageUrl} 
                  alt={block.alt}
                  className="w-full rounded-lg shadow-sm"
                />
                {block.caption && (
                  <p className="text-sm text-gray-600 mt-2 text-center italic">
                    {block.caption}
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-gray-100 h-48 rounded-lg flex items-center justify-center">
                <span className="text-gray-500">Image placeholder</span>
              </div>
            )}
          </div>
        )
      
      case "link":
        const linkStyle = {
          fontWeight: block.bold ? 'bold' : 'normal',
          fontStyle: block.italic ? 'italic' : 'normal',
          color: block.color
        }
        
        return (
          <div key={index} className="mb-4">
            <a 
              href={block.url}
              style={linkStyle}
              className="hover:underline"
              target={block.url.startsWith('http') ? '_blank' : undefined}
              rel={block.url.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {block.coverText}
            </a>
          </div>
        )
      
      case "quote":
        return (
          <blockquote key={index} className="border-l-4 border-blue-500 pl-4 mb-6 italic">
            <div className="mb-2">
              {block.content.map((segment, segIndex) => {
                const style = {
                  fontWeight: segment.bold ? 'bold' : 'normal',
                  fontStyle: segment.italic ? 'italic' : 'normal',
                  color: segment.color
                }
                
                if (segment.type === 'link') {
                  const linkSegment = segment as ILinkSegment
                  return (
                    <a 
                      key={segIndex}
                      href={linkSegment.url}
                      style={style}
                      className="hover:underline"
                      target={linkSegment.url.startsWith('http') ? '_blank' : undefined}
                      rel={linkSegment.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      {segment.content}
                    </a>
                  )
                }
                
                return (
                  <span key={segIndex} style={style}>
                    {segment.content}
                  </span>
                )
              })}
            </div>
            {(block.author || block.source) && (
              <footer className="text-sm text-gray-600">
                {block.author && <span>— {block.author}</span>}
                {block.source && <span>, {block.source}</span>}
              </footer>
            )}
          </blockquote>
        )
      
      case "list":
        const listStyle = {
          fontWeight: block.bold ? 'bold' : 'normal',
          fontStyle: block.italic ? 'italic' : 'normal',
          color: block.color
        }
        
        if (block.listType === "plain") {
          return (
            <div key={index} className="mb-6">
              <h4 className="font-semibold mb-2">{block.title}</h4>
              <div className="space-y-2" style={listStyle}>
                {block.items.map((item, itemIndex) => (
                  <div key={itemIndex}>
                    {item.text}
                    {item.subItems && item.subItems.length > 0 && (
                      <div className="pl-4 mt-1 space-y-1">
                        {item.subItems.map((subItem, subIndex) => (
                          <div key={subIndex}>{subItem}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        }
        
        const ListTag = block.listType === "ordered" ? "ol" : "ul"
        
        return (
          <div key={index} className="mb-6">
            <h4 className="font-semibold mb-2">{block.title}</h4>
            <ListTag className={`${block.listType === "ordered" ? "list-decimal" : "list-disc"} pl-6`} style={listStyle}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="mb-2">
                  {item.text}
                  {item.subItems && item.subItems.length > 0 && (
                    <ul className="list-disc pl-6 mt-1">
                      {item.subItems.map((subItem, subIndex) => (
                        <li key={subIndex} className="mb-1">{subItem}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ListTag>
          </div>
        )
      
      default:
        return null
    }
  }

  const featuredImageUrl = formData.featuredImage ? URL.createObjectURL(formData.featuredImage) : null

  return (
    <div className="bg-white rounded-lg border p-6 h-full overflow-y-auto">
      <div className="mb-6">
        {featuredImageUrl && (
          <img 
            src={featuredImageUrl} 
            alt="Featured" 
            className="w-full h-48 object-cover rounded-lg mb-4"
          />
        )}
        
        <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
          <Badge variant="outline">{formData.category}</Badge>
          <span>•</span>
          <span>Auto-calc min read</span>
          <span>•</span>
          <span>{formData.author}</span>
          {formData.featured && (
            <>
              <span>•</span>
              <Badge className="bg-yellow-500">Featured</Badge>
            </>
          )}
        </div>
        
        <h1 className="text-3xl font-bold mb-3">{formData.title || "Blog Title"}</h1>
        <p className="text-gray-600 mb-4">{formData.excerpt || "Blog excerpt..."}</p>
        
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {formData.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
      
      <div className="prose prose-sm max-w-none">
        {formData.contentBlocks
          .sort((a, b) => a.order - b.order)
          .map((block, index) => renderContentBlock(block, index))
        }
        
        {formData.contentBlocks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No content blocks yet. Add some content to see the preview.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Content block editor with enhanced validation
const ContentBlockEditor = ({ 
  block, 
  onUpdate, 
  onRemove, 
  onMove, 
  canMoveUp, 
  canMoveDown,
  errors = {},
  setErrors,
  hasH1Already
}: {
  block: IContentBlock
  onUpdate: (updates: Partial<IContentBlock>) => void
  onRemove: () => void
  onMove: (direction: 'up' | 'down') => void
  canMoveUp: boolean
  canMoveDown: boolean
  errors?: FieldErrors
  setErrors?: React.Dispatch<React.SetStateAction<FieldErrors>> 
  hasH1Already?: boolean
}) => {
  const blockId = `block-${block.order}`

  const validateBlockField = (field: string, value: any) => {
    if (!setErrors) return

    const errorKey = `${blockId}-${field}`
    let error = ''

    switch (field) {
      case 'content':
        if (block.type === 'heading') {
          if (!value || !value.toString().trim()) error = 'Heading content is required'
          else if (value.length > LIMITS.headingContent) error = `Content cannot exceed ${LIMITS.headingContent} characters`
        }
        break
      case 'alt':
        if (block.type === 'image') {
          if (!value || !value.toString().trim()) error = 'Alt text is required'
          else if (value.length > LIMITS.imageAlt) error = `Alt text cannot exceed ${LIMITS.imageAlt} characters`
        }
        break
      case 'caption':
        if (block.type === 'image' && value && value.length > LIMITS.imageCaption) {
          error = `Caption cannot exceed ${LIMITS.imageCaption} characters`
        }
        break
      case 'coverText':
        if (block.type === 'link') {
          if (!value || !value.toString().trim()) error = 'Cover text is required'
          else if (value.length > LIMITS.linkBlockCoverText) error = `Cover text cannot exceed ${LIMITS.linkBlockCoverText} characters`
        }
        break
      case 'url':
        if ((block.type === 'link' || block.type === 'image') && (!value || !value.toString().trim())) {
          error = 'URL is required'
        } else if (value && !/^(\/[a-zA-Z0-9\-\/]+|https?:\/\/.+)$/.test(value.toString())) {
          error = 'Invalid URL format'
        }
        break
      case 'title':
        if (block.type === 'list') {
          if (!value || !value.toString().trim()) error = 'List title is required'
          else if (value.length > LIMITS.listTitle) error = `Title cannot exceed ${LIMITS.listTitle} characters`
        }
        break
    }

    setErrors(prev => ({ ...prev, [errorKey]: error }))
  }

  const handleUpdate = (updates: Partial<IContentBlock>) => {
    onUpdate(updates)
    
    // Validate updated fields
    Object.keys(updates).forEach(field => {
      validateBlockField(field, updates[field as keyof IContentBlock])
    })
  }

  const renderBlockEditor = () => {
    switch (block.type) {
      case "paragraph":
        return (
          <ContentSegmentEditor
            segments={block.content}
            onChange={(content) => handleUpdate({ content })}
            maxSegments={MAX_PARAGRAPH_SEGMENTS}
            blockType="paragraph"
            errors={errors}
            setErrors={setErrors}
          />
        )
      
      case "heading":
        const isH1Disabled = block.level !== 1 && hasH1Already

        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Heading Level</Label>
                <Select 
                  value={block.level.toString()} 
                  onValueChange={(value) => {
                    const newLevel = parseInt(value) as 1|2|3|4|5|6
                    if (newLevel === 1 && hasH1Already && block.level !== 1) {
                      toast.error("Only one H1 heading is allowed per blog post for SEO")
                      return
                    }
                    handleUpdate({ level: newLevel })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1" disabled={isH1Disabled}>
                      H1 {isH1Disabled && "(Only one H1 allowed)"}
                    </SelectItem>
                    <SelectItem value="2">H2</SelectItem>
                    <SelectItem value="3">H3</SelectItem>
                    <SelectItem value="4">H4</SelectItem>
                    <SelectItem value="5">H5</SelectItem>
                    <SelectItem value="6">H6</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={block.bold ? "default" : "outline"}
                    onClick={() => handleUpdate({ bold: !block.bold })}
                    className="h-7 w-7 p-0"
                  >
                    <Bold className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={block.italic ? "default" : "outline"}
                    onClick={() => handleUpdate({ italic: !block.italic })}
                    className="h-7 w-7 p-0"
                  >
                    <Italic className="h-3 w-3" />
                  </Button>
                  <input
                    type="color"
                    value={block.color}
                    onChange={(e) => handleUpdate({ color: e.target.value })}
                    className="w-7 h-7 border border-gray-300 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
            
            <LimitedInput
              value={block.content}
              onChange={(content) => handleUpdate({ content })}
              maxLength={LIMITS.headingContent}
              placeholder="Enter heading text..."
              required
              error={errors[`${blockId}-content`]}
            />
          </div>
        )
      
      case "image":
        return (
          <div className="space-y-3">
            <ImageUpload
              file={block.file}
              url={block.url}
              onChange={(file) => handleUpdate({ file, url: "" })}
              onRemove={() => handleUpdate({ file: undefined, url: "" })}
              label="Image"
              required={true}
              error={errors[`${blockId}-image`]}
            />
            
            <div className="grid grid-cols-1 gap-3">
              <LimitedInput
                value={block.alt}
                onChange={(alt) => handleUpdate({ alt })}
                maxLength={LIMITS.imageAlt}
                placeholder="Enter alt text for accessibility..."
                label="Alt Text"
                required
                error={errors[`${blockId}-alt`]}
              />
              
              <LimitedInput
                value={block.caption || ""}
                onChange={(caption) => handleUpdate({ caption })}
                maxLength={LIMITS.imageCaption}
                placeholder="Enter optional image caption..."
                label="Caption"
                error={errors[`${blockId}-caption`]}
              />
            </div>
          </div>
        )
      
      case "link":
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <LimitedInput
                value={block.coverText}
                onChange={(coverText) => handleUpdate({ coverText })}
                maxLength={LIMITS.linkBlockCoverText}
                placeholder="Enter link display text..."
                label="Cover Text"
                required
                error={errors[`${blockId}-coverText`]}
              />
              
              <LimitedInput
                value={block.url}
                onChange={(url) => handleUpdate({ url })}
                maxLength={500}
                placeholder="Enter URL (e.g., /path or https://example.com)"
                label="URL"
                required
                error={errors[`${blockId}-url`]}
              />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={block.bold ? "default" : "outline"}
                  onClick={() => handleUpdate({ bold: !block.bold })}
                  className="h-7 w-7 p-0"
                >
                  <Bold className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={block.italic ? "default" : "outline"}
                  onClick={() => handleUpdate({ italic: !block.italic })}
                  className="h-7 w-7 p-0"
                >
                  <Italic className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Label className="text-xs">Color:</Label>
                <input
                  type="color"
                  value={block.color}
                  onChange={(e) => handleUpdate({ color: e.target.value })}
                  className="w-8 h-7 border border-gray-300 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )
      
      case "quote":
        return (
          <div className="space-y-3">
            <ContentSegmentEditor
              segments={block.content}
              onChange={(content) => handleUpdate({ content })}
              maxSegments={MAX_QUOTE_SEGMENTS}
              blockType="quote"
              errors={errors}
              setErrors={setErrors}
            />
            
            <div className="grid grid-cols-2 gap-3">
              <LimitedInput
                value={block.author || ""}
                onChange={(author) => handleUpdate({ author })}
                maxLength={LIMITS.quoteAuthor}
                placeholder="Enter quote author (optional)..."
                label="Author"
                error={errors[`${blockId}-author`]}
              />
              
              <LimitedInput
                value={block.source || ""}
                onChange={(source) => handleUpdate({ source })}
                maxLength={LIMITS.quoteSource}
                placeholder="Enter quote source (optional)..."
                label="Source"
                error={errors[`${blockId}-source`]}
              />
            </div>
          </div>
        )
      
      case "list":
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>List Type</Label>
                <Select 
                  value={block.listType} 
                  onValueChange={(listType: "ordered" | "unordered" | "plain") => handleUpdate({ listType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ordered">Numbered List</SelectItem>
                    <SelectItem value="unordered">Bullet List</SelectItem>
                    <SelectItem value="plain">Plain List</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={block.bold ? "default" : "outline"}
                  onClick={() => handleUpdate({ bold: !block.bold })}
                  className="h-7 w-7 p-0"
                >
                  <Bold className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={block.italic ? "default" : "outline"}
                  onClick={() => handleUpdate({ italic: !block.italic })}
                  className="h-7 w-7 p-0"
                >
                  <Italic className="h-3 w-3" />
                </Button>
                <input
                  type="color"
                  value={block.color}
                  onChange={(e) => handleUpdate({ color: e.target.value })}
                  className="w-7 h-7 border border-gray-300 rounded cursor-pointer"
                />
              </div>
            </div>
            
            <LimitedInput
              value={block.title}
              onChange={(title) => handleUpdate({ title })}
              maxLength={LIMITS.listTitle}
              placeholder="Enter list title..."
              label="List Title"
              required
              error={errors[`${blockId}-title`]}
            />
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm">List Items</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (block.items.length >= MAX_LIST_ITEMS) {
                      toast.error(`Cannot add more than ${MAX_LIST_ITEMS} items`)
                      return
                    }
                    handleUpdate({ 
                      items: [...block.items, { text: "", subItems: [] }] 
                    })
                  }}
                  disabled={block.items.length >= MAX_LIST_ITEMS}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Item
                </Button>
              </div>
              
              <CharCounter current={block.items.length} max={MAX_LIST_ITEMS} />
              
              {block.items.map((item, index) => (
                <Card key={index} className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <LimitedInput
                          value={item.text}
                          onChange={(text) => {
                            const newItems = [...block.items]
                            newItems[index] = { ...newItems[index], text }
                            handleUpdate({ items: newItems })
                          }}
                          maxLength={LIMITS.listItemText}
                          placeholder="Enter list item text..."
                          required
                          error={errors[`${blockId}-item-${index}`]}
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const newItems = block.items.filter((_, i) => i !== index)
                          handleUpdate({ items: newItems })
                        }}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="ml-4 space-y-1">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs text-gray-600">Sub-items</Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const newItems = [...block.items]
                            if (!newItems[index].subItems) newItems[index].subItems = []
                            newItems[index].subItems!.push("")
                            handleUpdate({ items: newItems })
                          }}
                          className="h-5 text-xs"
                        >
                          <Plus className="h-2 w-2 mr-1" />
                          Add Sub-item
                        </Button>
                      </div>
                      
                      {item.subItems?.map((subItem, subIndex) => (
                        <div key={subIndex} className="flex items-center gap-2">
                          <LimitedInput
                            value={subItem}
                            onChange={(value) => {
                              const newItems = [...block.items]
                              if (newItems[index].subItems) {
                                newItems[index].subItems![subIndex] = value
                                handleUpdate({ items: newItems })
                              }
                            }}
                            maxLength={LIMITS.listSubItemText}
                            placeholder="Enter sub-item text..."
                            className="flex-1"
                            error={errors[`${blockId}-subitem-${index}-${subIndex}`]}
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const newItems = [...block.items]
                              if (newItems[index].subItems) {
                                newItems[index].subItems = newItems[index].subItems!.filter((_, i) => i !== subIndex)
                                handleUpdate({ items: newItems })
                              }
                            }}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <X className="h-2 w-2" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
              
              {block.items.length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No items added yet. Click "Add Item" to add list items.
                </div>
              )}
            </div>
          </div>
        )
      
      default:
        return <div>Unknown block type</div>
    }
  }

  const getBlockIcon = () => {
    switch (block.type) {
      case "paragraph": return <Type className="h-4 w-4" />
      case "heading": return <Hash className="h-4 w-4" />
      case "image": return <ImageIcon className="h-4 w-4" />
      case "link": return <Link className="h-4 w-4" />
      case "quote": return <Quote className="h-4 w-4" />
      case "list": return <List className="h-4 w-4" />
      default: return <Type className="h-4 w-4" />
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getBlockIcon()}
            <h4 className="font-medium capitalize">{block.type} Block</h4>
            <Badge variant="outline">Order: {block.order}</Badge>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onMove('up')}
              disabled={!canMoveUp}
              className="h-7 w-7 p-0"
            >
              <MoveUp className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onMove('down')}
              disabled={!canMoveDown}
              className="h-7 w-7 p-0"
            >
              <MoveDown className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onRemove}
              className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {renderBlockEditor()}
      </CardContent>
    </Card>
  )
}

export function BlogFormModal({ isOpen, onClose, onSuccess, blog, mode }: BlogFormModalProps) {
  // Step navigation state (NEW - but preserves all existing logic)
  const [currentStep, setCurrentStep] = useState(0)
  
  const [formData, setFormData] = useState<BlogFormData>({
    title: "",
    excerpt: "",
    contentBlocks: [],
    featuredImage: null,
    author: "",
    category: "",
    tags: [],
    status: "Published",
    publishDate: new Date().toISOString().slice(0, 16),
    // readTime removed - auto-calculated by API
    featured: false,
  })
  
  const [featuredImagePreview, setFeaturedImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [apiError, setApiError] = useState<string>("")
  const [tagInput, setTagInput] = useState("")
  
  // Draft management state (NEW)
  const [showDraftDialog, setShowDraftDialog] = useState(false)
  const [draftTimestamp, setDraftTimestamp] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [initialFormData, setInitialFormData] = useState<BlogFormData | null>(null)

  // Initialize form data and check for drafts
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && blog) {
        // Load existing blog data for edit mode
        const convertedData = blogToFormData(blog)
        setFormData(convertedData)
        setInitialFormData(convertedData)
        setHasUnsavedChanges(false)
        
        if (blog.featuredImage) {
          setFeaturedImagePreview(blog.featuredImage)
        }
      } else if (mode === "add") {
        // Check for saved draft in add mode
        const hasDraft = hasSavedBlogDraft()
        if (hasDraft) {
          const timestamp = getBlogDraftTimestamp()
          setDraftTimestamp(timestamp)
          setShowDraftDialog(true)
        } else {
          resetToInitialState()
        }
      }
      setErrors({})
      setApiError("")
      setTagInput("")
      setCurrentStep(0) // Reset to first step
    }
  }, [blog, mode, isOpen])
  
  // Helper function to reset to initial state
  const resetToInitialState = () => {
    const initialData = {
      title: "",
      excerpt: "",
      contentBlocks: [],
      featuredImage: null,
      author: "",
      category: "",
      tags: [],
      status: "Published" as const,
      publishDate: new Date().toISOString().slice(0, 16),
      featured: false,
    }
    setFormData(initialData)
    setInitialFormData(initialData)
    setFeaturedImagePreview(null)
    setHasUnsavedChanges(false)
  }
  
  // Auto-save draft functionality (NEW)
  const debouncedSave = useCallback(
    createDebouncedBlogSave(3000), // 3 second delay
    []
  )

  // Draft dialog handlers (NEW)
  const handleRestoreDraft = () => {
    const draft = loadBlogFormDraft()
    if (draft) {
      setFormData(draft)
      setHasUnsavedChanges(true)
    }
    setShowDraftDialog(false)
  }

  const handleDiscardDraft = () => {
    clearBlogFormDraft()
    resetToInitialState()
    setShowDraftDialog(false)
  }
  
  // Auto-save when form data changes
  useEffect(() => {
    if (isOpen && hasUnsavedChanges && mode === 'add' && initialFormData) {
      debouncedSave(formData)
    }
  }, [formData, hasUnsavedChanges, isOpen, mode, initialFormData, debouncedSave])
  
  // Track unsaved changes
  useEffect(() => {
    if (initialFormData) {
      const hasChanges = hasFormDataChanged(formData, initialFormData)
      setHasUnsavedChanges(hasChanges)
    }
  }, [formData, initialFormData])

  // Real-time validation
  const handleFieldChange = (field: keyof BlogFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Validate field
    const error = validateField(field, value, formData)
    setErrors(prev => ({ ...prev, [field]: error }))
  }

  const handleFeaturedImageUpload = (file: File) => {
    setFormData(prev => ({ ...prev, featuredImage: file }))
    const reader = new FileReader()
    reader.onload = (e) => {
      setFeaturedImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
    
    // Clear featured image error
    setErrors(prev => ({ ...prev, featuredImage: '' }))
  }

  const removeFeaturedImage = () => {
    setFormData(prev => ({ ...prev, featuredImage: null }))
    setFeaturedImagePreview(null)
    
    // Add required error for add mode
    if (mode === 'add') {
      setErrors(prev => ({ ...prev, featuredImage: 'Featured image is required' }))
    }
  }

  // Tag management
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleFieldChange("tags", [...formData.tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    handleFieldChange("tags", formData.tags.filter(tag => tag !== tagToRemove))
  }

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag()
    }
  }

  // Step navigation handlers (NEW - but preserves all existing logic)
  const handleNext = () => {
    if (currentStep < blogFormSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex)
  }

  // Check if H1 already exists
  const hasH1 = formData.contentBlocks.some(block => 
    block.type === "heading" && block.level === 1
  )

  // Content block management
  const addContentBlock = (type: IContentBlock['type']) => {
    if (formData.contentBlocks.length >= MAX_BLOCKS) {
      toast.error(`Cannot add more than ${MAX_BLOCKS} content blocks`)
      return
    }

    const maxOrder = Math.max(0, ...formData.contentBlocks.map(block => block.order))
    const newOrder = maxOrder + 1

    let newBlock: IContentBlock

    switch (type) {
      case "paragraph":
        newBlock = {
          type: "paragraph",
          order: newOrder,
          content: []
        }
        break
      case "heading":
        newBlock = {
          type: "heading",
          order: newOrder,
          level: hasH1 ? 2 : 1, // Default to H2 if H1 exists
          content: "",
          bold: false,
          italic: false,
          color: "#000000"
        }
        break
      case "image":
        newBlock = {
          type: "image",
          order: newOrder,
          url: "",
          alt: "",
          caption: ""
        }
        break
      case "link":
        newBlock = {
          type: "link",
          order: newOrder,
          url: "",
          coverText: "",
          bold: false,
          italic: false,
          color: "#0aa83f"
        }
        break
      case "quote":
        newBlock = {
          type: "quote",
          order: newOrder,
          content: [],
          author: "",
          source: ""
        }
        break
      case "list":
        newBlock = {
          type: "list",
          order: newOrder,
          listType: "unordered",
          title: "",
          items: [],
          bold: false,
          italic: false,
          color: "#000000"
        }
        break
      default:
        return
    }

    handleFieldChange("contentBlocks", [...formData.contentBlocks, newBlock])
  }

 const updateContentBlock = (index: number, updates: Partial<IContentBlock>) => {
  const newBlocks = [...formData.contentBlocks]
  const currentBlock = newBlocks[index]
  
  // Type-safe update based on block type
  switch (currentBlock.type) {
    case 'paragraph':
      newBlocks[index] = {
        ...currentBlock,
        ...updates,
        type: 'paragraph' // Ensure type remains 'paragraph'
      } as IParagraphBlock
      break
      
    case 'heading':
      newBlocks[index] = {
        ...currentBlock,
        ...updates,
        type: 'heading' // Ensure type remains 'heading'
      } as IHeadingBlock
      break
      
    case 'image':
      newBlocks[index] = {
        ...currentBlock,
        ...updates,
        type: 'image' // Ensure type remains 'image'
      } as IImageBlock
      break
      
    case 'link':
      newBlocks[index] = {
        ...currentBlock,
        ...updates,
        type: 'link' // Ensure type remains 'link'
      } as ILinkBlock
      break
      
    case 'quote':
      newBlocks[index] = {
        ...currentBlock,
        ...updates,
        type: 'quote' // Ensure type remains 'quote'
      } as IQuoteBlock
      break
      
    case 'list':
      newBlocks[index] = {
        ...currentBlock,
        ...updates,
        type: 'list' // Ensure type remains 'list'
      } as IListBlock
      break
      
    default:
      // Handle unknown types gracefully
      console.warn('Unknown block type:', (currentBlock as any).type)
      return
  }
  
  handleFieldChange("contentBlocks", newBlocks)
}

  const removeContentBlock = (index: number) => {
    const newBlocks = formData.contentBlocks.filter((_, i) => i !== index)
    // Re-order remaining blocks
    const reorderedBlocks = newBlocks.map((block, i) => ({
      ...block,
      order: i + 1
    }))
    handleFieldChange("contentBlocks", reorderedBlocks)
  }

  const moveContentBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...formData.contentBlocks]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    
    if (newIndex < 0 || newIndex >= newBlocks.length) return

    // Swap blocks
    const temp = newBlocks[index]
    newBlocks[index] = newBlocks[newIndex]
    newBlocks[newIndex] = temp

    // Update order values
    newBlocks[index].order = index + 1
    newBlocks[newIndex].order = newIndex + 1

    handleFieldChange("contentBlocks", newBlocks)
  }

  // Check if form is valid for submission
  const isFormValid = (): boolean => {
    const hasErrors = Object.values(errors).some(error => error && error.trim() !== '')
    const hasRequiredFields = !!(formData.title && formData.excerpt && formData.author && formData.category)
    const hasFeaturedImage = mode === 'edit' || !!formData.featuredImage
    const hasContentBlocks = formData.contentBlocks.length > 0
    const hasParagraph = formData.contentBlocks.some(block => block.type === "paragraph")
    
    // Check for empty segments or incomplete blocks
    const hasIncompleteBlocks = formData.contentBlocks.some(block => {
      switch (block.type) {
        case "paragraph":
        case "quote":
          return block.content.length === 0 || block.content.some(segment => 
            !segment.content.trim() || (segment.type === 'link' && !(segment as ILinkSegment).url.trim())
          )
        case "heading":
          return !block.content.trim()
        case "image":
          return !block.alt.trim() || (!block.url && !block.file)
        case "link":
          return !block.coverText.trim() || !block.url.trim()
        case "list":
          return block.items.length === 0 || block.items.some(item => !item.text.trim())
        default:
          return false
      }
    })
    
    return Boolean(!hasErrors && hasRequiredFields && hasFeaturedImage && hasContentBlocks && hasParagraph && !hasIncompleteBlocks)
  }

  const fillFakeData = () => {
    const fakeBlocks: IContentBlock[] = [
      {
        type: "heading",
        order: 1,
        level: 1,
        content: "The Future of Real Estate Investment in Dubai",
        bold: true,
        italic: false,
        color: "#1a365d"
      },
      {
        type: "paragraph",
        order: 2,
        content: [
          {
            type: "text",
            content: "Dubai's real estate market continues to evolve with ",
            bold: false,
            italic: false,
            color: "#000000"
          },
          {
            type: "text",
            content: "innovative developments",
            bold: true,
            italic: false,
            color: "#1a365d"
          },
          {
            type: "text",
            content: " and investment opportunities. The city's strategic location makes it a ",
            bold: false,
            italic: false,
            color: "#000000"
          },
          {
            type: "link",
            content: "prime destination",
            url: "https://dubailand.gov.ae",
            bold: false,
            italic: false,
            color: "#0aa83f"
          },
          {
            type: "text",
            content: " for property investment.",
            bold: false,
            italic: false,
            color: "#000000"
          }
        ]
      }
    ]

    setFormData({
      title: "The Future of Real Estate Investment in Dubai",
      excerpt: "Discover the latest trends and opportunities in Dubai's dynamic real estate market, from luxury developments to emerging neighborhoods that offer unprecedented investment potential.",
      contentBlocks: fakeBlocks,
      featuredImage: null,
      author: "Sarah Johnson",
      category: "Investment",
      tags: ["Dubai Real Estate", "Investment", "Property Market", "Luxury Properties", "Market Trends"],
      status: "Published",
      publishDate: new Date().toISOString().slice(0, 16),
      // readTime removed - auto-calculated by API
      featured: true,
    })
    
    // Clear all errors when filling fake data
    setErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid()) {
      toast.error("Please fix all validation errors and complete all required fields")
      return
    }

    setIsSubmitting(true)
    setApiError("")

    try {
      // Generate slug from title
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      
      // Create FormData for file upload
      const submitData = new FormData()
      
      // Add basic fields
      submitData.append('title', formData.title)
      submitData.append('slug', slug)
      submitData.append('excerpt', formData.excerpt)
      submitData.append('author', formData.author)
      submitData.append('category', formData.category)
      submitData.append('status', formData.status)
      submitData.append('publishDate', formData.publishDate + ':00.000Z')
      // readTime removed - auto-calculated by API
      submitData.append('featured', formData.featured.toString())
      submitData.append('tags', JSON.stringify(formData.tags))

      // Add content blocks
      submitData.append('contentBlocks', JSON.stringify(formData.contentBlocks))

      // Add featured image if provided
      if (formData.featuredImage) {
        submitData.append('featuredImageFile', formData.featuredImage)
      }

      // Add image files from content blocks
      formData.contentBlocks.forEach((block, index) => {
        if (block.type === 'image' && 'file' in block && block.file) {
          submitData.append(`contentImage_${index}`, block.file)
        }
      })

      // Add existing data for edit mode
      if (mode === 'edit' && blog) {
        if (blog.featuredImage) {
          submitData.append('existingFeaturedImage', blog.featuredImage)
        }
        if (blog._id) {
          submitData.append('_id', blog._id)
        }
      }

      const endpoint = mode === 'add' ? '/api/blog/add' : `/api/blog/update/${blog?.slug}`
      const method = mode === 'add' ? 'POST' : 'PUT'

      const response = await fetch(endpoint, {
        method,
        body: submitData,
      })

      const result = await response.json()
       console.log('API Response:', result)
     if (!response.ok) {
            // Handle different types of API errors
            const apiError: ApiError = {
              message: result.error.message || 'An error occurred',
              error: result.error || 'UNKNOWN_ERROR',
              errors: result.errors || {}
            };
            setApiError(apiError.message);
    
            // Set field-specific errors if they exist
            if (result.errors && typeof result.errors === 'object') {
              const newFieldErrors: FieldErrors = {};
              
              Object.entries(result.errors).forEach(([field, messages]) => {
                if (Array.isArray(messages) && messages.length > 0) {
                  newFieldErrors[field] = messages[0]; // Take first error message
                }
              });
              
              setErrors(prev => ({ ...prev, ...newFieldErrors }));
            }
    
            
    
            // Show toast for immediate feedback
            toast.error(apiError.message);
            return;
          }
    

      // Clear draft on successful save
      if (mode === 'add') {
        clearBlogFormDraft()
      }
      
      toast.success(`Blog post ${mode === 'edit' ? 'updated' : 'created'} successfully!`)
      onSuccess?.(result)
      handleClose()
    } catch (error) {
      console.error('Error saving blog post:', error)
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      setApiError(errorMessage)
      toast.error(`Failed to ${mode === 'edit' ? 'update' : 'create'} blog post`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Close handler with unsaved changes check (UPDATED)
  const handleClose = () => {
    // Reset all state
    resetToInitialState()
    setErrors({})
    setApiError("")
    setTagInput("")
    setCurrentStep(0)
    onClose()
  }

  // Handle close with confirmation check - always show confirmation like project form
  const handleCloseWithConfirmation = () => {
    // Always trigger the confirmation dialog through global handler
    if ((window as any).handleBlogFormClose) {
      (window as any).handleBlogFormClose()
    } else {
      // Fallback if no handler is registered
      handleClose()
    }
  }

  // Render current step content (NEW - uses existing components and logic)
  const renderCurrentStep = () => {
    switch (blogFormSteps[currentStep].id) {
      case "basic":
        return (
          <BasicInfoStep
            formData={formData}
            errors={errors}
            onFieldChange={handleFieldChange}
          />
        )
      case "content":
        return (
          <ContentCreationStep
            formData={formData}
            errors={errors}
            onFieldChange={handleFieldChange}
            addContentBlock={addContentBlock}
            updateContentBlock={updateContentBlock}
            removeContentBlock={removeContentBlock}
            moveContentBlock={moveContentBlock}
            hasH1={hasH1}
            setErrors={setErrors}
            ContentBlockEditor={ContentBlockEditor}
          />
        )
      case "media":
        return (
          <MediaTagsStep
            formData={formData}
            errors={errors}
            onFieldChange={handleFieldChange}
            mode={mode}
            featuredImagePreview={featuredImagePreview}
            tagInput={tagInput}
            setTagInput={setTagInput}
            addTag={addTag}
            removeTag={removeTag}
            handleTagKeyPress={handleTagKeyPress}
            handleFeaturedImageUpload={handleFeaturedImageUpload}
            removeFeaturedImage={removeFeaturedImage}
            ImageUpload={ImageUpload}
          />
        )
      case "publishing":
        return (
          <PublishingStep
            formData={formData}
            errors={errors}
            onFieldChange={handleFieldChange}
            apiError={apiError}
            isFormValid={isFormValid}
            fillFakeData={fillFakeData}
            isSubmitting={isSubmitting}
            BlogPreview={BlogPreview}
          />
        )
      default:
        return null
    }
  }

  return (
    <>
      {/* Draft Restore Dialog */}
      <DraftRestoreDialog
        isOpen={showDraftDialog}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
        draftTimestamp={draftTimestamp}
      />

      <ConfirmationDialogs
        mode={mode}
        hasUnsavedChanges={hasUnsavedChanges}
        formData={formData}
        onClose={onClose}
        isSubmitting={isSubmitting}
        onResetForm={resetToInitialState}
        isModalOpen={isOpen}
      />

      {/* Main Form Modal */}
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open && !isSubmitting) {
          handleCloseWithConfirmation()
        }
      }}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            {mode === "add" ? "Create New Blog Post" : "Edit Blog Post"}
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                Unsaved Changes
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Step Navigation */}
        <BlogFormStepNavigation
          steps={blogFormSteps}
          currentStep={currentStep}
          onStepClick={handleStepClick}
        />

        <div className="flex flex-1 min-h-0">
          {/* Left Panel - Step Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {renderCurrentStep()}
          </div>

          {/* Right Panel - Live Preview */}
          <div className="w-1/2 border-l bg-gray-50 flex flex-col">
            <div className="p-4 border-b bg-white">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Live Preview
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <BlogPreview formData={formData} />
            </div>
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            {currentStep < blogFormSteps.length - 1 ? (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting || !isFormValid()}
                >
                  {isSubmitting ? 
                    (mode === "edit" ? "Updating..." : "Creating...") : 
                    (mode === "edit" ? "Update Blog Post" : "Create Blog Post")
                  }
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}