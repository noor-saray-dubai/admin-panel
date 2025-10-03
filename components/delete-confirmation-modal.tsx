"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Loader2 } from "lucide-react"

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
  itemName: string
  itemType: string
  isDeleting?: boolean
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  
  itemName,
  itemType,
  isDeleting = false,
}: DeleteConfirmationModalProps) {
  const handleConfirm = async () => {
    if (isDeleting) return // Prevent multiple clicks during deletion
    
    try {
      await onConfirm()
    } catch (error) {
      console.error('Delete operation failed:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={isDeleting ? undefined : onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <DialogTitle>Delete {itemType}</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete "{itemName}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
