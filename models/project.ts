import mongoose, { Schema, Document, model, models } from "mongoose";

interface IPaymentMilestone {
  milestone: string;
  percentage: string;
}

interface IPaymentPlan {
  booking: string;
  construction: IPaymentMilestone[];
  handover: string;
}

interface INearbyPlace {
  name: string;
  distance: string;
}

interface ICoordinates {
  latitude: number;
  longitude: number;
}

interface ILocationDetails {
  description: string;
  nearby: INearbyPlace[];
  coordinates: ICoordinates;
}

interface IAmenityCategory {
  category: string;
  items: string[];
}

interface IUnitType {
  type: string;
  size: string;
  price: string;
}

interface IFlags {
  elite: boolean;
  exclusive: boolean;
  featured: boolean;
  highValue: boolean;
}

// Audit tracking interface
interface IAuditInfo {
  email: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

interface IProject extends Document {
  id: string;
  slug: string;
  name: string;
  location: string;
  locationSlug: string;
  type: string;
  status: string;
  statusSlug: string;
  developer: string;
  developerSlug: string;
  price: string;
  priceNumeric: number;
  image: string; // cover image url
  description: string;
  overview: string;
  completionDate: Date;
  totalUnits: number;
  amenities: IAmenityCategory[];
  unitTypes: IUnitType[];
  gallery: string[]; // array of image URLs
  paymentPlan: IPaymentPlan;
  locationDetails: ILocationDetails;
  categories: string[];
  featured: boolean;
  launchDate: Date;
  registrationOpen: boolean;
  flags: IFlags;
  
  // Audit fields
  createdBy: IAuditInfo;
  updatedBy: IAuditInfo;
  version: number; // For optimistic locking
  
