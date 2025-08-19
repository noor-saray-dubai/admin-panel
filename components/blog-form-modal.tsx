"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
import { Upload, X, Eye, Star, Calendar, User, Tag, FileText } from "lucide-react"

interface Blog {
  _id?: string
  title: string
  slug?: string
  excerpt: string
  content: string
  featuredImage: string
  author: string
  category: string
  tags: string[]
  status: "Published" | "Draft" | "Scheduled"
  publishDate: string
  readTime: number
  views: number
  featured: boolean
}

interface BlogFormData {
  title: string
  excerpt: string
  content: string
  featuredImage: File | null
  author: string
  category: string
  tags: string[]
  status: "Published" | "Draft" | "Scheduled"
  publishDate: string
  readTime: number
  featured: boolean
}

interface BlogFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (blog: Blog) => void
  blog?: Blog | null
  mode: "add" | "edit"
}

const categories = ["Investment", "Development", "Legal", "Sustainability", "Market Analysis", "Lifestyle", "News"]

const initialFormData: BlogFormData = {
  title: "",
  excerpt: "",
  content: "",
  featuredImage: null,
  author: "",
  category: "",
  tags: [],
  status: "Draft",
  publishDate: new Date().toISOString().slice(0, 16),
  readTime: 5,
  featured: false,
}

// Image upload component
const ImageUpload = ({ 
  label, 
  value, 
  onChange, 
  preview,
  onRemove,
  accept = "image/*",
  required = false
}: { 
  label: string
  value: File | null
  onChange: (file: File | null) => void
  preview: string | null
  onRemove: () => void
  accept?: string
  required?: boolean
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file (PNG, JPEG, JPG)')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB')
        return
      }
      onChange(file)
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label} {required && '*'}</Label>
      {!preview ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <div>
            <Label htmlFor={label.replace(/\s+/g, '-').toLowerCase()} className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-500">
                Upload {label.toLowerCase()}
              </span>
              <Input
                id={label.replace(/\s+/g, '-').toLowerCase()}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                className="hidden"
              />
            </Label>
            <p className="text-gray-500 text-xs mt-1">PNG, JPEG, JPG (max 5MB)</p>
          </div>
        </div>
      ) : (
        <div className="relative">
          <img
            src={preview}
            alt={`${label} preview`}
            className="w-full h-32 object-cover rounded-lg"
          />
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
    </div>
  )
}

