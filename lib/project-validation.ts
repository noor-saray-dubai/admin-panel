// lib/project-validation.ts

import type { ProjectFormData, IPrice, IPaymentPlan, INearbyPlace, IUnitType, IAmenityCategory } from "@/types/projects";

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: string[];
  fieldErrors?: Record<string, string>;
}

// URL validation regex
const URL_REGEX = /^https?:\/\/.+/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IMAGE_URL_REGEX = /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i;

// Project type and status options
const PROJECT_TYPES = ['Residential', 'Commercial', 'Mixed Use', 'Industrial', 'Hospitality', 'Retail'];
const PROJECT_STATUSES = ['Pre-Launch', 'Launched', 'Under Construction', 'Ready to Move', 'Completed', 'Sold Out'];

// Comprehensive project form validation
export function validateProjectFormData(data: ProjectFormData): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];

  // Basic Information Validation
  if (!data.name?.trim()) {
    errors.name = "Project name is required";
  } else if (data.name.trim().length > 200) {
    errors.name = "Project name cannot exceed 200 characters";
  } else if (data.name.trim().length < 3) {
    errors.name = "Project name must be at least 3 characters";
  }

  if (data.subtitle && data.subtitle.trim().length > 300) {
    errors.subtitle = "Subtitle cannot exceed 300 characters";
  }

  if (!data.location?.trim()) {
    errors.location = "Location is required";
  } else if (data.location.trim().length > 100) {
    errors.location = "Location cannot exceed 100 characters";
  }

  if (data.subLocation && data.subLocation.trim().length > 100) {
    errors.subLocation = "Sub location cannot exceed 100 characters";
  }

  if (!data.type?.trim()) {
    errors.type = "Project type is required";
  } else if (!PROJECT_TYPES.includes(data.type)) {
    errors.type = "Invalid project type";
  }

  if (!data.status?.trim()) {
    errors.status = "Project status is required";
  } else if (!PROJECT_STATUSES.includes(data.status)) {
    errors.status = "Invalid project status";
  }

  if (!data.developer?.trim()) {
    errors.developer = "Developer is required";
  } else if (data.developer.trim().length > 150) {
    errors.developer = "Developer name cannot exceed 150 characters";
  }

  // Price validation
  if (!data.price) {
    errors.price = "Price information is required";
  } else {
    if (!data.price.total?.trim()) {
      errors["price.total"] = "Price display format is required";
    }
    if (typeof data.price.totalNumeric !== 'number' || data.price.totalNumeric <= 0) {
      errors["price.totalNumeric"] = "Price numeric value must be a positive number";
    }
    if (!data.price.currency?.trim()) {
      errors["price.currency"] = "Currency is required";
    } else {
      const validCurrencies = ['AED', 'USD', 'EUR', 'GBP'];
      if (!validCurrencies.includes(data.price.currency)) {
        errors["price.currency"] = "Invalid currency";
      }
    }
  }

  // Description validation
  if (!data.description?.trim()) {
    errors.description = "Description is required";
  } else if (data.description.trim().length < 50) {
    errors.description = "Description must be at least 50 characters";
  } else if (data.description.trim().length > 2000) {
    errors.description = "Description cannot exceed 2000 characters";
  }

  if (!data.overview?.trim()) {
    errors.overview = "Overview is required";
  } else if (data.overview.trim().length < 100) {
    errors.overview = "Overview must be at least 100 characters";
  } else if (data.overview.trim().length > 5000) {
    errors.overview = "Overview cannot exceed 5000 characters";
  }

  // Date validation
  if (!data.completionDate) {
    errors.completionDate = "Completion date is required";
  } else {
    const completionDate = new Date(data.completionDate);
    const now = new Date();
    const minDate = new Date('2020-01-01');
    if (completionDate < minDate) {
      errors.completionDate = "Completion date must be after 2020";
    }
  }

  if (!data.launchDate) {
    errors.launchDate = "Launch date is required";
  }

  // Units validation
  if (!data.totalUnits || data.totalUnits < 1) {
    errors.totalUnits = "Total units must be at least 1";
  } else if (data.totalUnits > 10000) {
    errors.totalUnits = "Total units cannot exceed 10,000";
  }

  // Payment Plan validation
  if (!data.paymentPlan) {
    errors.paymentPlan = "Payment plan is required";
  } else {
    if (!data.paymentPlan.booking?.trim()) {
      errors["paymentPlan.booking"] = "Booking payment details are required";
    }
    if (!data.paymentPlan.handover?.trim()) {
      errors["paymentPlan.handover"] = "Handover payment details are required";
    }
    if (!data.paymentPlan.construction || data.paymentPlan.construction.length === 0) {
      errors["paymentPlan.construction"] = "At least one construction milestone is required";
    } else {
      data.paymentPlan.construction.forEach((milestone, index) => {
        if (!milestone.milestone?.trim()) {
          errors[`paymentPlan.construction[${index}].milestone`] = "Milestone description is required";
        }
        if (!milestone.percentage?.trim()) {
          errors[`paymentPlan.construction[${index}].percentage`] = "Milestone percentage is required";
        }
      });
    }
  }

  // Unit Types validation
  if (!data.unitTypes || data.unitTypes.length === 0) {
    errors.unitTypes = "At least one unit type is required";
  } else {
    data.unitTypes.forEach((unit, index) => {
      const prefix = `unitTypes[${index}]`;
      
      if (!unit.type?.trim()) {
        errors[`${prefix}.type`] = "Unit type is required";
      }
      if (!unit.size?.trim()) {
        errors[`${prefix}.size`] = "Unit size is required";
      }
      if (!unit.price?.trim()) {
        errors[`${prefix}.price`] = "Unit price is required";
      }
    });
  }

  // Amenities validation
  if (!data.amenities || data.amenities.length === 0) {
    errors.amenities = "At least one amenity category is required";
  } else {
    data.amenities.forEach((amenity, index) => {
      const prefix = `amenities[${index}]`;
      
      if (!amenity.category?.trim()) {
        errors[`${prefix}.category`] = "Amenity category is required";
      }
      if (!amenity.items || amenity.items.length === 0) {
        errors[`${prefix}.items`] = "At least one amenity item is required";
      } else {
        amenity.items.forEach((item, itemIndex) => {
          if (!item?.trim()) {
            errors[`${prefix}.items[${itemIndex}]`] = "Amenity item cannot be empty";
          }
        });
      }
    });
  }

  // Location Details validation
  if (!data.locationDetails) {
    errors.locationDetails = "Location details are required";
  } else {
    if (!data.locationDetails.description?.trim()) {
      errors["locationDetails.description"] = "Location description is required";
    } else if (data.locationDetails.description.trim().length < 20) {
      errors["locationDetails.description"] = "Location description must be at least 20 characters";
    } else if (data.locationDetails.description.trim().length > 1000) {
      errors["locationDetails.description"] = "Location description cannot exceed 1000 characters";
    }

    if (!data.locationDetails.nearby || data.locationDetails.nearby.length === 0) {
      errors["locationDetails.nearby"] = "At least one nearby place is required";
    } else {
      data.locationDetails.nearby.forEach((place, index) => {
        if (!place.name?.trim()) {
          errors[`locationDetails.nearby[${index}].name`] = "Nearby place name is required";
        }
        if (!place.distance?.trim()) {
          errors[`locationDetails.nearby[${index}].distance`] = "Distance is required";
        }
      });
    }

    if (!data.locationDetails.coordinates) {
      errors["locationDetails.coordinates"] = "Coordinates are required";
    } else {
      const coords = data.locationDetails.coordinates;
      if (coords.latitude < -90 || coords.latitude > 90) {
        errors["locationDetails.coordinates.latitude"] = "Latitude must be between -90 and 90";
      }
      if (coords.longitude < -180 || coords.longitude > 180) {
        errors["locationDetails.coordinates.longitude"] = "Longitude must be between -180 and 180";
      }
    }
  }

  // Image validation
  if (!data.image?.trim()) {
    errors.image = "Main image is required";
  } else if (!IMAGE_URL_REGEX.test(data.image)) {
    errors.image = "Main image must be a valid image URL";
  }

  // Gallery validation
  if (!data.gallery || data.gallery.length === 0) {
    errors.gallery = "At least one gallery image is required";
  } else {
    data.gallery.forEach((url, index) => {
      if (!url?.trim()) {
        errors[`gallery[${index}]`] = "Gallery image URL cannot be empty";
      } else if (!IMAGE_URL_REGEX.test(url)) {
        errors[`gallery[${index}]`] = "Gallery image must be a valid image URL";
      }
    });
  }

  // Add warnings for optional but recommended fields
  if (!data.gallery || data.gallery.length < 3) {
    warnings.push("Adding more gallery images will improve the project listing");
  }

  if (!data.features || data.features.length === 0) {
    warnings.push("Adding key features will highlight the project's unique selling points");
  }



  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
    fieldErrors: errors
  };
}

