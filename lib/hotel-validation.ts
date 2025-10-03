// lib/hotel-validation.ts

import type { HotelFormData, IPrice, IDimensions, IRoomSuite, IDiningVenue } from "@/types/hotels";

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: string[];
  fieldErrors?: Record<string, string>;
}

// URL validation regex
const URL_REGEX = /^https?:\/\/.+/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Comprehensive hotel form validation
export function validateHotelFormData(data: HotelFormData): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];

  // Required fields validation
  if (!data.name?.trim()) {
    errors.name = "Hotel name is required";
  } else if (data.name.trim().length > 100) {
    errors.name = "Hotel name cannot exceed 100 characters";
  }

  if (data.subtitle && data.subtitle.trim().length > 200) {
    errors.subtitle = "Subtitle cannot exceed 200 characters";
  }

  if (!data.location?.trim()) {
    errors.location = "Location is required";
  } else if (data.location.trim().length > 100) {
    errors.location = "Location cannot exceed 100 characters";
  }

  if (!data.type?.trim()) {
    errors.type = "Hotel type is required";
  } else if (data.type.trim().length > 50) {
    errors.type = "Hotel type cannot exceed 50 characters";
  }

  if (!data.description?.trim()) {
    errors.description = "Description is required";
  } else if (data.description.trim().length > 2000) {
    errors.description = "Description cannot exceed 2000 characters";
  }

  if (!data.status?.trim()) {
    errors.status = "Status is required";
  } else {
    const validStatuses = [
      'Operational',
      'Under Construction', 
      'Planned',
      'Design Phase',
      'Permits Approved',
      'Foundation Ready',
      'Partially Operational',
      'Renovation',
      'Closed Temporarily',
      'For Sale',
      'Sold'
    ];
    if (!validStatuses.includes(data.status)) {
      errors.status = "Invalid status value";
    }
  }

  if (!data.year?.trim()) {
    errors.year = "Year is required";
  }

  // Price validation
  if (!data.price) {
    errors.price = "Price information is required";
  } else {
    if (!data.price.total?.trim()) {
      errors["price.total"] = "Price display format is required";
    }
    if (typeof data.price.totalNumeric !== 'number' || data.price.totalNumeric < 0) {
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

  // Dimensions validation
  if (!data.dimensions) {
    errors.dimensions = "Dimensions information is required";
  } else {
    if (!data.dimensions.height?.trim()) {
      errors["dimensions.height"] = "Height display format is required";
    }
    if (typeof data.dimensions.heightNumeric !== 'number' || data.dimensions.heightNumeric < 0) {
      errors["dimensions.heightNumeric"] = "Height numeric value must be a positive number";
    }
    if (data.dimensions.floors && data.dimensions.floors < 1) {
      errors["dimensions.floors"] = "Must have at least 1 floor";
    }
    if (data.dimensions.totalArea && data.dimensions.totalArea < 0) {
      errors["dimensions.totalArea"] = "Total area cannot be negative";
    }
    if (data.dimensions.landArea && data.dimensions.landArea < 0) {
      errors["dimensions.landArea"] = "Land area cannot be negative";
    }
  }

  // Rooms/Suites validation
  if (!data.roomsSuites || data.roomsSuites.length === 0) {
    errors.roomsSuites = "At least one room/suite type is required";
  } else {
    data.roomsSuites.forEach((room, index) => {
      const prefix = `roomsSuites[${index}]`;
      
      if (!room.name?.trim()) {
        errors[`${prefix}.name`] = "Room/suite name is required";
      }
      if (!room.size?.trim()) {
        errors[`${prefix}.size`] = "Size display format is required";
      }
      if (!room.description?.trim()) {
        errors[`${prefix}.description`] = "Description is required";
      } else if (room.description.trim().length > 500) {
        errors[`${prefix}.description`] = "Description cannot exceed 500 characters";
      }
      if (!room.features || room.features.length === 0) {
        errors[`${prefix}.features`] = "At least one feature is required";
      }
      if (room.count && room.count < 1) {
        errors[`${prefix}.count`] = "Count must be at least 1";
      }
      if (room.sizeNumeric && room.sizeNumeric < 0) {
        errors[`${prefix}.sizeNumeric`] = "Size cannot be negative";
      }
    });
  }

  // Dining validation
  if (!data.dining || data.dining.length === 0) {
    errors.dining = "At least one dining venue is required";
  } else {
    data.dining.forEach((venue, index) => {
      const prefix = `dining[${index}]`;
      
      if (!venue.name?.trim()) {
        errors[`${prefix}.name`] = "Dining venue name is required";
      }
      if (!venue.type?.trim()) {
        errors[`${prefix}.type`] = "Dining venue type is required";
      }
      if (!venue.location?.trim()) {
        errors[`${prefix}.location`] = "Venue location is required";
      }
      if (!venue.description?.trim()) {
        errors[`${prefix}.description`] = "Description is required";
      } else if (venue.description.trim().length > 500) {
        errors[`${prefix}.description`] = "Description cannot exceed 500 characters";
      }
      if (venue.capacity && venue.capacity < 1) {
        errors[`${prefix}.capacity`] = "Capacity must be positive";
      }
      if (venue.priceRange && !['$', '$$', '$$$', '$$$$', '$$$$$'].includes(venue.priceRange)) {
        errors[`${prefix}.priceRange`] = "Invalid price range";
      }
    });
  }

  // Main image validation
  if (!data.mainImage?.trim()) {
    errors.mainImage = "Main image is required";
  } else if (!URL_REGEX.test(data.mainImage)) {
    errors.mainImage = "Main image must be a valid URL";
  }

  // Gallery validation
  if (data.gallery && data.gallery.length > 0) {
    data.gallery.forEach((url, index) => {
      if (url && !URL_REGEX.test(url)) {
        errors[`gallery[${index}]`] = "Gallery image must be a valid URL";
      }
    });
  }

  // Floor plan validation
  if (data.floorPlan && !URL_REGEX.test(data.floorPlan)) {
    errors.floorPlan = "Floor plan must be a valid URL";
  }

  // Wellness facilities validation
  if (data.wellness) {
    if (!data.wellness.name?.trim()) {
      errors["wellness.name"] = "Wellness facility name is required";
    }
    if (!data.wellness.description?.trim()) {
      errors["wellness.description"] = "Wellness description is required";
    } else if (data.wellness.description.trim().length > 1000) {
      errors["wellness.description"] = "Wellness description cannot exceed 1000 characters";
    }
    if (!data.wellness.facilities || data.wellness.facilities.length === 0) {
      errors["wellness.facilities"] = "At least one wellness facility is required";
    }
    if (!data.wellness.signature?.trim()) {
      errors["wellness.signature"] = "Signature service is required";
    }
  }

  // Meetings facilities validation
  if (data.meetings) {
    if (!data.meetings.description?.trim()) {
      errors["meetings.description"] = "Meetings description is required";
    } else if (data.meetings.description.trim().length > 1000) {
      errors["meetings.description"] = "Meetings description cannot exceed 1000 characters";
    }
    if (!data.meetings.facilities || data.meetings.facilities.length === 0) {
      errors["meetings.facilities"] = "At least one meeting facility is required";
    }
    if (data.meetings.maxCapacity && data.meetings.maxCapacity < 1) {
      errors["meetings.maxCapacity"] = "Max capacity must be positive";
    }
    if (data.meetings.totalVenues && data.meetings.totalVenues < 1) {
      errors["meetings.totalVenues"] = "Total venues must be positive";
    }
  }

  // Ratings validation
  if (data.rating && (data.rating < 1 || data.rating > 7)) {
    errors.rating = "Rating must be between 1 and 7";
  }
  
  if (data.customerRating && (data.customerRating < 1 || data.customerRating > 5)) {
    errors.customerRating = "Customer rating must be between 1 and 5";
  }

  if (data.occupancyRate && (data.occupancyRate < 0 || data.occupancyRate > 100)) {
    errors.occupancyRate = "Occupancy rate must be between 0 and 100";
  }


  // Sale information validation
  if (data.saleInformation) {
    const validSaleStatuses = ["available", "underNegotiation", "sold", "offMarket", "notForSale"];
    if (data.saleInformation.saleStatus && !validSaleStatuses.includes(data.saleInformation.saleStatus)) {
      errors["saleInformation.saleStatus"] = "Invalid sale status";
    }
    if (data.saleInformation.askingPriceNumeric && data.saleInformation.askingPriceNumeric < 0) {
      errors["saleInformation.askingPriceNumeric"] = "Asking price cannot be negative";
    }
  }

  // Legal details validation
  if (data.legalDetails) {
    if (!data.legalDetails.zoning?.trim()) {
      errors["legalDetails.zoning"] = "Zoning information is required";
    }
    const validOwnership = ["freehold", "leasehold"];
    if (!data.legalDetails.ownership || !validOwnership.includes(data.legalDetails.ownership)) {
      errors["legalDetails.ownership"] = "Valid ownership type is required";
    }
    if (data.legalDetails.mortgageDetails?.outstandingAmount && data.legalDetails.mortgageDetails.outstandingAmount < 0) {
      errors["legalDetails.mortgageDetails.outstandingAmount"] = "Outstanding amount cannot be negative";
    }
  }

  // Operational details validation
  if (data.operationalDetails) {
    if (data.operationalDetails.staffCount && data.operationalDetails.staffCount < 0) {
      errors["operationalDetails.staffCount"] = "Staff count cannot be negative";
    }
    if (data.operationalDetails.serviceStandard) {
      const validStandards = ['3-Star', '4-Star', '5-Star', '6-Star', '7-Star', 'Luxury', 'Ultra-Luxury'];
      if (!validStandards.includes(data.operationalDetails.serviceStandard)) {
        errors["operationalDetails.serviceStandard"] = "Invalid service standard";
      }
    }
    if (data.operationalDetails.maintenanceStatus) {
      const validStatuses = ['new', 'renovated', 'requiresRenovation'];
      if (!validStatuses.includes(data.operationalDetails.maintenanceStatus)) {
        errors["operationalDetails.maintenanceStatus"] = "Invalid maintenance status";
      }
    }
  }

  // Marketing materials validation
  if (data.marketingMaterials) {
    if (data.marketingMaterials.brochure && !URL_REGEX.test(data.marketingMaterials.brochure)) {
      errors["marketingMaterials.brochure"] = "Brochure must be a valid URL";
    }
    if (data.marketingMaterials.videoTour && !URL_REGEX.test(data.marketingMaterials.videoTour)) {
      errors["marketingMaterials.videoTour"] = "Video tour must be a valid URL";
    }
    if (data.marketingMaterials.virtualTour3D && !URL_REGEX.test(data.marketingMaterials.virtualTour3D)) {
      errors["marketingMaterials.virtualTour3D"] = "Virtual tour must be a valid URL";
    }
  }

  // Investor relations validation
  if (data.investorRelations?.brokerContact) {
    const broker = data.investorRelations.brokerContact;
    if (!broker.name?.trim()) {
      errors["investorRelations.brokerContact.name"] = "Broker name is required";
    }
    if (!broker.phone?.trim()) {
      errors["investorRelations.brokerContact.phone"] = "Broker phone is required";
    }
    if (!broker.email?.trim()) {
      errors["investorRelations.brokerContact.email"] = "Broker email is required";
    } else if (!EMAIL_REGEX.test(broker.email)) {
      errors["investorRelations.brokerContact.email"] = "Invalid broker email format";
    }
  }

  if (data.investorRelations?.dataRoomAccessUrl && !URL_REGEX.test(data.investorRelations.dataRoomAccessUrl)) {
    errors["investorRelations.dataRoomAccessUrl"] = "Data room access URL must be valid";
  }

  // Developer validation
  if (data.developer) {
    if (!data.developer.name?.trim()) {
      errors["developer.name"] = "Developer name is required";
    }
    if (!data.developer.slug?.trim()) {
      errors["developer.slug"] = "Developer slug is required";
    } else if (!/^[a-z0-9-]+$/.test(data.developer.slug)) {
      errors["developer.slug"] = "Developer slug can only contain lowercase letters, numbers, and hyphens";
    }
    if (data.developer.established && (data.developer.established < 1800 || data.developer.established > new Date().getFullYear())) {
      errors["developer.established"] = "Invalid establishment year";
    }
  }

  // Coordinates validation
  if (data.locationDetails?.coordinates) {
    const coords = data.locationDetails.coordinates;
    if (coords.latitude < -90 || coords.latitude > 90) {
      errors["locationDetails.coordinates.latitude"] = "Latitude must be between -90 and 90";
    }
    if (coords.longitude < -180 || coords.longitude > 180) {
      errors["locationDetails.coordinates.longitude"] = "Longitude must be between -180 and 180";
    }
  }

  // Add warnings for optional but recommended fields
  if (!data.gallery || data.gallery.length === 0) {
    warnings.push("Adding gallery images will improve the hotel listing");
  }

  if (!data.features || data.features.length === 0) {
    warnings.push("Adding key features will highlight the hotel's unique selling points");
  }

  if (!data.rating) {
    warnings.push("Star rating helps guests understand the service level");
  }

  if (!data.wellness) {
    warnings.push("Adding wellness facilities information can attract more guests");
  }


  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
    fieldErrors: errors
  };
}

