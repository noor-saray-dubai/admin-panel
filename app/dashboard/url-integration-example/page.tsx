"use client"

import { useState } from 'react'
import { InstantImageUpload, UploadedImage } from '@/components/ui/instant-image-upload'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function UrlIntegrationExample() {
  // Example 1: Simple URL state management
  const [coverImageUrl, setCoverImageUrl] = useState<string>('')
  const [galleryImageUrls, setGalleryImageUrls] = useState<string[]>([])

  // Example 2: Form-like state management
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    coverImage: '',
    galleryImages: [] as string[],
    description: ''
  })

  // Example 3: Advanced state with metadata
  const [plotData, setPlotData] = useState<{
    title: string
    coverImage: { url: string; publicId: string } | null
    galleryImages: Array<{ url: string; publicId: string; originalName: string }>
  }>({
    title: '',
    coverImage: null,
    galleryImages: []
  })

  const handleFormSubmit = () => {
    console.log('Form Data to submit:', {
      ...formData,
      coverImage: coverImageUrl,
      galleryImages: galleryImageUrls
    })
    
    // This is what you would send to your API
    const dataToSend = {
      title: formData.title,
      subtitle: formData.subtitle,
      coverImage: coverImageUrl,           // Single URL string
      galleryImages: galleryImageUrls,     // Array of URL strings
      description: formData.description
    }
    
    console.log('Ready to send to API:', dataToSend)
  }

  const handleAdvancedSubmit = () => {
    console.log('Advanced plot data:', plotData)
    
    // This includes metadata for advanced use cases
    const advancedData = {
      title: plotData.title,
      coverImage: plotData.coverImage?.url || '',
      coverImagePublicId: plotData.coverImage?.publicId || '',
      galleryImages: plotData.galleryImages.map(img => img.url),
      galleryImageMetadata: plotData.galleryImages
    }
    
    console.log('Advanced data for API:', advancedData)
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">URL Integration Examples</h1>
        <p className="text-muted-foreground">
          See how image URLs are returned to parent components and integrated into forms
        </p>
      </div>

      {/* Example 1: Simple URL Management */}
      <Card>
        <CardHeader>
          <CardTitle>Example 1: Simple URL State Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cover Image Upload */}
            <div>
              <InstantImageUpload
                mode="single"
                projectTitle="URL Example"
                imageType="cover"
                title="Upload Cover"
                onUploadComplete={(result) => {
                  const uploadedImage = result as UploadedImage
                  setCoverImageUrl(uploadedImage.url)
                  console.log('Cover URL received:', uploadedImage.url)
                }}
                onDelete={(url) => {
                  setCoverImageUrl('')
                  console.log('Cover URL cleared:', url)
                }}
              />
            </div>

            {/* Gallery Images Upload */}
            <div>
              <InstantImageUpload
                mode="multiple"
                maxFiles={3}
                projectTitle="URL Example"
                imageType="gallery"
                title="Upload Gallery"
                onUploadComplete={(result) => {
                  const uploadedImages = result as UploadedImage[]
                  const newUrls = uploadedImages.map(img => img.url)
                  setGalleryImageUrls(prev => [...prev, ...newUrls])
                  console.log('Gallery URLs received:', newUrls)
                }}
                onDelete={(url) => {
                  setGalleryImageUrls(prev => prev.filter(u => u !== url))
                  console.log('Gallery URL removed:', url)
                }}
              />
            </div>
          </div>

          {/* Show Current URLs */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <h4 className="font-semibold">Current URLs in State:</h4>
            <div className="space-y-2">
              <div>
                <Label className="text-sm font-medium">Cover Image URL:</Label>
                <div className="bg-white p-2 rounded border text-xs font-mono break-all">
                  {coverImageUrl || 'No cover image uploaded'}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Gallery URLs ({galleryImageUrls.length}):</Label>
                <div className="bg-white p-2 rounded border space-y-1">
                  {galleryImageUrls.length === 0 ? (
                    <div className="text-xs text-gray-500">No gallery images uploaded</div>
                  ) : (
                    galleryImageUrls.map((url, index) => (
                      <div key={index} className="text-xs font-mono break-all border-b pb-1 last:border-b-0">
                        {index + 1}: {url}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Example 2: Form Integration */}
      <Card>
        <CardHeader>
          <CardTitle>Example 2: Form Integration Pattern</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Project Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter project title"
                />
              </div>
              
              <div>
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="Enter subtitle"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="w-full p-2 border rounded-md"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter description"
                />
              </div>

              <Button 
                onClick={handleFormSubmit}
                className="w-full"
                disabled={!formData.title || !coverImageUrl}
              >
                Submit Form Data
              </Button>
            </div>

            {/* Image Uploads */}
            <div className="space-y-6">
              <InstantImageUpload
                mode="single"
                projectTitle="Form Example"
                imageType="cover"
                title="Cover Image"
                description="Required for form submission"
                onUploadComplete={(result) => {
                  const uploadedImage = result as UploadedImage
                  // Update both the separate state AND the form data
                  setCoverImageUrl(uploadedImage.url)
                  setFormData(prev => ({ ...prev, coverImage: uploadedImage.url }))
                }}
                onDelete={() => {
                  setCoverImageUrl('')
                  setFormData(prev => ({ ...prev, coverImage: '' }))
                }}
              />

              <InstantImageUpload
                mode="multiple"
                maxFiles={4}
                projectTitle="Form Example"
                imageType="gallery"
                title="Gallery Images"
                description="Optional additional images"
                onUploadComplete={(result) => {
                  const uploadedImages = result as UploadedImage[]
                  const newUrls = uploadedImages.map(img => img.url)
                  setGalleryImageUrls(prev => [...prev, ...newUrls])
                  setFormData(prev => ({ 
                    ...prev, 
                    galleryImages: [...prev.galleryImages, ...newUrls] 
                  }))
                }}
                onDelete={(url) => {
                  setGalleryImageUrls(prev => prev.filter(u => u !== url))
                  setFormData(prev => ({ 
                    ...prev, 
                    galleryImages: prev.galleryImages.filter(u => u !== url) 
                  }))
                }}
              />
            </div>
          </div>

          {/* Form Data Preview */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Form Data Ready for API:</h4>
            <pre className="text-xs bg-white p-3 rounded border overflow-auto">
              {JSON.stringify({
                title: formData.title,
                subtitle: formData.subtitle,
                coverImage: coverImageUrl,
                galleryImages: galleryImageUrls,
                description: formData.description
              }, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Example 3: Advanced Integration with Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Example 3: Advanced Integration with Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="plot-title">Plot Title</Label>
                <Input
                  id="plot-title"
                  value={plotData.title}
                  onChange={(e) => setPlotData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter plot title"
                />
              </div>
              
              <Button 
                onClick={handleAdvancedSubmit}
                className="w-full"
                disabled={!plotData.title}
              >
                Submit Advanced Data
              </Button>

              {/* Metadata Display */}
              <div className="bg-gray-50 p-3 rounded">
                <h5 className="font-medium mb-2">Image Metadata:</h5>
                <div className="text-xs space-y-2">
                  <div>
                    <strong>Cover:</strong> {plotData.coverImage ? 
                      `${plotData.coverImage.publicId}` : 'None'}
                  </div>
                  <div>
                    <strong>Gallery Count:</strong> {plotData.galleryImages.length}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <InstantImageUpload
                mode="single"
                projectTitle="Advanced Example"
                imageType="cover"
                title="Cover with Metadata"
                onUploadComplete={(result) => {
                  const uploadedImage = result as UploadedImage
                  setPlotData(prev => ({
                    ...prev,
                    coverImage: {
                      url: uploadedImage.url,
                      publicId: uploadedImage.publicId
                    }
                  }))
                }}
                onDelete={() => {
                  setPlotData(prev => ({ ...prev, coverImage: null }))
                }}
              />

              <InstantImageUpload
                mode="multiple"
                maxFiles={3}
                projectTitle="Advanced Example"
                imageType="gallery"
                title="Gallery with Metadata"
                onUploadComplete={(result) => {
                  const uploadedImages = result as UploadedImage[]
                  const newImages = uploadedImages.map(img => ({
                    url: img.url,
                    publicId: img.publicId,
                    originalName: img.originalName
                  }))
                  setPlotData(prev => ({
                    ...prev,
                    galleryImages: [...prev.galleryImages, ...newImages]
                  }))
                }}
                onDelete={(url) => {
                  setPlotData(prev => ({
                    ...prev,
                    galleryImages: prev.galleryImages.filter(img => img.url !== url)
                  }))
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Code Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Code Patterns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">1. Simple URL Return:</h4>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
{`// Single image
onUploadComplete={(result) => {
  const uploadedImage = result as UploadedImage
  setImageUrl(uploadedImage.url)  // Just the URL string
}}

// Multiple images  
onUploadComplete={(result) => {
  const uploadedImages = result as UploadedImage[]
  const urls = uploadedImages.map(img => img.url)
  setImageUrls(prev => [...prev, ...urls])  // Array of URL strings
}}`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold mb-2">2. Form Integration Pattern:</h4>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
{`const [formData, setFormData] = useState({
  title: '',
  coverImage: '',        // Single URL
  galleryImages: []      // Array of URLs
})

// On upload complete
onUploadComplete={(result) => {
  const uploadedImage = result as UploadedImage
  setFormData(prev => ({
    ...prev,
    coverImage: uploadedImage.url
  }))
}}

// On form submit
const handleSubmit = () => {
  const dataToSend = {
    title: formData.title,
    coverImage: formData.coverImage,     // URL string
    galleryImages: formData.galleryImages // URL strings array
  }
  // Send to your API
  fetch('/api/plots/add', { 
    method: 'POST', 
    body: JSON.stringify(dataToSend) 
  })
}`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}