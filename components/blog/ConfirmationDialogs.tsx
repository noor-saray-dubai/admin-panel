"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Save, X } from "lucide-react"
import { toast } from "sonner"
import { saveBlogFormDraft, clearBlogFormDraft } from "@/lib/blog-form-persistence"

interface BlogFormData {
  title: string
  excerpt: string
  contentBlocks: any[]
  featuredImage: File | null
  author: string
  category: string
  tags: string[]
  status: "Published" | "Draft"
  publishDate: string
  featured: boolean
}

interface ConfirmationDialogsProps {
  mode: "add" | "edit"
  hasUnsavedChanges: boolean
  formData: BlogFormData
  onClose: () => void
  isSubmitting: boolean
  onResetForm?: () => void // Add callback to reset form data
  isModalOpen: boolean // Add flag to know if parent modal is open
}

export function ConfirmationDialogs({ mode, hasUnsavedChanges, formData, onClose, isSubmitting, onResetForm, isModalOpen }: ConfirmationDialogsProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const handleConfirmClose = () => {
    // If closing without unsaved changes in add mode, clear any existing draft
    if (mode === "add" && !hasUnsavedChanges) {
      try {
        clearBlogFormDraft()
        console.log('Blog draft cleared on clean close')
      } catch (error) {
        console.error('Failed to clear blog draft on clean close:', error)
      }
    }
    
    setShowConfirmDialog(false)
    onClose()
  }

  const handleSaveDraft = () => {
    if (mode === "add") {
      try {
        saveBlogFormDraft(formData)
        toast.success('Draft saved successfully')
      } catch (error) {
        console.error('Failed to save draft:', error)
        toast.error('Failed to save draft')
      }
    }
    handleConfirmClose()
  }

  const handleDiscardChanges = () => {
    if (mode === "add") {
      try {
        clearBlogFormDraft()
        console.log('Blog draft cleared on discard')
      } catch (error) {
        console.error('Failed to clear blog draft:', error)
      }
    }
    
    // Reset form data to initial state for both add and edit modes
    if (onResetForm) {
      onResetForm()
    }
    
    toast('Changes discarded')
    handleConfirmClose()
  }

  const handleCancelClose = () => {
    setShowConfirmDialog(false)
  }

  // Expose function to handle close attempts from parent
  useEffect(() => {
    // Only register handler if this modal is actually open
    if (!isModalOpen) {
      return
    }
    
    const handleCloseAttemptFromParent = () => {
      if (isSubmitting) return // Don't allow closing during submission
      
      // Always show the dialog (either unsaved changes or clean close confirmation)
      setShowConfirmDialog(true)
    }
    
    ;(window as any).handleBlogFormClose = handleCloseAttemptFromParent
    
    return () => {
      delete (window as any).handleBlogFormClose
    }
  }, [hasUnsavedChanges, onClose, isSubmitting, mode, isModalOpen])

  return (
    <Dialog open={showConfirmDialog} onOpenChange={(open) => !open && handleCancelClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {hasUnsavedChanges ? "Unsaved Changes" : "Confirm Close"}
          </DialogTitle>
          <DialogDescription>
            {hasUnsavedChanges 
              ? "You have unsaved changes that will be lost if you close now."
              : "Are you sure you want to close this form?"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 mt-4">
          {hasUnsavedChanges ? (
            <>
              <Button onClick={handleCancelClose} variant="outline" className="w-full">
                Continue Editing
              </Button>
              
              {mode === "add" && (
                <Button onClick={handleSaveDraft} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft & Close
                </Button>
              )}
              
              <Button onClick={handleDiscardChanges} variant="destructive" className="w-full">
                <X className="h-4 w-4 mr-2" />
                Discard Changes
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleCancelClose} variant="outline" className="w-full">
                Cancel
              </Button>
              <Button onClick={handleConfirmClose} variant="destructive" className="w-full">
                Close Form
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}