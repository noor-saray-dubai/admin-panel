// types/building.ts

export interface IPrice {
  value: string; // Display format like "AED 2.8B"
  valueNumeric: number; // Actual number for calculations
  currency: string;
}

export interface IPriceRange {
  display: string; // Display format like "5M - 40M AED"
  min: number;
  max: number;
  currency: string;
  period?: string; // "per year" for commercial leases
}

export interface IDimensions {
  floors: number;
  height?: string; // Display format like "321m"
  heightNumeric?: number; // Actual height in meters
  totalArea?: number; // Total built-up area in sqm
  landArea?: number; // Land area in sqm
  floorPlateSize?: number; // Typical floor size in sqm
}

export interface IUnit {
  type: string; // "Studio", "1BR", "2BR", "Office", "Retail", etc.
  count?: number;
  sizeRange?: {
    min: number;
    max: number;
    unit: string; // "sqm", "sqft"
  };
  priceRange?: IPriceRange;
  features?: string[];
  availability?: number; // Number of available units
}

export interface IAmenities {
  // Residential amenities
  privateElevator?: boolean;
  skyLounge?: boolean;
  concierge?: boolean;
  infinityPool?: boolean;
  skyBridge?: boolean;
  privateCinema?: boolean;
  skyPool?: boolean;
  panoramicViews?: boolean;
  valetService?: boolean;
  marinaAccess?: boolean;
  beachClub?: boolean;
  golfCourse?: boolean;
  
  // Commercial amenities
  executiveLounges?: boolean;
  helipad?: boolean;
  fiveStarHotel?: boolean;
  tradingFloors?: boolean;
  conferenceCenters?: boolean;
  fineDining?: boolean;
  exhibitionHalls?: boolean;
  conventionCenter?: boolean;
  retailSpaces?: boolean;
  marinaViews?: boolean;
  
  // Common amenities
  gym?: boolean;
  spa?: boolean;
  parking?: boolean;
  security247?: boolean;
  smartHome?: boolean;
  highSpeedElevators?: boolean;
  businessCenter?: boolean;
  cafeteria?: boolean;
  landscapedGardens?: boolean;
  childrenPlayArea?: boolean;
  petFriendly?: boolean;
  wheelchairAccessible?: boolean;
}

export interface IFinancials {
  totalValue?: number;
  valuationDate?: Date;
  annualRevenue?: number;
  occupancyRate?: number; // Percentage
  serviceCharges?: number;
  annualAppreciation?: number; // Percentage
  rentalYield?: number; // Percentage
  capRate?: number; // Percentage
  roi?: number; // Percentage
  operatingExpenses?: number;
  noi?: number; // Net Operating Income
  expectedReturns?: {
    year1: number;
    year5: number;
    year10: number;
  };
}

export interface ITransactionHistory {
  date: Date;
  price: number;
  buyer?: string;
  seller?: string;
  transactionType: "sale" | "lease" | "refinance" | "transfer";
  notes?: string;
}

export interface ISaleInformation {
  isForSale: boolean;
  askingPrice?: string;
  askingPriceNumeric?: number;
  valuationReports?: string[];
  saleStatus: "available" | "underNegotiation" | "sold" | "offMarket" | "notForSale";
  transactionHistory?: ITransactionHistory[];
  dealStructure?: "entireBuilding" | "floor" | "unit" | "shareSale" | "jointVenture";
  saleConditions?: string[];
  preferredBuyerType?: "institutional" | "REIT" | "privateInvestor" | "developer" | "endUser" | "any";
}

export interface ILegalDetails {
  titleDeedNumber?: string;
  reraNumber?: string;
  tradeLicenseNumber?: string;
  zoning: string;
  ownership: "freehold" | "leasehold";
  leaseholdExpiry?: Date;
  buildingPermits?: string[];
  complianceCertificates?: string[];
  mortgageDetails?: {
    lender: string;
    outstandingAmount: number;
    maturityDate: Date;
  };
}

export interface IOperationalDetails {
  managementCompany?: string;
  facilityManager?: string;
  staffCount?: number;
  maintenanceStatus: "new" | "wellMaintained" | "requiresMaintenance" | "underRenovation";
  lastRenovation?: Date;
  nextScheduledMaintenance?: Date;
  certifications?: string[]; // LEED, ISO, etc.
  utilities?: {
    electricity: string;
    water: string;
    cooling: string;
    internet: string[];
  };
}

export interface IConnectivity {
  metro?: {
    station: string;
    distance: number; // km
    walkingTime?: number; // minutes
  };
  airport?: {
    name: string;
    distance: number; // km
    driveTime?: number; // minutes
  };
  highways?: string[];
  publicTransport?: string[];
  landmarks?: Array<{
    name: string;
    distance: number;
  }>;
}

export interface ICoordinates {
  latitude: number;
  longitude: number;
}

export interface ILocationDetails {
  description?: string;
  coordinates?: ICoordinates;
  connectivity?: IConnectivity;
  nearbyFacilities?: string[];
  neighborhood?: string;
  district?: string;
  demographics?: {
    population?: number;
    averageIncome?: string;
    employmentRate?: number;
  };
}

export interface IDeveloper {
  name: string;
  slug: string;
  established?: number;
  portfolio?: string[];
  headquarters?: string;
  reputation?: string;
}

