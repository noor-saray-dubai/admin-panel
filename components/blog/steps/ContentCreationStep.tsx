"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Type, Hash, Image as ImageIcon, Link, Quote, List, FileText
} from "lucide-react"

// This will contain all the existing content block editor logic
// For now, this is a placeholder that will receive the content blocks logic

const MAX_BLOCKS = 50 // Aligned with schema limit

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

interface IContentBlock {
  type: "paragraph" | "heading" | "image" | "link" | "quote" | "list"
  order: number
  [key: string]: any
}

interface BlogFormData {
  contentBlocks: IContentBlock[]
  // ... other fields
}

interface FieldErrors {
  [key: string]: string
}

interface ContentCreationStepProps {
  formData: BlogFormData
  errors: FieldErrors
  onFieldChange: (field: keyof BlogFormData, value: any) => void
  // These are the existing functions from the main component - we'll pass them as props
  addContentBlock: (type: "paragraph" | "heading" | "image" | "link" | "quote" | "list") => void
  updateContentBlock: (index: number, updates: Partial<IContentBlock>) => void
  removeContentBlock: (index: number) => void
  moveContentBlock: (index: number, direction: 'up' | 'down') => void
  hasH1: boolean
  setErrors: React.Dispatch<React.SetStateAction<FieldErrors>>
  // All the existing content block editor components will be used here
  ContentBlockEditor?: React.ComponentType<any>
}

export function ContentCreationStep({ 
  formData, 
  errors, 
  onFieldChange,
  addContentBlock,
  updateContentBlock,
  removeContentBlock,
  moveContentBlock,
  hasH1,
  setErrors,
  ContentBlockEditor
}: ContentCreationStepProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Content Blocks</span>
            <CharCounter 
              current={formData.contentBlocks.length} 
              max={MAX_BLOCKS}
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.contentBlocks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium mb-2">No content blocks yet</p>
              <p className="text-sm">Use the buttons below to add paragraph, heading, image, link, quote, or list blocks.</p>
            </div>
          ) : (
            formData.contentBlocks
              .sort((a, b) => a.order - b.order)
              .map((block, index) => (
                // This will use the existing ContentBlockEditor component
                ContentBlockEditor && (
                  <ContentBlockEditor
                    key={`${block.type}-${block.order}`}
                    block={block}
                    onUpdate={(updates: Partial<IContentBlock>) => updateContentBlock(
                      formData.contentBlocks.findIndex(b => b.order === block.order),
                      updates
                    )}
                    onRemove={() => removeContentBlock(
                      formData.contentBlocks.findIndex(b => b.order === block.order)
                    )}
                    onMove={(direction: 'up' | 'down') => moveContentBlock(
                      formData.contentBlocks.findIndex(b => b.order === block.order),
                      direction
                    )}
                    canMoveUp={index > 0}
                    canMoveDown={index < formData.contentBlocks.length - 1}
                    errors={errors}
                    setErrors={setErrors}
                    hasH1Already={hasH1}
                  />
                )
              ))
          )}
          
          {/* Add New Content Block Buttons - Better UX at bottom */}
          <div className="border-t pt-4 mt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">Add a new content block:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline"
                  onClick={() => addContentBlock("paragraph")}
                  disabled={formData.contentBlocks.length >= MAX_BLOCKS}
                  className="flex items-center gap-2"
                >
                  <Type className="h-4 w-4" />
                  Paragraph
                </Button>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline"
                  onClick={() => addContentBlock("heading")}
                  disabled={formData.contentBlocks.length >= MAX_BLOCKS}
                  className="flex items-center gap-2"
                >
                  <Hash className="h-4 w-4" />
                  Heading
                </Button>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline"
                  onClick={() => addContentBlock("image")}
                  disabled={formData.contentBlocks.length >= MAX_BLOCKS}
                  className="flex items-center gap-2"
                >
                  <ImageIcon className="h-4 w-4" />
                  Image
                </Button>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline"
                  onClick={() => addContentBlock("link")}
                  disabled={formData.contentBlocks.length >= MAX_BLOCKS}
                  className="flex items-center gap-2"
                >
                  <Link className="h-4 w-4" />
                  Link
                </Button>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline"
                  onClick={() => addContentBlock("quote")}
                  disabled={formData.contentBlocks.length >= MAX_BLOCKS}
                  className="flex items-center gap-2"
                >
                  <Quote className="h-4 w-4" />
                  Quote
                </Button>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline"
                  onClick={() => addContentBlock("list")}
                  disabled={formData.contentBlocks.length >= MAX_BLOCKS}
                  className="flex items-center gap-2"
                >
                  <List className="h-4 w-4" />
                  List
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}