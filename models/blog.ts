import mongoose, { Schema, Document, model, models } from "mongoose";

// ----------------------
// Content Block Interfaces
// ----------------------

// Base text formatting interface
interface ITextFormatting {
  bold: boolean;
  italic: boolean;
  color: string;
}

// Text segment for rich content
interface ITextSegment extends ITextFormatting {
  type: "text";
  content: string;
}

// Link segment for inline links
interface ILinkSegment extends ITextFormatting {
  type: "link";
  content: string;
  url: string;
}

// Union type for content segments
type IContentSegment = ITextSegment | ILinkSegment;

// List item interface
interface IListItem {
  text: string;
  subItems?: string[];
}

// Content block interfaces
interface IParagraphBlock {
  type: "paragraph";
  order: number;
  content: IContentSegment[];
}

interface IHeadingBlock extends ITextFormatting {
  type: "heading";
  order: number;
  level: 1 | 2 | 3 | 4 | 5 | 6; // H1-H6
  content: string;
}

interface IImageBlock {
  type: "image";
  order: number;
  url: string;
  alt: string;
  caption?: string;
}

interface ILinkBlock extends ITextFormatting {
  type: "link";
  order: number;
  url: string;
  coverText: string;
}

interface IQuoteBlock {
  type: "quote";
  order: number;
  content: IContentSegment[];
  author?: string;
  source?: string;
}

interface IListBlock extends ITextFormatting {
  type: "list";
  order: number;
  listType: "ordered" | "unordered";
  title: string;
  items: IListItem[];
}

// Union type for all content blocks
type IContentBlock = IParagraphBlock | IHeadingBlock | IImageBlock | ILinkBlock | IQuoteBlock | IListBlock;

// ----------------------
// Main Blog Interface
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
  
  // Dynamic content blocks (replacing simple content string)
  contentBlocks: (IParagraphBlock | IHeadingBlock | IImageBlock | ILinkBlock | IQuoteBlock | IListBlock)[];
  
  featuredImage?: string; // Single optional featured image
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
  validateContentStructure(): boolean;
}

// ----------------------
// Content Segment Discriminator Schema
// ----------------------
const ContentSegmentSchema = new Schema({
  type: { type: String, required: true },
  content: { type: String, required: true, trim: true, maxlength: 500 }
}, { 
  discriminatorKey: 'type',
  _id: false 
});

// Add discriminators for text and link segments
const TextSegmentDiscriminator = ContentSegmentSchema.discriminator('text', new Schema({
  bold: { type: Boolean, required: true, default: false },
  italic: { type: Boolean, required: true, default: false },
  color: { type: String, required: true, default: "#000000", trim: true }
}, { _id: false }));

const LinkSegmentDiscriminator = ContentSegmentSchema.discriminator('link', new Schema({
  url: { 
    type: String, 
    required: true, 
    trim: true,
    validate: {
      validator: (v: string) => /^(\/[a-zA-Z0-9\-\/]+|https?:\/\/.+)$/.test(v),
      message: "Invalid URL format"
    }
  },
  bold: { type: Boolean, required: true, default: false },
  italic: { type: Boolean, required: true, default: false },
  color: { type: String, required: true, default: "#0aa83f", trim: true }
}, { _id: false }));

// ----------------------
// Subschemas (Updated)
// ----------------------

// Text formatting schema
const TextFormattingSchema = new Schema({
  bold: { type: Boolean, default: false },
  italic: { type: Boolean, default: false },
  color: { type: String, default: "#000000", trim: true }
}, { _id: false });

// Content segment schemas (removed - now using discriminators above)

// List item schema
const ListItemSchema = new Schema({
  text: { type: String, required: true, trim: true, maxlength: 300 },
  subItems: [{ type: String, trim: true, maxlength: 300 }]
}, { _id: false });

// Content block schemas
const ParagraphBlockSchema = new Schema({
  type: { type: String, enum: ["paragraph"], required: true },
  order: { type: Number, required: true, min: 1 },
  content: {
    type: [ContentSegmentSchema],
    required: true,
    validate: {
      validator: function(v: any[]) {
        return v && v.length > 0 && v.length <= 50; // Max 50 segments per paragraph
      },
      message: "Paragraph must have at least 1 and at most 50 content segments"
    }
  }
}, { _id: false });

const HeadingBlockSchema = new Schema({
  type: { type: String, enum: ["heading"], required: true },
  order: { type: Number, required: true, min: 1 },
  level: { type: Number, enum: [1, 2, 3, 4, 5, 6], required: true },
  content: { 
    type: String, 
    required: true, 
    trim: true, 
    maxlength: 200,
    validate: {
      validator: (v: string) => v.length > 0,
      message: "Heading content cannot be empty"
    }
  },
  bold: { type: Boolean, required: true, default: false },
  italic: { type: Boolean, required: true, default: false },
  color: { type: String, required: true, default: "#000000", trim: true }
}, { _id: false });

const ImageBlockSchema = new Schema({
  type: { type: String, enum: ["image"], required: true },
  order: { type: Number, required: true, min: 1 },
  url: { 
    type: String, 
    required: true, 
    trim: true,
    validate: {
      validator: (v: string) => /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v),
      message: "Invalid image URL format"
    }
  },
  alt: { type: String, required: true, trim: true, maxlength: 200 },
  caption: { type: String, trim: true, maxlength: 300 }
}, { _id: false });

