// models/hotels.ts

import mongoose, { Schema, Document, model, models, Query } from "mongoose";

// Define custom query helpers interface
interface HotelQueryHelpers {
  operational(): Query<any, Document> & HotelQueryHelpers;
  luxury(): Query<any, Document> & HotelQueryHelpers;
  verified(): Query<any, Document> & HotelQueryHelpers;
  active(): Query<any, Document> & HotelQueryHelpers;
  byLocation(location: string): Query<any, Document> & HotelQueryHelpers;
}

// Extend mongoose Query interface
declare module 'mongoose' {
  interface Query<ResultType, DocType extends Document, THelpers = {}> {
    byLocation(location: string): Query<ResultType, DocType, THelpers>;
    operational(): Query<ResultType, DocType, THelpers>;
    luxury(): Query<ResultType, DocType, THelpers>;
    verified(): Query<ResultType, DocType, THelpers>;
    active(): Query<ResultType, DocType, THelpers>;
  }
}

// Interfaces
interface IPrice {
  total: string; // Display format like "AED 2M"
  totalNumeric: number; // Actual number for calculations
  currency: string;
}

interface IDimensions {
  height: string; // Display format like "321m"
  heightNumeric: number; // Actual height in meters
  floors?: number;
  totalArea?: number; // Total built-up area in sqm
  landArea?: number; // Land area in sqm
}

interface IRoomSuite {
  name: string;
  size: string; // Display format like "170 sqm"
  sizeNumeric?: number; // Size in sqm for calculations
  features: string[];
  description: string;
  count?: number; // Number of this type of room/suite
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
}

interface IDiningVenue {
  name: string;
  type: string; // "International Fine Dining", "Seafood Restaurant", etc.
  location: string; // "27th Floor", "Ground Floor", etc.
  description: string;
  cuisine?: string[];
  capacity?: number;
  operatingHours?: {
    breakfast: string;
    lunch: string;
    dinner: string;
    allDay: boolean;
  };
  priceRange?: string; // "$$$$", "$$$", etc.
  reservationRequired?: boolean;
  dressCode?: string;
}

interface IWellnessFacilities {
  name: string;
  description: string;
  facilities: string[];
  signature: string; // Signature treatment/service
  operatingHours?: string;
  bookingRequired?: boolean;
  additionalServices?: string[];
}

interface IMeetingsFacilities {
  description: string;
  facilities: string[];
  maxCapacity?: number;
  totalVenues?: number;
  cateringAvailable?: boolean;
  technicalSupport?: boolean;
}


interface ITransactionHistory {
  date: Date;
  price: number;
  buyer?: string;
  seller?: string;
  notes?: string;
}

interface ISaleInformation {
  askingPrice?: string;
  askingPriceNumeric?: number;
  valuationReports?: string[];
  saleStatus: "available" | "underNegotiation" | "sold" | "offMarket" | "notForSale";
  transactionHistory?: ITransactionHistory[];
  dealStructure?: "assetSale" | "shareSale" | "jointVenture" | "leaseback" | "managementContract";
  saleConditions?: string[];
  preferredBuyerType?: "institutional" | "REIT" | "privateInvestor" | "hotelChain" | "developer" | "any";
}

interface ILegalDetails {
  titleDeedNumber?: string;
  reraNumber?: string;
  tradeLicenseNumber?: string;
  zoning: string;
  ownership: "freehold" | "leasehold";
  leaseholdExpiry?: Date;
  mortgageDetails?: {
    lender: string;
    outstandingAmount: number;
    maturityDate: Date;
  };
}

interface IOperationalDetails {
  managementCompany?: string;
  brandAffiliation?: string; // Hotel brand/chain
  operatingLicense?: string;
  staffCount?: number;
  serviceStandard?: string; // "5-Star", "7-Star", etc.
  certifications?: string[];
  maintenanceStatus?: "new" | "renovated" | "requiresRenovation";
  lastRenovation?: Date;
}

interface IAmenities {
  spa?: boolean;
  pool?: boolean;
  infinityPool?: boolean;
  privateBeach?: boolean;
  gym?: boolean;
  businessCenter?: boolean;
  concierge?: boolean;
  roomService?: boolean;
  valet?: boolean;
  butler?: boolean;
  helipad?: boolean;
  marina?: boolean;
  golf?: boolean;
  tennis?: boolean;
  kidClub?: boolean;
  petFriendly?: boolean;
  airportTransfer?: boolean;
  wheelchairAccessible?: boolean;
}

