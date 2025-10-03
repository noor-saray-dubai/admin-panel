// types/hotels.ts

import { Document } from "mongoose";

// Base interfaces for hotel data structures
export interface IPrice {
  total: string; // Display format like "AED 2M"
  totalNumeric: number; // Actual number for calculations
  currency: string;
}

export interface IDimensions {
  height: string; // Display format like "321m"
  heightNumeric: number; // Actual height in meters
  floors?: number;
  totalArea?: number; // Total built-up area in sqm
  landArea?: number; // Land area in sqm
}

export interface IRoomSuite {
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

export interface IDiningVenue {
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

export interface IWellnessFacilities {
  name: string;
  description: string;
  facilities: string[];
  signature: string; // Signature treatment/service
  operatingHours?: string;
  bookingRequired?: boolean;
  additionalServices?: string[];
}

export interface IMeetingsFacilities {
  description: string;
  facilities: string[];
  maxCapacity?: number;
  totalVenues?: number;
  cateringAvailable?: boolean;
  technicalSupport?: boolean;
}


export interface ITransactionHistory {
  date: Date;
  price: number;
  buyer?: string;
  seller?: string;
  notes?: string;
}

export interface ISaleInformation {
  askingPrice?: string;
  askingPriceNumeric?: number;
  valuationReports?: string[];
  saleStatus: "available" | "underNegotiation" | "sold" | "offMarket" | "notForSale";
  transactionHistory?: ITransactionHistory[];
  dealStructure?: "assetSale" | "shareSale" | "jointVenture" | "leaseback" | "managementContract";
  saleConditions?: string[];
  preferredBuyerType?: "institutional" | "REIT" | "privateInvestor" | "hotelChain" | "developer" | "any";
}

export interface ILegalDetails {
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

export interface IOperationalDetails {
  managementCompany?: string;
  brandAffiliation?: string; // Hotel brand/chain
  operatingLicense?: string;
  staffCount?: number;
  serviceStandard?: string; // "5-Star", "7-Star", etc.
  certifications?: string[];
  maintenanceStatus?: "new" | "renovated" | "requiresRenovation";
  lastRenovation?: Date;
}

export interface IAmenities {
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

export interface IConnectivity {
  airport?: string;
  airportDistance?: number; // Distance in km
  metroStation?: string;
  metroDistance?: number;
  highways?: string[];
  landmarks?: string[];
  publicTransport?: string[];
}

export interface ICoordinates {
  latitude: number;
  longitude: number;
}

export interface ILocationDetails {
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

export interface IDeveloper {
  name: string;
  slug: string;
  established?: number;
  portfolio?: string[];
  headquarters?: string;
}

export interface IMarketingMaterials {
  brochure?: string;
  videoTour?: string;
  virtualTour3D?: string;
  investmentHighlights?: string[];
  keySellingPoints?: string[];
  awards?: string[];
}

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

// Main Hotel interface (extends Document for MongoDB)
export interface IHotel extends Document {
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

// Form data interface for frontend forms (excludes server-generated fields)
export interface HotelFormData {
  // Basic Information
  name: string;
  subtitle: string;
  location: string;
  subLocation?: string;
  type: string;
  
  // Pricing & Dimensions
  price: IPrice;
  dimensions: IDimensions;
  
  // Timeline
  year: string;
  yearBuilt?: number;
  yearOpened?: number;
  
  // Accommodation
  roomsSuites: IRoomSuite[];
  totalRooms?: number;
  totalSuites?: number;
  
  // Facilities & Services
  dining: IDiningVenue[];
  wellness?: IWellnessFacilities;
  meetings?: IMeetingsFacilities;
  
  // Features & Amenities
  amenities?: IAmenities;
  features?: string[];
  facts?: string[];
  
  // Business Information
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
  rating?: number;
  customerRating?: number;
  occupancyRate?: number;
  
  // Additional Details
  architecture?: string;
  description: string;
  
  // Status & Availability
  status: string;
  verified?: boolean;
  isActive?: boolean;
  isAvailable?: boolean;
  
  // Note: hotelId, slug, timestamps, and metadata fields are server-generated
}

// API response types
export interface HotelPaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface HotelFiltersData {
  locations: string[];
  types: string[];
  statuses: string[];
  serviceStandards: string[];
  saleStatuses: string[];
}

export interface HotelStatsData {
  total: number;
  operational: number;
  luxury: number;
  ultraLuxury: number;
  forSale: number;
  verified: number;
}

// Tab configuration
export interface HotelTabConfig {
  id: string;
  label: string;
  count: number;
  icon: any; // Lucide icon component
  description: string;
  filterCriteria?: {
    status?: string[];
    serviceStandard?: string[];
    saleStatus?: string[];
    isAvailable?: boolean;
    verified?: boolean;
    rating?: { $gte?: number };
  };
}