// components/mall/index.ts

// Main component
export { MallFormModal } from "./MallFormModal"

// Step components
export { BasicInfoStep } from "./steps/BasicInfoStep"
export { SizePriceStep } from "./steps/SizePriceStep"
export { RentalOperationsStep } from "./steps/RentalOperationsStep"
export { SaleLegalStep } from "./steps/SaleLegalStep"
export { FeaturesAmenitiesStep } from "./steps/FeaturesAmenitiesStep"
export { LocationDetailsStep } from "./steps/LocationDetailsStep"
export { MarketingMediaStep } from "./steps/MarketingMediaStep"
export { SettingsReviewStep } from "./steps/SettingsReviewStep"

// Navigation component
export { MallFormStepNavigation } from "./MallFormStepNavigation"

// Reusable input components
export { ValidatedInput } from "./ValidatedInput"
export { ValidatedTextarea } from "./ValidatedTextarea"

// Dialog components
export { ConfirmationDialogs } from "./ConfirmationDialogs"
export { DraftRestoreDialog } from "./DraftRestoreDialog"

// Hooks
export { useMallFormLogic } from "./hooks/useMallFormLogic"
export { useMallFormValidation } from "./hooks/useMallFormValidation"

// Types re-export for convenience
export type { Step } from "./MallFormStepNavigation"
export type { StepStatus } from "./hooks/useMallFormValidation"