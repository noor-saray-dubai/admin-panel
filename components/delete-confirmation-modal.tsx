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
  isActive?: boolean // For two-stage deletion - whether item is currently active
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  
  itemName,
  itemType,
  isDeleting = false,
  isActive = true, // Default to active if not specified
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
            {isActive ? (
              <>
                Are you sure you want to deactivate "{itemName}"?
                <br />
                <span className="text-sm text-muted-foreground mt-1 block">
                  This will mark the {itemType.toLowerCase()} as inactive. You can delete it again to permanently remove it from the database.
                </span>
              </>
            ) : (
              <>
                Are you sure you want to permanently delete "{itemName}"?
                <br />
                <span className="text-sm text-red-500 mt-1 block font-medium">
                  This action cannot be undone and will permanently remove the {itemType.toLowerCase()} from the database.
                </span>
              </>
            )}
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
            {isDeleting 
              ? (isActive ? 'Deactivating...' : 'Deleting...') 
              : (isActive ? 'Deactivate' : 'Delete Permanently')
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
