// components/building/index.ts

// Main component
export { BuildingFormModal } from "./BuildingFormModal"

// Step components
export { BasicInformationStep } from "./steps/BasicInformationStep"
export { DimensionsPricingStep } from "./steps/DimensionsPricingStep"
export { UnitsAmenitiesStep } from "./steps/UnitsAmenitiesStep"
export { MarketingMediaStep } from "./steps/MarketingMediaStep"
export { SettingsReviewStep } from "./steps/SettingsReviewStep"

// Navigation component
export { BuildingFormStepNavigation } from "./BuildingFormStepNavigation"

// Reusable input components
export { ValidatedInput } from "./ValidatedInput"
export { ValidatedTextarea } from "./ValidatedTextarea"

// Dialog components
export { ConfirmationDialogs } from "./ConfirmationDialogs"
export { DraftRestoreDialog } from "./DraftRestoreDialog"

// Hooks
export { useBuildingFormLogic } from "./hooks/useBuildingFormLogic"

// Types re-export for convenience
export type { Step } from "./BuildingFormStepNavigation"