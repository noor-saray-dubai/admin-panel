// components/building/DraftRestoreDialog.tsx
"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Clock, FileText, Trash } from "lucide-react"

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
              Saved {draftTimestamp}
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