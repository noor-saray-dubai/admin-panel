// lib/mall-validation.ts

import { MallFormData, MallValidationResult, IMall } from '@/types/mall';

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
 * Comprehensive validation function for mall data
 */
export function validateMallData(data: Partial<MallFormData>, isUpdate = false): MallValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const fieldErrors: Record<string, string> = {};

  // Helper to add field error
  const addFieldError = (field: string, message: string) => {
    errors.push(message);
    fieldErrors[field] = message;
  };

  // Required string fields with length limits (all mandatory)
  if (!isUpdate || data.name !== undefined) {
    const nameError = validateString(data.name, "Mall name", 3, 100, true);
    if (nameError) addFieldError('name', nameError);
  }

  if (!isUpdate || data.subtitle !== undefined) {
    const subtitleError = validateString(data.subtitle, "Subtitle", 3, 200, true);
    if (subtitleError) addFieldError('subtitle', subtitleError);
  }

  if (!isUpdate || data.location !== undefined) {
    const locationError = validateString(data.location, "Location", 3, 100, true);
    if (locationError) addFieldError('location', locationError);
  }

  if (!isUpdate || data.subLocation !== undefined) {
    const subLocationError = validateString(data.subLocation, "Sub-location", 3, 100, true);
    if (subLocationError) addFieldError('subLocation', subLocationError);
  }

  // Architecture is now required
  if (!isUpdate || data.architecture !== undefined) {
    const architectureError = validateString(data.architecture, "Architecture", 3, 200, true);
    if (architectureError) addFieldError('architecture', architectureError);
  }

  // Status validation (always required)
  if (!isUpdate || data.status !== undefined) {
    const validStatuses = [
      'Operational',
      'Under Construction', 
      'Planned',
      'Design Phase',
      'Permits Approved',
      'Foundation Ready',
      'Partially Operational',
      'Renovation',
      'For Sale',
      'Sold',
      'Reserved'
    ];
    if (!data.status) {
      addFieldError('status', 'Status is required.');
    } else if (!validStatuses.includes(data.status)) {
      addFieldError('status', `Status must be one of: ${validStatuses.join(', ')}`);
    }
  }

  // Ownership validation (always required)
  if (!isUpdate || data.ownership !== undefined) {
    const validOwnership = ['freehold', 'leasehold'];
    if (!data.ownership) {
      addFieldError('ownership', 'Ownership is required.');
    } else if (!validOwnership.includes(data.ownership)) {
      addFieldError('ownership', `Ownership must be one of: ${validOwnership.join(', ')}`);
    }
  }

  // Price validations (all required)
  if (!isUpdate || data.price !== undefined) {
    if (!data.price || typeof data.price !== "object") {
      addFieldError('price', "Price object is required.");
    } else {
      if (typeof data.price.perSqft !== "number" || data.price.perSqft <= 0) {
        addFieldError('price.perSqft', "Price per sqft is required and must be a positive number.");
      }
      if (typeof data.price.totalNumeric !== "number" || data.price.totalNumeric <= 0) {
        addFieldError('price.totalNumeric', "Total price is required and must be a positive number.");
      }
      const totalError = validateString(data.price.total, "Total price display", 3, 50, true);
      if (totalError) addFieldError('price.total', totalError);
      
      const validCurrencies = ['AED', 'USD', 'EUR'];
      if (!data.price.currency || !validCurrencies.includes(data.price.currency)) {
        addFieldError('price.currency', `Currency is required and must be one of: ${validCurrencies.join(', ')}`);
      }
    }
  }

  // Size validations
  if (!isUpdate || data.size !== undefined) {
    if (!data.size || typeof data.size !== "object") {
      if (!isUpdate) addFieldError('size', "Size object is required.");
    } else {
      if (data.size.totalArea !== undefined && (typeof data.size.totalArea !== "number" || data.size.totalArea <= 0)) {
        addFieldError('size.totalArea', "Total area must be a positive number.");
      }
      if (data.size.retailArea !== undefined && (typeof data.size.retailArea !== "number" || data.size.retailArea <= 0)) {
        addFieldError('size.retailArea', "Retail area must be a positive number.");
      }
      if (data.size.totalSqm !== undefined && (typeof data.size.totalSqm !== "number" || data.size.totalSqm <= 0)) {
        addFieldError('size.totalSqm', "Total area in sqm must be a positive number.");
      }
      if (data.size.retailSqm !== undefined && (typeof data.size.retailSqm !== "number" || data.size.retailSqm <= 0)) {
        addFieldError('size.retailSqm', "Retail area in sqm must be a positive number.");
      }
      if (data.size.floors !== undefined && (typeof data.size.floors !== "number" || data.size.floors < 1)) {
        addFieldError('size.floors', "Number of floors must be at least 1.");
      }
      if (data.size.parkingSpaces !== undefined && (typeof data.size.parkingSpaces !== "number" || data.size.parkingSpaces < 0)) {
        addFieldError('size.parkingSpaces', "Parking spaces cannot be negative.");
      }
    }
  }

  // Rental Details validations
  if (!isUpdate || data.rentalDetails !== undefined) {
    if (!data.rentalDetails || typeof data.rentalDetails !== "object") {
      if (!isUpdate) addFieldError('rentalDetails', "Rental details object is required.");
    } else {
      // Individual field validations
      if (data.rentalDetails.maxStores !== undefined && (typeof data.rentalDetails.maxStores !== "number" || data.rentalDetails.maxStores < 1)) {
        addFieldError('rentalDetails.maxStores', "Maximum stores capacity must be at least 1.");
      }
      if (data.rentalDetails.currentOccupancy !== undefined && (typeof data.rentalDetails.currentOccupancy !== "number" || data.rentalDetails.currentOccupancy < 0 || data.rentalDetails.currentOccupancy > 100)) {
        addFieldError('rentalDetails.currentOccupancy', "Current occupancy must be a percentage between 0 and 100.");
      }
      if (data.rentalDetails.averageRent !== undefined && (typeof data.rentalDetails.averageRent !== "number" || data.rentalDetails.averageRent < 0)) {
        addFieldError('rentalDetails.averageRent', "Average rent cannot be negative.");
      }
      if (data.rentalDetails.totalStores !== undefined && (typeof data.rentalDetails.totalStores !== "number" || data.rentalDetails.totalStores < 0)) {
        addFieldError('rentalDetails.totalStores', "Total stores cannot be negative.");
      }
      if (data.rentalDetails.vacantStores !== undefined && (typeof data.rentalDetails.vacantStores !== "number" || data.rentalDetails.vacantStores < 0)) {
        addFieldError('rentalDetails.vacantStores', "Vacant stores cannot be negative.");
      }

      // Cross-validation between rental fields
      const maxStores = data.rentalDetails.maxStores;
      const totalStores = data.rentalDetails.totalStores;
      const vacantStores = data.rentalDetails.vacantStores;
      const currentOccupancy = data.rentalDetails.currentOccupancy;

      // Validate maxStores >= totalStores
      if (maxStores !== undefined && totalStores !== undefined && 
          typeof maxStores === "number" && typeof totalStores === "number" &&
          maxStores < totalStores) {
        addFieldError('rentalDetails.totalStores', `Total stores (${totalStores}) cannot exceed maximum capacity (${maxStores}).`);
      }

      // Only validate if vacantStores is explicitly provided and exceeds totalStores
      if (totalStores !== undefined && vacantStores !== undefined && 
          typeof totalStores === "number" && typeof vacantStores === "number" &&
          vacantStores > totalStores && vacantStores > 0) {
        addFieldError('rentalDetails.vacantStores', `Vacant stores (${vacantStores}) cannot exceed total stores (${totalStores}).`);
      }

      // Skip occupancy consistency checks - client-side validation handles this
    }
  }

  // Financials validations
  if (!isUpdate || data.financials !== undefined) {
    if (!data.financials || typeof data.financials !== "object") {
      if (!isUpdate) addFieldError('financials', "Financials object is required.");
    } else {
      if (data.financials.capRate !== undefined && (typeof data.financials.capRate !== "number" || data.financials.capRate < 0)) {
        addFieldError('financials.capRate', "Cap rate must be a non-negative number.");
      }
      if (data.financials.roi !== undefined && (typeof data.financials.roi !== "number" || data.financials.roi < 0)) {
        addFieldError('financials.roi', "ROI must be a non-negative number.");
      }
      if (data.financials.appreciation !== undefined && (typeof data.financials.appreciation !== "number" || data.financials.appreciation < 0)) {
        addFieldError('financials.appreciation', "Appreciation must be a non-negative number.");
      }
      if (data.financials.payback !== undefined && (typeof data.financials.payback !== "number" || data.financials.payback < 0)) {
        addFieldError('financials.payback', "Payback period must be a non-negative number.");
      }
      if (data.financials.annualRevenue !== undefined && (typeof data.financials.annualRevenue !== "number" || data.financials.annualRevenue < 0)) {
        addFieldError('financials.annualRevenue', "Annual revenue cannot be negative.");
      }
      if (data.financials.operatingExpenses !== undefined && (typeof data.financials.operatingExpenses !== "number" || data.financials.operatingExpenses < 0)) {
        addFieldError('financials.operatingExpenses', "Operating expenses cannot be negative.");
      }
    }
  }

  // Sale Information validations
  if (!isUpdate || data.saleInformation !== undefined) {
    if (!data.saleInformation || typeof data.saleInformation !== "object") {
      if (!isUpdate) addFieldError('saleInformation', "Sale information object is required.");
    } else {
      const validSaleStatuses = ['available', 'underNegotiation', 'sold', 'offMarket'];
      if (data.saleInformation.saleStatus && !validSaleStatuses.includes(data.saleInformation.saleStatus)) {
        addFieldError('saleInformation.saleStatus', `Sale status must be one of: ${validSaleStatuses.join(', ')}`);
      }
      
      const validDealStructures = ['assetSale', 'shareSale', 'jointVenture', 'leaseback'];
      if (data.saleInformation.dealStructure && !validDealStructures.includes(data.saleInformation.dealStructure)) {
        addFieldError('saleInformation.dealStructure', `Deal structure must be one of: ${validDealStructures.join(', ')}`);
      }
      
      const validBuyerTypes = ['institutional', 'REIT', 'privateInvestor', 'developer', 'any'];
      if (data.saleInformation.preferredBuyerType && !validBuyerTypes.includes(data.saleInformation.preferredBuyerType)) {
        addFieldError('saleInformation.preferredBuyerType', `Preferred buyer type must be one of: ${validBuyerTypes.join(', ')}`);
      }

      if (data.saleInformation.askingPriceNumeric !== undefined && (typeof data.saleInformation.askingPriceNumeric !== "number" || data.saleInformation.askingPriceNumeric < 0)) {
        addFieldError('saleInformation.askingPriceNumeric', "Asking price cannot be negative.");
      }
    }
  }

  // Legal Details validations
  if (!isUpdate || data.legalDetails !== undefined) {
    if (!data.legalDetails || typeof data.legalDetails !== "object") {
      if (!isUpdate) addFieldError('legalDetails', "Legal details object is required.");
    } else {
      if (!data.legalDetails.zoning) {
        if (!isUpdate) addFieldError('legalDetails.zoning', "Zoning is required.");
      } else {
        const zoningError = validateString(data.legalDetails.zoning, "Zoning", 2, 100, !isUpdate);
        if (zoningError) addFieldError('legalDetails.zoning', zoningError);
      }
    }
  }

  // Mortgage Details validations (nested under legalDetails)
  if (data.legalDetails?.mortgageDetails !== undefined && data.legalDetails?.mortgageDetails !== null) {
    if (typeof data.legalDetails.mortgageDetails === "object") {
      const mortgageDetails = data.legalDetails.mortgageDetails;
      
      // Check if any mortgage field has been meaningfully provided to determine if validation is needed
      const hasLender = mortgageDetails.lender && typeof mortgageDetails.lender === "string" && mortgageDetails.lender.trim().length > 0;
      const hasOutstandingAmount = mortgageDetails.outstandingAmount !== undefined && mortgageDetails.outstandingAmount !== null && mortgageDetails.outstandingAmount > 0;
      const hasMaturityDate = mortgageDetails.maturityDate !== undefined && mortgageDetails.maturityDate !== null && 
        (mortgageDetails.maturityDate instanceof Date || 
         (typeof mortgageDetails.maturityDate === 'string' && mortgageDetails.maturityDate.trim().length > 0));
      
      const hasAnyMortgageField = hasLender || hasOutstandingAmount || hasMaturityDate;
      
      if (hasAnyMortgageField) {
        // If any field is provided, all required fields must be filled
        if (!mortgageDetails.lender || typeof mortgageDetails.lender !== "string" || mortgageDetails.lender.trim().length === 0) {
          addFieldError('legalDetails.mortgageDetails.lender', "Lender name is required when mortgage details are provided.");
        }
        
        if (!mortgageDetails.maturityDate) {
          addFieldError('legalDetails.mortgageDetails.maturityDate', "Maturity date is required when mortgage details are provided.");
        } else {
          // Validate date format and value
          let dateString: string;
          let isValidFormat = true;
          
          if (mortgageDetails.maturityDate instanceof Date) {
            // Handle Date object
            try {
              dateString = mortgageDetails.maturityDate.toISOString().split('T')[0];
            } catch (error) {
              isValidFormat = false;
              dateString = '';
            }
          } else if (typeof mortgageDetails.maturityDate === 'string') {
            // Handle string (should already be in YYYY-MM-DD format)
            dateString = mortgageDetails.maturityDate;
          } else {
            isValidFormat = false;
            dateString = '';
          }
          
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!isValidFormat || !dateRegex.test(dateString)) {
            addFieldError('legalDetails.mortgageDetails.maturityDate', "Maturity date must be in YYYY-MM-DD format.");
          } else {
            // Validate that it's a valid date and in the future
            const maturityDate = new Date(dateString);
            if (isNaN(maturityDate.getTime())) {
              addFieldError('legalDetails.mortgageDetails.maturityDate', "Maturity date must be a valid date.");
            } else {
              const today = new Date();
              today.setHours(0, 0, 0, 0); // Reset time for comparison
              maturityDate.setHours(0, 0, 0, 0);
              
              if (maturityDate <= today) {
                addFieldError('legalDetails.mortgageDetails.maturityDate', "Maturity date must be in the future.");
              }
            }
          }
        }
        
        if (mortgageDetails.outstandingAmount === undefined || mortgageDetails.outstandingAmount === null || 
            typeof mortgageDetails.outstandingAmount !== "number" || mortgageDetails.outstandingAmount < 0) {
          addFieldError('legalDetails.mortgageDetails.outstandingAmount', "Outstanding amount is required and must be a non-negative number when mortgage details are provided.");
        }
      }

      // Optional mortgage fields validation (if provided)
      if (mortgageDetails.loanAmount !== undefined && 
          (typeof mortgageDetails.loanAmount !== "number" || mortgageDetails.loanAmount < 0)) {
        addFieldError('legalDetails.mortgageDetails.loanAmount', "Loan amount must be a non-negative number.");
      }
      if (mortgageDetails.interestRate !== undefined && 
          (typeof mortgageDetails.interestRate !== "number" || mortgageDetails.interestRate < 0 || mortgageDetails.interestRate > 100)) {
        addFieldError('legalDetails.mortgageDetails.interestRate', "Interest rate must be between 0 and 100.");
      }
      if (mortgageDetails.loanTerm !== undefined && 
          (typeof mortgageDetails.loanTerm !== "number" || mortgageDetails.loanTerm < 1)) {
        addFieldError('legalDetails.mortgageDetails.loanTerm', "Loan term must be at least 1 year.");
      }
      if (mortgageDetails.monthlyPayment !== undefined && 
          (typeof mortgageDetails.monthlyPayment !== "number" || mortgageDetails.monthlyPayment < 0)) {
        addFieldError('legalDetails.mortgageDetails.monthlyPayment', "Monthly payment must be a non-negative number.");
      }
    }
  }

  // Features validation
  if (data.features !== undefined) {
    if (!Array.isArray(data.features)) {
      addFieldError('features', "Features must be an array.");
    } else {
      data.features.forEach((feature, idx) => {
        const featureError = validateString(feature, `Feature ${idx + 1}`, 1, 200);
        if (featureError) addFieldError(`features[${idx}]`, featureError);
      });
    }
  }

  // Developer validation (optional)
  if (data.developer !== undefined) {
    if (data.developer && typeof data.developer === "object") {
      if (!data.developer.name) {
        addFieldError('developer.name', "Developer name is required.");
      }
      if (!data.developer.slug) {
        addFieldError('developer.slug', "Developer slug is required.");
      }
    }
  }

  // Location details validation
  if (data.locationDetails !== undefined) {
    if (data.locationDetails && typeof data.locationDetails === "object") {
      if (data.locationDetails.description !== undefined) {
        const descError = validateString(data.locationDetails.description, "Location description", 10, 1000, false);
        if (descError) addFieldError('locationDetails.description', descError);
      }
      
      const coords = data.locationDetails.coordinates;
      if (coords !== undefined && coords !== null) {
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
    }
  }

  // Main image validation (required)
  if (!isUpdate || data.image !== undefined) {
    if (!data.image || typeof data.image !== "string" || data.image.trim().length === 0) {
      addFieldError('image', 'Main mall image is required.');
    }
  }

  // Year validations (required)
  const currentYear = new Date().getFullYear();
  if (!isUpdate || data.yearBuilt !== undefined) {
    if (typeof data.yearBuilt !== "number" || data.yearBuilt < 1900 || data.yearBuilt > 2050) {
      addFieldError('yearBuilt', "Year built is required and must be between 1900 and 2050.");
    }
  }
  if (!isUpdate || data.yearOpened !== undefined) {
    if (typeof data.yearOpened !== "number" || data.yearOpened < 1900 || data.yearOpened > 2050) {
      addFieldError('yearOpened', "Year opened is required and must be between 1900 and 2050.");
    }
  }

  // Rating validation
  if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
    addFieldError('rating', "Rating must be between 1 and 5.");
  }

  // Visitors validation
  if (data.visitorsAnnually !== undefined && data.visitorsAnnually < 0) {
    addFieldError('visitorsAnnually', "Annual visitors cannot be negative.");
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
  if (data.isOperational !== undefined && typeof data.isOperational !== "boolean") {
    addFieldError('isOperational', "Operational status must be a boolean.");
  }

  return {
    isValid: errors.length === 0,
    errors: errors.reduce((acc, error, index) => {
      acc[`error_${index}`] = error;
      return acc;
    }, {} as Record<string, string>),
    warnings,
    fieldErrors
  };
}

