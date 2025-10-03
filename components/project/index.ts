// components/project/index.ts

// Main modal component
export { ProjectFormModal } from './ProjectFormModal'

// Step navigation and utilities
export { ProjectFormStepNavigation } from './ProjectFormStepNavigation'
export type { StepValidationStatus } from './ProjectFormStepNavigation'

// Dialog components
export { ConfirmationDialogs } from './ConfirmationDialogs'
export { DraftRestoreDialog } from './DraftRestoreDialog'

// Form components
export { ValidatedInput } from './ValidatedInput'
export { ValidatedTextarea } from './ValidatedTextarea'

// Hooks
export { useProjectFormLogic } from './hooks/useProjectFormLogic'
export { useProjectFormValidation } from './hooks/useProjectFormValidation'

// Step components (when created)
export { BasicInfoStep } from './steps/BasicInfoStep'
export { PricingPaymentStep } from './steps/PricingPaymentStep'
export { DetailsOverviewStep } from './steps/DetailsOverviewStep'
export { UnitsAmenitiesStep } from './steps/UnitsAmenitiesStep'
export { LocationDetailsStep } from './steps/LocationDetailsStep'
export { MarketingMediaStep } from './steps/MarketingMediaStep'
export { SettingsStep } from './steps/LegalFinancialStep'
export { SettingsReviewStep } from './steps/SettingsReviewStep'