// Sanitize hotel form data
export function sanitizeHotelData(data: HotelFormData): HotelFormData {
  const sanitized: HotelFormData = { ...data };

  // Sanitize strings
  if (sanitized.name) sanitized.name = sanitized.name.trim();
  if (sanitized.subtitle) sanitized.subtitle = sanitized.subtitle.trim();
  if (sanitized.location) sanitized.location = sanitized.location.trim();
  if (sanitized.subLocation) sanitized.subLocation = sanitized.subLocation.trim();
  if (sanitized.type) sanitized.type = sanitized.type.trim();
  if (sanitized.description) sanitized.description = sanitized.description.trim();
  if (sanitized.status) sanitized.status = sanitized.status.trim();
  if (sanitized.year) sanitized.year = sanitized.year.trim();
  if (sanitized.currentOwner) sanitized.currentOwner = sanitized.currentOwner.trim();
  if (sanitized.architecture) sanitized.architecture = sanitized.architecture.trim();

  // Sanitize price
  if (sanitized.price) {
    if (sanitized.price.total) sanitized.price.total = sanitized.price.total.trim();
    if (sanitized.price.currency) sanitized.price.currency = sanitized.price.currency.trim().toUpperCase();
  }

  // Sanitize dimensions
  if (sanitized.dimensions) {
    if (sanitized.dimensions.height) sanitized.dimensions.height = sanitized.dimensions.height.trim();
  }

  // Sanitize rooms/suites
  if (sanitized.roomsSuites) {
    sanitized.roomsSuites = sanitized.roomsSuites.map(room => ({
      ...room,
      name: room.name?.trim() || '',
      size: room.size?.trim() || '',
      description: room.description?.trim() || '',
      features: room.features?.map(f => f.trim()).filter(f => f.length > 0) || []
    }));
  }

  // Sanitize dining venues
  if (sanitized.dining) {
    sanitized.dining = sanitized.dining.map(venue => ({
      ...venue,
      name: venue.name?.trim() || '',
      type: venue.type?.trim() || '',
      location: venue.location?.trim() || '',
      description: venue.description?.trim() || '',
      operatingHours: venue.operatingHours ? {
        breakfast: venue.operatingHours.breakfast?.trim() || '',
        lunch: venue.operatingHours.lunch?.trim() || '',
        dinner: venue.operatingHours.dinner?.trim() || '',
        allDay: Boolean(venue.operatingHours.allDay)
      } : undefined,
      cuisine: venue.cuisine?.map(c => c.trim()).filter(c => c.length > 0),
      priceRange: venue.priceRange?.trim() || undefined,
      dressCode: venue.dressCode?.trim() || ''
    }));
  }

  // Sanitize arrays
  if (sanitized.features) {
    sanitized.features = sanitized.features.map(f => f.trim()).filter(f => f.length > 0);
  }
  
  if (sanitized.facts) {
    sanitized.facts = sanitized.facts.map(f => f.trim()).filter(f => f.length > 0);
  }

  if (sanitized.gallery) {
    sanitized.gallery = sanitized.gallery.map(url => url.trim()).filter(url => url.length > 0);
  }

  // Sanitize wellness
  if (sanitized.wellness) {
    sanitized.wellness = {
      ...sanitized.wellness,
      name: sanitized.wellness.name?.trim() || '',
      description: sanitized.wellness.description?.trim() || '',
      signature: sanitized.wellness.signature?.trim() || '',
      operatingHours: sanitized.wellness.operatingHours?.trim(),
      facilities: sanitized.wellness.facilities?.map(f => f.trim()).filter(f => f.length > 0) || [],
      additionalServices: sanitized.wellness.additionalServices?.map(s => s.trim()).filter(s => s.length > 0) || []
    };
  }

  // Sanitize meetings
  if (sanitized.meetings) {
    sanitized.meetings = {
      ...sanitized.meetings,
      description: sanitized.meetings.description?.trim() || '',
      facilities: sanitized.meetings.facilities?.map(f => f.trim()).filter(f => f.length > 0) || []
    };
  }

  // Clean up empty objects
  if (sanitized.amenities && Object.keys(sanitized.amenities).length === 0) {
    delete sanitized.amenities;
  }


  if (sanitized.saleInformation && Object.keys(sanitized.saleInformation).length === 0) {
    delete sanitized.saleInformation;
  }

  if (sanitized.legalDetails && Object.keys(sanitized.legalDetails).length === 0) {
    delete sanitized.legalDetails;
  }

  if (sanitized.operationalDetails && Object.keys(sanitized.operationalDetails).length === 0) {
    delete sanitized.operationalDetails;
  }

  if (sanitized.locationDetails && Object.keys(sanitized.locationDetails).length === 0) {
    delete sanitized.locationDetails;
  }

  if (sanitized.developer && Object.keys(sanitized.developer).length === 0) {
    delete sanitized.developer;
  }

  return sanitized;
}