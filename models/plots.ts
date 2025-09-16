import mongoose, { Schema, Document, model, models } from "mongoose";

// Interfaces
interface IPrice {
  perSqft: number;
  total: string; // Display format like "AED 12.5M"
  totalNumeric: number; // Actual number for calculations
  currency: string;
}

interface ISize {
  sqft: number;
  sqm: number;
  acres: number;
}

interface IPermissions {
  floors: string; // e.g., "G+P+M+25"
  usage: string; // e.g., "5-Star Hotel"
  far: number; // Floor Area Ratio
  coverage: number; // Coverage percentage
}

interface IInvestment {
  roi: number; // Return on Investment percentage
  appreciation: number; // Expected appreciation percentage
  payback: number; // Payback period in years
}

interface ICoordinates {
  latitude: number;
  longitude: number;
}

interface ILocationDetails {
  description?: string;
  coordinates?: ICoordinates;
  accessibility?: string[];
}

export interface IPlot extends Document {
  plotId: string; // Custom ID like "IND_001", "COM_001"
  slug: string; // URL-friendly version
  title: string;
  subtitle: string;
  type: "industrial" | "community" | "building";
  subtype?: "hotel" | "residential" | "mixuse"; // Only when type === "building"
  location: string;
  subLocation: string;
  ownership: "freehold" | "leasehold";
  price: IPrice;
  size: ISize;
  permissions: IPermissions;
  investment: IInvestment;
  features: string[];
  developer?: string; // Optional - references Developer.slug
  status: string;
  image: string; // Main image URL
  gallery?: string[]; // Additional images
  locationDetails?: ILocationDetails;
  verified: boolean;
  isActive: boolean; // Available for sale
  isAvailable: boolean; // Not sold/reserved
  createdBy?: string; // Admin/user who created
  updatedBy?: string; // Admin/user who last updated
  createdAt: Date;
  updatedAt: Date;
}

// Sub-schemas
const PriceSchema = new Schema<IPrice>({
  perSqft: { 
    type: Number, 
    required: [true, 'Price per sqft is required'],
    min: [0, 'Price per sqft cannot be negative']
  },
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
    enum: ['AED', 'USD', 'EUR'],
    default: 'AED'
  }
}, { _id: false });

const SizeSchema = new Schema<ISize>({
  sqft: { 
    type: Number, 
    required: [true, 'Square feet is required'],
    min: [1, 'Size must be positive']
  },
  sqm: { 
    type: Number, 
    required: [true, 'Square meters is required'],
    min: [1, 'Size must be positive']
  },
  acres: { 
    type: Number, 
    required: [true, 'Acres is required'],
    min: [0.01, 'Acres must be positive']
  }
}, { _id: false });

const PermissionsSchema = new Schema<IPermissions>({
  floors: { 
    type: String, 
    required: [true, 'Floor permissions are required'],
    trim: true
  },
  usage: { 
    type: String, 
    required: [true, 'Usage type is required'],
    trim: true
  },
  far: { 
    type: Number, 
    required: [true, 'FAR is required'],
    min: [0, 'FAR cannot be negative']
  },
  coverage: { 
    type: Number, 
    required: [true, 'Coverage percentage is required'],
    min: [0, 'Coverage cannot be negative'],
    max: [100, 'Coverage cannot exceed 100%']
  }
}, { _id: false });

const InvestmentSchema = new Schema<IInvestment>({
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
    maxlength: [500, 'Location description cannot exceed 500 characters']
  },
  coordinates: { 
    type: CoordinatesSchema,
    required: false
  },
  accessibility: { 
    type: [String],
    default: []
  }
}, { _id: false });

