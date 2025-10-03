// lib/building-validation.ts
import type { BuildingFormData, BuildingValidationResult } from "@/types/buildings";

/**
 * Helper function for string validation
 */
function validateString(
  value: any, 
  fieldName: string, 
  minLength = 1, 
  maxLength = Infinity,
  required = true
): string {
  if (!value || typeof value !== "string") {
    return required ? `${fieldName} is required and must be a string.` : '';
  }
  
  const trimmed = value.trim();
  if (trimmed.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters long.`;
  }
  
  if (trimmed.length > maxLength) {
    return `${fieldName} must not exceed ${maxLength} characters.`;
  }
  
  return '';
}

/**
 * Helper function for number validation
 */
function validateNumber(
  value: any,
  fieldName: string,
  min = -Infinity,
  max = Infinity,
  required = true
): string {
  if (value === undefined || value === null || value === '') {
    return required ? `${fieldName} is required.` : '';
  }
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (typeof num !== 'number' || isNaN(num)) {
    return `${fieldName} must be a valid number.`;
  }
  
  if (num < min) {
    return `${fieldName} must be at least ${min}.`;
  }
  
  if (num > max) {
    return `${fieldName} must not exceed ${max}.`;
  }
  
  return '';
}

/**
 * Comprehensive validation function for building form data
 */
export function validateBuildingFormData(data: BuildingFormData, isUpdate = false): BuildingValidationResult {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];

  // Helper to add field error
  const addFieldError = (field: string, message: string) => {
    errors[field] = message;
  };

  // Basic Information Validation
  if (!isUpdate || data.name !== undefined) {
    const nameError = validateString(data.name, "Building name", 2, 100, !isUpdate);
    if (nameError) addFieldError('name', nameError);
  }

  if (data.subtitle !== undefined) {
    const subtitleError = validateString(data.subtitle, "Subtitle", 0, 200, false);
    if (subtitleError) addFieldError('subtitle', subtitleError);
  }

  if (!isUpdate || data.location !== undefined) {
    const locationError = validateString(data.location, "Location", 2, 100, !isUpdate);
    if (locationError) addFieldError('location', locationError);
  }

  if (data.subLocation !== undefined) {
    const subLocationError = validateString(data.subLocation, "Sub-location", 0, 100, false);
    if (subLocationError) addFieldError('subLocation', subLocationError);
  }

  if (!isUpdate || data.description !== undefined) {
    const descriptionError = validateString(data.description, "Description", 10, 2000, !isUpdate);
    if (descriptionError) addFieldError('description', descriptionError);
  }

  // Category and Type Validation
  if (!isUpdate || data.category !== undefined) {
    const validCategories = ['residential', 'commercial', 'mixed'];
    if (!data.category) {
      if (!isUpdate) addFieldError('category', 'Category is required.');
    } else if (!validCategories.includes(data.category)) {
      addFieldError('category', `Category must be one of: ${validCategories.join(', ')}`);
    }
  }

  if (!isUpdate || data.type !== undefined) {
    const typeError = validateString(data.type, "Building type", 2, 50, !isUpdate);
    if (typeError) addFieldError('type', typeError);
  }

  // Status Validation
  if (!isUpdate || data.status !== undefined) {
    const validStatuses = [
      'Completed', 'Under Construction', 'Planned', 'Renovation', 
      'Iconic', 'New', 'Premium', 'Exclusive', 'Landmark', 'Elite', 'Historic', 'Modern'
    ];
    if (!data.status) {
      if (!isUpdate) addFieldError('status', 'Status is required.');
    } else if (!validStatuses.includes(data.status)) {
      addFieldError('status', `Status must be one of: ${validStatuses.join(', ')}`);
    }
  }

  // Price Validation
  if (!isUpdate || data.price !== undefined) {
    if (!data.price || typeof data.price !== "object") {
      if (!isUpdate) addFieldError('price', "Price information is required.");
    } else {
      const valueError = validateString(data.price.value, "Price display value", 1, 50, !isUpdate);
      if (valueError) addFieldError('price.value', valueError);

      const numericError = validateNumber(data.price.valueNumeric, "Price numeric value", 0, Infinity, !isUpdate);
      if (numericError) addFieldError('price.valueNumeric', numericError);

      const validCurrencies = ['AED', 'USD', 'EUR', 'GBP'];
      if (!data.price.currency) {
        if (!isUpdate) addFieldError('price.currency', 'Currency is required.');
      } else if (!validCurrencies.includes(data.price.currency)) {
        addFieldError('price.currency', `Currency must be one of: ${validCurrencies.join(', ')}`);
      }
    }
  }

  // Dimensions Validation
  if (!isUpdate || data.dimensions !== undefined) {
    if (!data.dimensions || typeof data.dimensions !== "object") {
      if (!isUpdate) addFieldError('dimensions', "Dimensions information is required.");
    } else {
      const floorsError = validateNumber(data.dimensions.floors, "Number of floors", 1, 200, !isUpdate);
      if (floorsError) addFieldError('dimensions.floors', floorsError);

      if (data.dimensions.heightNumeric !== undefined) {
        const heightError = validateNumber(data.dimensions.heightNumeric, "Height", 0, 2000, false);
        if (heightError) addFieldError('dimensions.heightNumeric', heightError);
      }

      if (data.dimensions.totalArea !== undefined) {
        const areaError = validateNumber(data.dimensions.totalArea, "Total area", 0, Infinity, false);
        if (areaError) addFieldError('dimensions.totalArea', areaError);
      }

      if (data.dimensions.landArea !== undefined) {
        const landAreaError = validateNumber(data.dimensions.landArea, "Land area", 0, Infinity, false);
        if (landAreaError) addFieldError('dimensions.landArea', landAreaError);
      }

      if (data.dimensions.floorPlateSize !== undefined) {
        const floorPlateError = validateNumber(data.dimensions.floorPlateSize, "Floor plate size", 0, Infinity, false);
        if (floorPlateError) addFieldError('dimensions.floorPlateSize', floorPlateError);
      }
    }
  }

  // Year Validation
  if (!isUpdate || data.year !== undefined) {
    const currentYear = new Date().getFullYear();
    const yearError = validateNumber(data.year, "Year completed", 1800, currentYear + 10, !isUpdate);
    if (yearError) addFieldError('year', yearError);
  }

  if (data.yearBuilt !== undefined) {
    const currentYear = new Date().getFullYear();
    const yearBuiltError = validateNumber(data.yearBuilt, "Year built", 1800, currentYear + 10, false);
    if (yearBuiltError) addFieldError('yearBuilt', yearBuiltError);
  }

  // Units Validation
  if (!isUpdate || data.totalUnits !== undefined) {
    const totalUnitsError = validateNumber(data.totalUnits, "Total units", 1, Infinity, !isUpdate);
    if (totalUnitsError) addFieldError('totalUnits', totalUnitsError);
  }

  if (data.availableUnits !== undefined) {
    const availableUnitsError = validateNumber(data.availableUnits, "Available units", 0, Infinity, false);
    if (availableUnitsError) addFieldError('availableUnits', availableUnitsError);

    // Check if available units don't exceed total units
    if (data.totalUnits && data.availableUnits > data.totalUnits) {
      addFieldError('availableUnits', 'Available units cannot exceed total units.');
    }
  }

  // Unit types validation
  if (data.units && Array.isArray(data.units)) {
    data.units.forEach((unit, index) => {
      if (!unit.type || unit.type.trim().length === 0) {
        addFieldError(`units.${index}.type`, `Unit ${index + 1}: Type is required.`);
      }
      
      if (unit.count !== undefined && unit.count < 0) {
        addFieldError(`units.${index}.count`, `Unit ${index + 1}: Count cannot be negative.`);
      }

      if (unit.sizeRange) {
        if (unit.sizeRange.min < 0) {
          addFieldError(`units.${index}.sizeRange.min`, `Unit ${index + 1}: Minimum size cannot be negative.`);
        }
        if (unit.sizeRange.max < unit.sizeRange.min) {
          addFieldError(`units.${index}.sizeRange.max`, `Unit ${index + 1}: Maximum size cannot be less than minimum size.`);
        }
      }
    });
  }

  // Media Validation
  if (!isUpdate || data.mainImage !== undefined) {
    if (!data.mainImage || data.mainImage.trim().length === 0) {
      if (!isUpdate) addFieldError('mainImage', 'Main image is required.');
    } else {
      // Validate URL format
      try {
        new URL(data.mainImage);
        if (!data.mainImage.match(/\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i)) {
          warnings.push('Main image should be a direct image URL (jpg, jpeg, png, webp, gif)');
        }
      } catch {
        addFieldError('mainImage', 'Main image must be a valid URL.');
      }
    }
  }

  // Gallery validation
  if (data.gallery && Array.isArray(data.gallery)) {
    data.gallery.forEach((imageUrl, index) => {
      if (imageUrl && imageUrl.trim().length > 0) {
        try {
          new URL(imageUrl);
          if (!imageUrl.match(/\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i)) {
            warnings.push(`Gallery image ${index + 1} should be a direct image URL`);
          }
        } catch {
          addFieldError(`gallery.${index}`, `Gallery image ${index + 1} must be a valid URL.`);
        }
      }
    });
  }

  // Legal Details Validation (if provided)
  if (data.legalDetails) {
    if (data.legalDetails.zoning !== undefined) {
      const zoningError = validateString(data.legalDetails.zoning, "Zoning", 1, 100, false);
      if (zoningError) addFieldError('legalDetails.zoning', zoningError);
    }

    if (data.legalDetails.ownership !== undefined) {
      const validOwnership = ['freehold', 'leasehold'];
      if (!validOwnership.includes(data.legalDetails.ownership)) {
        addFieldError('legalDetails.ownership', `Ownership must be one of: ${validOwnership.join(', ')}`);
      }
    }

    if (data.legalDetails.mortgageDetails) {
      if (data.legalDetails.mortgageDetails.outstandingAmount < 0) {
        addFieldError('legalDetails.mortgageDetails.outstandingAmount', 'Outstanding amount cannot be negative.');
      }
    }
  }

  // Sale Information Validation (if provided)
  if (data.saleInformation) {
    if (data.saleInformation.askingPriceNumeric !== undefined && data.saleInformation.askingPriceNumeric < 0) {
      addFieldError('saleInformation.askingPriceNumeric', 'Asking price cannot be negative.');
    }

    if (data.saleInformation.saleStatus !== undefined) {
      const validSaleStatuses = ['available', 'underNegotiation', 'sold', 'offMarket', 'notForSale'];
      if (!validSaleStatuses.includes(data.saleInformation.saleStatus)) {
        addFieldError('saleInformation.saleStatus', `Sale status must be one of: ${validSaleStatuses.join(', ')}`);
      }
    }

    if (data.saleInformation.dealStructure !== undefined) {
      const validDealStructures = ['entireBuilding', 'floor', 'unit', 'shareSale', 'jointVenture'];
      if (!validDealStructures.includes(data.saleInformation.dealStructure)) {
        addFieldError('saleInformation.dealStructure', `Deal structure must be one of: ${validDealStructures.join(', ')}`);
      }
    }

    if (data.saleInformation.preferredBuyerType !== undefined) {
      const validBuyerTypes = ['institutional', 'REIT', 'privateInvestor', 'developer', 'endUser', 'any'];
      if (!validBuyerTypes.includes(data.saleInformation.preferredBuyerType)) {
        addFieldError('saleInformation.preferredBuyerType', `Preferred buyer type must be one of: ${validBuyerTypes.join(', ')}`);
      }
    }
  }

  // Financials Validation (if provided)
  if (data.financials) {
    const financialFields = [
      'totalValue', 'annualRevenue', 'serviceCharges', 'operatingExpenses', 'noi'
    ];
    
    financialFields.forEach(field => {
      if (data.financials![field as keyof typeof data.financials] !== undefined) {
        const value = data.financials![field as keyof typeof data.financials] as number;
        if (value < 0) {
          addFieldError(`financials.${field}`, `${field} cannot be negative.`);
        }
      }
    });

    const percentageFields = [
      'occupancyRate', 'annualAppreciation', 'rentalYield', 'capRate', 'roi'
    ];
    
    percentageFields.forEach(field => {
      if (data.financials![field as keyof typeof data.financials] !== undefined) {
        const value = data.financials![field as keyof typeof data.financials] as number;
        if (value < 0 || value > 100) {
          addFieldError(`financials.${field}`, `${field} must be between 0 and 100.`);
        }
      }
    });
  }

  // Operational Details Validation (if provided)
  if (data.operationalDetails) {
    if (data.operationalDetails.staffCount !== undefined && data.operationalDetails.staffCount < 0) {
      addFieldError('operationalDetails.staffCount', 'Staff count cannot be negative.');
    }

    if (data.operationalDetails.maintenanceStatus !== undefined) {
      const validMaintenanceStatuses = ['new', 'wellMaintained', 'requiresMaintenance', 'underRenovation'];
      if (!validMaintenanceStatuses.includes(data.operationalDetails.maintenanceStatus)) {
        addFieldError('operationalDetails.maintenanceStatus', `Maintenance status must be one of: ${validMaintenanceStatuses.join(', ')}`);
      }
    }
  }

  // Location Details Validation (if provided)
  if (data.locationDetails) {
    if (data.locationDetails.description !== undefined) {
      const descError = validateString(data.locationDetails.description, "Location description", 0, 1000, false);
      if (descError) addFieldError('locationDetails.description', descError);
    }

    if (data.locationDetails.coordinates) {
      const latError = validateNumber(data.locationDetails.coordinates.latitude, "Latitude", -90, 90, false);
      if (latError) addFieldError('locationDetails.coordinates.latitude', latError);

      const lngError = validateNumber(data.locationDetails.coordinates.longitude, "Longitude", -180, 180, false);
      if (lngError) addFieldError('locationDetails.coordinates.longitude', lngError);
    }

    if (data.locationDetails.connectivity?.metro) {
      if (data.locationDetails.connectivity.metro.distance < 0) {
        addFieldError('locationDetails.connectivity.metro.distance', 'Metro distance cannot be negative.');
      }
    }

    if (data.locationDetails.connectivity?.airport) {
      if (data.locationDetails.connectivity.airport.distance < 0) {
        addFieldError('locationDetails.connectivity.airport.distance', 'Airport distance cannot be negative.');
      }
    }

    if (data.locationDetails.demographics) {
      if (data.locationDetails.demographics.population !== undefined && data.locationDetails.demographics.population < 0) {
        addFieldError('locationDetails.demographics.population', 'Population cannot be negative.');
      }

      if (data.locationDetails.demographics.employmentRate !== undefined) {
        const empRate = data.locationDetails.demographics.employmentRate;
        if (empRate < 0 || empRate > 100) {
          addFieldError('locationDetails.demographics.employmentRate', 'Employment rate must be between 0 and 100.');
        }
      }
    }
  }

  // Developer Validation (if provided)
  if (data.developer) {
    const devNameError = validateString(data.developer.name, "Developer name", 1, 100, false);
    if (devNameError) addFieldError('developer.name', devNameError);

    const slugError = validateString(data.developer.slug, "Developer slug", 1, 100, false);
    if (slugError) addFieldError('developer.slug', slugError);

    if (data.developer.established !== undefined) {
      const currentYear = new Date().getFullYear();
      const establishedError = validateNumber(data.developer.established, "Developer established year", 1800, currentYear, false);
      if (establishedError) addFieldError('developer.established', establishedError);
    }
  }

  // Investment Relations Validation (if provided)
  if (data.investorRelations?.brokerContact) {
    const broker = data.investorRelations.brokerContact;
    
    const brokerNameError = validateString(broker.name, "Broker name", 1, 100, false);
    if (brokerNameError) addFieldError('investorRelations.brokerContact.name', brokerNameError);

    const phoneError = validateString(broker.phone, "Broker phone", 1, 50, false);
    if (phoneError) addFieldError('investorRelations.brokerContact.phone', phoneError);

    if (broker.email && !broker.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      addFieldError('investorRelations.brokerContact.email', 'Broker email must be a valid email address.');
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
    fieldErrors: errors
  };
}

/**
 * Sanitize building form data by trimming strings and cleaning up empty objects
 */
export function sanitizeBuildingData(data: BuildingFormData): BuildingFormData {
  const sanitized: BuildingFormData = { ...data };

  // Helper function to trim strings recursively
  const trimStrings = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.trim();
    }
    if (Array.isArray(obj)) {
      return obj.map(trimStrings).filter(item => item !== '' && item != null);
    }
    if (obj && typeof obj === 'object' && obj.constructor === Object) {
      const trimmed: any = {};
      Object.keys(obj).forEach(key => {
        const value = trimStrings(obj[key]);
        if (value !== '' && value != null && !(Array.isArray(value) && value.length === 0)) {
          trimmed[key] = value;
        }
      });
      return trimmed;
    }
    return obj;
  };

  // Apply trimming to all string fields
  Object.keys(sanitized).forEach(key => {
    (sanitized as any)[key] = trimStrings((sanitized as any)[key]);
  });

  // Ensure required arrays are initialized
  if (!sanitized.units || !Array.isArray(sanitized.units)) {
    sanitized.units = [];
  }
  if (!sanitized.features || !Array.isArray(sanitized.features)) {
    sanitized.features = [];
  }
  if (!sanitized.highlights || !Array.isArray(sanitized.highlights)) {
    sanitized.highlights = [];
  }
  if (!sanitized.gallery || !Array.isArray(sanitized.gallery)) {
    sanitized.gallery = [];
  }
  if (!sanitized.floorPlans || !Array.isArray(sanitized.floorPlans)) {
    sanitized.floorPlans = [];
  }

  // Clean up empty nested objects
  const cleanEmptyObjects = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(cleanEmptyObjects).filter(item => {
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          return Object.keys(item).length > 0;
        }
        return item !== '' && item != null;
      });
    }
    if (obj && typeof obj === 'object' && obj.constructor === Object) {
      const cleaned: any = {};
      Object.keys(obj).forEach(key => {
        const value = cleanEmptyObjects(obj[key]);
        
        // Special handling for priceRange - only include if it has all required fields
        if (key === 'priceRange' && typeof value === 'object' && value !== null) {
          const hasRequiredFields = value.display && value.min !== undefined && value.max !== undefined;
          if (hasRequiredFields) {
            cleaned[key] = value;
          }
          // Skip if priceRange doesn't have all required fields
          return;
        }
        
        if (value !== null && value !== undefined) {
          if (typeof value === 'object' && !Array.isArray(value)) {
            if (Object.keys(value).length > 0) {
              cleaned[key] = value;
            }
          } else if (Array.isArray(value)) {
            if (value.length > 0) {
              cleaned[key] = value;
            }
          } else if (value !== '') {
            cleaned[key] = value;
          }
        }
      });
      return cleaned;
    }
    return obj;
  };

  return cleanEmptyObjects(sanitized) as BuildingFormData;
}
