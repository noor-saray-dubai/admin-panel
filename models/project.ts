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
}

const PaymentMilestoneSchema = new Schema<IPaymentMilestone>({
  milestone: { type: String, required: true },
  percentage: { type: String, required: true },
});

const PaymentPlanSchema = new Schema<IPaymentPlan>({
  booking: { type: String, required: true },
  construction: { type: [PaymentMilestoneSchema], required: true },
  handover: { type: String, required: true },
});

const NearbyPlaceSchema = new Schema<INearbyPlace>({
  name: { type: String, required: true },
  distance: { type: String, required: true },
});

const CoordinatesSchema = new Schema<ICoordinates>({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
});

const LocationDetailsSchema = new Schema<ILocationDetails>({
  description: { type: String, required: true },
  nearby: { type: [NearbyPlaceSchema], required: true },
  coordinates: { type: CoordinatesSchema, required: true },
});

const AmenityCategorySchema = new Schema<IAmenityCategory>({
  category: { type: String, required: true },
  items: { type: [String], required: true },
});

const UnitTypeSchema = new Schema<IUnitType>({
  type: { type: String, required: true },
  size: { type: String, required: true },
  price: { type: String, required: true },
});

const FlagsSchema = new Schema<IFlags>({
  elite: { type: Boolean, default: false },
  exclusive: { type: Boolean, default: false },
  featured: { type: Boolean, default: false },
  highValue: { type: Boolean, default: false },
});

const ProjectSchema = new Schema<IProject>(
  {
    id: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    location: { type: String, required: true },
    locationSlug: { type: String, required: true },
    type: { type: String, required: true },
    status: { type: String, required: true },
    statusSlug: { type: String, required: true },
    developer: { type: String, required: true },
    developerSlug: { type: String, required: true },
    price: { type: String, required: true },
    priceNumeric: { type: Number, required: true },
    image: { type: String, required: true },
    description: { type: String, required: true },
    overview: { type: String, required: true },
    completionDate: { type: Date, required: true },
    totalUnits: { type: Number, required: true },
    amenities: { type: [AmenityCategorySchema], required: true },
    unitTypes: { type: [UnitTypeSchema], required: true },
    gallery: { type: [String], required: true },
    paymentPlan: { type: PaymentPlanSchema, required: true },
    locationDetails: { type: LocationDetailsSchema, required: true },
    categories: { type: [String], required: true },
    featured: { type: Boolean, required: true },
    launchDate: { type: Date, required: true },
    registrationOpen: { type: Boolean, required: true },
    flags: { type: FlagsSchema, required: true },
  },
  {
    timestamps: true,
  }
);

// Use existing model if exists (helps with hot reload in dev)
const Project = models.Project || model<IProject>("Project", ProjectSchema);

export default Project;
