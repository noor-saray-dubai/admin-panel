// Shared types for Plot entities

export interface IPrice {
  perSqft: number;
  total: string;
  totalNumeric: number;
  currency: string;
}

export interface ISize {
  sqft: number;
  sqm: number;
  acres: number;
}

export interface IPermissions {
  floors: string;
  usage: string;
  far: number;
  coverage: number;
}

export interface IInvestment {
  roi: number;
  appreciation: number;
  payback: number;
}

export interface ICoordinates {
  latitude: number;
  longitude: number;
}

export interface ILocationDetails {
  description: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  accessibility: string[];
}

export interface IPlot {
  _id: string;
  plotId: string;
  slug: string;
  title: string;
  subtitle: string;
  type: "industrial" | "community" | "building";
  subtype?: "hotel" | "residential" | "mixuse";
  location: string;
  subLocation: string;
  ownership: "freehold" | "leasehold";
  price: IPrice;
  size: ISize;
  permissions: IPermissions;
  investment: IInvestment;
  features: string[];
  developer?: string;
  status: string;
  image: string;
  gallery?: string[];
  locationDetails?: ILocationDetails;
  verified: boolean;
  isActive: boolean;
  isAvailable: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Form-specific types
export interface PlotFormData {
  title: string;
  subtitle: string;
  type: "industrial" | "community" | "building" | "";
  subtype: "hotel" | "residential" | "mixuse" | "";
  location: string;
  subLocation: string;
  ownership: "freehold" | "leasehold" | "";
  price: {
    perSqft: number;
    total: string;
    totalNumeric: number;
    currency: string;
  };
  size: {
    sqft: number;
    sqm: number;
    acres: number;
  };
  permissions: {
    floors: string;
    usage: string;
    far: number;
    coverage: number;
  };
  investment: {
    roi: number;
    appreciation: number;
    payback: number;
  };
  features: string[];
  developer: string;
  status: string;
  image: string; // Image URL
  gallery: string[]; // Array of image URLs
  locationDetails: {
    description: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    accessibility: string[];
  };
  verified: boolean;
  isActive: boolean;
  isAvailable: boolean;
}

// API response types
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalPlots: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface FiltersData {
  locations: string[];
  developers: string[];
  types: string[];
  statuses: string[];
  subtypes: string[];
  ownershipTypes: string[];
}

export interface PlotApiResponse {
  success: boolean;
  plots: IPlot[];
  pagination: PaginationInfo;
  filters: FiltersData;
}

// Component prop types
export interface PlotCardProps {
  plot: IPlot;
  onView: (plot: IPlot) => void;
  onEdit: (plot: IPlot) => void;
  onDelete: (plot: IPlot) => void;
}

export interface PlotFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (plotData: any) => void;
  onSuccess?: (plot: IPlot) => void;
  plot?: IPlot | null | undefined;
  mode: "add" | "edit";
}

export interface PlotViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  plot: IPlot | null | undefined;
}

export interface PlotTabsProps {
  initialModalOpen?: boolean;
  onModalClose?: () => void;
}