import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../../lib/db";
import Project from "../../../../models/project";

interface NearbyPlace {
  name: string;
  distance: string;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface LocationDetails {
  description: string;
  nearby: NearbyPlace[];
  coordinates: Coordinates;
}

interface PaymentMilestone {
  milestone: string;
  percentage: string;
}

interface PaymentPlan {
  booking: string;
  construction: PaymentMilestone[];
  handover: string;
}

interface Flags {
  elite: boolean;
  exclusive: boolean;
  featured: boolean;
  highValue: boolean;
}

interface ProjectCreateRequest {
  name: string;
  location: string;
  type: string;
  status: string;
  developer: string;
  price: string;
  priceNumeric: number;
  coverImage: string[];
  gallery: string[];
  description: string;
  completionDate: string;
  totalUnits: number;
  registrationOpen: boolean;
  launchDate: string;
  featured: boolean;
  overview: string;
  image: string;
  flags: Flags;
  locationDetails: LocationDetails;
  paymentPlan: PaymentPlan;
}

// Deep validation helper for nested fields
function validateProjectData(data: ProjectCreateRequest): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Simple string fields
  const requiredStringFields: (keyof ProjectCreateRequest)[] = [
    "name", "location", "type", "status", "developer",
    "price", "description", "overview", "image"
  ];
  for (const field of requiredStringFields) {
    if (!data[field] || typeof data[field] !== "string" || !data[field].trim()) {
      errors.push(`${field} is required and must be a non-empty string.`);
    }
  }

  // Numeric fields
  if (typeof data.priceNumeric !== "number" || data.priceNumeric <= 0) {
    errors.push("priceNumeric must be a positive number.");
  }
  if (typeof data.totalUnits !== "number" || data.totalUnits <= 0) {
    errors.push("totalUnits must be a positive number.");
  }

  // Boolean fields
  if (typeof data.registrationOpen !== "boolean") {
    errors.push("registrationOpen must be a boolean.");
  }
  if (typeof data.featured !== "boolean") {
    errors.push("featured must be a boolean.");
  }

  // Dates
  if (!data.completionDate || isNaN(new Date(data.completionDate).getTime())) {
    errors.push("completionDate is required and must be a valid date string.");
  }
  if (!data.launchDate || isNaN(new Date(data.launchDate).getTime())) {
    errors.push("launchDate is required and must be a valid date string.");
  }

  // Arrays
  if (!Array.isArray(data.coverImage)) {
    errors.push("coverImage must be an array of strings.");
  }
  if (!Array.isArray(data.gallery)) {
    errors.push("gallery must be an array of strings.");
  }

  // Flags object
  if (!data.flags || typeof data.flags !== "object") {
    errors.push("flags must be an object.");
  } else {
    const flagKeys: (keyof Flags)[] = ["elite", "exclusive", "featured", "highValue"];
    for (const key of flagKeys) {
      if (typeof data.flags[key] !== "boolean") {
        errors.push(`flags.${key} must be a boolean.`);
      }
    }
  }

  // Validate locationDetails (nested)
  if (
    !data.locationDetails ||
    typeof data.locationDetails !== "object" ||
    !data.locationDetails.description ||
    !data.locationDetails.description.trim()
  ) {
    errors.push("locationDetails.description is required.");
  }
  if (
    !Array.isArray(data.locationDetails.nearby) ||
    data.locationDetails.nearby.length === 0
  ) {
    errors.push("locationDetails.nearby must be a non-empty array.");
  } else {
    data.locationDetails.nearby.forEach((place, idx) => {
      if (!place.name || !place.name.trim()) errors.push(`locationDetails.nearby[${idx}].name is required.`);
      if (!place.distance || !place.distance.trim()) errors.push(`locationDetails.nearby[${idx}].distance is required.`);
    });
  }
  if (
    !data.locationDetails.coordinates ||
    typeof data.locationDetails.coordinates.latitude !== "number" ||
    typeof data.locationDetails.coordinates.longitude !== "number"
  ) {
    errors.push("locationDetails.coordinates.latitude and longitude are required numbers.");
  }

  // Validate paymentPlan (nested)
  if (!data.paymentPlan || typeof data.paymentPlan !== "object") {
    errors.push("paymentPlan must be an object.");
  } else {
    if (!data.paymentPlan.booking || !data.paymentPlan.booking.trim()) {
      errors.push("paymentPlan.booking is required.");
    }
    if (!Array.isArray(data.paymentPlan.construction) || data.paymentPlan.construction.length === 0) {
      errors.push("paymentPlan.construction must be a non-empty array.");
    } else {
      data.paymentPlan.construction.forEach((milestone, idx) => {
        if (!milestone.milestone || !milestone.milestone.trim()) {
          errors.push(`paymentPlan.construction[${idx}].milestone is required.`);
        }
        if (!milestone.percentage || !milestone.percentage.trim()) {
          errors.push(`paymentPlan.construction[${idx}].percentage is required.`);
        }
      });
    }
    if (!data.paymentPlan.handover || !data.paymentPlan.handover.trim()) {
      errors.push("paymentPlan.handover is required.");
    }
  }

  return { isValid: errors.length === 0, errors };
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    let data: ProjectCreateRequest;
    try {
      data = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON in request body", error: "INVALID_JSON" },
        { status: 400 }
      );
    }

    // Validate incoming data
    const validation = validateProjectData(data);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: "Validation failed", errors: validation.errors, error: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Normalize strings (trim)
    data.name = data.name.trim();
    data.location = data.location.trim();
    data.type = data.type.trim();
    data.status = data.status.trim();
    data.developer = data.developer.trim();
    data.description = data.description.trim();
    data.overview = data.overview.trim();
    data.image = data.image.trim();
    data.price = data.price.trim();

    // Check for existing project by name (case-insensitive)
    const existing = await Project.findOne({ name: { $regex: new RegExp(`^${data.name}$`, "i") } });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "Project with this name already exists", error: "DUPLICATE_NAME" },
        { status: 409 }
      );
    }

    // Prepare final object to save
    const projectToSave = {
      ...data,
      completionDate: new Date(data.completionDate),
      launchDate: new Date(data.launchDate),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const createdProject = await Project.create(projectToSave);

    return NextResponse.json(
      {
        success: true,
        message: "Project created successfully",
        project: {
          id: createdProject._id,
          name: createdProject.name,
          location: createdProject.location,
          createdAt: createdProject.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating project:", error);

    if (error.name === "ValidationError") {
      return NextResponse.json(
        {
          success: false,
          message: "Database validation error",
          errors: Object.values(error.errors).map((err: any) => err.message),
          error: "DB_VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "Duplicate entry error",
          error: "DUPLICATE_ENTRY",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Internal server error", error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