interface IConnectivity {
  airport?: string;
  airportDistance?: number; // Distance in km
  metroStation?: string;
  metroDistance?: number;
  highways?: string[];
  landmarks?: string[];
  publicTransport?: string[];
}

interface ICoordinates {
  latitude: number;
  longitude: number;
}

interface ILocationDetails {
  description?: string;
  coordinates?: ICoordinates;
  connectivity?: IConnectivity;
  nearbyAttractions?: string[];
  demographics?: {
    catchmentPopulation?: number;
    averageIncome?: string;
    touristFootfall?: number;
  };
}

interface IDeveloper {
  name: string;
  slug: string;
  established?: number;
  portfolio?: string[];
  headquarters?: string;
}

interface IMarketingMaterials {
  brochure?: string;
  videoTour?: string;
  virtualTour3D?: string;
  investmentHighlights?: string[];
  keySellingPoints?: string[];
  awards?: string[];
}

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

export interface IHotel extends Document<any, HotelQueryHelpers> {
  hotelId: string; // Custom ID like "HOTEL_001"
  slug: string;
  name: string;
  subtitle: string;
  location: string;
  subLocation?: string;
  type: string; // "Ultra Luxury Resort", "Business Hotel", etc.
  
  price: IPrice;
  dimensions: IDimensions;
  
  year: string; // Year built/opened (display format)
  yearBuilt?: number;
  yearOpened?: number;
  
  roomsSuites: IRoomSuite[];
  totalRooms?: number;
  totalSuites?: number;
  
  dining: IDiningVenue[];
  wellness?: IWellnessFacilities;
  meetings?: IMeetingsFacilities;
  
  amenities?: IAmenities;
  features?: string[]; // General features/highlights
  facts?: string[]; // Key facts about the hotel
  
  // Business & Investment Information
  saleInformation?: ISaleInformation;
  legalDetails?: ILegalDetails;
  operationalDetails?: IOperationalDetails;
  marketingMaterials?: IMarketingMaterials;
  investorRelations?: IInvestorRelations;
  
  // Media
  mainImage: string;
  gallery?: string[];
  floorPlan?: string;
  
  // Location & Connectivity
  locationDetails?: ILocationDetails;
  
  // Developer/Owner Information
  developer?: IDeveloper;
  currentOwner?: string;
  
  // Ratings & Performance
  rating?: number; // Star rating (1-7)
  customerRating?: number; // Customer satisfaction (1-5)
  occupancyRate?: number; // Current occupancy percentage
  
  // Additional Details
  architecture?: string;
  description: string;
  
  // Status & Availability
  status: string; // "Operational", "Under Construction", etc.
  verified?: boolean;
  isActive?: boolean;
  isAvailable?: boolean; // Available for sale/investment
  
  // Metadata
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Sub-schemas
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
  currency: { 
    type: String, 
    required: [true, 'Currency is required'],
    enum: ['AED', 'USD', 'EUR', 'GBP'],
    default: 'AED'
  }
}, { _id: false });

const DimensionsSchema = new Schema<IDimensions>({
  height: { 
    type: String, 
    required: [true, 'Height display is required'],
    trim: true
  },
  heightNumeric: { 
    type: Number, 
    required: [true, 'Height numeric value is required'],
    min: [0, 'Height cannot be negative']
  },
  floors: { 
    type: Number, 
    min: [1, 'Must have at least 1 floor']
  },
  totalArea: { 
    type: Number, 
    min: [0, 'Total area cannot be negative']
  },
  landArea: { 
    type: Number, 
    min: [0, 'Land area cannot be negative']
  }
}, { _id: false });

