// models/malls.ts

import mongoose, { Schema, Document, model, models } from "mongoose";

// Audit tracking interface
interface IAuditInfo {
  email: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

// Interfaces
interface IPrice {
  total: string; // Display format like "AED 12.5B"
  totalNumeric: number; // Actual number for calculations
  perSqft: number;
  currency: string;
}

interface ISize {
  totalArea: number; // Total built-up area in sqft
  retailArea: number; // Leasable retail area in sqft
  totalSqm: number; // Total area in sqm
  retailSqm: number; // Retail area in sqm
  floors: number; // Number of floors
  parkingSpaces?: number; // Number of parking spaces
}

interface IRentalDetails {
  currentOccupancy?: number; // Percentage occupied (0-100)
  averageRent?: number; // Per sqft per year
  totalStores?: number; // Current number of stores
  maxStores: number; // Maximum possible stores
  vacantStores?: number; // Available retail spaces
  anchorTenants?: string[]; // Major anchor tenants
}

interface IFinancials {
  annualRevenue?: number; // Current annual revenue
  noi?: number; // Net Operating Income
  operatingExpenses?: number; // Annual operating costs
  capRate: number; // Capitalization rate
  roi: number; // Return on Investment percentage
  appreciation: number; // Expected appreciation percentage
  payback: number; // Payback period in years
}

// NEW: Transaction & Sale Information
interface ITransactionHistory {
  date: Date;
  price: number;
  buyer?: string;
  seller?: string;
  notes?: string;
}

interface ISaleInformation {
  askingPrice?: string; // May differ from valuation
  askingPriceNumeric?: number;
  valuationReports?: string[]; // Links to valuation PDFs
  saleStatus: "available" | "underNegotiation" | "sold" | "offMarket";
  transactionHistory?: ITransactionHistory[];
  dealStructure?: "assetSale" | "shareSale" | "jointVenture" | "leaseback";
  saleConditions?: string[];
  preferredBuyerType?: "institutional" | "REIT" | "privateInvestor" | "developer" | "any";
}

// NEW: Ownership & Legal
interface ILegalDetails {
  titleDeedNumber?: string;
  reraNumber?: string;
  zoning: string; // commercial, mixed-use, etc.
  leaseholdExpiry?: Date;
  mortgageDetails?: {
    lender: string;
    outstandingAmount: number;
    maturityDate: Date;
  };
}

// NEW: Enhanced Operational Details
interface IOperationalDetails {
  managementCompany?: string;
  serviceCharges?: number; // Annual OPEX chargeable to tenants
  utilityCosts?: number; // Average monthly/annual costs
  maintenanceStatus?: "new" | "renovated" | "requiresRenovation";
  greenBuildingCertifications?: string[]; // LEED, BREEAM, Estidama
}

// NEW: Tenant & Lease Information
interface ILeaseDetails {
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

// NEW: Marketing & Presentation
interface IMarketingMaterials {
  brochure?: string; // PDF marketing deck
  videoTour?: string;
  virtualTour3D?: string; // Matterport/3D model
  investmentHighlights?: string[];
  keySellingPoints?: string[];
}

// NEW: Buyer/Investor Relations
interface IBrokerContact {
  name: string;
  phone: string;
  email: string;
  company?: string;
}

interface IInvestorRelations {
  brokerContact?: IBrokerContact;
  ndaRequired?: boolean;
  dataRoomAccessUrl?: string;
}

interface IAmenities {
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

interface IConnectivity {
  metroStation?: string;
  metroDistance?: number; // Distance in km
  highways?: string[]; // Connected highways
  airports?: string[]; // Nearby airports with distance
  publicTransport?: string[]; // Bus routes, etc.
}

interface ICoordinates {
  latitude: number;
  longitude: number;
}

interface ILocationDetails {
  description?: string;
  coordinates?: ICoordinates;
  connectivity?: IConnectivity;
  demographics?: {
    catchmentPopulation?: number;
    averageIncome?: string;
    touristFootfall?: number; // Annual tourist visitors in area
  };
}

interface IDeveloper {
  name: string;
  slug: string;
  established?: number;
  portfolio?: string[]; // Other developments
}

export interface IMall extends Document {
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
  
