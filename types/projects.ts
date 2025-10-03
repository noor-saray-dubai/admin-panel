// types/projects.ts

import { Document } from "mongoose";

// Base interfaces for project data structures
export interface IPrice {
  total: string; // Display format like "AED 2.5M"
  totalNumeric: number; // Actual number for calculations
  currency: string;
  pricePerSqft?: number;
}

export interface IPaymentMilestone {
  milestone: string;
  percentage: string;
}

export interface IPaymentPlan {
  booking: string;
  construction: IPaymentMilestone[];
  handover: string;
}

export interface INearbyPlace {
  name: string;
  distance: string;
}

export interface ICoordinates {
  latitude: number;
  longitude: number;
}

export interface ILocationDetails {
  description: string;
  nearby: INearbyPlace[];
  coordinates: ICoordinates;
  connectivity?: {
    metroStation?: string;
    metroDistance?: number;
    highways?: string[];
    airports?: string[];
    publicTransport?: string[];
  };
  demographics?: {
    catchmentPopulation?: number;
    averageIncome?: string;
    touristFootfall?: number;
  };
}

export interface IAmenityCategory {
  category: string;
  items: string[];
}

export interface IUnitType {
  type: string;
  size: string;
  price: string;
  sizeNumeric?: number; // Size in sqft for calculations
  priceNumeric?: number;
  count?: number; // Number of this type of unit
}

export interface IDeveloper {
  id: string;
  name: string;
  slug?: string;
  established?: number;
  portfolio?: string[];
  headquarters?: string;
}





// Audit information interface
export interface IAuditInfo {
  email: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

// Main Project interface (extends Document for MongoDB)
export interface IProject extends Document {
  _id: string;
  id: string; // Added for compatibility
  projectId: string; // Unique project identifier
  slug: string;
  name: string;
  subtitle?: string;
  location: string;
  locationSlug: string;
  subLocation?: string;
  type: string; // 'Residential', 'Commercial', 'Mixed Use', 'Industrial', 'Hospitality', 'Retail'
  status: string; // 'Pre-Launch', 'Launched', 'Under Construction', 'Ready to Move', 'Completed', 'Sold Out'
  statusSlug: string;
  developer: string;
  developerSlug: string;
  developerDetails?: IDeveloper;
  
  // Pricing (with backward compatibility)
  price: IPrice;
  priceNumeric: number; // Added for direct numeric access
  paymentPlan: IPaymentPlan;
  
  // Project Details
  description: string;
  overview: string;
  completionDate: string;
  launchDate: string;
  totalUnits: number;
  availableUnits?: number;
  
  // Features and Amenities
  amenities: IAmenityCategory[];
  unitTypes: IUnitType[];
  features?: string[];
  highlights?: string[];
  
  // Media
  image: string; // Main cover image URL
  gallery: string[];
  floorPlan?: string;
  brochure?: string;
  
  // Location
  locationDetails: ILocationDetails;
  
  // Categories and Tags
  categories: string[];
  tags: string[]; // Added missing tags property
  
  // Settings and Flags
  registrationOpen: boolean;
  featured: boolean;
  flags: {
    elite: boolean;
    exclusive: boolean;
    featured: boolean;
    highValue: boolean;
  };
  
  // System fields
  verified: boolean;
  isActive: boolean;
  isAvailable: boolean;
  version: number; // Added missing version property
  createdAt: Date;
  updatedAt: Date;
  createdBy?: IAuditInfo; // Enhanced audit info
  updatedBy?: IAuditInfo; // Enhanced audit info
}

// Form data interface (for form handling)
export interface ProjectFormData {
  name: string;
  subtitle?: string; // Made optional to match IProject
  location: string;
  subLocation: string;
  type: string;
  status: string;
  developer: string;
  developerSlug: string;
  
  // Pricing
  price: IPrice;
  paymentPlan: IPaymentPlan;
  
  // Details
  description: string;
  overview: string;
  completionDate: string;
  launchDate: string;
  totalUnits: number;
  
  // Features
  amenities: IAmenityCategory[];
  unitTypes: IUnitType[];
  features: string[];
  
  // Media - Using URLs instead of File objects for instant upload
  image: string; // Main image URL
  gallery: string[]; // Array of image URLs
  floorPlan: string;
  brochure: string;
  
  // Location
  locationDetails: ILocationDetails;
  
  
  // Settings
  categories: string[];
  registrationOpen: boolean;
  featured: boolean;
  flags: {
    elite: boolean;
    exclusive: boolean;
    featured: boolean;
    highValue: boolean;
  };
  
  // System fields
  verified: boolean;
  isActive: boolean;
  isAvailable: boolean;
}

// Form modal props
export interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (projectData: ProjectFormData) => Promise<void>; // Fixed to match actual usage
  project?: IProject | null;
  mode: 'add' | 'edit';
}

// Step navigation interface
export interface ProjectStep {
  id: string;
  title: string;
  icon: any; // Lucide icon component
  description: string;
}

// Validation interfaces
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: string[];
  fieldErrors?: Record<string, string>;
}

export interface FieldValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | undefined;
}