"use client"

import { useState } from 'react'
import { InstantImageUpload, UploadedImage } from '@/components/ui/instant-image-upload'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

export default function EditModeExample() {
  const [currentMode, setCurrentMode] = useState<'add' | 'edit'>('add')
  
  // Mock existing data (like what you'd get from an API)
  const mockExistingData = {
    single: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    multiple: [
      'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      'https://res.cloudinary.com/demo/image/upload/sample2.jpg',
      'https://res.cloudinary.com/demo/image/upload/sample3.jpg'
    ]
  }
  
  // Form state
  const [singleFormData, setSingleFormData] = useState({
    title: 'My Project',
    coverImage: currentMode === 'edit' ? mockExistingData.single : '',
  })
  
  const [multipleFormData, setMultipleFormData] = useState({
    title: 'Gallery Project',
    galleryImages: currentMode === 'edit' ? [...mockExistingData.multiple] : [],
  })
  
  // Reset form data when mode changes
  const handleModeChange = (mode: 'add' | 'edit') => {
    setCurrentMode(mode)
    if (mode === 'edit') {
      setSingleFormData({
        title: 'My Project (Edit Mode)',
        coverImage: mockExistingData.single,
      })
      setMultipleFormData({
        title: 'Gallery Project (Edit Mode)',
        galleryImages: [...mockExistingData.multiple],
      })
    } else {
      setSingleFormData({
        title: 'New Project',
        coverImage: '',
      })
      setMultipleFormData({
        title: 'New Gallery Project',
        galleryImages: [],
      })
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Edit vs Add Mode Example</h1>
        <p className="text-muted-foreground">
          See how the image upload component behaves differently in edit mode vs add mode
        </p>
        
        {/* Mode Toggle */}
        <div className="flex justify-center">
          <ToggleGroup 
            type="single" 
            value={currentMode} 
            onValueChange={(value) => value && handleModeChange(value as 'add' | 'edit')}
            className="border rounded-lg p-1"
          >
            <ToggleGroupItem value="add" className="px-4 py-2">
              Add Mode
            </ToggleGroupItem>
            <ToggleGroupItem value="edit" className="px-4 py-2">
              Edit Mode
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        
        <div className="text-center space-y-2">
          <Badge variant={currentMode === 'edit' ? 'default' : 'secondary'} className="mx-2">
            Current Mode: {currentMode.toUpperCase()}
          </Badge>
          {currentMode === 'edit' && (
            <p className="text-sm text-blue-600">
              📝 In edit mode: Existing images are shown with blue borders and "Existing" badges
            </p>
          )}
          {currentMode === 'add' && (
            <p className="text-sm text-green-600">
              ➕ In add mode: Starting fresh with no existing images
            </p>
          )}
        </div>
      </div>

      <Separator />

      {/* Single Mode Example */}
      <Card>
        <CardHeader>
          <CardTitle>Single Mode - Cover Image</CardTitle>
          <p className="text-sm text-muted-foreground">
            {currentMode === 'edit' 
              ? 'Edit mode: Existing cover image is shown, can be replaced' 
              : 'Add mode: Upload a new cover image'
            }
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="single-title">Project Title</Label>
                <Input
                  id="single-title"
                  value={singleFormData.title}
                  onChange={(e) => setSingleFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium mb-2">Current Form Data:</h5>
                <pre className="text-xs bg-white p-2 rounded overflow-auto">
                  {JSON.stringify(singleFormData, null, 2)}
                </pre>
              </div>
            </div>

            {/* Upload Component */}
            <div>
              <InstantImageUpload
                mode="single"
                projectTitle="Edit Mode Example"
                imageType="cover"
                title="Cover Image"
                description={currentMode === 'edit' 
                  ? "Replace existing cover image or keep current one" 
                  : "Upload a new cover image"
                }
                editMode={currentMode === 'edit'}
                existingImages={currentMode === 'edit' ? singleFormData.coverImage : undefined}
                onUploadComplete={(result) => {
                  const uploadedImage = result as UploadedImage
                  setSingleFormData(prev => ({ ...prev, coverImage: uploadedImage.url }))
                  console.log('Single upload complete:', uploadedImage.url)
                }}
                onReplace={(oldUrl, newResult) => {
                  const newImage = newResult as UploadedImage
                  setSingleFormData(prev => ({ ...prev, coverImage: newImage.url }))
                  console.log('Single image replaced:', { oldUrl, newUrl: newImage.url })
                }}
                onDelete={(imageUrl) => {
                  setSingleFormData(prev => ({ ...prev, coverImage: '' }))
                  console.log('Single image deleted:', imageUrl)
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Multiple Mode Example */}
      <Card>
        <CardHeader>
          <CardTitle>Multiple Mode - Gallery Images</CardTitle>
          <p className="text-sm text-muted-foreground">
            {currentMode === 'edit' 
              ? 'Edit mode: Existing gallery images shown, can add more or remove existing' 
              : 'Add mode: Build a new gallery from scratch'
            }
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="multiple-title">Gallery Title</Label>
                <Input
                  id="multiple-title"
                  value={multipleFormData.title}
                  onChange={(e) => setMultipleFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium mb-2">Current Form Data:</h5>
                <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(multipleFormData, null, 2)}
                </pre>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p><strong>Gallery URLs count:</strong> {multipleFormData.galleryImages.length}</p>
              </div>
            </div>

            {/* Upload Component */}
            <div>
              <InstantImageUpload
                mode="multiple"
                maxFiles={6}
                projectTitle="Edit Mode Example"
                imageType="gallery"
                title="Gallery Images"
                description={currentMode === 'edit' 
                  ? "Manage existing gallery images - add new ones or remove existing" 
                  : "Upload new gallery images"
                }
                editMode={currentMode === 'edit'}
                existingImages={currentMode === 'edit' ? multipleFormData.galleryImages : undefined}
                onUploadComplete={(result) => {
                  const uploadedImages = result as UploadedImage[]
                  const newUrls = uploadedImages.map(img => img.url)
                  setMultipleFormData(prev => ({ 
                    ...prev, 
                    galleryImages: [...prev.galleryImages, ...newUrls] 
                  }))
                  console.log('Multiple upload complete:', newUrls)
                }}
                onDelete={(imageUrl) => {
                  setMultipleFormData(prev => ({ 
                    ...prev, 
                    galleryImages: prev.galleryImages.filter(url => url !== imageUrl) 
                  }))
                  console.log('Multiple image deleted:', imageUrl)
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* API Integration Example */}
      <Card>
        <CardHeader>
          <CardTitle>API Integration Pattern</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Usage in Add Mode:</h4>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
{`<InstantImageUpload
  mode="single"
  projectTitle="New Project"
  imageType="cover"
  editMode={false}  // Add mode
  // No existingImages prop
  onUploadComplete={(result) => {
    const uploadedImage = result as UploadedImage
    setFormData(prev => ({ ...prev, coverImage: uploadedImage.url }))
  }}
/>`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Usage in Edit Mode:</h4>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
{`<InstantImageUpload
  mode="single"
  projectTitle="Existing Project"
  imageType="cover"
  editMode={true}   // Edit mode
  existingImages={project.coverImageUrl}  // Pass existing URL
  onReplace={(oldUrl, newResult) => {
    // Called when replacing existing image
    const newImage = newResult as UploadedImage
    updateProject({ coverImage: newImage.url })
  }}
  onDelete={(imageUrl) => {
    // Called when removing existing image
    updateProject({ coverImage: null })
  }}
/>`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Key Differences:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-green-50 p-3 rounded">
                  <h5 className="font-medium text-green-800 mb-2">Add Mode:</h5>
                  <ul className="text-green-700 space-y-1 text-xs">
                    <li>• editMode={false} or omitted</li>
                    <li>• No existingImages prop</li>
                    <li>• Uses onUploadComplete callback</li>
                    <li>• Fresh start with no images</li>
                    <li>• All images get watermark applied</li>
                  </ul>
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <h5 className="font-medium text-blue-800 mb-2">Edit Mode:</h5>
                  <ul className="text-blue-700 space-y-1 text-xs">
                    <li>• editMode={true} explicitly set</li>
                    <li>• existingImages prop with URLs</li>
                    <li>• Uses onReplace for replacements</li>
                    <li>• Existing images shown with badges</li>
                    <li>• Existing images not deleted from Cloudinary</li>
                    <li>• New images still get watermark</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}