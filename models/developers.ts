import mongoose, { Schema, Document, model, models } from "mongoose"

interface IDeveloper extends Document {
  name: string
  slug: string
  logo: string
  coverImage: string
  description: string
  location: string
  establishedYear: number
  totalProjects: number
  activeProjects: number
  completedProjects: number
  website: string
  email: string
  phone: string
  specialization: string[]
  rating: number
  verified: boolean
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
        validator: function(v: string) {
          return /^https?:\/\/.+/.test(v) || v === ''
        },
        message: 'Logo must be a valid URL'
      }
    },
    coverImage: { 
      type: String, 
      required: [true, 'Cover image is required'],
      validate: {
        validator: function(v: string) {
          return /^https?:\/\/.+/.test(v) || v === ''
        },
        message: 'Cover image must be a valid URL'
      }
    },
    description: { 
      type: String, 
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
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
    totalProjects: { 
      type: Number, 
      required: [true, 'Total projects is required'],
      min: [0, 'Total projects cannot be negative']
    },
    activeProjects: { 
      type: Number, 
      required: [true, 'Active projects is required'],
      min: [0, 'Active projects cannot be negative']
    },
    completedProjects: { 
      type: Number, 
      required: [true, 'Completed projects is required'],
      min: [0, 'Completed projects cannot be negative']
    },
    website: { 
      type: String, 
      required: false,
      trim: true,
    //   validate: {
    //     validator: function(v: string) {
    //       return !v || /^https?:\/\/.+/.test(v)
    //     },
    //     message: 'Website must be a valid URL'
    //   }
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
        validator: function(v: string[]) {
          return v && v.length > 0
        },
        message: 'At least one specialization must be selected'
      }
    },
    rating: { 
      type: Number, 
      required: [true, 'Rating is required'],
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5']
    },
    verified: { 
      type: Boolean, 
      required: [true, 'Verified status is required'],
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

// Indexes for better query performance
DeveloperSchema.index({ slug: 1 })
DeveloperSchema.index({ name: 1 })
DeveloperSchema.index({ location: 1 })
DeveloperSchema.index({ verified: 1 })
DeveloperSchema.index({ rating: -1 })
DeveloperSchema.index({ createdAt: -1 })

// Virtual for calculating project completion percentage
DeveloperSchema.virtual('completionRate').get(function() {
  if (this.totalProjects === 0) return 0
  return Math.round((this.completedProjects / this.totalProjects) * 100)
})

// Pre-save middleware to ensure data consistency
DeveloperSchema.pre('save', function(next) {
  // Ensure total projects is at least the sum of active and completed
  const minTotal = this.activeProjects + this.completedProjects
  if (this.totalProjects < minTotal) {
    this.totalProjects = minTotal
  }
  
  next()
})

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
    rating: this.rating,
    totalProjects: this.totalProjects,
    verified: this.verified,
    specialization: this.specialization
  }
}

const Developer = models.Developer || model<IDeveloper>("Developer", DeveloperSchema)
export default Developer