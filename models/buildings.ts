// models/buildings.ts

import mongoose, { Schema, Document, model, models, Query } from "mongoose";

// Audit tracking interface
interface IAuditInfo {
  email: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

// Define custom query helpers interface
interface BuildingQueryHelpers {
  residential(): Query<any, Document> & BuildingQueryHelpers;
  commercial(): Query<any, Document> & BuildingQueryHelpers;
  verified(): Query<any, Document> & BuildingQueryHelpers;
  active(): Query<any, Document> & BuildingQueryHelpers;
  byLocation(location: string): Query<any, Document> & BuildingQueryHelpers;
  luxury(): Query<any, Document> & BuildingQueryHelpers;
}

// Extend mongoose Query interface
declare module 'mongoose' {
  interface Query<ResultType, DocType extends Document, THelpers = {}> {
    residential(): Query<ResultType, DocType, THelpers>;
    commercial(): Query<ResultType, DocType, THelpers>;
  }
}

// Interfaces
interface IPrice {
  value: string; // Display format like "AED 2.8B"
  valueNumeric: number; // Actual number for calculations
  currency: string;
}

interface IPriceRange {
  display: string; // Display format like "5M - 40M AED"
  min: number;
  max: number;
  currency: string;
  period?: string; // "per year" for commercial leases
}

interface IDimensions {
  floors: number;
  height?: string; // Display format like "321m"
  heightNumeric?: number; // Actual height in meters
  totalArea?: number; // Total built-up area in sqm
  landArea?: number; // Land area in sqm
  floorPlateSize?: number; // Typical floor size in sqm
}

interface IUnit {
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

interface IAmenities {
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

interface IFinancials {
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

interface ITransactionHistory {
  date: Date;
  price: number;
  buyer?: string;
  seller?: string;
  transactionType: "sale" | "lease" | "refinance" | "transfer";
  notes?: string;
}

interface ISaleInformation {
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

interface ILegalDetails {
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

interface IOperationalDetails {
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

interface IConnectivity {
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

interface ICoordinates {
  latitude: number;
  longitude: number;
}

interface ILocationDetails {
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

interface IDeveloper {
  name: string;
  slug: string;
  established?: number;
  portfolio?: string[];
  headquarters?: string;
  reputation?: string;
}

interface IMarketingMaterials {
  brochure?: string;
  videoTour?: string;
  virtualTour3D?: string;
  floorPlans?: string[];
  investmentHighlights?: string[];
  keySellingPoints?: string[];
  awards?: string[];
  pressReleases?: string[];
}

interface IBrokerContact {
  name: string;
  phone: string;
  email: string;
  company?: string;
  license?: string;
}

interface IInvestorRelations {
  brokerContact?: IBrokerContact;
  ndaRequired?: boolean;
  dataRoomAccessUrl?: string;
  tourAvailability?: string;
}

export interface IBuilding extends Document<any, BuildingQueryHelpers> {
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
  