/**
 * Clean and sanitize mall data
 */
export function sanitizeMallData(data: Partial<MallFormData>): Partial<MallFormData> {
  const sanitizeString = (str: string): string => str.trim().replace(/\s+/g, ' ');
  
  const sanitized: Partial<MallFormData> = { ...data };

  // Sanitize string fields
  if (sanitized.name) sanitized.name = sanitizeString(sanitized.name);
  if (sanitized.subtitle) sanitized.subtitle = sanitizeString(sanitized.subtitle);
  if (sanitized.location) sanitized.location = sanitizeString(sanitized.location);
  if (sanitized.subLocation) sanitized.subLocation = sanitizeString(sanitized.subLocation);
  if (sanitized.status) sanitized.status = sanitizeString(sanitized.status);
  if (sanitized.architecture) sanitized.architecture = sanitizeString(sanitized.architecture);

  // Sanitize complex object fields
  if (sanitized.price?.total) {
    sanitized.price.total = sanitizeString(sanitized.price.total);
  }

  if (sanitized.features) {
    sanitized.features = sanitized.features
      .map(feature => sanitizeString(feature))
      .filter(feature => feature.length > 0);
  }

  if (sanitized.locationDetails?.description) {
    sanitized.locationDetails.description = sanitizeString(sanitized.locationDetails.description);
  }

  if (sanitized.legalDetails?.zoning) {
    sanitized.legalDetails.zoning = sanitizeString(sanitized.legalDetails.zoning);
  }

  // Sanitize mortgage details - remove if empty
  if (sanitized.legalDetails?.mortgageDetails) {
    const mortgageDetails = sanitized.legalDetails.mortgageDetails;
    
    // Clean up string fields
    if (mortgageDetails.lender) {
      mortgageDetails.lender = sanitizeString(mortgageDetails.lender);
    }
    
    // Check if any meaningful data exists after sanitization
    const hasLender = mortgageDetails.lender && mortgageDetails.lender.trim().length > 0;
    const hasOutstandingAmount = mortgageDetails.outstandingAmount !== undefined && mortgageDetails.outstandingAmount !== null && mortgageDetails.outstandingAmount > 0;
    const hasMaturityDate = mortgageDetails.maturityDate !== undefined && mortgageDetails.maturityDate !== null &&
      (mortgageDetails.maturityDate instanceof Date || 
       (typeof mortgageDetails.maturityDate === 'string' && mortgageDetails.maturityDate.trim().length > 0));
    
    // If no meaningful data exists, remove the entire mortgageDetails object
    if (!hasLender && !hasOutstandingAmount && !hasMaturityDate) {
      delete sanitized.legalDetails.mortgageDetails;
    }
  }

  return sanitized;
}

/**
 * Validate image file
 */
export function validateImageFile(file: File, fieldName: string, maxSizeMB: number = 10): { isValid: boolean; error?: string } {
  if (!file || file.size === 0) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: `${fieldName} must be one of: ${allowedTypes.join(', ')}` 
    };
  }

  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return { 
      isValid: false, 
      error: `${fieldName} must be less than ${maxSizeMB}MB` 
    };
  }

  return { isValid: true };
}

// Client-side validation for individual fields
export function validateField(field: string, value: any, formData: Partial<MallFormData>): string {
  const validation = validateMallData({ [field]: value, ...formData }, true);
  return validation.fieldErrors?.[field] || '';
}

// Client-side validation for entire form
export function validateMallFormData(formData: MallFormData, isUpdate = false): { isValid: boolean; errors: Record<string, string> } {
  const validation = validateMallData(formData, isUpdate);
  return {
    isValid: validation.isValid,
    errors: validation.fieldErrors || {}
  };
}