// Main Plot Schema
const PlotSchema = new Schema<IPlot>(
  {
    plotId: { 
      type: String, 
      required: [true, 'Plot ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z]{3}_\d{3}$/, 'Plot ID must follow format: ABC_123']
    },
    slug: { 
      type: String, 
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
    },
    title: { 
      type: String, 
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    subtitle: { 
      type: String, 
      required: [true, 'Subtitle is required'],
      trim: true,
      maxlength: [150, 'Subtitle cannot exceed 150 characters']
    },
    type: { 
      type: String, 
      required: [true, 'Type is required'],
      enum: {
        values: ['industrial', 'community', 'building'],
        message: 'Type must be industrial, community, or building'
      }
    },
    subtype: { 
      type: String,
      enum: {
        values: ['hotel', 'residential', 'mixuse'],
        message: 'Subtype must be hotel, residential, or mixuse'
      },
      validate: {
        validator: function(this: IPlot, value: string) {
          // Subtype is required only when type is 'building'
          if (this.type === 'building') {
            return value != null && value.trim().length > 0;
          }
          // Subtype should not exist for other types
          return !value || value.trim().length === 0;
        },
        message: 'Subtype is required only for building type plots'
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
    permissions: { 
      type: PermissionsSchema, 
      required: [true, 'Permission details are required']
    },
    investment: { 
      type: InvestmentSchema, 
      required: [true, 'Investment metrics are required']
    },
    features: { 
      type: [String], 
      required: [true, 'Features are required'],
      validate: {
        validator: (v: string[]) => v?.length > 0,
        message: 'At least one feature must be provided'
      }
    },
    developer: { 
      type: String,
      trim: true,
      validate: {
        validator: function(v: string) {
          // If provided, should match slug format
          return !v || /^[a-z0-9-]+$/.test(v);
        },
        message: 'Developer slug can only contain lowercase letters, numbers, and hyphens'
      }
    },
    status: { 
      type: String, 
      required: [true, 'Status is required'],
      trim: true,
      enum: {
        values: [
          'Ready for Development',
          'Infrastructure Complete',
          'Master Plan Approved',
          'Design Development Phase',
          'Permits Approved',
          'Foundation Ready',
          'Under Development',
          'Sold',
          'Reserved'
        ],
        message: 'Invalid status value'
      }
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
    locationDetails: { 
      type: LocationDetailsSchema,
      required: false
    },
    verified: { 
      type: Boolean, 
      default: false
    },
    isActive: { 
      type: Boolean, 
      default: true
    },
    isAvailable: { 
      type: Boolean, 
      default: true
    },
    createdBy: { 
      type: String,
      trim: true
    },
    updatedBy: { 
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound Indexes for optimization
PlotSchema.index({ type: 1, subtype: 1, location: 1 });
PlotSchema.index({ ownership: 1, isAvailable: 1, verified: 1 });
PlotSchema.index({ 'price.totalNumeric': 1, 'size.sqft': 1 });
PlotSchema.index({ developer: 1, verified: 1 });
PlotSchema.index({ status: 1, isActive: 1 });
PlotSchema.index({ slug: 1 }, { unique: true });

// Virtual for price per sqm
PlotSchema.virtual('pricePerSqm').get(function() {
  return this.price.perSqft * 10.764; // Convert sqft to sqm
});

// Static methods
PlotSchema.statics.findByType = function(type: string, subtype?: string) {
  const query: any = { type, verified: true, isActive: true, isAvailable: true };
  if (subtype && type === 'building') {
    query.subtype = subtype;
  }
  return this.find(query);
};

PlotSchema.statics.findByLocation = function(location: string) {
  return this.find({ 
    location: new RegExp(location, 'i'),
    verified: true,
    isActive: true,
    isAvailable: true
  });
};

PlotSchema.statics.findByPriceRange = function(min: number, max: number) {
  return this.find({
    'price.totalNumeric': { $gte: min, $lte: max },
    verified: true,
    isActive: true,
    isAvailable: true
  });
};

// Instance methods
PlotSchema.methods.getPriceSummary = function() {
  return {
    total: this.price.total,
    perSqft: this.price.perSqft,
    perSqm: Math.round(this.price.perSqft * 10.764),
    currency: this.price.currency
  };
};

PlotSchema.methods.getSizeSummary = function() {
  return {
    sqft: this.size.sqft.toLocaleString(),
    sqm: this.size.sqm.toLocaleString(),
    acres: this.size.acres.toFixed(2)
  };
};

// Pre-save middleware to generate slug if not provided
PlotSchema.pre('save', function(next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  next();
});

// Pre-save validation for subtype logic
PlotSchema.pre('save', function(next) {
  if (this.type === 'building' && !this.subtype) {
    next(new Error('Subtype is required for building type plots'));
  } else if (this.type !== 'building' && this.subtype) {
    this.subtype = undefined; // Clear subtype for non-building types
  }
  next();
});

const Plot = models.Plot || model<IPlot>("Plot", PlotSchema);
export default Plot;