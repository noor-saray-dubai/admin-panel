import mongoose, { Schema, Document, model, models } from "mongoose";

// ----------------------
// Subdocument Interfaces
// ----------------------
interface IAuditInfo {
  email: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

interface ICareer extends Document {
  slug: string;
  title: string;
  department: string;
  location: string;
  type: "Full-time" | "Part-time" | "Contract" | "Internship";
  level: "Entry" | "Mid" | "Senior" | "Executive";
  salary: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  status: "Active" | "Paused" | "Closed";
  postedDate: Date;
  applicationDeadline: Date;
  applicationsCount: number;
  featured: boolean;

  // Audit
  createdBy: IAuditInfo;
  updatedBy: IAuditInfo;
  version: number;

  // Metadata
  isActive: boolean;
  tags: string[];

  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  isOpen(): boolean;
  softDelete(): Promise<ICareer>;
}

// ----------------------
// Subschemas
// ----------------------
const AuditInfoSchema = new Schema<IAuditInfo>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    timestamp: { type: Date, required: true, default: Date.now },
    ipAddress: { type: String, trim: true },
    userAgent: { type: String, trim: true },
  },
  { _id: false }
);

// ----------------------
// Career Schema
// ----------------------
const CareerSchema = new Schema<ICareer>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      validate: {
        validator: function (v: string) {
          return /^[a-z0-9-]+$/.test(v);
        },
        message: "Slug can only contain lowercase letters, numbers, and hyphens",
      },
    },
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
      index: "text",
    },
    department: { type: String, required: true, trim: true, index: true },
    location: { type: String, required: true, trim: true, index: true },
    type: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Internship"],
      required: true,
    },
    level: {
      type: String,
      enum: ["Entry", "Mid", "Senior", "Executive"],
      required: true,
    },
    salary: { type: String, required: true, trim: true },
    description: { type: String, required: true, maxlength: 5000 },
    requirements: { type: [String], default: [] },
    responsibilities: { type: [String], default: [] },
    benefits: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["Active", "Paused", "Closed"],
      default: "Active",
      index: true,
    },
    postedDate: { type: Date, required: true, default: Date.now, index: true },
    applicationDeadline: { type: Date, required: true },
    applicationsCount: { type: Number, default: 0, min: 0 },
    featured: { type: Boolean, default: false, index: true },

    // Audit fields
    createdBy: { type: AuditInfoSchema, required: true },
    updatedBy: { type: AuditInfoSchema, required: true },
    version: { type: Number, default: 1, min: 1 },

    // Metadata
    isActive: { type: Boolean, default: true, index: true },
    tags: { type: [String], default: [], index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ----------------------
// Indexes
// ----------------------
CareerSchema.index({ department: 1, status: 1 });
CareerSchema.index({ location: 1, type: 1 });
CareerSchema.index({ featured: 1, isActive: 1 });
CareerSchema.index({ applicationDeadline: 1 });
CareerSchema.index({ "createdBy.email": 1 });
CareerSchema.index({ "updatedBy.email": 1 });

// ----------------------
// Middleware
// ----------------------
CareerSchema.pre("save", function (next) {
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
  next();
});

// ----------------------
// Instance Methods
// ----------------------
CareerSchema.methods.isOpen = function (): boolean {
  return this.status === "Active" && new Date() <= this.applicationDeadline;
};

CareerSchema.methods.softDelete = function () {
  this.isActive = false;
  return this.save();
};

// ----------------------
// Static Methods
// ----------------------
CareerSchema.statics.findBySlug = function (slug: string) {
  return this.findOne({ slug, isActive: true });
};

CareerSchema.statics.findFeatured = function () {
  return this.find({ featured: true, isActive: true });
};

CareerSchema.statics.findByDepartment = function (dept: string) {
  return this.find({ department: dept, isActive: true });
};

// ----------------------
// Model Export
// ----------------------
const Career = models.Career || model<ICareer>("Career", CareerSchema);

export default Career;
export type { ICareer, IAuditInfo };
