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

interface IBlog extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string[];
  author: string;
  category: string;
  tags: string[];
  status: "Published" | "Draft" | "Scheduled";
  publishDate: Date;
  readTime: number;
  views: number;
  featured: boolean;

  // Audit
  createdBy: IAuditInfo;
  updatedBy: IAuditInfo;
  version: number;

  // Metadata
  isActive: boolean;

  // Instance methods
  incrementViews(): Promise<IBlog>;
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
// Blog Schema
// ----------------------
const BlogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200, index: "text" },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      validate: {
        validator: (v: string) => /^[a-z0-9-]+$/.test(v),
        message: "Slug can only contain lowercase letters, numbers, and hyphens",
      },
    },
    excerpt: { type: String, required: true, maxlength: 500 },
    content: { type: String, required: true, maxlength: 20000 },
    featuredImage: { type: [String], default: [] },
    author: { type: String, required: true, trim: true, index: true },
    category: { type: String, required: true, trim: true, index: true },
    tags: { type: [String], default: [], index: true },
    status: { type: String, enum: ["Published", "Draft", "Scheduled"], default: "Draft", index: true },
    publishDate: { type: Date, required: true, default: Date.now, index: true },
    readTime: { type: Number, default: 5, min: 1 },
    views: { type: Number, default: 0, min: 0 },
    featured: { type: Boolean, default: false, index: true },

    // Audit
    createdBy: { type: AuditInfoSchema, required: true },
    updatedBy: { type: AuditInfoSchema, required: true },
    version: { type: Number, default: 1, min: 1 },

    // Metadata
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ----------------------
// Middleware
// ----------------------
BlogSchema.pre("save", function (next) {
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
  next();
});

// ----------------------
// Instance Methods
// ----------------------
BlogSchema.methods.incrementViews = function (): Promise<IBlog> {
  this.views += 1;
  return this.save();
};

// ----------------------
// Indexes
// ----------------------
BlogSchema.index({ category: 1, status: 1 });
BlogSchema.index({ author: 1 });
BlogSchema.index({ featured: 1, isActive: 1 });

// ----------------------
// Model Export
// ----------------------
const Blog = models.Blog || model<IBlog>("Blog", BlogSchema);

export default Blog;
export type { IBlog, IAuditInfo };
