// lib/client-validation.ts
import type { PlotFormData } from "@/types/plot";

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: string[];
}

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
 * Comprehensive validation function for plot form data
 */
export function validatePlotFormData(data: PlotFormData, isUpdate = false): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];

  // Helper to add field error
  const addFieldError = (field: string, message: string) => {
    errors[field] = message;
  };

  // Required string fields with length limits
  if (!isUpdate || data.title !== undefined) {
    const titleError = validateString(data.title, "Title", 2, 100, !isUpdate);
    if (titleError) addFieldError('title', titleError);
  }

  if (!isUpdate || data.subtitle !== undefined) {
    const subtitleError = validateString(data.subtitle, "Subtitle", 2, 150, !isUpdate);
    if (subtitleError) addFieldError('subtitle', subtitleError);
  }

  if (!isUpdate || data.location !== undefined) {
    const locationError = validateString(data.location, "Location", 2, 100, !isUpdate);
    if (locationError) addFieldError('location', locationError);
  }

  if (!isUpdate || data.subLocation !== undefined) {
    const subLocationError = validateString(data.subLocation, "Sub-location", 2, 100, !isUpdate);
    if (subLocationError) addFieldError('subLocation', subLocationError);
  }

  if (!isUpdate || data.status !== undefined) {
    const validStatuses = [
      'Ready for Development',
      'Infrastructure Complete',
      'Master Plan Approved',
      'Design Development Phase',
      'Permits Approved',
      'Foundation Ready',
      'Under Development',
      'Sold',
      'Reserved'
    ];
    if (!data.status) {
      if (!isUpdate) addFieldError('status', 'Status is required.');
    } else if (!validStatuses.includes(data.status)) {
      addFieldError('status', `Status must be one of: ${validStatuses.join(', ')}`);
    }
  }

  // Validate enums
  if (!isUpdate || data.type !== undefined) {
    const validTypes = ['industrial', 'community', 'building'];
    if (!data.type) {
      if (!isUpdate) addFieldError('type', 'Type is required.');
    } else if (!validTypes.includes(data.type)) {
      addFieldError('type', `Type must be one of: ${validTypes.join(', ')}`);
    }
  }

  // Subtype validation for building type
  if (data.type === 'building') {
    if (!data.subtype) {
      addFieldError('subtype', 'Subtype is required when type is "building"');
    } else {
      const validSubtypes = ['hotel', 'residential', 'mixuse'];
      if (!validSubtypes.includes(data.subtype)) {
        addFieldError('subtype', `Subtype must be one of: ${validSubtypes.join(', ')}`);
      }
    }
  } else if (data.subtype && data.type && !['building'].includes(data.type)) {
    warnings.push('Subtype should only be provided when type is "building"');
  }

  if (!isUpdate || data.ownership !== undefined) {
    const validOwnership = ['freehold', 'leasehold'];
    if (!data.ownership) {
      if (!isUpdate) addFieldError('ownership', 'Ownership is required.');
    } else if (!validOwnership.includes(data.ownership)) {
      addFieldError('ownership', `Ownership must be one of: ${validOwnership.join(', ')}`);
    }
  }

  // Price validations
  if (!isUpdate || data.price !== undefined) {
    if (!data.price || typeof data.price !== "object") {
      if (!isUpdate) addFieldError('price', "Price object is required.");
    } else {
      if (data.price.perSqft !== undefined && (typeof data.price.perSqft !== "number" || data.price.perSqft <= 0)) {
        addFieldError('price.perSqft', "Price per sqft must be a positive number.");
      }
      if (data.price.totalNumeric !== undefined && (typeof data.price.totalNumeric !== "number" || data.price.totalNumeric <= 0)) {
        addFieldError('price.totalNumeric', "Total price must be a positive number.");
      }
      if (data.price.total !== undefined) {
        const totalError = validateString(data.price.total, "Total price display", 1, 50, !isUpdate);
        if (totalError) addFieldError('price.total', totalError);
      }
      
      const validCurrencies = ['AED', 'USD', 'EUR'];
      if (data.price.currency !== undefined && !validCurrencies.includes(data.price.currency)) {
        addFieldError('price.currency', `Currency must be one of: ${validCurrencies.join(', ')}`);
      }
    }
  }

  // Size validations
  if (!isUpdate || data.size !== undefined) {
    if (!data.size || typeof data.size !== "object") {
      if (!isUpdate) addFieldError('size', "Size object is required.");
    } else {
      if (data.size.sqft !== undefined && (typeof data.size.sqft !== "number" || data.size.sqft <= 0)) {
        addFieldError('size.sqft', "Square feet must be a positive number.");
      }
      if (data.size.sqm !== undefined && (typeof data.size.sqm !== "number" || data.size.sqm <= 0)) {
        addFieldError('size.sqm', "Square meters must be a positive number.");
      }
      if (data.size.acres !== undefined && (typeof data.size.acres !== "number" || data.size.acres <= 0)) {
        addFieldError('size.acres', "Acres must be a positive number.");
      }
    }
  }

  // Permissions validations
  if (!isUpdate || data.permissions !== undefined) {
    if (!data.permissions || typeof data.permissions !== "object") {
      if (!isUpdate) addFieldError('permissions', "Permissions object is required.");
    } else {
      if (data.permissions.floors !== undefined) {
        const floorsError = validateString(data.permissions.floors, "Floor permissions", 1, 50, !isUpdate);
        if (floorsError) addFieldError('permissions.floors', floorsError);
      }
      if (data.permissions.usage !== undefined) {
        const usageError = validateString(data.permissions.usage, "Usage type", 1, 200, !isUpdate);
        if (usageError) addFieldError('permissions.usage', usageError);
      }
      
      if (data.permissions.far !== undefined && (typeof data.permissions.far !== "number" || data.permissions.far < 0)) {
        addFieldError('permissions.far', "FAR must be a non-negative number.");
      }
      if (data.permissions.coverage !== undefined && (typeof data.permissions.coverage !== "number" || data.permissions.coverage < 0 || data.permissions.coverage > 100)) {
        addFieldError('permissions.coverage', "Coverage must be between 0 and 100.");
      }
    }
  }

  // Investment validations
  if (!isUpdate || data.investment !== undefined) {
    if (!data.investment || typeof data.investment !== "object") {
      if (!isUpdate) addFieldError('investment', "Investment object is required.");
    } else {
      if (data.investment.roi !== undefined && (typeof data.investment.roi !== "number" || data.investment.roi < 0)) {
        addFieldError('investment.roi', "ROI must be a non-negative number.");
      }
      if (data.investment.appreciation !== undefined && (typeof data.investment.appreciation !== "number" || data.investment.appreciation < 0)) {
        addFieldError('investment.appreciation', "Appreciation must be a non-negative number.");
      }
      if (data.investment.payback !== undefined && (typeof data.investment.payback !== "number" || data.investment.payback < 0)) {
        addFieldError('investment.payback', "Payback period must be a non-negative number.");
      }
    }
  }

  // Features validation
  if (!isUpdate || data.features !== undefined) {
    if (!Array.isArray(data.features)) {
      if (!isUpdate) addFieldError('features', "Features must be an array.");
    } else if (data.features.length === 0) {
      if (!isUpdate) addFieldError('features', "At least one feature must be provided.");
    } else {
      data.features.forEach((feature, idx) => {
        const featureError = validateString(feature, `Feature ${idx + 1}`, 1, 200);
        if (featureError) addFieldError(`features[${idx}]`, featureError);
      });
    }
  }

  // Developer validation (optional)
  if (data.developer !== undefined && data.developer !== '') {
    const developerError = validateString(data.developer, "Developer", 1, 150, false);
    if (developerError) addFieldError('developer', developerError);
  }

  // Location details validation
  if (data.locationDetails !== undefined) {
    if (!data.locationDetails || typeof data.locationDetails !== "object") {
      addFieldError('locationDetails', "Location details must be an object.");
    } else {
      if (data.locationDetails.description !== undefined && data.locationDetails.description !== '') {
        const descError = validateString(data.locationDetails.description, "Location description", 10, 500, false);
        if (descError) addFieldError('locationDetails.description', descError);
      }
      
      const coords = data.locationDetails.coordinates;
      if (coords !== undefined && (coords.latitude !== 0 || coords.longitude !== 0)) {
        if (!coords || typeof coords.latitude !== "number" || typeof coords.longitude !== "number") {
          addFieldError('locationDetails.coordinates', "Coordinates must have valid latitude and longitude numbers.");
        } else {
          if (coords.latitude < -90 || coords.latitude > 90) {
            addFieldError('locationDetails.coordinates.latitude', "Latitude must be between -90 and 90.");
          }
          if (coords.longitude < -180 || coords.longitude > 180) {
            addFieldError('locationDetails.coordinates.longitude', "Longitude must be between -180 and 180.");
          }
        }
      }

      if (data.locationDetails.accessibility !== undefined) {
        if (!Array.isArray(data.locationDetails.accessibility)) {
          addFieldError('locationDetails.accessibility', "Accessibility must be an array.");
        } else {
          data.locationDetails.accessibility.forEach((item, idx) => {
            const accessError = validateString(item, `Accessibility item ${idx + 1}`, 1, 100);
            if (accessError) addFieldError(`locationDetails.accessibility[${idx}]`, accessError);
          });
        }
      }
    }
  }

  // Boolean validations
  if (data.verified !== undefined && typeof data.verified !== "boolean") {
    addFieldError('verified', "Verified must be a boolean.");
  }
  if (data.isActive !== undefined && typeof data.isActive !== "boolean") {
    addFieldError('isActive', "Active status must be a boolean.");
  }
  if (data.isAvailable !== undefined && typeof data.isAvailable !== "boolean") {
    addFieldError('isAvailable', "Available status must be a boolean.");
  }

  // Image validation for add mode
  if (!isUpdate) {
    if (!data.image) {
      addFieldError('image', 'Main image is required');
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings
  };
}

/**
 * Validate individual field
 */
export function validateField(field: string, value: any, formData: PlotFormData): string {
  // Create a temporary object with just this field to validate
  const tempData = { ...formData, [field]: value };
  const result = validatePlotFormData(tempData, false);
  
  // Handle nested fields
  if (field.includes('.')) {
    const parts = field.split('.');
    let current: any = tempData;
    
    // Set the nested value
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
    
    const nestedResult = validatePlotFormData(tempData, false);
    return nestedResult.errors[field] || '';
  }
  
  return result.errors[field] || '';
}