const LinkBlockSchema = new Schema({
  type: { type: String, enum: ["link"], required: true },
  order: { type: Number, required: true, min: 1 },
  url: { 
    type: String, 
    required: true, 
    trim: true,
    validate: {
      validator: (v: string) => /^(\/[a-zA-Z0-9\-\/]+|https?:\/\/.+)$/.test(v),
      message: "Invalid URL format"
    }
  },
  coverText: { type: String, required: true, trim: true, maxlength: 200 },
  bold: { type: Boolean, required: true, default: false },
  italic: { type: Boolean, required: true, default: false },
  color: { type: String, required: true, default: "#0aa83f", trim: true }
}, { _id: false });

const QuoteBlockSchema = new Schema({
  type: { type: String, enum: ["quote"], required: true },
  order: { type: Number, required: true, min: 1 },
  content: {
    type: [ContentSegmentSchema],
    required: true,
    validate: {
      validator: function(v: any[]) {
        return v && v.length > 0 && v.length <= 30; // Max 30 segments per quote
      },
      message: "Quote must have at least 1 and at most 30 content segments"
    }
  },
  author: { type: String, trim: true, maxlength: 100 },
  source: { type: String, trim: true, maxlength: 200 }
}, { _id: false });

const ListBlockSchema = new Schema({
  type: { type: String, enum: ["list"], required: true },
  order: { type: Number, required: true, min: 1 },
  listType: { type: String, enum: ["ordered", "unordered"], required: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  items: {
    type: [ListItemSchema],
    required: true,
    validate: {
      validator: function(v: any[]) {
        return v && v.length > 0 && v.length <= 20; // Max 20 items per list
      },
      message: "List must have at least 1 and at most 20 items"
    }
  },
  bold: { type: Boolean, required: true, default: false },
  italic: { type: Boolean, required: true, default: false },
  color: { type: String, required: true, default: "#000000", trim: true }
}, { _id: false });

// Audit info schema
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
// Content Block Discriminator Schema
// ----------------------
const ContentBlockSchema = new Schema({
  type: { type: String, required: true },
  order: { type: Number, required: true, min: 1 }
}, { 
  discriminatorKey: 'type',
  _id: false 
});

// Add discriminators for each block type
ContentBlockSchema.discriminator('paragraph', ParagraphBlockSchema);
ContentBlockSchema.discriminator('heading', HeadingBlockSchema);
ContentBlockSchema.discriminator('image', ImageBlockSchema);
ContentBlockSchema.discriminator('link', LinkBlockSchema);
ContentBlockSchema.discriminator('quote', QuoteBlockSchema);
ContentBlockSchema.discriminator('list', ListBlockSchema);

// ----------------------
// Main Blog Schema
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
    
    // Dynamic content blocks with proper schema validation
    contentBlocks: {
      type: [ContentBlockSchema],
      required: true,
      validate: {
        validator: function(blocks: any[]) {
          if (!blocks || blocks.length === 0 || blocks.length > 15) {
            return false;
          }
          
          // Check if at least one paragraph block exists
          const hasParagraph = blocks.some(block => block.type === "paragraph");
          if (!hasParagraph) {
            return false;
          }
          
          // Check for unique order values
          const orders = blocks.map(block => block.order);
          const uniqueOrders = new Set(orders);
          if (orders.length !== uniqueOrders.size) {
            return false;
          }
          
          // SEO: Enforce at most one H1 heading per blog
          const h1Count = blocks.filter(block => 
            block.type === "heading" && block.level === 1
          ).length;
          if (h1Count > 1) {
            return false;
          }
          
          return true;
        },
        message: "Content must have 1-15 blocks, at least one paragraph, unique order values, and at most one H1 heading"
      }
    },
    
    featuredImage: { type: String, trim: true }, // Single featured image
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
// Middleware (Updated)
// ----------------------
BlogSchema.pre("save", function (next) {
  // Only bump version on meaningful content changes, not view increments
  if (!this.isNew && (
    this.isModified("contentBlocks") || 
    this.isModified("title") || 
    this.isModified("excerpt") ||
    this.isModified("status") ||
    this.isModified("category") ||
    this.isModified("tags")
  )) {
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

BlogSchema.methods.validateContentStructure = function (): boolean {
  try {
    // Additional custom validation logic can be added here
    // This method can be used for complex content validation
    return this.contentBlocks && this.contentBlocks.length > 0;
  } catch (error) {
    return false;
  }
};

// ----------------------
// Static Methods
// ----------------------
BlogSchema.statics.findByContentType = function(contentType: string) {
  return this.find({
    "contentBlocks.type": contentType,
    isActive: true
  });
};

// ----------------------
// Indexes
// ----------------------
BlogSchema.index({ category: 1, status: 1 });
BlogSchema.index({ author: 1 });
BlogSchema.index({ featured: 1, isActive: 1 });
BlogSchema.index({ "contentBlocks.type": 1 });

// ----------------------
// Model Export
// ----------------------
const Blog = models.Blog || model<IBlog>("Blog", BlogSchema);

export default Blog;
export type { 
  IBlog, 
  IAuditInfo, 
  IContentBlock,
  IParagraphBlock,
  IHeadingBlock,
  IImageBlock,
  ILinkBlock,
  IQuoteBlock,
  IListBlock,
  ITextSegment,
  ILinkSegment,
  IListItem,
  ITextFormatting
};