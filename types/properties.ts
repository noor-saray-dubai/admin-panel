// types/properties.ts

// Floor level type definitions
export interface ISingleFloorLevel {
  type: 'single';
  value: number; // Encoded value: B1=-1, G=0, floors=positive, M=1000+floor, R=2000+floor
}

export interface IComplexFloorLevel {
  type: 'complex';
  basements: number;
  hasGroundFloor: boolean; // Always true - ground floor is mandatory
  floors: number;
  mezzanines: number;
  hasRooftop: boolean;
}

export type IFloorLevel = ISingleFloorLevel | IComplexFloorLevel;

// Re-export interfaces from the model for frontend use
export interface IProjectLink {
  projectName: string;
  projectSlug: string;
}

export interface IDeveloperLink {
  developerName: string;
  developerSlug: string;
}

export interface ICommunityLink {
  communityName: string;
  communitySlug: string;
}

export interface IAgentLink {
  agentId: string;
  agentName: string;
  phoneNumber: string;
  email?: string;
}

export interface ICoordinates {
  latitude: number;
  longitude: number;
}

export interface ILocationDetails {
  address: string;
  area: string;
  city: string;
  country: string;
  coordinates: ICoordinates;
}

export interface IAmenityCategory {
  category: string;
  items: string[];
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

export interface IFlags {
  elite: boolean;
  exclusive: boolean;
  featured: boolean;
  highValue: boolean;
}

export interface IAuditInfo {
  email: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface IProperty {
  id: string;
  slug: string;
  name: string;
  
  // Optional linking to project, developer, community, and agent
  project?: IProjectLink;
  developer?: IDeveloperLink;
  community?: ICommunityLink;
  agent?: IAgentLink;
  
  // Property Type & Specifications
  propertyType: 'Apartment' | 'Villa' | 'Penthouse' | 'Condo' | 'Townhouse' | 'Studio' | 'Duplex' | 'Loft';
  bedrooms: number;
  bathrooms: number;
  builtUpArea?: number; // Optional - e.g., 1200
  suiteArea?: number; // Optional - e.g., 800
  balconyArea?: number; // Optional - e.g., 150
  terracePoolArea?: number; // Optional - e.g., 300
  totalArea: number; // Mandatory - e.g., 1500
  areaUnit: string; // Unit for all areas - e.g., "sq ft"
  furnishingStatus: 'Unfurnished' | 'Semi-Furnished' | 'Fully Furnished';
  facingDirection: 'North' | 'South' | 'East' | 'West' | 'North-East' | 'North-West' | 'South-East' | 'South-West';
  floorLevel: IFloorLevel; // Required JSON structure for floor information
  
  // Ownership & Availability
  ownershipType: 'Primary' | 'Secondary'; // Primary = from developer, Secondary = from owner
  propertyStatus: 'Ready' | 'Offplan'; // Property construction status
  availabilityStatus: 'Ready' | 'Offplan';
  
  // Location (MANDATORY - even if linked to project)
  location: ILocationDetails;
  
  // Pricing
  price: string; // Display price (e.g., "AED 1,200,000")
  priceNumeric: number; // For sorting/filtering
  pricePerSqFt?: number; // Optional
  
  // Description
  description: string;
  overview: string;
  
  // Media
  coverImage: string; // Main cover image URL
  gallery: string[]; // Additional images
  
  // Amenities & Payment Plan
  amenities: IAmenityCategory[];
  paymentPlan?: IPaymentPlan; // Optional - mainly for primary market
  
  // Flags
  flags: IFlags;
  
  // Audit fields
  createdBy: IAuditInfo;
  updatedBy: IAuditInfo;
  version: number;
  
  // Metadata
  isActive: boolean;
  tags: string[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Form data interface for property form
export interface PropertyFormData {
  name: string;
  
  // Optional linking
  projectName: string;
  projectSlug: string;
  developerName: string;
  developerSlug: string;
  communityName: string;
  communitySlug: string;
  agentId: string;
  agentName: string;
  agentPhone: string;
  agentEmail: string;
  
  // Property specifications
  propertyType: string;
  bedrooms: number | undefined;
  bathrooms: number | undefined;
  builtUpArea: number | undefined;
  suiteArea: number | undefined;
  balconyArea: number | undefined;
  terracePoolArea: number | undefined;
  totalArea: number | undefined;
  areaUnit: string;
  furnishingStatus: string;
  facingDirection: string;
  floorLevel: IFloorLevel;
  
  // Ownership & Availability
  ownershipType: string;
  propertyStatus: string;
  availabilityStatus: string;
  
  // Location
  address: string;
  area: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  
  // Pricing
  price: string;
  priceNumeric: number;
  pricePerSqFt: number;
  
  // Description
  description: string;
  overview: string;
  
  // Media
  coverImage: string;
  gallery: string[];
  
  // Amenities
  amenities: IAmenityCategory[];
  
  // Payment Plan (for primary market)
  hasPaymentPlan: boolean;
  paymentPlan: IPaymentPlan;
  
  // Flags
  flags: IFlags;
  
  // Metadata
  tags: string[];
  isActive: boolean;
}

// Property modal props
export interface PropertyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (property?: IProperty) => void;
  property?: IProperty;
  mode: 'add' | 'edit';
}

// Property step interface
export interface PropertyStep {
  id: string;
  title: string;
  icon: any;
  description: string;
}

// Property filters
export interface PropertyFilters {
  propertyTypes: string[];
  bedrooms: string[];
  bathrooms: string[];
  furnishingStatuses: string[];
  ownershipTypes: string[];
  availabilityStatuses: string[];
  areas: string[];
  cities: string[];
  priceRanges: string[];
}

// Property pagination
export interface PropertyPaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Property counts response
export interface PropertyCounts {
  total: number;
  available: number;
  reserved: number;
  sold: number;
  primary: number;
  secondary: number;
  featured: number;
  elite: number;
  exclusive: number;
  byPropertyType: { [key: string]: number };
  byLocation: { [key: string]: number };
  byPriceRange: { [key: string]: number };
  recentlyAdded: number;
}

// Property form mode
export type PropertyFormMode = 'add' | 'edit';

// Property step props
export interface PropertyStepProps {
  formData: PropertyFormData;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
  onInputChange: (field: keyof PropertyFormData, value: any) => void;
}

// Step validation status
export interface StepValidationStatus {
  [stepId: string]: {
    isValid: boolean;
    hasErrors: boolean;
    errors?: string[];
    errorCount?: number;
  };
}

// Validation result
export interface ValidationResult {
  isValid: boolean;
  fieldErrors?: Record<string, string>;
}
