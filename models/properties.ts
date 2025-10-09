import mongoose, { Schema, Document, model, models } from "mongoose";

// ============ INTERFACES ============

interface IProjectLink {
  projectName: string;
  projectSlug: string;
}

interface IDeveloperLink {
  developerName: string;
  developerSlug: string;
}

interface ICommunityLink {
  communityName: string;
  communitySlug: string;
}

interface IAgentLink {
  agentId: string;
  agentName: string;
  phoneNumber: string;
  email?: string;
}

interface ICoordinates {
  latitude: number;
  longitude: number;
}

interface ILocationDetails {
  address: string;
  area: string;
  city: string;
  country: string;
  coordinates: ICoordinates;
}

interface IAmenityCategory {
  category: string;
  items: string[];
}

interface IPaymentMilestone {
  milestone: string;
  percentage: string;
}

interface IPaymentPlan {
  booking: string;
  construction: IPaymentMilestone[];
  handover: string;
}

interface IFlags {
  elite: boolean;
  exclusive: boolean;
  featured: boolean;
  highValue: boolean;
}

interface IAuditInfo {
  email: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

interface IProperty extends Document {
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
  builtUpArea: string; // e.g., "1200 sq ft"
  carpetArea?: string; // Optional - e.g., "1000 sq ft"
  furnishingStatus: 'Unfurnished' | 'Semi-Furnished' | 'Fully Furnished';
  facingDirection: 'North' | 'South' | 'East' | 'West' | 'North-East' | 'North-West' | 'South-East' | 'South-West';
  floorLevel: number; // Which floor (e.g., 5 for 5th floor)
  
  // Ownership & Availability
  ownershipType: 'Primary' | 'Secondary'; // Primary = from developer, Secondary = from owner
  propertyStatus: 'Ready' | 'Offplan'; // Property construction status
  availabilityStatus: 'Ready' | 'Offplan'; // Property availability status
  
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

// ============ SCHEMAS ============

const AuditInfoSchema = new Schema<IAuditInfo>({
  email: { type: String, required: true, lowercase: true, trim: true },
  timestamp: { type: Date, required: true, default: Date.now },
  ipAddress: { type: String, trim: true },
  userAgent: { type: String, trim: true }
}, { _id: false });

const ProjectLinkSchema = new Schema<IProjectLink>({
  projectName: { type: String, required: true, trim: true },
  projectSlug: { type: String, required: true, trim: true, lowercase: true }
}, { _id: false });

const DeveloperLinkSchema = new Schema<IDeveloperLink>({
  developerName: { type: String, required: true, trim: true },
  developerSlug: { type: String, required: true, trim: true, lowercase: true }
}, { _id: false });

const CommunityLinkSchema = new Schema<ICommunityLink>({
  communityName: { type: String, required: true, trim: true },
  communitySlug: { type: String, required: true, trim: true, lowercase: true }
}, { _id: false });

const AgentLinkSchema = new Schema<IAgentLink>({
  agentId: { type: String, required: true, trim: true },
  agentName: { type: String, required: true, trim: true },
  phoneNumber: { 
    type: String, 
    required: true, 
    trim: true,
    validate: {
      validator: function(v: string) {
        // Allow international phone numbers with optional + and spaces/dashes
        return /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/i.test(v);
      },
      message: 'Please provide a valid phone number'
    }
  },
  email: { 
    type: String, 
    trim: true, 
    lowercase: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Optional field
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please provide a valid email address'
    }
  }
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
  }
}, { _id: false });

const LocationDetailsSchema = new Schema<ILocationDetails>({
  address: { type: String, required: true, trim: true },
  area: { type: String, required: true, trim: true, index: true },
  city: { type: String, required: true, trim: true, index: true },
  country: { type: String, required: true, trim: true, default: 'UAE' },
  coordinates: { type: CoordinatesSchema, required: true }
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
  }
}, { _id: false });

const PaymentMilestoneSchema = new Schema<IPaymentMilestone>({
  milestone: { type: String, required: true, trim: true },
  percentage: { type: String, required: true, trim: true }
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
  handover: { type: String, required: true, trim: true }
}, { _id: false });

const FlagsSchema = new Schema<IFlags>({
  elite: { type: Boolean, default: false },
  exclusive: { type: Boolean, default: false },
  featured: { type: Boolean, default: false },
  highValue: { type: Boolean, default: false }
}, { _id: false });

// ============ MAIN PROPERTY SCHEMA ============

