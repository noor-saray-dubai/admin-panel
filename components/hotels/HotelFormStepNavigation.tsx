// components/hotels/HotelFormStepNavigation.tsx
"use client"

import { CheckCircle, AlertCircle } from "lucide-react"

export interface Step {
  id: string
  title: string
  icon: React.ComponentType<any>
  description: string
}

interface HotelFormStepNavigationProps {
  steps: Step[]
  currentStep: number
  onStepClick: (stepIndex: number) => void
  getStepStatus: (stepIndex: number) => 'valid' | 'invalid' | 'incomplete'
}

export function HotelFormStepNavigation({
  steps,
  currentStep,
  onStepClick,
  getStepStatus
}: HotelFormStepNavigationProps) {
  return (
    <div className="px-6 py-4 border-b bg-gray-50">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium">
          Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
        </div>
        <div className="text-xs text-gray-500">
          Form Progress: {Math.round((steps.filter((step, index) => getStepStatus(index) === 'valid').length / steps.length) * 100)}% Complete
        </div>
      </div>
      <div className="flex items-center space-x-2 overflow-x-auto">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = currentStep === index
          const isVisited = currentStep > index
          const stepStatus = getStepStatus(index)
          const isValid = stepStatus === 'valid'
          const isInvalid = stepStatus === 'invalid'
          const isCompleted = isValid && isVisited

          return (
            <div
              key={step.id}
              className={`flex items-center space-x-2 cursor-pointer px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                isActive 
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' 
                  : isCompleted
                    ? 'bg-green-100 text-green-700 border-2 border-green-300' 
                    : isInvalid
                    ? 'bg-red-100 text-red-700 border-2 border-red-300'
                    : 'hover:bg-gray-100 border-2 border-transparent'
              }`}
              onClick={() => onStepClick(index)}
            >
              <Icon className={`h-4 w-4 ${
                isActive 
                  ? 'text-blue-500' 
                  : isCompleted
                  ? 'text-green-500' 
                  : isInvalid
                  ? 'text-red-500'
                  : 'text-gray-400'
              }`} />
              <span className="text-sm font-medium">{step.title}</span>
              {isCompleted && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              {isInvalid && (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}