export interface IMarketingMaterials {
  brochure?: string;
  videoTour?: string;
  virtualTour3D?: string;
  floorPlans?: string[];
  investmentHighlights?: string[];
  keySellingPoints?: string[];
  awards?: string[];
  pressReleases?: string[];
}

export interface IBrokerContact {
  name: string;
  phone: string;
  email: string;
  company?: string;
  license?: string;
}

export interface IInvestorRelations {
  brokerContact?: IBrokerContact;
  ndaRequired?: boolean;
  dataRoomAccessUrl?: string;
  tourAvailability?: string;
}

// Main Building interface
export interface IBuilding {
  _id?: string;
  buildingId: string; // Custom ID like "BLDG_001"
  slug: string;
  name: string;
  subtitle?: string;
  location: string;
  subLocation?: string;
  
  // Building category
  category: "residential" | "commercial" | "mixed";
  type: string; // "Ultra-Luxury Tower", "Business District", etc.
  
  price: IPrice;
  priceRange?: IPriceRange;
  dimensions: IDimensions;
  
  year: number; // Year completed
  yearBuilt?: number;
  
  // Units information
  units: IUnit[];
  totalUnits: number;
  availableUnits?: number;
  
  amenities: IAmenities;
  features?: string[];
  highlights?: string[];
  
  // Business & Investment Information
  financials?: IFinancials;
  saleInformation?: ISaleInformation;
  legalDetails?: ILegalDetails;
  operationalDetails?: IOperationalDetails;
  marketingMaterials?: IMarketingMaterials;
  investorRelations?: IInvestorRelations;
  
  // Media
  mainImage: string;
  gallery?: string[];
  floorPlans?: string[];
  
  // Location & Connectivity
  locationDetails?: ILocationDetails;
  
  // Developer/Owner Information
  developer?: IDeveloper;
  currentOwner?: string;
  masterDeveloper?: string;
  
  // Ratings & Performance
  rating?: string; // "Iconic", "Premium", "Exclusive", etc.
  sustainabilityRating?: string; // LEED, BREEAM, etc.
  
  // Additional Details
  architecture?: string;
  architect?: string;
  description: string;
  
  // Status & Availability
  status: "Completed" | "Under Construction" | "Planned" | "Renovation" | "Iconic" | "New" | "Premium" | "Exclusive" | "Landmark" | "Elite" | "Historic" | "Modern";
  verified?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  
  // Metadata
  createdBy?: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Form data interface
export interface BuildingFormData {
  name: string;
  subtitle?: string;
  location: string;
  subLocation?: string;
  category: "residential" | "commercial" | "mixed" | "";
  type: string;
  price: IPrice;
  priceRange?: IPriceRange;
  dimensions: IDimensions;
  year: number;
  yearBuilt?: number;
  units: IUnit[];
  totalUnits: number;
  availableUnits?: number;
  amenities: IAmenities;
  features?: string[];
  highlights?: string[];
  financials?: IFinancials;
  saleInformation?: ISaleInformation;
  legalDetails?: ILegalDetails;
  operationalDetails?: IOperationalDetails;
  marketingMaterials?: IMarketingMaterials;
  investorRelations?: IInvestorRelations;
  mainImage: string;
  gallery?: string[];
  floorPlans?: string[];
  locationDetails?: ILocationDetails;
  developer?: IDeveloper;
  currentOwner?: string;
  masterDeveloper?: string;
  rating?: string;
  sustainabilityRating?: string;
  architecture?: string;
  architect?: string;
  description: string;
  status: "Completed" | "Under Construction" | "Planned" | "Renovation" | "Iconic" | "New" | "Premium" | "Exclusive" | "Landmark" | "Elite" | "Historic" | "Modern" | "";
  verified?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
}

// Props interfaces
export interface BuildingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: BuildingFormData) => Promise<void>;
  building?: IBuilding | null;
  mode: 'add' | 'edit';
}

// API data types
export interface BuildingUpdateData extends Partial<IBuilding> {}

// Building list/filter types
export interface BuildingFilters {
  search?: string;
  location?: string;
  category?: string;
  status?: string;
  ownership?: string;
  saleStatus?: string;
  priceRange?: [number, number];
  floorRange?: [number, number];
  yearRange?: [number, number];
  verified?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
}

// Building summary for lists
export interface BuildingSummary {
  _id: string;
  buildingId: string;
  slug: string;
  name: string;
  subtitle?: string;
  location: string;
  subLocation?: string;
  category: string;
  type: string;
  status: string;
  price: {
    value: string;
    valueNumeric: number;
    currency: string;
  };
  dimensions: {
    floors: number;
    totalArea?: number;
  };
  totalUnits: number;
  availableUnits?: number;
  financials?: {
    capRate?: number;
    roi?: number;
    occupancyRate?: number;
  };
  saleInformation?: {
    saleStatus: string;
    isForSale: boolean;
  };
  mainImage: string;
  verified: boolean;
  isActive: boolean;
  isFeatured: boolean;
  updatedAt: Date;
}

// Validation result interface
export interface BuildingValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings?: string[];
  fieldErrors?: Record<string, string>;
}

export default IBuilding;