const PropertySchema = new Schema<IProperty>(
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
    
    // Optional linking
    project: { 
      type: ProjectLinkSchema, 
      required: false,
      default: undefined
    },
    developer: { 
      type: DeveloperLinkSchema, 
      required: false,
      default: undefined
    },
    community: { 
      type: CommunityLinkSchema, 
      required: false,
      default: undefined
    },
    agent: { 
      type: AgentLinkSchema, 
      required: false,
      default: undefined
    },
    
    // Property specifications
    propertyType: { 
      type: String, 
      required: true,
      enum: ['Apartment', 'Villa', 'Penthouse', 'Condo', 'Townhouse', 'Studio', 'Duplex', 'Loft'],
      index: true
    },
    bedrooms: { 
      type: Number, 
      required: true,
      min: 0,
      max: 20,
      index: true
    },
    bathrooms: { 
      type: Number, 
      required: true,
      min: 0,
      max: 20
    },
    builtUpArea: { 
      type: String, 
      required: true,
      trim: true
    },
    carpetArea: { 
      type: String, 
      trim: true
    },
    furnishingStatus: { 
      type: String, 
      required: true,
      enum: ['Unfurnished', 'Semi-Furnished', 'Fully Furnished'],
      index: true
    },
    facingDirection: { 
      type: String, 
      required: true,
      enum: ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'],
      index: true
    },
    floorLevel: { 
      type: Number, 
      required: true,
      min: -5, // Allow basement floors
      max: 200
    },
    
    // Ownership & Availability
    ownershipType: { 
      type: String, 
      required: true,
      enum: ['Primary', 'Secondary'],
      index: true
    },
    propertyStatus: {
      type: String,
      required: true,
      enum: ['Ready', 'Offplan'],
      default: 'Ready',
      index: true
    },
    availabilityStatus: { 
      type: String, 
      required: true,
      enum: ['Ready', 'Offplan'],
      default: 'Ready',
      index: true
    },
    
    // Location (MANDATORY)
    location: { 
      type: LocationDetailsSchema, 
      required: true 
    },
    
    // Pricing
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
    pricePerSqFt: { 
      type: Number,
      min: 0
    },
    
    // Description
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
    
    // Media
    coverImage: { 
      type: String, 
      required: true,
      validate: {
        validator: function(v: string) {
          return /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(v);
        },
        message: 'Cover image must be a valid URL ending with an image extension'
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
    
    // Amenities & Payment Plan
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
    paymentPlan: { 
      type: PaymentPlanSchema,
      required: false
    },
    
    // Flags
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
    
    // Metadata
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
    versionKey: false,
    suppressReservedKeysWarning: true
  }
);

// ============ INDEXES ============

// Compound indexes for common queries
PropertySchema.index({ propertyType: 1, availabilityStatus: 1 });
PropertySchema.index({ bedrooms: 1, bathrooms: 1 });
PropertySchema.index({ priceNumeric: 1, ownershipType: 1 });
PropertySchema.index({ 'location.city': 1, 'location.area': 1 });
PropertySchema.index({ ownershipType: 1, availabilityStatus: 1 });
PropertySchema.index({ 'project.projectSlug': 1 });
PropertySchema.index({ 'developer.developerSlug': 1 });
PropertySchema.index({ 'community.communitySlug': 1 });
PropertySchema.index({ 'agent.agentId': 1 });
PropertySchema.index({ featured: 1, isActive: 1 });
PropertySchema.index({ 'createdBy.email': 1 });
PropertySchema.index({ 'updatedBy.email': 1 });

// Geospatial index for location-based queries
PropertySchema.index({ 'location.coordinates': '2dsphere' });

// ============ MIDDLEWARE ============

// Pre-save middleware to update version
PropertySchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
  next();
});

// ============ STATIC METHODS ============

PropertySchema.statics.findBySlug = function(slug: string) {
  return this.findOne({ slug, isActive: true });
};

PropertySchema.statics.findByProject = function(projectSlug: string) {
  return this.find({ 
    'project.projectSlug': projectSlug, 
    isActive: true 
  }).sort({ createdAt: -1 });
};

PropertySchema.statics.findByDeveloper = function(developerSlug: string) {
  return this.find({ 
    'developer.developerSlug': developerSlug, 
    isActive: true 
  }).sort({ createdAt: -1 });
};

PropertySchema.statics.findByCommunity = function(communitySlug: string) {
  return this.find({ 
    'community.communitySlug': communitySlug, 
    isActive: true 
  }).sort({ createdAt: -1 });
};

PropertySchema.statics.findByAgent = function(agentId: string) {
  return this.find({ 
    'agent.agentId': agentId, 
    isActive: true 
  }).sort({ createdAt: -1 });
};

PropertySchema.statics.findFeatured = function() {
  return this.find({ 
    'flags.featured': true, 
    isActive: true,
    availabilityStatus: 'Available'
  }).sort({ createdAt: -1 });
};

PropertySchema.statics.findByOwnership = function(ownershipType: 'Primary' | 'Secondary') {
  return this.find({ 
    ownershipType, 
    isActive: true,
    availabilityStatus: 'Available'
  }).sort({ createdAt: -1 });
};

PropertySchema.statics.findAvailable = function() {
  return this.find({ 
    availabilityStatus: 'Available',
    isActive: true
  }).sort({ createdAt: -1 });
};

// ============ INSTANCE METHODS ============

PropertySchema.methods.softDelete = function() {
  this.isActive = false;
  return this.save();
};

PropertySchema.methods.markAsReserved = function() {
  this.availabilityStatus = 'Reserved';
  return this.save();
};

PropertySchema.methods.markAsSold = function() {
  this.availabilityStatus = 'Sold';
  return this.save();
};

PropertySchema.methods.markAsAvailable = function() {
  this.availabilityStatus = 'Available';
  return this.save();
};

// ============ MODEL EXPORT ============

const Property = models.Property || model<IProperty>("Property", PropertySchema);

export default Property;
export type { 
  IProperty, 
  IAuditInfo, 
  IProjectLink, 
  IDeveloperLink,
  ICommunityLink,
  IAgentLink,
  ILocationDetails,
  ICoordinates,
  IAmenityCategory,
  IPaymentPlan,
  IFlags
};