  // Audit fields
  createdBy: IAuditInfo;
  updatedBy: IAuditInfo;
  version: number; // For optimistic locking
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Sub-schemas
const AuditInfoSchema = new Schema<IAuditInfo>({
  email: { type: String, required: true, lowercase: true, trim: true },
  timestamp: { type: Date, required: true, default: Date.now },
  ipAddress: { type: String, trim: true },
  userAgent: { type: String, trim: true }
}, { _id: false }); // Disable _id for subdocuments

const PriceSchema = new Schema<IPrice>({
  value: { 
    type: String, 
    required: [true, 'Price value display is required'],
    trim: true
  },
  valueNumeric: { 
    type: Number, 
    required: [true, 'Price numeric value is required'],
    min: [0, 'Price cannot be negative']
  },
  currency: { 
    type: String, 
    required: [true, 'Currency is required'],
    enum: ['AED', 'USD', 'EUR', 'GBP'],
    default: 'AED'
  }
}, { _id: false });

const PriceRangeSchema = new Schema<IPriceRange>({
  display: { 
    type: String, 
    required: [true, 'Price range display is required'],
    trim: true
  },
  min: { 
    type: Number, 
    required: [true, 'Minimum price is required'],
    min: [0, 'Price cannot be negative']
  },
  max: { 
    type: Number, 
    required: [true, 'Maximum price is required'],
    min: [0, 'Price cannot be negative']
  },
  currency: { 
    type: String, 
    required: [true, 'Currency is required'],
    enum: ['AED', 'USD', 'EUR', 'GBP'],
    default: 'AED'
  },
  period: { type: String, trim: true }
}, { _id: false });

const DimensionsSchema = new Schema<IDimensions>({
  floors: { 
    type: Number, 
    required: [true, 'Number of floors is required'],
    min: [1, 'Must have at least 1 floor']
  },
  height: { type: String, trim: true },
  heightNumeric: { 
    type: Number, 
    min: [0, 'Height cannot be negative']
  },
  totalArea: { 
    type: Number, 
    min: [0, 'Total area cannot be negative']
  },
  landArea: { 
    type: Number, 
    min: [0, 'Land area cannot be negative']
  },
  floorPlateSize: { 
    type: Number, 
    min: [0, 'Floor plate size cannot be negative']
  }
}, { _id: false });

const UnitSchema = new Schema<IUnit>({
  type: { 
    type: String, 
    required: [true, 'Unit type is required'],
    trim: true
  },
  count: { 
    type: Number, 
    min: [0, 'Count cannot be negative']
  },
  sizeRange: {
    min: { type: Number, min: 0 },
    max: { type: Number, min: 0 },
    unit: { type: String, enum: ['sqm', 'sqft'], default: 'sqm' }
  },
  priceRange: { type: PriceRangeSchema },
  features: { type: [String], default: [] },
  availability: { 
    type: Number, 
    min: [0, 'Availability cannot be negative']
  }
}, { _id: false });

const AmenitiesSchema = new Schema<IAmenities>({
  // Residential amenities
  privateElevator: { type: Boolean, default: false },
  skyLounge: { type: Boolean, default: false },
  concierge: { type: Boolean, default: false },
  infinityPool: { type: Boolean, default: false },
  skyBridge: { type: Boolean, default: false },
  privateCinema: { type: Boolean, default: false },
  skyPool: { type: Boolean, default: false },
  panoramicViews: { type: Boolean, default: false },
  valetService: { type: Boolean, default: false },
  marinaAccess: { type: Boolean, default: false },
  beachClub: { type: Boolean, default: false },
  golfCourse: { type: Boolean, default: false },
  
  // Commercial amenities
  executiveLounges: { type: Boolean, default: false },
  helipad: { type: Boolean, default: false },
  fiveStarHotel: { type: Boolean, default: false },
  tradingFloors: { type: Boolean, default: false },
  conferenceCenters: { type: Boolean, default: false },
  fineDining: { type: Boolean, default: false },
  exhibitionHalls: { type: Boolean, default: false },
  conventionCenter: { type: Boolean, default: false },
  retailSpaces: { type: Boolean, default: false },
  marinaViews: { type: Boolean, default: false },
  
  // Common amenities
  gym: { type: Boolean, default: false },
  spa: { type: Boolean, default: false },
  parking: { type: Boolean, default: false },
  security247: { type: Boolean, default: false },
  smartHome: { type: Boolean, default: false },
  highSpeedElevators: { type: Boolean, default: false },
  businessCenter: { type: Boolean, default: false },
  cafeteria: { type: Boolean, default: false },
  landscapedGardens: { type: Boolean, default: false },
  childrenPlayArea: { type: Boolean, default: false },
  petFriendly: { type: Boolean, default: false },
  wheelchairAccessible: { type: Boolean, default: false }
}, { _id: false });

const FinancialsSchema = new Schema<IFinancials>({
  totalValue: { type: Number, min: [0, 'Total value cannot be negative'] },
  valuationDate: { type: Date },
  annualRevenue: { type: Number, min: [0, 'Annual revenue cannot be negative'] },
  occupancyRate: { 
    type: Number, 
    min: [0, 'Occupancy rate cannot be negative'],
    max: [100, 'Occupancy rate cannot exceed 100%']
  },
  serviceCharges: { type: Number, min: [0, 'Service charges cannot be negative'] },
  annualAppreciation: { type: Number },
  rentalYield: { type: Number },
  capRate: { type: Number },
  roi: { type: Number },
  operatingExpenses: { type: Number, min: [0, 'Operating expenses cannot be negative'] },
  noi: { type: Number },
  expectedReturns: {
    year1: { type: Number },
    year5: { type: Number },
    year10: { type: Number }
  }
}, { _id: false });

const TransactionHistorySchema = new Schema<ITransactionHistory>({
  date: { type: Date, required: true },
  price: { type: Number, required: true, min: 0 },
  buyer: { type: String, trim: true },
  seller: { type: String, trim: true },
  transactionType: { 
    type: String, 
    required: true,
    enum: ['sale', 'lease', 'refinance', 'transfer']
  },
  notes: { type: String, trim: true }
}, { _id: false });

const SaleInformationSchema = new Schema<ISaleInformation>({
  isForSale: { type: Boolean, default: false },
  askingPrice: { type: String, trim: true },
  askingPriceNumeric: { type: Number, min: 0 },
  valuationReports: { type: [String], default: [] },
  saleStatus: { 
    type: String, 
    enum: ['available', 'underNegotiation', 'sold', 'offMarket', 'notForSale'],
    default: 'notForSale'
  },
  transactionHistory: { type: [TransactionHistorySchema], default: [] },
  dealStructure: { 
    type: String, 
    enum: ['entireBuilding', 'floor', 'unit', 'shareSale', 'jointVenture']
  },
  saleConditions: { type: [String], default: [] },
  preferredBuyerType: { 
    type: String, 
    enum: ['institutional', 'REIT', 'privateInvestor', 'developer', 'endUser', 'any'],
    default: 'any'
  }
}, { _id: false });

const LegalDetailsSchema = new Schema<ILegalDetails>({
  titleDeedNumber: { type: String, trim: true },
  reraNumber: { type: String, trim: true },
  tradeLicenseNumber: { type: String, trim: true },
  zoning: { 
    type: String, 
    required: [true, 'Zoning is required'],
    trim: true
  },
  ownership: { 
    type: String, 
    required: [true, 'Ownership type is required'],
    enum: ['freehold', 'leasehold']
  },
  leaseholdExpiry: { type: Date },
  buildingPermits: { type: [String], default: [] },
  complianceCertificates: { type: [String], default: [] },
  mortgageDetails: {
    lender: { type: String, trim: true },
    outstandingAmount: { type: Number, min: 0 },
    maturityDate: { type: Date }
  }
}, { _id: false });

const OperationalDetailsSchema = new Schema<IOperationalDetails>({
  managementCompany: { type: String, trim: true },
  facilityManager: { type: String, trim: true },
  staffCount: { type: Number, min: [0, 'Staff count cannot be negative'] },
  maintenanceStatus: { 
    type: String, 
    required: [true, 'Maintenance status is required'],
    enum: ['new', 'wellMaintained', 'requiresMaintenance', 'underRenovation']
  },
  lastRenovation: { type: Date },
  nextScheduledMaintenance: { type: Date },
  certifications: { type: [String], default: [] },
  utilities: {
    electricity: { type: String, trim: true },
    water: { type: String, trim: true },
    cooling: { type: String, trim: true },
    internet: { type: [String], default: [] }
  }
}, { _id: false });

const ConnectivitySchema = new Schema<IConnectivity>({
  metro: {
    station: { type: String, trim: true },
    distance: { type: Number, min: 0 },
    walkingTime: { type: Number, min: 0 }
  },
  airport: {
    name: { type: String, trim: true },
    distance: { type: Number, min: 0 },
    driveTime: { type: Number, min: 0 }
  },
  highways: { type: [String], default: [] },
  publicTransport: { type: [String], default: [] },
  landmarks: [{
    name: { type: String, trim: true },
    distance: { type: Number, min: 0 }
  }]
}, { _id: false });

const CoordinatesSchema = new Schema<ICoordinates>({
  latitude: { 
    type: Number, 
    required: true,
    min: [-90, 'Latitude must be between -90 and 90'],
    max: [90, 'Latitude must be between -90 and 90']
  },
  longitude: { 
    type: Number, 
    required: true,
    min: [-180, 'Longitude must be between -180 and 180'],
    max: [180, 'Longitude must be between -180 and 180']
  }
}, { _id: false });

const LocationDetailsSchema = new Schema<ILocationDetails>({
  description: { 
    type: String, 
    trim: true,
    maxlength: [1000, 'Location description cannot exceed 1000 characters']
  },
  coordinates: { type: CoordinatesSchema },
  connectivity: { type: ConnectivitySchema },
  nearbyFacilities: { type: [String], default: [] },
  neighborhood: { type: String, trim: true },
  district: { type: String, trim: true },
  demographics: {
    population: { type: Number, min: [0, 'Population cannot be negative'] },
    averageIncome: { type: String, trim: true },
    employmentRate: { type: Number, min: 0, max: 100 }
  }
}, { _id: false });

const DeveloperSchema = new Schema<IDeveloper>({
  name: { 
    type: String, 
    required: [true, 'Developer name is required'],
    trim: true
  },
  slug: { 
    type: String, 
    required: [true, 'Developer slug is required'],
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },
  established: { 
    type: Number,
    min: [1800, 'Establishment year must be valid'],
    max: [new Date().getFullYear(), 'Establishment year cannot be in the future']
  },
  portfolio: { type: [String], default: [] },
  headquarters: { type: String, trim: true },
  reputation: { type: String, trim: true }
}, { _id: false });

const MarketingMaterialsSchema = new Schema<IMarketingMaterials>({
  brochure: { 
    type: String,
    validate: {
      validator: (v: string) => !v || /^https?:\/\/.+/.test(v),
      message: 'Brochure must be a valid URL'
    }
  },
  videoTour: { 
    type: String,
    validate: {
      validator: (v: string) => !v || /^https?:\/\/.+/.test(v),
      message: 'Video tour must be a valid URL'
    }
  },
  virtualTour3D: { 
    type: String,
    validate: {
      validator: (v: string) => !v || /^https?:\/\/.+/.test(v),
      message: 'Virtual tour must be a valid URL'
    }
  },
  floorPlans: { 
    type: [String],
    validate: {
      validator: (v: string[]) => {
        return v.every(url => /^https?:\/\/.+/.test(url));
      },
      message: 'All floor plans must be valid URLs'
    }
  },
  investmentHighlights: { type: [String], default: [] },
  keySellingPoints: { type: [String], default: [] },
  awards: { type: [String], default: [] },
  pressReleases: { type: [String], default: [] }
}, { _id: false });

const BrokerContactSchema = new Schema<IBrokerContact>({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { 
    type: String, 
    required: true, 
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },
  company: { type: String, trim: true },
  license: { type: String, trim: true }
}, { _id: false });

const InvestorRelationsSchema = new Schema<IInvestorRelations>({
  brokerContact: { type: BrokerContactSchema },
  ndaRequired: { type: Boolean, default: false },
  dataRoomAccessUrl: { 
    type: String,
    validate: {
      validator: (v: string) => !v || /^https?:\/\/.+/.test(v),
      message: 'Data room access URL must be a valid URL'
    }
  },
  tourAvailability: { type: String, trim: true }
}, { _id: false });

// Main Building Schema
const BuildingSchema = new Schema<IBuilding>(
  {
    buildingId: { 
      type: String, 
      required: [true, 'Building ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^BLDG_\d{3}$/, 'Building ID must follow format: BLDG_001']
    },
    slug: { 
      type: String, 
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
    },
    name: { 
      type: String, 
      required: [true, 'Building name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    subtitle: { 
      type: String, 
      trim: true,
      maxlength: [200, 'Subtitle cannot exceed 200 characters']
    },
    location: { 
      type: String, 
      required: [true, 'Location is required'],
      trim: true,
      maxlength: [100, 'Location cannot exceed 100 characters']
    },
    subLocation: { 
      type: String, 
      trim: true,
      maxlength: [100, 'Sub-location cannot exceed 100 characters']
    },
    
    category: { 
      type: String, 
      required: [true, 'Category is required'],
      enum: ['residential', 'commercial', 'mixed']
    },
    type: { 
      type: String, 
      required: [true, 'Building type is required'],
      trim: true,
      maxlength: [50, 'Type cannot exceed 50 characters']
    },
    
    price: { 
      type: PriceSchema, 
      required: [true, 'Price information is required']
    },
    priceRange: { type: PriceRangeSchema },
    dimensions: { 
      type: DimensionsSchema, 
      required: [true, 'Dimensions information is required']
    },
    
    year: { 
      type: Number, 
      required: [true, 'Year is required'],
      min: [1800, 'Year must be valid'],
      max: [2100, 'Year cannot be too far in future']
    },
    yearBuilt: { 
      type: Number,
      min: [1800, 'Year built must be valid'],
      max: [2100, 'Year built cannot be too far in future']
    },
    
    units: { 
      type: [UnitSchema], 
      default: []
    },
    totalUnits: { 
      type: Number, 
      required: [true, 'Total units is required'],
      min: [1, 'Total units must be positive']
    },
    availableUnits: { 
      type: Number, 
      min: [0, 'Available units cannot be negative']
    },
    
    amenities: { 
      type: AmenitiesSchema,
      required: [true, 'Amenities information is required']
    },
    features: { type: [String], default: [] },
    highlights: { type: [String], default: [] },
    
    // Business & Investment Information
    financials: { type: FinancialsSchema },
    saleInformation: { type: SaleInformationSchema },
    legalDetails: { type: LegalDetailsSchema },
    operationalDetails: { type: OperationalDetailsSchema },
    marketingMaterials: { type: MarketingMaterialsSchema },
    investorRelations: { type: InvestorRelationsSchema },
    
    // Media
    mainImage: { 
      type: String, 
      required: [true, 'Main image is required'],
      validate: {
        validator: (v: string) => /^https?:\/\/.+/.test(v),
        message: 'Main image must be a valid URL'
      }
    },
    gallery: { 
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => {
          return v.every(url => /^https?:\/\/.+/.test(url));
        },
        message: 'All gallery images must be valid URLs'
      }
    },
    floorPlans: { 
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => {
          return v.every(url => /^https?:\/\/.+/.test(url));
        },
        message: 'All floor plans must be valid URLs'
      }
    },
    
    // Location & Connectivity
    locationDetails: { type: LocationDetailsSchema },
    
    // Developer/Owner Information
    developer: { type: DeveloperSchema },
    currentOwner: { type: String, trim: true },
    masterDeveloper: { type: String, trim: true },
    
    // Ratings & Performance
    rating: { type: String, trim: true },
    sustainabilityRating: { type: String, trim: true },
    
    // Additional Details
    architecture: { 
      type: String, 
      trim: true,
      maxlength: [500, 'Architecture description cannot exceed 500 characters']
    },
    architect: { type: String, trim: true },
    description: { 
      type: String, 
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    
    // Status & Availability
    status: { 
      type: String, 
      required: [true, 'Status is required'],
      trim: true,
      enum: {
        values: [
          'Completed',
          'Under Construction',
          'Planned',
          'Renovation',
          'Iconic',
          'New',
          'Premium',
          'Exclusive',
          'Landmark',
          'Elite',
          'Historic',
          'Modern'
        ],
        message: 'Invalid status value'
      }
    },
    verified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    
    // Audit fields
    createdBy: { 
      type: AuditInfoSchema, 
      required: true 
    },
    updatedBy: { 
      type: AuditInfoSchema, 
      required: true 
    },
    version: { 
      type: Number, 
      default: 1,
      min: 1
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound Indexes for optimization
BuildingSchema.index({ location: 1, category: 1, status: 1 });
BuildingSchema.index({ category: 1, type: 1 });
BuildingSchema.index({ 'price.valueNumeric': 1, category: 1 });
BuildingSchema.index({ 'saleInformation.saleStatus': 1, 'saleInformation.isForSale': 1 });
BuildingSchema.index({ year: 1, status: 1 });
BuildingSchema.index({ slug: 1 }, { unique: true });
BuildingSchema.index({ buildingId: 1 }, { unique: true });
BuildingSchema.index({ verified: 1, isActive: 1 });
BuildingSchema.index({ 'createdBy.email': 1 });
BuildingSchema.index({ 'updatedBy.email': 1 });

// Virtual properties
BuildingSchema.virtual('occupancyPercentage').get(function() {
  if (!this.totalUnits || !this.availableUnits) return null;
  const occupied = this.totalUnits - this.availableUnits;
  return ((occupied / this.totalUnits) * 100).toFixed(2);
});

BuildingSchema.virtual('investmentSummary').get(function() {
  return {
    value: this.price.value,
    priceRange: this.priceRange?.display,
    capRate: this.financials?.capRate,
    roi: this.financials?.roi,
    occupancyRate: this.financials?.occupancyRate,
    saleStatus: this.saleInformation?.saleStatus || 'notForSale',
    isForSale: this.saleInformation?.isForSale || false
  };
});

BuildingSchema.virtual('amenityCount').get(function() {
  if (!this.amenities) return 0;
  return Object.values(this.amenities).filter(Boolean).length;
});

BuildingSchema.virtual('buildingAge').get(function() {
  const currentYear = new Date().getFullYear();
  return currentYear - (this.yearBuilt || this.year);
});

// Static methods
BuildingSchema.statics.findResidential = function() {
  return this.find({ 
    category: 'residential',
    verified: true,
    isActive: true
  });
};

BuildingSchema.statics.findCommercial = function() {
  return this.find({ 
    category: 'commercial',
    verified: true,
    isActive: true
  });
};

BuildingSchema.statics.findMixed = function() {
  return this.find({ 
    category: 'mixed',
    verified: true,
    isActive: true
  });
};

BuildingSchema.statics.findByLocation = function(location: string) {
  return this.find({
    $or: [
      { location: new RegExp(location, 'i') },
      { subLocation: new RegExp(location, 'i') }
    ],
    verified: true,
    isActive: true
  });
};

BuildingSchema.statics.findByPriceRange = function(minPrice: number, maxPrice: number) {
  return this.find({
    'price.valueNumeric': { $gte: minPrice, $lte: maxPrice },
    verified: true,
    isActive: true
  });
};

BuildingSchema.statics.findByStatus = function(status: string) {
  return this.find({
    status: status,
    verified: true,
    isActive: true
  });
};

BuildingSchema.statics.findLuxury = function() {
  return this.find({
    $or: [
      { rating: { $in: ['Iconic', 'Premium', 'Exclusive', 'Elite', 'Landmark'] } },
      { type: /luxury|ultra-luxury|premium/i }
    ],
    verified: true,
    isActive: true
  });
};

BuildingSchema.statics.findAvailableForSale = function() {
  return this.find({ 
    'saleInformation.isForSale': true,
    'saleInformation.saleStatus': 'available',
    verified: true,
    isActive: true
  });
};

BuildingSchema.statics.findByYearRange = function(startYear: number, endYear: number) {
  return this.find({
    year: { $gte: startYear, $lte: endYear },
    verified: true,
    isActive: true
  });
};

BuildingSchema.statics.findByAmenities = function(amenities: string[]) {
  const query: any = { verified: true, isActive: true };
  
  amenities.forEach(amenity => {
    query[`amenities.${amenity}`] = true;
  });
  
  return this.find(query);
};

BuildingSchema.statics.findFeatured = function() {
  return this.find({
    isFeatured: true,
    verified: true,
    isActive: true
  });
};

// Instance methods
BuildingSchema.methods.getBasicInfo = function() {
  return {
    name: this.name,
    location: this.location,
    type: this.type,
    category: this.category,
    year: this.year,
    floors: this.dimensions.floors,
    totalUnits: this.totalUnits,
    status: this.status
  };
};

BuildingSchema.methods.getInvestmentMetrics = function() {
  return {
    value: this.price.value,
    priceRange: this.priceRange?.display || 'N/A',
    capRate: this.financials?.capRate ? `${this.financials.capRate}%` : 'N/A',
    roi: this.financials?.roi ? `${this.financials.roi}%` : 'N/A',
    occupancyRate: this.financials?.occupancyRate ? `${this.financials.occupancyRate}%` : 'N/A',
    rentalYield: this.financials?.rentalYield ? `${this.financials.rentalYield}%` : 'N/A',
    annualAppreciation: this.financials?.annualAppreciation ? `${this.financials.annualAppreciation}%` : 'N/A',
    saleStatus: this.saleInformation?.saleStatus || 'notForSale',
    isForSale: this.saleInformation?.isForSale || false
  };
};

BuildingSchema.methods.getAmenitiesList = function() {
  if (!this.amenities) return [];
  
  const amenityMap: { [key: string]: string } = {
    // Residential
    privateElevator: 'Private Elevator',
    skyLounge: 'Sky Lounge',
    concierge: 'Concierge Service',
    infinityPool: 'Infinity Pool',
    skyBridge: 'Sky Bridge',
    privateCinema: 'Private Cinema',
    skyPool: 'Sky Pool',
    panoramicViews: 'Panoramic Views',
    valetService: 'Valet Service',
    marinaAccess: 'Marina Access',
    beachClub: 'Beach Club',
    golfCourse: 'Golf Course',
    
    // Commercial
    executiveLounges: 'Executive Lounges',
    helipad: 'Helipad',
    fiveStarHotel: 'Five Star Hotel',
    tradingFloors: 'Trading Floors',
    conferenceCenters: 'Conference Centers',
    fineDining: 'Fine Dining',
    exhibitionHalls: 'Exhibition Halls',
    conventionCenter: 'Convention Center',
    retailSpaces: 'Retail Spaces',
    marinaViews: 'Marina Views',
    
    // Common
    gym: 'Fitness Center',
    spa: 'Spa & Wellness',
    parking: 'Parking',
    security247: '24/7 Security',
    smartHome: 'Smart Home Technology',
    highSpeedElevators: 'High Speed Elevators',
    businessCenter: 'Business Center',
    cafeteria: 'Cafeteria',
    landscapedGardens: 'Landscaped Gardens',
    childrenPlayArea: 'Children Play Area',
    petFriendly: 'Pet Friendly',
    wheelchairAccessible: 'Wheelchair Accessible'
  };
  
  return Object.entries(this.amenities)
    .filter(([_, value]) => value === true)
    .map(([key, _]) => amenityMap[key] || key);
};

BuildingSchema.methods.getUnitTypes = function() {
  return this.units.map((unit: IUnit) => ({
    type: unit.type,
    count: unit.count,
    sizeRange: unit.sizeRange,
    priceRange: unit.priceRange?.display,
    availability: unit.availability
  }));
};

BuildingSchema.methods.getLocationInfo = function() {
  return {
    location: this.location,
    subLocation: this.subLocation,
    neighborhood: this.locationDetails?.neighborhood,
    district: this.locationDetails?.district,
    coordinates: this.locationDetails?.coordinates,
    nearbyFacilities: this.locationDetails?.nearbyFacilities || [],
    connectivity: this.locationDetails?.connectivity
  };
};

// Pre-save middleware
BuildingSchema.pre('save', function(next) {
  // Auto-generate slug if not provided
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  
  // Set yearBuilt from year if not provided
  if (!this.yearBuilt && this.year) {
    this.yearBuilt = this.year;
  }
  
  // Calculate available units if not provided
  if (this.availableUnits === undefined && this.units.length > 0) {
    const totalAvailable = this.units.reduce((sum, unit) => {
      return sum + (unit.availability || 0);
    }, 0);
    this.availableUnits = totalAvailable;
  }
  
  // Update version for existing documents
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
  
  next();
});

// Post-save middleware
BuildingSchema.post('save', function(doc) {
  console.log(`Building ${doc.name} has been saved with ID: ${doc.buildingId}`);
});

// Query helpers
BuildingSchema.query = {
  byLocation: function(this: Query<any, IBuilding>, location: string) {
    return this.find({
      $or: [
        { location: new RegExp(location, 'i') },
        { subLocation: new RegExp(location, 'i') }
      ]
    });
  },
  residential: function(this: Query<any, IBuilding>) {
    return this.find({ category: 'residential' });
  },
  commercial: function(this: Query<any, IBuilding>) {
    return this.find({ category: 'commercial' });
  },
  luxury: function(this: Query<any, IBuilding>) {
    return this.find({
      $or: [
        { rating: { $in: ['Iconic', 'Premium', 'Exclusive', 'Elite', 'Landmark'] } },
        { type: /luxury|ultra-luxury|premium/i }
      ]
    });
  },
  verified: function(this: Query<any, IBuilding>) {
    return this.find({ verified: true });
  },
  active: function(this: Query<any, IBuilding>) {
    return this.find({ isActive: true });
  }
};

const Building = models.Building || model<IBuilding>("Building", BuildingSchema);
export default Building;

// Export interfaces for use in other files
export type {
  IAuditInfo,
  IPrice,
  IPriceRange,
  IDimensions,
  IUnit,
  IAmenities,
  IFinancials,
  ITransactionHistory,
  ISaleInformation,
  ILegalDetails,
  IOperationalDetails,
  IConnectivity,
  ICoordinates,
  ILocationDetails,
  IDeveloper,
  IMarketingMaterials,
  IBrokerContact,
  IInvestorRelations
};