// Sanitize project form data
export function sanitizeProjectData(data: ProjectFormData): ProjectFormData {
  const sanitized: ProjectFormData = { ...data };

  // Sanitize strings
  if (sanitized.name) sanitized.name = sanitized.name.trim();
  if (sanitized.subtitle) sanitized.subtitle = sanitized.subtitle.trim();
  if (sanitized.location) sanitized.location = sanitized.location.trim();
  if (sanitized.subLocation) sanitized.subLocation = sanitized.subLocation.trim();
  if (sanitized.type) sanitized.type = sanitized.type.trim();
  if (sanitized.status) sanitized.status = sanitized.status.trim();
  if (sanitized.developer) sanitized.developer = sanitized.developer.trim();
  if (sanitized.developerSlug) sanitized.developerSlug = sanitized.developerSlug.trim();
  if (sanitized.description) sanitized.description = sanitized.description.trim();
  if (sanitized.overview) sanitized.overview = sanitized.overview.trim();

  // Sanitize price
  if (sanitized.price) {
    if (sanitized.price.total) sanitized.price.total = sanitized.price.total.trim();
    if (sanitized.price.currency) sanitized.price.currency = sanitized.price.currency.trim().toUpperCase();
  }

  // Sanitize payment plan
  if (sanitized.paymentPlan) {
    if (sanitized.paymentPlan.booking) sanitized.paymentPlan.booking = sanitized.paymentPlan.booking.trim();
    if (sanitized.paymentPlan.handover) sanitized.paymentPlan.handover = sanitized.paymentPlan.handover.trim();
    if (sanitized.paymentPlan.construction) {
      sanitized.paymentPlan.construction = sanitized.paymentPlan.construction.map(milestone => ({
        ...milestone,
        milestone: milestone.milestone?.trim() || '',
        percentage: milestone.percentage?.trim() || ''
      }));
    }
  }

  // Sanitize unit types
  if (sanitized.unitTypes) {
    sanitized.unitTypes = sanitized.unitTypes.map(unit => ({
      ...unit,
      type: unit.type?.trim() || '',
      size: unit.size?.trim() || '',
      price: unit.price?.trim() || ''
    }));
  }

  // Sanitize amenities
  if (sanitized.amenities) {
    sanitized.amenities = sanitized.amenities.map(amenity => ({
      ...amenity,
      category: amenity.category?.trim() || '',
      items: amenity.items?.map(item => item.trim()).filter(item => item.length > 0) || []
    }));
  }

  // Sanitize arrays
  if (sanitized.features) {
    sanitized.features = sanitized.features.map(f => f.trim()).filter(f => f.length > 0);
  }
  
  if (sanitized.categories) {
    sanitized.categories = sanitized.categories.map(c => c.trim()).filter(c => c.length > 0);
  }

  if (sanitized.gallery) {
    sanitized.gallery = sanitized.gallery.map(url => url.trim()).filter(url => url.length > 0);
  }

  // Sanitize location details
  if (sanitized.locationDetails) {
    if (sanitized.locationDetails.description) {
      sanitized.locationDetails.description = sanitized.locationDetails.description.trim();
    }
    if (sanitized.locationDetails.nearby) {
      sanitized.locationDetails.nearby = sanitized.locationDetails.nearby.map(place => ({
        name: place.name?.trim() || '',
        distance: place.distance?.trim() || ''
      }));
    }
  }

  // Clean up empty objects and arrays
  if (sanitized.amenities && sanitized.amenities.length === 0) {
    sanitized.amenities = [];
  }

  if (sanitized.unitTypes && sanitized.unitTypes.length === 0) {
    sanitized.unitTypes = [];
  }

  if (sanitized.gallery && sanitized.gallery.length === 0) {
    sanitized.gallery = [];
  }

  return sanitized;
}