  // Additional metadata
  isActive: boolean;
  tags: string[]; // For better categorization
}

const AuditInfoSchema = new Schema<IAuditInfo>({
  email: { type: String, required: true, lowercase: true, trim: true },
  timestamp: { type: Date, required: true, default: Date.now },
  ipAddress: { type: String, trim: true },
  userAgent: { type: String, trim: true }
}, { _id: false }); // Disable _id for subdocuments

const PaymentMilestoneSchema = new Schema<IPaymentMilestone>({
  milestone: { type: String, required: true, trim: true },
  percentage: { type: String, required: true, trim: true },
}, { _id: false });

const PaymentPlanSchema = new Schema<IPaymentPlan>({
  booking: { type: String, required: true, trim: true },
  construction: { 
    type: [PaymentMilestoneSchema], 
    required: true,
    validate: {
      validator: function(v: IPaymentMilestone[]) {
        return v && v.length > 0;
      },
      message: 'At least one construction milestone is required'
    }
  },
  handover: { type: String, required: true, trim: true },
}, { _id: false });

const NearbyPlaceSchema = new Schema<INearbyPlace>({
  name: { type: String, required: true, trim: true },
  distance: { type: String, required: true, trim: true },
}, { _id: false });

const CoordinatesSchema = new Schema<ICoordinates>({
  latitude: { 
    type: Number, 
    required: true,
    min: -90,
    max: 90
  },
  longitude: { 
    type: Number, 
    required: true,
    min: -180,
    max: 180
  },
}, { _id: false });

const LocationDetailsSchema = new Schema<ILocationDetails>({
  description: { type: String, required: true, trim: true },
  nearby: { 
    type: [NearbyPlaceSchema], 
    required: true,
    validate: {
      validator: function(v: INearbyPlace[]) {
        return v && v.length > 0;
      },
      message: 'At least one nearby place is required'
    }
  },
  coordinates: { type: CoordinatesSchema, required: true },
}, { _id: false });

const AmenityCategorySchema = new Schema<IAmenityCategory>({
  category: { type: String, required: true, trim: true },
  items: { 
    type: [String], 
    required: true,
    validate: {
      validator: function(v: string[]) {
        return v && v.length > 0 && v.every(item => item.trim().length > 0);
      },
      message: 'Each amenity category must have at least one valid item'
    }
  },
}, { _id: false });

const UnitTypeSchema = new Schema<IUnitType>({
  type: { type: String, required: true, trim: true },
  size: { type: String, required: true, trim: true },
  price: { type: String, required: true, trim: true },
}, { _id: false });

const FlagsSchema = new Schema<IFlags>({
  elite: { type: Boolean, default: false },
  exclusive: { type: Boolean, default: false },
  featured: { type: Boolean, default: false },
  highValue: { type: Boolean, default: false },
}, { _id: false });

const ProjectSchema = new Schema<IProject>(
  {
    id: { 
      type: String, 
      required: true, 
      unique: true,
      trim: true,
      index: true
    },
    slug: { 
      type: String, 
      required: true, 
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      validate: {
        validator: function(v: string) {
          return /^[a-z0-9-]+$/.test(v);
        },
        message: 'Slug can only contain lowercase letters, numbers, and hyphens'
      }
    },
    name: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 200,
      index: 'text'
    },
    location: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 100,
      index: true
    },
    locationSlug: { 
      type: String, 
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },
    type: { 
      type: String, 
      required: true,
      trim: true,
      enum: ['Residential', 'Commercial', 'Mixed Use', 'Industrial', 'Hospitality', 'Retail'],
      index: true
    },
    status: { 
      type: String, 
      required: true,
      trim: true,
      enum: ['Pre-Launch', 'Launched', 'Under Construction', 'Ready to Move', 'Completed', 'Sold Out'],
      index: true
    },
    statusSlug: { 
      type: String, 
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },
    developer: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 150,
      index: true
    },
    developerSlug: { 
      type: String, 
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },
    price: { 
      type: String, 
      required: true,
      trim: true
    },
    priceNumeric: { 
      type: Number, 
      required: true,
      min: 0,
      index: true
    },
    image: { 
      type: String, 
      required: true,
      validate: {
        validator: function(v: string) {
          return /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(v);
        },
        message: 'Image must be a valid URL ending with an image extension'
      }
    },
    description: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 2000
    },
    overview: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 5000
    },
    completionDate: { 
      type: Date, 
      required: true,
      validate: {
        validator: function(v: Date) {
          return v > new Date('2020-01-01'); // Reasonable validation
        },
        message: 'Completion date must be after 2020'
      },
      index: true
    },
    totalUnits: { 
      type: Number, 
      required: true,
      min: 1,
      max: 10000,
      index: true
    },
    amenities: { 
      type: [AmenityCategorySchema], 
      required: true,
      validate: {
        validator: function(v: IAmenityCategory[]) {
          return v && v.length > 0;
        },
        message: 'At least one amenity category is required'
      }
    },
    unitTypes: { 
      type: [UnitTypeSchema], 
      required: true,
      validate: {
        validator: function(v: IUnitType[]) {
          return v && v.length > 0;
        },
        message: 'At least one unit type is required'
      }
    },
    gallery: { 
      type: [String], 
      required: true,
      validate: {
        validator: function(v: string[]) {
          return v && v.length > 0 && v.every(url => 
            /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(url)
          );
        },
        message: 'Gallery must contain at least one valid image URL'
      }
    },
    paymentPlan: { 
      type: PaymentPlanSchema, 
      required: true 
    },
    locationDetails: { 
      type: LocationDetailsSchema, 
      required: true 
    },
    categories: { 
      type: [String], 
      required: true,
      validate: {
        validator: function(v: string[]) {
          return v && v.every(cat => cat.trim().length > 0);
        },
        message: 'All categories must be non-empty strings'
      },
      index: true
    },
    featured: { 
      type: Boolean, 
      required: true,
      default: false,
      index: true
    },
    launchDate: { 
      type: Date, 
      required: true,
      index: true
    },
    registrationOpen: { 
      type: Boolean, 
      required: true,
      default: true,
      index: true
    },
    flags: { 
      type: FlagsSchema, 
      required: true,
      default: () => ({
        elite: false,
        exclusive: false,
        featured: false,
        highValue: false
      })
    },
    
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
    },
    
    // Additional metadata
    isActive: { 
      type: Boolean, 
      default: true,
      index: true
    },
    tags: { 
      type: [String], 
      default: [],
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
    // Add compound indexes for better query performance
  }
);

// Define compound indexes after schema definition
ProjectSchema.index({ developer: 1, status: 1 });
ProjectSchema.index({ location: 1, type: 1 });
ProjectSchema.index({ priceNumeric: 1, completionDate: 1 });
ProjectSchema.index({ featured: 1, isActive: 1 });
ProjectSchema.index({ 'createdBy.email': 1 });
ProjectSchema.index({ 'updatedBy.email': 1 });

// Pre-save middleware to update version and updatedBy
ProjectSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
  next();
});

// Static methods for common queries
ProjectSchema.statics.findBySlug = function(slug: string) {
  return this.findOne({ slug, isActive: true });
};

ProjectSchema.statics.findByDeveloper = function(developerSlug: string) {
  return this.find({ developerSlug, isActive: true }).sort({ createdAt: -1 });
};

ProjectSchema.statics.findFeatured = function() {
  return this.find({ featured: true, isActive: true }).sort({ createdAt: -1 });
};

// Instance methods
ProjectSchema.methods.softDelete = function() {
  this.isActive = false;
  return this.save();
};

// Use existing model if exists (helps with hot reload in dev)
const Project = models.Project || model<IProject>("Project", ProjectSchema);

export default Project;
export type { IProject, IAuditInfo };