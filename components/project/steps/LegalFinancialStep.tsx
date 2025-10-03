// components/project/steps/SettingsStep.tsx  
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Settings, Flag, Eye, CheckCircle } from "lucide-react"
import type { ProjectFormData } from "@/types/projects"

interface SettingsStepProps {
  formData: ProjectFormData
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  onInputChange: (field: string, value: any) => void
}

export function SettingsStep({ 
  formData, 
  errors, 
  setErrors, 
  onInputChange 
}: SettingsStepProps) {


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-4">
        <Settings className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Project Settings</h2>
      </div>

      {/* Project Flags & Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Project Flags
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-base font-semibold">Visibility Settings</Label>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="featured"
                  checked={formData.featured || false}
                  onCheckedChange={(checked) => onInputChange('featured', !!checked)}
                />
                <Label htmlFor="featured" className="cursor-pointer flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Featured Project (Show in featured listings)
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="registrationOpen"
                  checked={formData.registrationOpen ?? true}
                  onCheckedChange={(checked) => onInputChange('registrationOpen', !!checked)}
                />
                <Label htmlFor="registrationOpen" className="cursor-pointer flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-600" />
                  Registration Open (Accept new registrations)
                </Label>
              </div>
            </div>
            
            <div className="space-y-3">
              <Label className="text-base font-semibold">Special Flags</Label>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="elite"
                  checked={formData.flags?.elite || false}
                  onCheckedChange={(checked) => onInputChange('flags.elite', !!checked)}
                />
                <Label htmlFor="elite" className="cursor-pointer flex items-center gap-2">
                  <Flag className="h-4 w-4 text-purple-600" />
                  Elite Project
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="exclusive"
                  checked={formData.flags?.exclusive || false}
                  onCheckedChange={(checked) => onInputChange('flags.exclusive', !!checked)}
                />
                <Label htmlFor="exclusive" className="cursor-pointer flex items-center gap-2">
                  <Flag className="h-4 w-4 text-orange-600" />
                  Exclusive Project
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="highValue"
                  checked={formData.flags?.highValue || false}
                  onCheckedChange={(checked) => onInputChange('flags.highValue', !!checked)}
                />
                <Label htmlFor="highValue" className="cursor-pointer flex items-center gap-2">
                  <Flag className="h-4 w-4 text-red-600" />
                  High Value Project
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
