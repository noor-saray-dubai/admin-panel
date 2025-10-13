"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface BlogFormStep {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

interface BlogFormStepNavigationProps {
  steps: BlogFormStep[]
  currentStep: number
  onStepClick: (stepIndex: number) => void
}

export function BlogFormStepNavigation({
  steps,
  currentStep,
  onStepClick
}: BlogFormStepNavigationProps) {
  return (
    <div className="px-6 py-4 border-b bg-gray-50">
      <div className="flex items-center space-x-4 overflow-x-auto">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = currentStep === index
          const isCompleted = currentStep > index
          const isClickable = true // Allow navigation to any step
          
          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer transition-colors whitespace-nowrap",
                isActive && "bg-blue-100 text-blue-700 border border-blue-200",
                isCompleted && !isActive && "bg-green-50 text-green-700 border border-green-200",
                !isActive && !isCompleted && "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50",
                !isClickable && "cursor-not-allowed opacity-50"
              )}
              onClick={() => isClickable && onStepClick(index)}
            >
              <Icon className={cn(
                "h-4 w-4",
                isActive && "text-blue-600",
                isCompleted && !isActive && "text-green-600",
                !isActive && !isCompleted && "text-gray-500"
              )} />
              
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{step.title}</span>
                {isActive && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    Current
                  </Badge>
                )}
                {isCompleted && !isActive && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    ✓
                  </Badge>
                )}
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Current step description */}
      <div className="mt-2 text-sm text-gray-600">
        {steps[currentStep]?.description}
      </div>
    </div>
  )
}