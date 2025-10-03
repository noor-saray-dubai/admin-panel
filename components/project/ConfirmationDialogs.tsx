// components/project/ConfirmationDialogs.tsx
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Save, X } from "lucide-react"
import { useToast } from "@/components/ui/toast-system"
import type { ProjectFormData } from "@/types/projects"
import { saveProjectFormDraft, clearProjectFormDraft } from "@/lib/project-form-persistence"

interface ConfirmationDialogsProps {
  mode: "add" | "edit"
  hasUnsavedChanges: boolean
  formData: ProjectFormData
  onClose: () => void
  isSubmitting: boolean
  onResetForm?: () => void // Add callback to reset form data
  isModalOpen: boolean // Add flag to know if parent modal is open
}

export function ConfirmationDialogs({ mode, hasUnsavedChanges, formData, onClose, isSubmitting, onResetForm, isModalOpen }: ConfirmationDialogsProps) {
  const toast = useToast()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)


  const handleConfirmClose = () => {
    // If closing without unsaved changes in add mode, clear any existing draft
    if (mode === "add" && !hasUnsavedChanges) {
      try {
        clearProjectFormDraft()
        console.log('Draft cleared on clean close')
      } catch (error) {
        console.error('Failed to clear draft on clean close:', error)
      }
    }
    
    setShowConfirmDialog(false)
    onClose()
  }

  const handleSaveDraft = () => {
    if (mode === "add") {
      try {
        saveProjectFormDraft(formData)
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
        clearProjectFormDraft()
        console.log('Draft cleared on discard')
        // Reset form data to initial state
        if (onResetForm) {
          onResetForm()
        }
      } catch (error) {
        console.error('Failed to clear draft:', error)
      }
    }
    toast.info('Changes discarded')
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
    
    ;(window as any).handleProjectFormClose = handleCloseAttemptFromParent
    
    return () => {
      delete (window as any).handleProjectFormClose
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