// Validate individual step
export function validateProjectStep(stepId: string, data: ProjectFormData): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];

  switch (stepId) {
    case 'basic':
      // Basic information validation
      if (!data.name?.trim()) errors.name = "Project name is required";
      if (!data.location?.trim()) errors.location = "Location is required";
      if (!data.type?.trim()) errors.type = "Project type is required";
      if (!data.status?.trim()) errors.status = "Project status is required";
      if (!data.developer?.trim()) errors.developer = "Developer is required";
      break;

    case 'pricing':
      // Pricing validation
      if (!data.price?.total?.trim()) errors["price.total"] = "Price is required";
      if (!data.price?.totalNumeric || data.price.totalNumeric <= 0) {
        errors["price.totalNumeric"] = "Price must be a positive number";
      }
      break;

    case 'details':
      // Details validation
      if (!data.description?.trim()) errors.description = "Description is required";
      if (!data.overview?.trim()) errors.overview = "Overview is required";
      if (!data.completionDate) errors.completionDate = "Completion date is required";
      if (!data.totalUnits || data.totalUnits < 1) errors.totalUnits = "Total units must be at least 1";
      break;

    case 'payment':
      // Payment plan validation
      if (!data.paymentPlan?.booking?.trim()) errors["paymentPlan.booking"] = "Booking details required";
      if (!data.paymentPlan?.handover?.trim()) errors["paymentPlan.handover"] = "Handover details required";
      break;

    case 'units':
      // Unit types validation
      if (!data.unitTypes || data.unitTypes.length === 0) {
        errors.unitTypes = "At least one unit type is required";
      }
      break;

    case 'amenities':
      // Amenities validation
      if (!data.amenities || data.amenities.length === 0) {
        errors.amenities = "At least one amenity category is required";
      }
      break;

    case 'location':
      // Location details validation
      if (!data.locationDetails?.description?.trim()) {
        errors["locationDetails.description"] = "Location description is required";
      }
      break;

    case 'media':
      // Media validation
      if (!data.image?.trim()) errors.image = "Main image is required";
      if (!data.gallery || data.gallery.length === 0) {
        errors.gallery = "At least one gallery image is required";
      }
      break;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
    fieldErrors: errors
  };
}