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
import { ImageUpload } from "./image-upload"

interface Blog {
  id: number
  title: string
  slug: string
  excerpt: string
  content: string
  featuredImage: string[]
  author: string
  category: string
  tags: string[]
  status: "Published" | "Draft" | "Scheduled"
  publishDate: string
  readTime: number
  views: number
  featured: boolean
}

interface BlogFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (blog: Blog) => void
  blog?: Blog | null
  mode: "add" | "edit"
}

const categories = ["Investment", "Development", "Legal", "Sustainability", "Market Analysis", "Lifestyle", "News"]

export function BlogFormModal({ isOpen, onClose, onSave, blog, mode }: BlogFormModalProps) {
  const [formData, setFormData] = useState<Blog>({
    id: 0,
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    featuredImage: [],
    author: "",
    category: "",
    tags: [],
    status: "Draft",
    publishDate: new Date().toISOString(),
    readTime: 5,
    views: 0,
    featured: false,
  })

  const [tagInput, setTagInput] = useState("")

  useEffect(() => {
    if (blog && mode === "edit") {
      setFormData(blog)
    } else {
      setFormData({
        id: 0,
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        featuredImage: [],
        author: "",
        category: "",
        tags: [],
        status: "Draft",
        publishDate: new Date().toISOString(),
        readTime: 5,
        views: 0,
        featured: false,
      })
    }
  }, [blog, mode, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    onClose()
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()
  }

  const handleTitleChange = (title: string) => {
    handleInputChange("title", title)
    if (!blog) {
      // Only auto-generate slug for new blogs
      handleInputChange("slug", generateSlug(title))
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleInputChange("tags", [...formData.tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    handleInputChange(
      "tags",
      formData.tags.filter((tag) => tag !== tagToRemove),
    )
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Create New Blog Post" : "Edit Blog Post"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={formData.title} onChange={(e) => handleTitleChange(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleInputChange("slug", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) => handleInputChange("author", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger>
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
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Published">Published</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="publishDate">Publish Date</Label>
              <Input
                id="publishDate"
                type="datetime-local"
                value={formData.publishDate.slice(0, 16)}
                onChange={(e) => handleInputChange("publishDate", e.target.value + ":00.000Z")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="readTime">Read Time (minutes)</Label>
              <Input
                id="readTime"
                type="number"
                value={formData.readTime}
                onChange={(e) => handleInputChange("readTime", Number.parseInt(e.target.value) || 0)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              value={formData.excerpt}
              onChange={(e) => handleInputChange("excerpt", e.target.value)}
              rows={3}
              placeholder="Brief description of the blog post..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange("content", e.target.value)}
              rows={8}
              placeholder="Write your blog content here..."
              required
            />
          </div>

          <ImageUpload
            label="Featured Image"
            value={formData.featuredImage}
            onChange={(images) => handleInputChange("featuredImage", images)}
            multiple={false}
          />

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex space-x-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a tag and press Enter"
              />
              <Button type="button" onClick={addTag}>
                Add Tag
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag, index) => (
                <div key={index} className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
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
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="featured"
              checked={formData.featured}
              onCheckedChange={(checked) => handleInputChange("featured", checked as boolean)}
            />
            <Label htmlFor="featured">Featured Blog Post</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{mode === "add" ? "Create Blog Post" : "Save Changes"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}