// components/property/PropertyFormStepNavigation.tsx
"use client"

import React from "react"
import { CheckCircle2, AlertCircle, Circle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PropertyStep, StepValidationStatus } from "@/types/properties"

interface PropertyFormStepNavigationProps {
  steps: PropertyStep[]
  currentStep: number
  onStepClick: (stepIndex: number) => void
  validationStatus: StepValidationStatus
}

export function PropertyFormStepNavigation({ 
  steps, 
  currentStep, 
  onStepClick, 
  validationStatus 
}: PropertyFormStepNavigationProps) {
  const getStepStatus = (stepIndex: number) => {
    const stepId = steps[stepIndex].id
    
    // Current step
    if (stepIndex === currentStep) {
      return 'current'
    }
    
    // Check validation status
    const status = validationStatus[stepId]
    if (status?.isValid) {
      return 'completed'
    } else if (status?.hasErrors) {
      return 'error'
    } else if (stepIndex < currentStep) {
      return 'visited'
    }
    
    return 'pending'
  }

  const getStepIcon = (stepIndex: number, status: string) => {
    const IconComponent = steps[stepIndex].icon
    
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />
      case 'error':
        return <AlertCircle className="h-4 w-4" />
      case 'current':
        return <IconComponent className="h-4 w-4" />
      default:
        return <Circle className="h-4 w-4" />
    }
  }

  const getStepClasses = (status: string) => {
    const baseClasses = "flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 border"
    
    switch (status) {
      case 'current':
        return cn(baseClasses, "bg-blue-50 border-blue-200 text-blue-900 shadow-sm")
      case 'completed':
        return cn(baseClasses, "bg-green-50 border-green-200 text-green-800 hover:bg-green-100")
      case 'error':
        return cn(baseClasses, "bg-red-50 border-red-200 text-red-800 hover:bg-red-100")
      case 'visited':
        return cn(baseClasses, "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100")
      default:
        return cn(baseClasses, "bg-white border-gray-200 text-gray-500 hover:bg-gray-50")
    }
  }

  return (
    <div className="px-6 py-4 border-b bg-gray-50">
      <div className="grid grid-cols-3 lg:grid-cols-9 gap-2">
        {steps.map((step, index) => {
          const status = getStepStatus(index)
          
          return (
            <div
              key={step.id}
              className={getStepClasses(status)}
              onClick={() => onStepClick(index)}
            >
              {getStepIcon(index, status)}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">
                  {step.title}
                </div>
                {status === 'current' && (
                  <div className="text-xs text-gray-600 truncate">
                    {step.description}
                  </div>
                )}
              </div>
              {status === 'error' && validationStatus[step.id]?.errorCount && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-red-600 bg-red-100 rounded-full">
                  {validationStatus[step.id].errorCount}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}