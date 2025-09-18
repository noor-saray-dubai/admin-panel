// types/mall.ts

export interface IPrice {
  total: string; // Display format like "AED 12.5B"
  totalNumeric: number; // Actual number for calculations
  perSqft: number;
  currency: string;
}

export interface ISize {
  totalArea: number; // Total built-up area in sqft
  retailArea: number; // Leasable retail area in sqft
  totalSqm: number; // Total area in sqm
  retailSqm: number; // Retail area in sqm
  floors: number; // Number of floors
  parkingSpaces?: number; // Number of parking spaces
}

export interface IRentalDetails {
  currentOccupancy?: number; // Percentage occupied (0-100)
  averageRent?: number; // Per sqft per year
  totalStores?: number; // Current number of stores
  maxStores: number; // Maximum possible stores
  vacantStores?: number; // Available retail spaces
  anchorTenants?: string[]; // Major anchor tenants
}

export interface IFinancials {
  annualRevenue?: number; // Current annual revenue
  noi?: number; // Net Operating Income
  operatingExpenses?: number; // Annual operating costs
  capRate: number; // Capitalization rate
  roi: number; // Return on Investment percentage
  appreciation: number; // Expected appreciation percentage
  payback: number; // Payback period in years
}

// Transaction & Sale Information
export interface ITransactionHistory {
  date: Date;
  price: number;
  buyer?: string;
  seller?: string;
  notes?: string;
}

export interface ISaleInformation {
  askingPrice?: string; // May differ from valuation
  askingPriceNumeric?: number;
  valuationReports?: string[]; // Links to valuation PDFs
  saleStatus: "available" | "underNegotiation" | "sold" | "offMarket";
  transactionHistory?: ITransactionHistory[];
  dealStructure?: "assetSale" | "shareSale" | "jointVenture" | "leaseback";
  saleConditions?: string[];
  preferredBuyerType?: "institutional" | "REIT" | "privateInvestor" | "developer" | "any";
}

// Ownership & Legal
export interface ILegalDetails {
  titleDeedNumber?: string;
  reraNumber?: string;
  zoning: string; // commercial, mixed-use, etc.
  leaseholdExpiry?: Date | string;
  mortgageDetails?: {
    lender: string;
    outstandingAmount: number;
    maturityDate: Date | string;
  };
}

// Enhanced Operational Details
export interface IOperationalDetails {
  managementCompany?: string;
  serviceCharges?: number; // Annual OPEX chargeable to tenants
  utilityCosts?: number; // Average monthly/annual costs
  maintenanceStatus?: "new" | "renovated" | "requiresRenovation";
  greenBuildingCertifications?: string[]; // LEED, BREEAM, Estidama
}

// Tenant & Lease Information
export interface ILeaseDetails {
  leaseTermsSummary?: {
    avgLeaseDuration: number;
    escalationRate: number;
  };
  topTenants?: {
    name: string;
    leaseExpiry: Date;
    leasedArea: number;
    rent: number;
  }[];
  leaseExpirySchedule?: {
    year: number;
    percentageExpiring: number;
  }[];
}

// Marketing & Presentation
export interface IMarketingMaterials {
  brochure?: string; // PDF marketing deck
  videoTour?: string;
  virtualTour3D?: string; // Matterport/3D model
  investmentHighlights?: string[];
  keySellingPoints?: string[];
}

// Buyer/Investor Relations
export interface IBrokerContact {
  name: string;
  phone: string;
  email: string;
  company?: string;
}

export interface IInvestorRelations {
  brokerContact?: IBrokerContact;
  ndaRequired?: boolean;
  dataRoomAccessUrl?: string;
}

export interface IAmenities {
  cinemas?: boolean;
  foodCourt?: boolean;
  hypermarket?: boolean;
  departmentStore?: boolean;
  entertainment?: boolean;
  skiResort?: boolean;
  aquarium?: boolean;
  iceRink?: boolean;
  hotel?: boolean;
  offices?: boolean;
  residential?: boolean;
  mosque?: boolean;
  clinic?: boolean;
  bankingServices?: boolean;
  vip_lounges?: boolean;
  nursery?: boolean;
}

