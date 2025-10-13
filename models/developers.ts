import mongoose, { Schema, Document, model, models } from "mongoose"

// Import shared audit schema from project model for consistency
interface IAuditInfo {
  email: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

interface IDescriptionSection {
  title?: string
  description: string
}

interface IAward {
  name: string
  year: number
}

interface IDeveloper extends Document {
  name: string
  slug: string
  logo: string
  coverImage: string
  description: IDescriptionSection[]
  overview: string
  location: string
  establishedYear: number
  website: string
  email: string
  phone: string
  specialization: string[]
  awards: IAward[]
  verified: boolean
  createdBy: IAuditInfo
  updatedBy: IAuditInfo
  version: number
  createdAt: Date
  updatedAt: Date
}

const DeveloperSchema = new Schema<IDeveloper>(
  {
    name: { 
      type: String, 
      required: [true, 'Developer name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    slug: { 
      type: String, 
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
    },
    logo: { 
      type: String, 
      required: [true, 'Logo is required'],
      validate: {
        validator: (v: string) => /^https?:\/\/.+/.test(v) || v === '',
        message: 'Logo must be a valid URL'
      }
    },
    coverImage: { 
      type: String, 
      required: [true, 'Cover image is required'],
      validate: {
        validator: (v: string) => /^https?:\/\/.+/.test(v) || v === '',
        message: 'Cover image must be a valid URL'
      }
    },
    description: [{
      title: { 
        type: String, 
        trim: true,
        maxlength: [100, 'Section title cannot exceed 100 characters']
      },
      description: { 
        type: String, 
        required: [true, 'Description is required'],
        trim: true,
        maxlength: [500, 'Section description cannot exceed 500 characters']
      },
      _id: false
    }],
    overview: { 
      type: String, 
      required: [true, 'Overview is required'],
      trim: true,
      validate: {
        validator: (v: string) => v.trim().split(/\s+/).length <= 20,
        message: 'Overview cannot exceed 20 words'
      }
    },
    location: { 
      type: String, 
      required: [true, 'Location is required'],
      trim: true,
      maxlength: [100, 'Location cannot exceed 100 characters']
    },
    establishedYear: { 
      type: Number, 
      required: [true, 'Established year is required'],
      min: [1800, 'Established year cannot be before 1800'],
      max: [new Date().getFullYear(), 'Established year cannot be in the future']
    },
    website: { 
      type: String, 
      trim: true
    },
    email: { 
      type: String, 
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    phone: { 
      type: String, 
      required: [true, 'Phone is required'],
      trim: true
    },
    specialization: { 
      type: [String], 
      required: [true, 'At least one specialization is required'],
      validate: {
        validator: (v: string[]) => v?.length > 0,
        message: 'At least one specialization must be selected'
      }
    },
    awards: {
      type: [{
        name: { 
          type: String, 
          required: [true, 'Award name is required'],
          trim: true,
          maxlength: [200, 'Award name cannot exceed 200 characters']
        },
        year: { 
          type: Number, 
          required: [true, 'Award year is required'],
          min: [1900, 'Award year cannot be before 1900'],
          max: [new Date().getFullYear(), 'Award year cannot be in the future']
        },
        _id: false
      }],
      default: []
    },
    verified: { 
      type: Boolean, 
      default: false
    },
    // Audit fields using consistent schema
    createdBy: {
      email: { type: String, required: true, lowercase: true, trim: true },
      timestamp: { type: Date, required: true, default: Date.now },
      ipAddress: { type: String, trim: true },
      userAgent: { type: String, trim: true }
    },
    updatedBy: {
      email: { type: String, required: true, lowercase: true, trim: true },
      timestamp: { type: Date, required: true, default: Date.now },
      ipAddress: { type: String, trim: true },
      userAgent: { type: String, trim: true }
    },
    version: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

// Optimized compound indexes for common queries
DeveloperSchema.index({ verified: 1, location: 1 })
DeveloperSchema.index({ verified: 1, specialization: 1 })
DeveloperSchema.index({ slug: 1 }, { unique: true })
DeveloperSchema.index({ createdAt: -1 })

// Audit field indexes
DeveloperSchema.index({ 'createdBy.email': 1 })
DeveloperSchema.index({ 'updatedBy.email': 1 })

// Pre-save middleware for version control
DeveloperSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.version = (this.version || 1) + 1;
  }
  next();
});

// Static method to find developers by specialization
DeveloperSchema.statics.findBySpecialization = function(specialization: string) {
  return this.find({ specialization: { $in: [specialization] } })
}

// Static method to find verified developers
DeveloperSchema.statics.findVerified = function() {
  return this.find({ verified: true })
}

// Instance method to get developer summary
DeveloperSchema.methods.getSummary = function() {
  return {
    name: this.name,
    location: this.location,
    totalAwards: this.awards.length,
    verified: this.verified,
    specialization: this.specialization,
    overview: this.overview
  }
}

const Developer = models.Developer || model<IDeveloper>("Developer", DeveloperSchema)
export default Developer