// components/hotels/DraftRestoreDialog.tsx
"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileText, Trash2, Clock } from "lucide-react"

interface DraftRestoreDialogProps {
  isOpen: boolean
  onRestore: () => void
  onDiscard: () => void
  draftTimestamp: string | null
}

export function DraftRestoreDialog({
  isOpen,
  onRestore,
  onDiscard,
  draftTimestamp
}: DraftRestoreDialogProps) {
  const formatDateTime = (timestamp: string | null) => {
    if (!timestamp) return "Unknown time"
    
    try {
      const date = new Date(timestamp)
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      })
    } catch (error) {
      return "Unknown time"
    }
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Restore Draft
          </DialogTitle>
          <DialogDescription>
            We found a saved hotel draft from your previous session.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Clock className="h-4 w-4" />
            Last saved: {formatDateTime(draftTimestamp)}
          </div>
          <p className="text-sm text-blue-600 mt-2">
            Your hotel information has been automatically saved. Would you like to continue where you left off?
          </p>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <Button onClick={onRestore} className="w-full">
            <FileText className="h-4 w-4 mr-2" />
            Restore Draft & Continue
          </Button>
          
          <Button onClick={onDiscard} variant="outline" className="w-full">
            <Trash2 className="h-4 w-4 mr-2" />
            Start Fresh
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}