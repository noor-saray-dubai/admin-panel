"use client"

import { useState } from 'react'
import { InstantImageUpload, UploadedImage } from '@/components/ui/instant-image-upload'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default function TestUploadPage() {
  const [coverImage, setCoverImage] = useState<UploadedImage | null>(null)
  const [galleryImages, setGalleryImages] = useState<UploadedImage[]>([])

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Enhanced Image Upload Component</h1>
        <p className="text-muted-foreground">
          Test instant uploads with client-side processing, validation, and real-time feedback
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cover Image - Single Mode */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Cover Image
              <Badge variant="outline">mode="single"</Badge>
              <Badge variant="secondary">type="cover"</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InstantImageUpload
              mode="single"
              projectTitle="Demo Project"
              imageType="cover"
              title="Upload Cover Image"
              description="Landscape images work best for covers (minimum 1200×600px)"
              onUploadComplete={(result) => {
                console.log('Cover upload complete:', result)
                setCoverImage(result as UploadedImage)
              }}
              onUploadStart={() => console.log('Cover upload started')}
              onError={(error) => console.error('Cover upload error:', error)}
              onDelete={(url) => {
                console.log('Cover image deleted:', url)
                setCoverImage(null)
              }}
            />

            {coverImage && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Current Cover:</h4>
                <div className="text-sm space-y-1">
                  <p><strong>URL:</strong> <span className="font-mono text-xs">{coverImage.url}</span></p>
                  <p><strong>Name:</strong> {coverImage.originalName}</p>
                  <p><strong>Size:</strong> {(coverImage.size / (1024 * 1024)).toFixed(2)} MB</p>
                  <p><strong>Format:</strong> {coverImage.format}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gallery Images - Multiple Mode */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Gallery Images
              <Badge variant="outline">mode="multiple"</Badge>
              <Badge variant="secondary">type="gallery"</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* <InstantImageUpload
              mode="multiple"
              maxFiles={5}
              projectTitle="Demo Project"
              imageType="gallery"
              title="Upload Gallery Images"
              description="Upload up to 5 images for the gallery (minimum 800×600px each)"
              onUploadComplete={(result) => {
                console.log('Gallery upload complete:', result)
                setGalleryImages(prev => [...prev, ...(result as UploadedImage[])])
              }}
              onUploadStart={() => console.log('Gallery upload started')}
              onError={(error) => console.error('Gallery upload error:', error)}
              onDelete={(url) => {
                console.log('Gallery image deleted:', url)
                setGalleryImages(prev => prev.filter(img => img.url !== url))
              }}
            /> */}

            {galleryImages.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Gallery Images ({galleryImages.length}):</h4>
                <div className="space-y-2 text-sm max-h-48 overflow-y-auto">
                  {galleryImages.map((image, index) => (
                    <div key={index} className="flex justify-between items-center py-1 px-2 bg-white rounded border">
                      <span className="truncate max-w-[200px] text-xs font-mono">{image.originalName}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {image.format.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {(image.size / (1024 * 1024)).toFixed(1)} MB
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Enhanced Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>✨ Enhanced Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold">🖱️ Multiple Upload Methods</h4>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>• Click to browse files</li>
                <li>• Drag & drop from explorer</li>
                <li>• Copy & paste from clipboard</li>
                <li>• Instant visual feedback</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">⚡ Client-Side Processing</h4>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>• Auto-resize to optimal dimensions</li>
                <li>• Convert to WebP for compression</li>
                <li>• Validate dimensions before upload</li>
                <li>• Smart quality optimization</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">🎯 Smart Validation</h4>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>• Cover: 1200×600px min, landscape</li>
                <li>• Gallery: 800×600px min, any ratio</li>
                <li>• File size and type validation</li>
                <li>• Helpful error messages</li>
              </ul>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-semibold">🚀 Real-time Features:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Instant upload progress indicators</li>
                <li>Real-time image processing feedback</li>
                <li>Immediate UI updates on delete</li>
                <li>Background Cloudinary operations</li>
              </ul>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Full-screen image preview modal</li>
                <li>Copy image URL to clipboard</li>
                <li>Download processed images</li>
                <li>Organized cloud storage folders</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">📁 Folder Organization</h4>
            <p className="text-blue-700 text-sm">
              Images are organized in Cloudinary as: <code className="bg-blue-100 px-1 rounded">projects/demo-project/cover-0.webp</code> or <code className="bg-blue-100 px-1 rounded">projects/demo-project/gallery-1.webp</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}