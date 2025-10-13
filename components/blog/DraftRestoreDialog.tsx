"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Clock, FileText, Trash } from "lucide-react"
import { getBlogDraftTimestamp } from "@/lib/blog-form-persistence"

interface DraftRestoreDialogProps {
  isOpen: boolean
  onRestore: () => void
  onDiscard: () => void
  draftTimestamp: Date | string | null
  entityType?: string
}

const formatDraftAge = (timestamp: Date | string | null) => {
  if (!timestamp) return "Unknown time"
  
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export function DraftRestoreDialog({ 
  isOpen, 
  onRestore, 
  onDiscard, 
  draftTimestamp 
}: DraftRestoreDialogProps) {

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Previous Session Found
          </DialogTitle>
          <DialogDescription>
            We found a saved draft from your previous session, including form data and uploaded images.
          </DialogDescription>
          {draftTimestamp && (
            <div className="flex items-center gap-1 mt-2 text-sm text-gray-600">
              <Clock className="h-3 w-3" />
              Saved {formatDraftAge(draftTimestamp)}
            </div>
          )}
        </DialogHeader>

        <div className="flex flex-col gap-2 mt-4">
          <Button onClick={onRestore} className="w-full">
            <FileText className="h-4 w-4 mr-2" />
            Restore Session (with images)
          </Button>
          
          <Button onClick={onDiscard} variant="outline" className="w-full">
            <Trash className="h-4 w-4 mr-2" />
            Start Fresh
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}