  // Audit fields
  createdBy: IAuditInfo;
  updatedBy: IAuditInfo;
  version: number; // For optimistic locking
  
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
  total: { 
    type: String, 
    required: [true, 'Total price display is required'],
    trim: true
  },
  totalNumeric: { 
    type: Number, 
    required: [true, 'Total price numeric value is required'],
    min: [0, 'Total price cannot be negative']
  },
  perSqft: { 
    type: Number, 
    required: [true, 'Price per sqft is required'],
    min: [0, 'Price per sqft cannot be negative']
  },
  currency: { 
    type: String, 
    required: [true, 'Currency is required'],
    enum: ['AED', 'USD', 'EUR'],
    default: 'AED'
  }
}, { _id: false });

const SizeSchema = new Schema<ISize>({
  totalArea: { 
    type: Number, 
    required: [true, 'Total area is required'],
    min: [1, 'Total area must be positive']
  },
  retailArea: { 
    type: Number, 
    required: [true, 'Retail area is required'],
    min: [1, 'Retail area must be positive']
  },
  totalSqm: { 
    type: Number, 
    required: [true, 'Total area in sqm is required'],
    min: [1, 'Total area must be positive']
  },
  retailSqm: { 
    type: Number, 
    required: [true, 'Retail area in sqm is required'],
    min: [1, 'Retail area must be positive']
  },
  floors: { 
    type: Number, 
    required: [true, 'Number of floors is required'],
    min: [1, 'Must have at least 1 floor']
  },
  parkingSpaces: { 
    type: Number, 
    min: [0, 'Parking spaces cannot be negative']
  }
}, { _id: false });

const RentalDetailsSchema = new Schema<IRentalDetails>({
  currentOccupancy: { 
    type: Number, 
    min: [0, 'Occupancy cannot be negative'],
    max: [100, 'Occupancy cannot exceed 100%'],
    default: 0
  },
  averageRent: { 
    type: Number, 
    min: [0, 'Average rent cannot be negative']
  },
  totalStores: { 
    type: Number, 
    min: [0, 'Total stores cannot be negative'],
    default: 0
  },
  maxStores: { 
    type: Number, 
    required: [true, 'Maximum stores capacity is required'],
    min: [1, 'Must have capacity for at least 1 store']
  },
  vacantStores: { 
    type: Number, 
    min: [0, 'Vacant stores cannot be negative']
  },
  anchorTenants: { 
    type: [String],
    default: []
  }
}, { _id: false });

const FinancialsSchema = new Schema<IFinancials>({
  annualRevenue: { 
    type: Number, 
    min: [0, 'Revenue cannot be negative']
  },
  noi: { 
    type: Number
  },
  operatingExpenses: { 
    type: Number, 
    min: [0, 'Operating expenses cannot be negative']
  },
  capRate: { 
    type: Number, 
    required: [true, 'Cap rate is required'],
    min: [0, 'Cap rate cannot be negative']
  },
  roi: { 
    type: Number, 
    required: [true, 'ROI is required'],
    min: [0, 'ROI cannot be negative']
  },
  appreciation: { 
    type: Number, 
    required: [true, 'Appreciation rate is required'],
    min: [0, 'Appreciation cannot be negative']
  },
  payback: { 
    type: Number, 
    required: [true, 'Payback period is required'],
    min: [0, 'Payback period cannot be negative']
  }
}, { _id: false });

// NEW SCHEMAS
const TransactionHistorySchema = new Schema<ITransactionHistory>({
  date: { type: Date, required: true },
  price: { type: Number, required: true, min: 0 },
  buyer: { type: String, trim: true },
  seller: { type: String, trim: true },
  notes: { type: String, trim: true }
}, { _id: false });

const SaleInformationSchema = new Schema<ISaleInformation>({
  askingPrice: { type: String, trim: true },
  askingPriceNumeric: { type: Number, min: 0 },
  valuationReports: { type: [String], default: [] },
  saleStatus: { 
    type: String, 
    required: [true, 'Sale status is required'],
    enum: ['available', 'underNegotiation', 'sold', 'offMarket'],
    default: 'available'
  },
  transactionHistory: { type: [TransactionHistorySchema], default: [] },
  dealStructure: { 
    type: String, 
    enum: ['assetSale', 'shareSale', 'jointVenture', 'leaseback']
  },
  saleConditions: { type: [String], default: [] },
  preferredBuyerType: { 
    type: String, 
    enum: ['institutional', 'REIT', 'privateInvestor', 'developer', 'any'],
    default: 'any'
  }
}, { _id: false });

const LegalDetailsSchema = new Schema<ILegalDetails>({
  titleDeedNumber: { type: String, trim: true },
  reraNumber: { type: String, trim: true },
  zoning: { 
    type: String, 
    required: [true, 'Zoning is required'],
    trim: true
  },
  leaseholdExpiry: { type: Date },
  mortgageDetails: {
    lender: { type: String, trim: true },
    outstandingAmount: { type: Number, min: 0 },
    maturityDate: { type: Date }
  }
}, { _id: false });

const OperationalDetailsSchema = new Schema<IOperationalDetails>({
  managementCompany: { type: String, trim: true },
  serviceCharges: { type: Number, min: 0 },
  utilityCosts: { type: Number, min: 0 },
  maintenanceStatus: { 
    type: String, 
    enum: ['new', 'renovated', 'requiresRenovation']
  },
  greenBuildingCertifications: { type: [String], default: [] }
}, { _id: false });

const LeaseDetailsSchema = new Schema<ILeaseDetails>({
  leaseTermsSummary: {
    avgLeaseDuration: { type: Number, min: 0 },
    escalationRate: { type: Number, min: 0 }
  },
  topTenants: [{
    name: { type: String, required: true, trim: true },
    leaseExpiry: { type: Date, required: true },
    leasedArea: { type: Number, required: true, min: 0 },
    rent: { type: Number, required: true, min: 0 }
  }],
  leaseExpirySchedule: [{
    year: { type: Number, required: true },
    percentageExpiring: { type: Number, required: true, min: 0, max: 100 }
  }]
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
  investmentHighlights: { type: [String], default: [] },
  keySellingPoints: { type: [String], default: [] }
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
  company: { type: String, trim: true }
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
  }
}, { _id: false });

const AmenitiesSchema = new Schema<IAmenities>({
  cinemas: { type: Boolean, default: false },
  foodCourt: { type: Boolean, default: false },
  hypermarket: { type: Boolean, default: false },
  departmentStore: { type: Boolean, default: false },
  entertainment: { type: Boolean, default: false },
  skiResort: { type: Boolean, default: false },
  aquarium: { type: Boolean, default: false },
  iceRink: { type: Boolean, default: false },
  hotel: { type: Boolean, default: false },
  offices: { type: Boolean, default: false },
  residential: { type: Boolean, default: false },
  mosque: { type: Boolean, default: false },
  clinic: { type: Boolean, default: false },
  bankingServices: { type: Boolean, default: false },
  vip_lounges: { type: Boolean, default: false },
  nursery: { type: Boolean, default: false }
}, { _id: false });

const ConnectivitySchema = new Schema<IConnectivity>({
  metroStation: { type: String },
  metroDistance: { 
    type: Number, 
    min: [0, 'Distance cannot be negative']
  },
  highways: { type: [String], default: [] },
  airports: { type: [String], default: [] },
  publicTransport: { type: [String], default: [] }
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
  demographics: {
    catchmentPopulation: { type: Number, min: [0, 'Population cannot be negative'] },
    averageIncome: { type: String, trim: true },
    touristFootfall: { type: Number, min: [0, 'Tourist footfall cannot be negative'] }
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
    min: [1900, 'Establishment year must be valid'],
    max: [new Date().getFullYear(), 'Establishment year cannot be in the future']
  },
  portfolio: { type: [String], default: [] }
}, { _id: false });

// Main Mall Schema
const MallSchema = new Schema<IMall>(
  {
    mallId: { 
      type: String, 
      required: [true, 'Mall ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^MALL_\d{3}$/, 'Mall ID must follow format: MALL_123']
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
      required: [true, 'Mall name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    subtitle: { 
      type: String, 
      required: [true, 'Subtitle is required'],
      trim: true,
      maxlength: [200, 'Subtitle cannot exceed 200 characters']
    },
    status: { 
      type: String, 
      required: [true, 'Status is required'],
      trim: true,
      enum: {
        values: [
          'Operational',
          'Under Construction', 
          'Planned',
          'Design Phase',
          'Permits Approved',
          'Foundation Ready',
          'Partially Operational',
          'Renovation',
          'For Sale',
          'Sold',
          'Reserved'
        ],
        message: 'Invalid status value'
      }
    },
    location: { 
      type: String, 
      required: [true, 'Location is required'],
      trim: true,
      maxlength: [100, 'Location cannot exceed 100 characters']
    },
    subLocation: { 
      type: String, 
      required: [true, 'Sub-location is required'],
      trim: true,
      maxlength: [100, 'Sub-location cannot exceed 100 characters']
    },
    ownership: { 
      type: String, 
      required: [true, 'Ownership type is required'],
      enum: {
        values: ['freehold', 'leasehold'],
        message: 'Ownership must be freehold or leasehold'
      }
    },
    price: { 
      type: PriceSchema, 
      required: [true, 'Price information is required']
    },
    size: { 
      type: SizeSchema, 
      required: [true, 'Size information is required']
    },
    rentalDetails: { 
      type: RentalDetailsSchema, 
      required: [true, 'Rental details are required']
    },
    financials: { 
      type: FinancialsSchema, 
      required: [true, 'Financial information is required']
    },
    
    // NEW REQUIRED SECTIONS
    saleInformation: { 
      type: SaleInformationSchema, 
      required: [true, 'Sale information is required']
    },
    legalDetails: { 
      type: LegalDetailsSchema, 
      required: [true, 'Legal details are required']
    },
    
    // OPTIONAL SECTIONS
    operationalDetails: { type: OperationalDetailsSchema },
    leaseDetails: { type: LeaseDetailsSchema },
    marketingMaterials: { type: MarketingMaterialsSchema },
    investorRelations: { type: InvestorRelationsSchema },
    amenities: { type: AmenitiesSchema },
    features: { type: [String], default: [] },
    developer: { type: DeveloperSchema },
    yearBuilt: { 
      type: Number,
      min: [1900, 'Year built must be valid'],
      max: [2050, 'Year built cannot be too far in future']
    },
    yearOpened: { 
      type: Number,
      min: [1900, 'Year opened must be valid'],
      max: [2050, 'Year opened cannot be too far in future']
    },
    rating: { 
      type: Number,
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5']
    },
    visitorsAnnually: { 
      type: Number,
      min: [0, 'Visitors count cannot be negative']
    },
    architecture: { 
      type: String, 
      trim: true,
      maxlength: [500, 'Architecture description cannot exceed 500 characters']
    },
    image: { 
      type: String, 
      required: [true, 'Main image is required'],
      validate: {
        validator: (v: string) => /^https?:\/\/.+/.test(v),
        message: 'Image must be a valid URL'
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
    floorPlan: { 
      type: String,
      validate: {
        validator: (v: string) => !v || /^https?:\/\/.+/.test(v),
        message: 'Floor plan must be a valid URL'
      }
    },
    locationDetails: { type: LocationDetailsSchema },
    verified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isAvailable: { type: Boolean, default: true },
    isOperational: { type: Boolean, default: false },
    
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
MallSchema.index({ 'saleInformation.saleStatus': 1, location: 1, isAvailable: 1 });
MallSchema.index({ 'price.totalNumeric': 1, 'financials.capRate': 1 });
MallSchema.index({ 'saleInformation.preferredBuyerType': 1, verified: 1 });
MallSchema.index({ 'legalDetails.zoning': 1, ownership: 1 });
MallSchema.index({ status: 1, isActive: 1, verified: 1 });
MallSchema.index({ slug: 1 }, { unique: true });
MallSchema.index({ 'createdBy.email': 1 });
MallSchema.index({ 'updatedBy.email': 1 });

// Virtual properties
MallSchema.virtual('investmentSummary').get(function() {
  return {
    askingPrice: this.saleInformation.askingPrice || this.price.total,
    capRate: this.financials.capRate,
    roi: this.financials.roi,
    payback: this.financials.payback,
    saleStatus: this.saleInformation.saleStatus
  };
});


MallSchema.virtual('saleReadiness').get(function() {
  const hasValuation = (this.saleInformation?.valuationReports?.length ?? 0) > 0;
  const hasMarketing = !!(this.marketingMaterials?.brochure || 
                         (this.marketingMaterials?.investmentHighlights?.length ?? 0) > 0);
  const hasBroker = !!this.investorRelations?.brokerContact;
  
  return {
    hasValuation,
    hasMarketing,
    hasBroker,
    readyForSale: hasValuation && hasMarketing && hasBroker
  };
});

// Static methods for sale-focused queries
MallSchema.statics.findAvailableForSale = function() {
  return this.find({ 
    'saleInformation.saleStatus': 'available',
    verified: true,
    isActive: true
  });
};

MallSchema.statics.findByBuyerType = function(buyerType: string) {
  return this.find({
    'saleInformation.preferredBuyerType': { $in: [buyerType, 'any'] },
    'saleInformation.saleStatus': 'available',
    verified: true,
    isActive: true
  });
};

MallSchema.statics.findByCapRate = function(minRate: number, maxRate: number) {
  return this.find({
    'financials.capRate': { $gte: minRate, $lte: maxRate },
    'saleInformation.saleStatus': 'available',
    verified: true,
    isActive: true
  });
};

// Instance methods
MallSchema.methods.getInvestmentMetrics = function() {
  return {
    askingPrice: this.saleInformation.askingPrice || this.price.total,
    valuation: this.price.total,
    capRate: `${this.financials.capRate}%`,
    roi: `${this.financials.roi}%`,
    payback: `${this.financials.payback} years`,
    noi: this.financials.noi ? `${this.financials.noi.toLocaleString()}` : 'N/A',
    saleStatus: this.saleInformation.saleStatus
  };
};

MallSchema.methods.getSaleHighlights = function() {
  return {
    keyPoints: this.marketingMaterials?.keySellingPoints || [],
    investmentHighlights: this.marketingMaterials?.investmentHighlights || [],
    dealStructure: this.saleInformation.dealStructure,
    preferredBuyer: this.saleInformation.preferredBuyerType,
    hasNDA: this.investorRelations?.ndaRequired || false
  };
};

// Pre-save middleware to update version and handle slug generation
MallSchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  
  // Auto-update occupancy if store data provided
  if (this.rentalDetails.totalStores && this.rentalDetails.maxStores > 0) {
    this.rentalDetails.currentOccupancy = Math.round((this.rentalDetails.totalStores / this.rentalDetails.maxStores) * 100);
  }
  
  // Update version for existing documents
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
  
  next();
});

const Mall = models.Mall || model<IMall>("Mall", MallSchema);
export default Mall;
export type { IAuditInfo };