export interface IConnectivity {
  metroStation?: string;
  metroDistance?: number; // Distance in km
  highways?: string[]; // Connected highways
  airports?: string[]; // Nearby airports with distance
  publicTransport?: string[]; // Bus routes, etc.
}

export interface ICoordinates {
  latitude: number;
  longitude: number;
}

export interface ILocationDetails {
  description?: string;
  coordinates?: ICoordinates;
  connectivity?: IConnectivity;
  demographics?: {
    catchmentPopulation?: number;
    averageIncome?: string;
    touristFootfall?: number; // Annual tourist visitors in area
  };
}

export interface IDeveloper {
  name: string;
  slug: string;
  established?: number;
  portfolio?: string[]; // Other developments
}

// Main Mall interface
export interface IMall {
  _id?: string;
  mallId: string; // Custom ID like "MALL_001"
  slug: string; // URL-friendly version
  name: string;
  subtitle: string;
  status: string;
  location: string;
  subLocation: string;
  ownership: "freehold" | "leasehold";
  price: IPrice;
  size: ISize;
  rentalDetails: IRentalDetails;
  financials: IFinancials;
  
  // NEW SECTIONS
  saleInformation: ISaleInformation;
  legalDetails: ILegalDetails;
  operationalDetails?: IOperationalDetails;
  leaseDetails?: ILeaseDetails;
  marketingMaterials?: IMarketingMaterials;
  investorRelations?: IInvestorRelations;
  
  amenities?: IAmenities;
  features?: string[];
  developer?: IDeveloper;
  yearBuilt?: number;
  yearOpened?: number;
  rating?: number; // If operational (1-5)
  visitorsAnnually?: number; // Annual footfall if operational
  architecture?: string; // Architectural style/description
  image: string; // Main image URL
  gallery?: string[]; // Additional images
  floorPlan?: string; // Floor plan image URL
  locationDetails?: ILocationDetails;
  verified?: boolean;
  isActive?: boolean; // Available for sale
  isAvailable?: boolean; // Not sold/reserved
  isOperational?: boolean; // Currently operating as a mall
  createdBy?: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Form data interface
export interface MallFormData {
  name: string;
  subtitle: string;
  status: string;
  location: string;
  subLocation: string;
  ownership: "freehold" | "leasehold" | "";
  price: IPrice;
  size: ISize;
  rentalDetails: IRentalDetails;
  financials: IFinancials;
  saleInformation: ISaleInformation;
  legalDetails: ILegalDetails;
  operationalDetails?: IOperationalDetails;
  leaseDetails?: ILeaseDetails;
  marketingMaterials?: IMarketingMaterials;
  investorRelations?: IInvestorRelations;
  amenities?: IAmenities;
  features?: string[];
  developer?: IDeveloper;
  yearBuilt?: number;
  yearOpened?: number;
  rating?: number;
  visitorsAnnually?: number;
  architecture?: string;
  image: string;
  gallery?: string[];
  floorPlan?: string;
  locationDetails?: ILocationDetails;
  verified?: boolean;
  isActive?: boolean;
  isAvailable?: boolean;
  isOperational?: boolean;
}

// Props interfaces
export interface MallFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: MallFormData) => void;
  mall?: IMall | null;
  mode: 'add' | 'edit';
}

// API data types
export interface MallUpdateData extends Partial<IMall> {}

// Mall list/filter types
export interface MallFilters {
  search?: string;
  location?: string;
  status?: string;
  ownership?: string;
  saleStatus?: string;
  priceRange?: [number, number];
  capRateRange?: [number, number];
  verified?: boolean;
  isOperational?: boolean;
}

// Mall summary for lists
export interface MallSummary {
  _id: string;
  mallId: string;
  slug: string;
  name: string;
  subtitle: string;
  location: string;
  subLocation: string;
  status: string;
  price: {
    total: string;
    totalNumeric: number;
    currency: string;
  };
  size: {
    totalArea: number;
    floors: number;
  };
  financials: {
    capRate: number;
    roi: number;
  };
  saleInformation: {
    saleStatus: string;
  };
  image: string;
  verified: boolean;
  isActive: boolean;
  isOperational: boolean;
  updatedAt: Date;
}

// Validation result interface
export interface MallValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings?: string[];
  fieldErrors?: Record<string, string>;
}

export default IMall;