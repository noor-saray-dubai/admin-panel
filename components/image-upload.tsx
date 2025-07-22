"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { X, Upload, ImageIcon } from "lucide-react"

interface ImageUploadProps {
  label: string
  value: string[]
  onChange: (images: string[]) => void
  multiple?: boolean
  maxImages?: number
}

export function ImageUpload({ label, value, onChange, multiple = false, maxImages = 5 }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const newImages: string[] = []
    const maxFiles = multiple ? Math.min(files.length, maxImages - value.length) : 1

    for (let i = 0; i < maxFiles; i++) {
      const file = files[i]
      if (file && file.type.startsWith("image/")) {
        // In a real app, you'd upload to a service like Cloudinary
        // For demo, we'll create object URLs
        const objectUrl = URL.createObjectURL(file)
        newImages.push(objectUrl)
      }
    }

    if (multiple) {
      onChange([...value, ...newImages])
    } else {
      onChange(newImages)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const removeImage = (index: number) => {
    const newImages = value.filter((_, i) => i !== index)
    onChange(newImages)
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        <div className="space-y-2">
          <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
          <div>
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Upload {multiple ? "Images" : "Image"}
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            Drag and drop {multiple ? "images" : "an image"} here, or click to select
          </p>
          {multiple && (
            <p className="text-xs text-gray-400">
              {value.length}/{maxImages} images uploaded
            </p>
          )}
        </div>
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
          {value.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={image || "/placeholder.svg"}
                alt={`Upload ${index + 1}`}
                className="w-full h-24 object-cover rounded border"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