const RoomSuiteSchema = new Schema<IRoomSuite>({
  name: { 
    type: String, 
    required: [true, 'Room/suite name is required'],
    trim: true
  },
  size: { 
    type: String, 
    required: [true, 'Size display is required'],
    trim: true
  },
  sizeNumeric: { 
    type: Number, 
    min: [0, 'Size cannot be negative']
  },
  features: { 
    type: [String], 
    required: [true, 'Features are required'],
    validate: {
      validator: (v: string[]) => v && v.length > 0,
      message: 'At least one feature is required'
    }
  },
  description: { 
    type: String, 
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  count: { 
    type: Number, 
    min: [1, 'Count must be at least 1']
  },
  priceRange: {
    min: { type: Number, min: 0 },
    max: { type: Number, min: 0 },
    currency: { type: String, enum: ['AED', 'USD', 'EUR', 'GBP'] }
  }
}, { _id: false });

const DiningVenueSchema = new Schema<IDiningVenue>({
  name: { 
    type: String, 
    required: [true, 'Dining venue name is required'],
    trim: true
  },
  type: { 
    type: String, 
    required: [true, 'Dining venue type is required'],
    trim: true
  },
  location: { 
    type: String, 
    required: [true, 'Location is required'],
    trim: true
  },
  description: { 
    type: String, 
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  cuisine: { type: [String], default: [] },
  capacity: { type: Number, min: [1, 'Capacity must be positive'] },
  operatingHours: {
    breakfast: { type: String, trim: true, default: '' },
    lunch: { type: String, trim: true, default: '' },
    dinner: { type: String, trim: true, default: '' },
    allDay: { type: Boolean, default: false }
  },
  priceRange: { 
    type: String, 
    enum: {
      values: ['$', '$$', '$$$', '$$$$', '$$$$$'],
      message: 'Price range must be one of: $, $$, $$$, $$$$, $$$$$'
    },
    required: false
  },
  reservationRequired: { type: Boolean, default: false },
  dressCode: { type: String, trim: true, default: '' }
}, { _id: false });

const WellnessFacilitiesSchema = new Schema<IWellnessFacilities>({
  name: { 
    type: String, 
    required: [true, 'Wellness facility name is required'],
    trim: true
  },
  description: { 
    type: String, 
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  facilities: { 
    type: [String], 
    required: [true, 'Facilities list is required'],
    validate: {
      validator: (v: string[]) => v && v.length > 0,
      message: 'At least one facility is required'
    }
  },
  signature: { 
    type: String, 
    required: [true, 'Signature service is required'],
    trim: true
  },
  operatingHours: { type: String, trim: true },
  bookingRequired: { type: Boolean, default: true },
  additionalServices: { type: [String], default: [] }
}, { _id: false });

const MeetingsFacilitiesSchema = new Schema<IMeetingsFacilities>({
  description: { 
    type: String, 
    required: [true, 'Meetings description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  facilities: { 
    type: [String], 
    required: [true, 'Facilities list is required'],
    validate: {
      validator: (v: string[]) => v && v.length > 0,
      message: 'At least one facility is required'
    }
  },
  maxCapacity: { type: Number, min: [1, 'Max capacity must be positive'] },
  totalVenues: { type: Number, min: [1, 'Total venues must be positive'] },
  cateringAvailable: { type: Boolean, default: true },
  technicalSupport: { type: Boolean, default: true }
}, { _id: false });


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
    enum: ['available', 'underNegotiation', 'sold', 'offMarket', 'notForSale'],
    default: 'notForSale'
  },
  transactionHistory: { type: [TransactionHistorySchema], default: [] },
  dealStructure: { 
    type: String, 
    enum: ['assetSale', 'shareSale', 'jointVenture', 'leaseback', 'managementContract']
  },
  saleConditions: { type: [String], default: [] },
  preferredBuyerType: { 
    type: String, 
    enum: ['institutional', 'REIT', 'privateInvestor', 'hotelChain', 'developer', 'any'],
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
  mortgageDetails: {
    lender: { type: String, trim: true },
    outstandingAmount: { type: Number, min: 0 },
    maturityDate: { type: Date }
  }
}, { _id: false });

const OperationalDetailsSchema = new Schema<IOperationalDetails>({
  managementCompany: { type: String, trim: true },
  brandAffiliation: { type: String, trim: true },
  operatingLicense: { type: String, trim: true },
  staffCount: { type: Number, min: [0, 'Staff count cannot be negative'] },
  serviceStandard: { 
    type: String, 
    enum: ['3-Star', '4-Star', '5-Star', '6-Star', '7-Star', 'Luxury', 'Ultra-Luxury']
  },
  certifications: { type: [String], default: [] },
  maintenanceStatus: { 
    type: String, 
    enum: ['new', 'renovated', 'requiresRenovation']
  },
  lastRenovation: { type: Date }
}, { _id: false });

const AmenitiesSchema = new Schema<IAmenities>({
  spa: { type: Boolean, default: false },
  pool: { type: Boolean, default: false },
  infinityPool: { type: Boolean, default: false },
  privateBeach: { type: Boolean, default: false },
  gym: { type: Boolean, default: false },
  businessCenter: { type: Boolean, default: false },
  concierge: { type: Boolean, default: false },
  roomService: { type: Boolean, default: false },
  valet: { type: Boolean, default: false },
  butler: { type: Boolean, default: false },
  helipad: { type: Boolean, default: false },
  marina: { type: Boolean, default: false },
  golf: { type: Boolean, default: false },
  tennis: { type: Boolean, default: false },
  kidClub: { type: Boolean, default: false },
  petFriendly: { type: Boolean, default: false },
  airportTransfer: { type: Boolean, default: false },
  wheelchairAccessible: { type: Boolean, default: false }
}, { _id: false });

const ConnectivitySchema = new Schema<IConnectivity>({
  airport: { type: String, trim: true },
  airportDistance: { type: Number, min: [0, 'Distance cannot be negative'] },
  metroStation: { type: String, trim: true },
  metroDistance: { type: Number, min: [0, 'Distance cannot be negative'] },
  highways: { type: [String], default: [] },
  landmarks: { type: [String], default: [] },
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
  nearbyAttractions: { type: [String], default: [] },
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
    min: [1800, 'Establishment year must be valid'],
    max: [new Date().getFullYear(), 'Establishment year cannot be in the future']
  },
  portfolio: { type: [String], default: [] },
  headquarters: { type: String, trim: true }
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
  keySellingPoints: { type: [String], default: [] },
  awards: { type: [String], default: [] }
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

// Main Hotel Schema
const HotelSchema = new Schema<IHotel>(
  {
    hotelId: { 
      type: String, 
      required: [true, 'Hotel ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^HOTEL_\d{3}$/, 'Hotel ID must follow format: HOTEL_123']
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
      required: [true, 'Hotel name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    subtitle: { 
      type: String, 
      required: [true, 'Subtitle is required'],
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
    type: { 
      type: String, 
      required: [true, 'Hotel type is required'],
      trim: true,
      maxlength: [50, 'Type cannot exceed 50 characters']
    },
    
    price: { 
      type: PriceSchema, 
      required: [true, 'Price information is required']
    },
    dimensions: { 
      type: DimensionsSchema, 
      required: [true, 'Dimensions information is required']
    },
    
    year: { 
      type: String, 
      required: [true, 'Year is required'],
      trim: true
    },
    yearBuilt: { 
      type: Number,
      min: [1800, 'Year built must be valid'],
      max: [2050, 'Year built cannot be too far in future']
    },
    yearOpened: { 
      type: Number,
      min: [1800, 'Year opened must be valid'],
      max: [2050, 'Year opened cannot be too far in future']
    },
    
    roomsSuites: { 
      type: [RoomSuiteSchema], 
      required: [true, 'Rooms/suites information is required'],
      validate: {
        validator: (v: IRoomSuite[]) => v && v.length > 0,
        message: 'At least one room/suite type is required'
      }
    },
    totalRooms: { type: Number, min: [1, 'Total rooms must be positive'] },
    totalSuites: { type: Number, min: [0, 'Total suites cannot be negative'] },
    
    dining: { 
      type: [DiningVenueSchema], 
      required: [true, 'Dining information is required'],
      validate: {
        validator: (v: IDiningVenue[]) => v && v.length > 0,
        message: 'At least one dining venue is required'
      }
    },
    wellness: { type: WellnessFacilitiesSchema },
    meetings: { type: MeetingsFacilitiesSchema },
    
    amenities: { type: AmenitiesSchema },
    features: { type: [String], default: [] },
    facts: { type: [String], default: [] },
    
    // Business & Investment Information
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
    floorPlan: { 
      type: String,
      validate: {
        validator: (v: string) => !v || /^https?:\/\/.+/.test(v),
        message: 'Floor plan must be a valid URL'
      }
    },
    
    // Location & Connectivity
    locationDetails: { type: LocationDetailsSchema },
    
    // Developer/Owner Information
    developer: { type: DeveloperSchema },
    currentOwner: { type: String, trim: true },
    
    // Ratings & Performance
    rating: { 
      type: Number,
      min: [1, 'Rating must be between 1 and 7'],
      max: [7, 'Rating must be between 1 and 7']
    },
    customerRating: { 
      type: Number,
      min: [1, 'Customer rating must be between 1 and 5'],
      max: [5, 'Customer rating must be between 1 and 5']
    },
    occupancyRate: { 
      type: Number,
      min: [0, 'Occupancy rate cannot be negative'],
      max: [100, 'Occupancy rate cannot exceed 100%']
    },
    
    // Additional Details
    architecture: { 
      type: String, 
      trim: true,
      maxlength: [500, 'Architecture description cannot exceed 500 characters']
    },
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
          'Operational',
          'Under Construction', 
          'Planned',
          'Design Phase',
          'Permits Approved',
          'Foundation Ready',
          'Partially Operational',
          'Renovation',
          'Closed Temporarily',
          'For Sale',
          'Sold'
        ],
        message: 'Invalid status value'
      }
    },
    verified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isAvailable: { type: Boolean, default: false }, // Available for sale/investment
    
    // Metadata
    createdBy: { type: String, trim: true },
    updatedBy: { type: String, trim: true }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound Indexes for optimization
HotelSchema.index({ location: 1, type: 1, status: 1 });
HotelSchema.index({ 'price.totalNumeric': 1, rating: 1 });
HotelSchema.index({ 'saleInformation.saleStatus': 1, isAvailable: 1 });
HotelSchema.index({ 'operationalDetails.serviceStandard': 1, verified: 1 });
HotelSchema.index({ slug: 1 }, { unique: true });
HotelSchema.index({ hotelId: 1 }, { unique: true });

// Virtual properties
HotelSchema.virtual('totalAccommodation').get(function() {
  return (this.totalRooms || 0) + (this.totalSuites || 0);
});

HotelSchema.virtual('investmentSummary').get(function() {
  return {
    askingPrice: this.saleInformation?.askingPrice || this.price.total,
    occupancyRate: this.occupancyRate,
    saleStatus: this.saleInformation?.saleStatus || 'notForSale'
  };
});

HotelSchema.virtual('operationalMetrics').get(function() {
  return {
    occupancyRate: this.occupancyRate,
    totalRooms: this.totalRooms,
    totalSuites: this.totalSuites,
    diningVenues: this.dining?.length || 0
  };
});

HotelSchema.virtual('amenityCount').get(function() {
  if (!this.amenities) return 0;
  return Object.values(this.amenities).filter(Boolean).length;
});

// Static methods
HotelSchema.statics.findOperational = function() {
  return this.find({ 
    status: 'Operational',
    verified: true,
    isActive: true
  });
};

HotelSchema.statics.findByStarRating = function(minRating: number, maxRating: number = 7) {
  return this.find({
    rating: { $gte: minRating, $lte: maxRating },
    status: 'Operational',
    verified: true,
    isActive: true
  });
};

HotelSchema.statics.findLuxuryHotels = function() {
  return this.find({
    $or: [
      { rating: { $gte: 5 } },
      { 'operationalDetails.serviceStandard': { $in: ['5-Star', '6-Star', '7-Star', 'Luxury', 'Ultra-Luxury'] } }
    ],
    status: 'Operational',
    verified: true,
    isActive: true
  });
};

HotelSchema.statics.findAvailableForSale = function() {
  return this.find({ 
    'saleInformation.saleStatus': 'available',
    verified: true,
    isActive: true,
    isAvailable: true
  });
};

HotelSchema.statics.findByLocation = function(location: string) {
  return this.find({
    $or: [
      { location: new RegExp(location, 'i') },
      { subLocation: new RegExp(location, 'i') }
    ],
    verified: true,
    isActive: true
  });
};

HotelSchema.statics.findByPriceRange = function(minPrice: number, maxPrice: number) {
  return this.find({
    'price.totalNumeric': { $gte: minPrice, $lte: maxPrice },
    verified: true,
    isActive: true
  });
};

HotelSchema.statics.findByAmenities = function(amenities: string[]) {
  const query: any = { verified: true, isActive: true };
  
  amenities.forEach(amenity => {
    query[`amenities.${amenity}`] = true;
  });
  
  return this.find(query);
};

// Instance methods
HotelSchema.methods.getBasicInfo = function() {
  return {
    name: this.name,
    subtitle: this.subtitle,
    location: this.location,
    type: this.type,
    rating: this.rating,
    yearOpened: this.yearOpened || this.year,
    totalRooms: this.totalRooms,
    totalSuites: this.totalSuites
  };
};

HotelSchema.methods.getInvestmentMetrics = function() {
  return {
    askingPrice: this.saleInformation?.askingPrice || this.price.total,
    valuation: this.price.total,
    occupancyRate: this.occupancyRate ? `${this.occupancyRate}%` : 'N/A',
    saleStatus: this.saleInformation?.saleStatus || 'notForSale'
  };
};

HotelSchema.methods.getAmenitiesList = function() {
  if (!this.amenities) return [];
  
  const amenityMap: { [key: string]: string } = {
    spa: 'Spa & Wellness',
    pool: 'Swimming Pool',
    infinityPool: 'Infinity Pool',
    privateBeach: 'Private Beach',
    gym: 'Fitness Center',
    businessCenter: 'Business Center',
    concierge: 'Concierge Service',
    roomService: '24/7 Room Service',
    valet: 'Valet Parking',
    butler: 'Butler Service',
    helipad: 'Helicopter Landing Pad',
    marina: 'Marina',
    golf: 'Golf Course',
    tennis: 'Tennis Court',
    kidClub: 'Kids Club',
    petFriendly: 'Pet Friendly',
    airportTransfer: 'Airport Transfer',
    wheelchairAccessible: 'Wheelchair Accessible'
  };
  
  return Object.entries(this.amenities)
    .filter(([_, value]) => value === true)
    .map(([key, _]) => amenityMap[key] || key);
};

HotelSchema.methods.getDiningOptions = function() {
  return this.dining.map((venue: IDiningVenue) => ({
    name: venue.name,
    type: venue.type,
    location: venue.location,
    cuisine: venue.cuisine || [],
    priceRange: venue.priceRange
  }));
};

HotelSchema.methods.getRoomTypes = function() {
  return this.roomsSuites.map((room: IRoomSuite) => ({
    name: room.name,
    size: room.size,
    features: room.features,
    count: room.count
  }));
};

// Pre-save middleware
HotelSchema.pre('save', function(next) {
  // Auto-generate slug if not provided
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  
  // Calculate total rooms/suites if not provided
  if (!this.totalRooms || !this.totalSuites) {
    let totalRooms = 0;
    let totalSuites = 0;
    
    this.roomsSuites.forEach(room => {
      const count = room.count || 1;
      if (room.name.toLowerCase().includes('suite')) {
        totalSuites += count;
      } else {
        totalRooms += count;
      }
    });
    
    if (!this.totalRooms) this.totalRooms = totalRooms;
    if (!this.totalSuites) this.totalSuites = totalSuites;
  }
  
  // Set yearOpened from year if not provided
  if (!this.yearOpened && this.year) {
    const yearNum = parseInt(this.year);
    if (!isNaN(yearNum)) {
      this.yearOpened = yearNum;
    }
  }
  
  next();
});

// Post-save middleware
HotelSchema.post('save', function(doc) {
  console.log(`Hotel ${doc.name} has been saved with ID: ${doc.hotelId}`);
});

// Query helpers
HotelSchema.query = {
  byLocation: function(this: Query<any, IHotel>, location: string) {
    return this.find({
      $or: [
        { location: new RegExp(location, 'i') },
        { subLocation: new RegExp(location, 'i') }
      ]
    });
  },
  operational: function(this: Query<any, IHotel>) {
    return this.find({ status: 'Operational' });
  },
  luxury: function(this: Query<any, IHotel>) {
    return this.find({
      $or: [
        { rating: { $gte: 5 } },
        { 'operationalDetails.serviceStandard': { $in: ['5-Star', '6-Star', '7-Star', 'Luxury', 'Ultra-Luxury'] } }
      ]
    });
  },
  verified: function(this: Query<any, IHotel>) {
    return this.find({ verified: true });
  },
  active: function(this: Query<any, IHotel>) {
    return this.find({ isActive: true });
  }
};

const Hotel = models.Hotel || model<IHotel>("Hotel", HotelSchema);
export default Hotel;

// Export interfaces for use in other files
export type {
  IPrice,
  IDimensions,
  IRoomSuite,
  IDiningVenue,
  IWellnessFacilities,
  IMeetingsFacilities,
  ISaleInformation,
  ILegalDetails,
  IOperationalDetails,
  IAmenities,
  ILocationDetails,
  IDeveloper,
  IMarketingMaterials,
  IInvestorRelations
};