export function BlogFormModal({ isOpen, onClose, onSuccess, blog, mode }: BlogFormModalProps) {
  const [formData, setFormData] = useState<BlogFormData>(initialFormData)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>("")
  const [tagInput, setTagInput] = useState("")

  // Convert blog to form data
  const convertBlogToFormData = (blog: Blog): BlogFormData => {
    return {
      title: blog.title || "",
      excerpt: blog.excerpt || "",
      content: blog.content || "",
      featuredImage: null,
      author: blog.author || "",
      category: blog.category || "",
      tags: blog.tags || [],
      status: blog.status || "Draft",
      publishDate: blog.publishDate ? blog.publishDate.slice(0, 16) : new Date().toISOString().slice(0, 16),
      readTime: blog.readTime || 5,
      featured: blog.featured || false,
    }
  }

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && blog) {
        const convertedData = convertBlogToFormData(blog)
        setFormData(convertedData)
        
        // Set image preview for existing blog
        if (blog.featuredImage) {
          setImagePreview(blog.featuredImage)
        }
      } else {
        // Reset form for add mode
        setFormData(initialFormData)
        setImagePreview(null)
      }
      setError("")
      setTagInput("")
    }
  }, [blog, mode, isOpen])

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleInputChange = (field: keyof BlogFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleTitleChange = (title: string) => {
    handleInputChange("title", title)
  }

  // Handle featured image upload
  const handleImageUpload = (file: File | null) => {
    setFormData(prev => ({ ...prev, featuredImage: file }))
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Remove featured image
  const removeImage = () => {
    setFormData(prev => ({ ...prev, featuredImage: null }))
    setImagePreview(null)
  }

  // Tag management
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleInputChange("tags", [...formData.tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    handleInputChange(
      "tags",
      formData.tags.filter((tag) => tag !== tagToRemove)
    )
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag()
    }
  }

  // Fill fake data for testing
  const fillFakeData = () => {
    setFormData({
      title: "The Future of Real Estate Investment in Dubai",
      excerpt: "Discover the latest trends and opportunities in Dubai's dynamic real estate market, from luxury developments to emerging neighborhoods.",
      content: "Dubai's real estate market continues to evolve with innovative developments and investment opportunities. The city's strategic location, world-class infrastructure, and business-friendly environment make it a prime destination for property investment.\n\nWith new regulations and government initiatives supporting sustainable development, investors are finding unprecedented opportunities in both residential and commercial sectors. From luxury waterfront properties to affordable housing projects, Dubai offers diverse investment options for every budget.\n\nThe integration of smart technology and sustainable building practices is reshaping the landscape, creating properties that not only appreciate in value but also contribute to a more sustainable future.",
      featuredImage: null,
      author: "Sarah Johnson",
      category: "Investment",
      tags: ["Dubai Real Estate", "Investment", "Property Market", "Luxury Properties", "Market Trends"],
      status: "Draft",
      publishDate: new Date().toISOString().slice(0, 16),
      readTime: 8,
      featured: true,
    })
  }

  // Validate form
  const validateForm = (): string[] => {
    const errors: string[] = []

    if (!formData.title.trim()) errors.push("Title is required")
    if (!formData.excerpt.trim()) errors.push("Excerpt is required")
    if (!formData.content.trim()) errors.push("Content is required")
    if (!formData.author.trim()) errors.push("Author is required")
    if (!formData.category.trim()) errors.push("Category is required")
    if (formData.readTime <= 0) errors.push("Read time must be greater than 0")
    
    // For add mode, featured image is required
    if (mode === 'add' && !formData.featuredImage) {
      errors.push("Featured image is required")
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const errors = validateForm()
    if (errors.length > 0) {
      toast.error(`Please fix the following errors:\n${errors.join('\n')}`)
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      // Generate slug from title
      const slug = generateSlug(formData.title)
      
      // Create FormData for file upload
      const submitData = new FormData()
      
      // Add all form fields
      submitData.append('title', formData.title)
      submitData.append('slug', slug)
      submitData.append('excerpt', formData.excerpt)
      submitData.append('content', formData.content)
      submitData.append('author', formData.author)
      submitData.append('category', formData.category)
      submitData.append('status', formData.status)
      submitData.append('publishDate', formData.publishDate + ':00.000Z')
      submitData.append('readTime', formData.readTime.toString())
      submitData.append('featured', formData.featured.toString())
      submitData.append('tags', JSON.stringify(formData.tags))

      // Add featured image if provided
      if (formData.featuredImage) {
        submitData.append('featuredImageFile', formData.featuredImage)
      }

      // Add existing URLs for edit mode
      if (mode === 'edit' && blog) {
        submitData.append('existingFeaturedImage', blog.featuredImage || '')
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

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save blog post')
      }

      toast.success(`Blog post ${mode === 'edit' ? 'updated' : 'created'} successfully!`)
      onSuccess?.(result)
      handleClose()
    } catch (error) {
      console.error('Error saving blog post:', error)
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      setError(errorMessage)
      toast.error(`Failed to ${mode === 'edit' ? 'update' : 'create'} blog post: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData(initialFormData)
    setImagePreview(null)
    setError("")
    setTagInput("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <DialogTitle className="text-2xl font-bold">
            {mode === "add" ? "Create New Blog Post" : "Edit Blog Post"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0">
          <div className="space-y-8 py-4">

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter blog post title"
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="author">Author *</Label>
                    <Input
                      id="author"
                      placeholder="Enter author name"
                      value={formData.author}
                      onChange={(e) => handleInputChange("author", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="excerpt">Excerpt *</Label>
                  <Textarea
                    id="excerpt"
                    placeholder="Brief description of the blog post..."
                    value={formData.excerpt}
                    onChange={(e) => handleInputChange("excerpt", e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    placeholder="Write your blog content here..."
                    value={formData.content}
                    onChange={(e) => handleInputChange("content", e.target.value)}
                    rows={8}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Publishing Details */}
            <Card>
              <CardHeader>
                <CardTitle>Publishing Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="status">Status *</Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="Published">Published</SelectItem>
                        <SelectItem value="Scheduled">Scheduled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="readTime">Read Time (minutes) *</Label>
                    <Input
                      id="readTime"
                      type="number"
                      min="1"
                      value={formData.readTime}
                      onChange={(e) => handleInputChange("readTime", Number.parseInt(e.target.value) || 1)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="publishDate">Publish Date *</Label>
                    <Input
                      id="publishDate"
                      type="datetime-local"
                      value={formData.publishDate}
                      onChange={(e) => handleInputChange("publishDate", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Checkbox
                      id="featured"
                      checked={formData.featured}
                      onCheckedChange={(checked) => handleInputChange("featured", checked as boolean)}
                    />
                    <Label htmlFor="featured">Featured Blog Post</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Featured Image */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Featured Image {mode === 'add' ? '*' : '(Optional - leave blank to keep existing)'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  label="Featured Image"
                  value={formData.featuredImage}
                  onChange={handleImageUpload}
                  preview={imagePreview}
                  onRemove={removeImage}
                  required={mode === 'add'}
                />
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Add a tag and press Enter"
                    className="flex-1"
                  />
                  <Button type="button" onClick={addTag}>
                    Add Tag
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <div key={index} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Preview Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Blog Post Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Featured Image */}
                {imagePreview && (
                  <div>
                    <img src={imagePreview} alt="Featured" className="w-full h-64 object-cover rounded-lg" />
                  </div>
                )}

                {/* Header */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {formData.category && (
                      <Badge variant="outline">{formData.category}</Badge>
                    )}
                    {formData.featured && (
                      <Badge className="bg-yellow-500">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                    <Badge variant="outline" className="bg-green-50">
                      {formData.status}
                    </Badge>
                  </div>

                  <h1 className="text-3xl font-bold">{formData.title || "Blog Post Title"}</h1>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {formData.author || "Author Name"}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(formData.publishDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {formData.readTime} min read
                    </div>
                  </div>
                </div>

                {/* Excerpt */}
                <div>
                  <h4 className="font-semibold mb-2">Excerpt</h4>
                  <p className="text-gray-700 italic">{formData.excerpt || "No excerpt provided"}</p>
                </div>

                {/* Content Preview */}
                <div>
                  <h4 className="font-semibold mb-2">Content Preview</h4>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {formData.content ? formData.content.substring(0, 300) + (formData.content.length > 300 ? "..." : "") : "No content provided"}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                {formData.tags.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="bg-gray-50">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t p-6 bg-gray-50 flex-shrink-0">
          <div className="flex gap-2 justify-between">
            <Button variant="outline" onClick={fillFakeData}>
              Fill Test Data
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 
                  (mode === "edit" ? "Updating..." : "Creating...") : 
                  (mode === "edit" ? "Update Blog Post" : "Create Blog Post")
                }
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}