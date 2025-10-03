"use client"

import { useState } from 'react'
import { InstantImageUpload, UploadedImage } from '@/components/ui/instant-image-upload'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, Keyboard, Mouse, Copy, Upload } from 'lucide-react'

export default function PasteTestPage() {
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [testInput, setTestInput] = useState('')

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Paste & Error Handling Test</h1>
        <p className="text-muted-foreground">
          Test the improved paste functionality and error handling
        </p>
      </div>

    
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            How to Test Paste Functionality
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Keyboard className="h-4 w-4" />
            <AlertDescription>
              <strong>Global Paste:</strong> Press Ctrl+V anywhere on this page (outside of text inputs) to paste images or image URLs
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-green-700 flex items-center gap-2">
                <Copy className="h-4 w-4" />
                What You Can Paste:
              </h4>
              <ul className="text-sm space-y-1 text-green-600">
                <li>• Image files from clipboard (copied images)</li>
                <li>• Direct image URLs (jpg, png, webp, gif)</li>
                <li>• Screenshots from clipboard</li>
                <li>• Images copied from other websites</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-blue-700 flex items-center gap-2">
                <Mouse className="h-4 w-4" />
                Other Upload Methods:
              </h4>
              <ul className="text-sm space-y-1 text-blue-600">
                <li>• Drag & drop images onto upload area</li>
                <li>• Click to open file browser</li>
                <li>• Multiple file selection supported</li>
                <li>• Auto-watermarking with "Noor Saray Real Estate"</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h5 className="font-medium text-yellow-800 mb-2">Test URLs (try pasting these):</h5>
            <div className="space-y-1 text-xs font-mono text-yellow-700">
              <div>✅ Valid: https://picsum.photos/800/600</div>
              <div>✅ Valid: https://via.placeholder.com/1200x600.jpg</div>
              <div>❌ Invalid: https://example.com/not-an-image.txt</div>
              <div>❌ Invalid: https://httpstat.us/404.jpg</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Test Input Field */}
      <Card>
        <CardHeader>
          <CardTitle>Test Text Input (Paste should work normally here)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="test-input">Type or paste text here (paste won't trigger image upload):</Label>
            <Input
              id="test-input"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Paste URLs or text here - should work normally"
            />
            <p className="text-xs text-muted-foreground">
              When focused on this input, Ctrl+V will paste text normally, not trigger image upload
            </p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Upload Component */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Image Upload Test Area
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Click outside this text, then press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+V</kbd> to paste images or URLs
              </AlertDescription>
            </Alert>

            <InstantImageUpload
              mode="multiple"
              maxFiles={5}
              projectTitle="Paste Test"
              imageType="gallery"
              title="Test Image Upload"
              description="Try all upload methods: drag & drop, click to browse, or paste (Ctrl+V)"
              onUploadComplete={(result) => {
                const newImages = result as UploadedImage[]
                const newUrls = newImages.map(img => img.url)
                setUploadedImages(prev => [...prev, ...newUrls])
                console.log('Upload complete:', newUrls)
              }}
              onDelete={(imageUrl) => {
                setUploadedImages(prev => prev.filter(url => url !== imageUrl))
                console.log('Image deleted:', imageUrl)
              }}
              onError={(error) => {
                console.error('Upload error:', error)
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Upload Results */}
      {uploadedImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Results ({uploadedImages.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {uploadedImages.map((url, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-xs font-mono truncate flex-1 mr-2">{url}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(url, '_blank')}
                  >
                    View
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => setUploadedImages([])}
                className="w-full mt-4"
              >
                Clear Results
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Testing */}
      <Card>
        <CardHeader>
          <CardTitle>Error Handling Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h5 className="font-medium mb-2">Try these to test error handling:</h5>
              <ul className="space-y-1 text-muted-foreground">
                <li>1. Paste a non-image URL (like https://example.com)</li>
                <li>2. Paste a 404 URL (like https://httpstat.us/404.jpg)</li>
                <li>3. Upload a very large image (&gt;10MB)</li>
                <li>4. Upload a non-image file</li>
                <li>5. Try to upload more than the maximum allowed files</li>
              </ul>
            </div>
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-blue-800 text-xs">
                <strong>Improved Error Messages:</strong> All errors now show specific, actionable messages
                with emojis and detailed explanations of what went wrong and how to fix it.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}