import { NextRequest, NextResponse } from "next/server";
import Property from "@/models/properties";
import { connectToDatabase } from "@/lib/db";
import { withCollectionPermission } from "@/lib/auth/server";
import { Collection, Action } from "@/types/user";

export const runtime = "nodejs";

// GET - Fetch all properties with advanced filtering and pagination
async function handler(request: NextRequest) {
  const user = (request as any).user;
  
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Max 100 items per page
    const skip = (page - 1) * limit;

    // Tab parameter for filtering
    const tab = searchParams.get('tab') || 'all';
    
    // Search parameters
    const search = searchParams.get('search') || '';
    const propertyType = searchParams.get('propertyType');
    const bedrooms = searchParams.get('bedrooms');
    const bathrooms = searchParams.get('bathrooms');
    const furnishingStatus = searchParams.get('furnishingStatus');
    const ownershipType = searchParams.get('ownershipType');
    const availabilityStatus = searchParams.get('availabilityStatus');
    const location = searchParams.get('location');
    const area = searchParams.get('area');
    const city = searchParams.get('city');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const featured = searchParams.get('featured');
    const tags = searchParams.get('tags');
    const projectSlug = searchParams.get('projectSlug');
    const developerSlug = searchParams.get('developerSlug');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    // Build query object - determine if we're looking for active or inactive properties
    const query: any = {};
    
    // Tab-based filtering
    switch (tab) {
      case 'inactive':
        query.isActive = false;
        break;
      case 'ready':
        query.isActive = true;
        query.availabilityStatus = 'Ready';
        break;
      case 'offplan':
        query.isActive = true;
        query.availabilityStatus = 'Offplan';
        break;
      case 'primary':
        query.isActive = true;
        query.ownershipType = 'Primary';
        break;
      case 'secondary':
        query.isActive = true;
        query.ownershipType = 'Secondary';
        break;
      case 'featured':
        query.isActive = true;
        query['flags.featured'] = true;
        break;
      case 'elite':
        query.isActive = true;
        query['flags.elite'] = true;
        break;
      case 'all':
      default:
        query.isActive = true;
        break;
    }

    // Search in name, description, overview, and location
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { overview: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } },
        { 'location.area': { $regex: search, $options: 'i' } },
        { id: { $regex: search, $options: 'i' } }
      ];
    }

    // Property type filter
    if (propertyType) {
      query.propertyType = propertyType;
    }

    // Bedrooms filter
    if (bedrooms) {
      if (bedrooms === '5+') {
        query.bedrooms = { $gte: 5 };
      } else {
        query.bedrooms = parseInt(bedrooms);
      }
    }

    // Bathrooms filter
    if (bathrooms) {
      if (bathrooms === '4+') {
        query.bathrooms = { $gte: 4 };
      } else {
        query.bathrooms = parseInt(bathrooms);
      }
    }

    // Furnishing status filter
    if (furnishingStatus) {
      query.furnishingStatus = furnishingStatus;
    }

    // Ownership type filter (only apply if not already set by tab filtering)
    if (ownershipType && !query.ownershipType) {
      query.ownershipType = ownershipType;
    }

    // Availability status filter (only apply if not already set by tab filtering)
    if (availabilityStatus && !query.availabilityStatus) {
      query.availabilityStatus = availabilityStatus;
    }

    // Location filters
    if (location) {
      query['location.address'] = { $regex: location, $options: 'i' };
    }
    if (area) {
      query['location.area'] = { $regex: area, $options: 'i' };
    }
    if (city) {
      query['location.city'] = { $regex: city, $options: 'i' };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.priceNumeric = {};
      if (minPrice) query.priceNumeric.$gte = parseFloat(minPrice);
      if (maxPrice) query.priceNumeric.$lte = parseFloat(maxPrice);
    }

    // Featured filter (only apply if not already set by tab filtering)
    if (featured === 'true' && query['flags.featured'] === undefined) {
      query['flags.featured'] = true;
    }

    // Tags filter
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    // Project filter
    if (projectSlug) {
      query['project.projectSlug'] = projectSlug;
    }

    // Developer filter
    if (developerSlug) {
      query['developer.developerSlug'] = developerSlug;
    }

    // Build sort object
    const sort: any = {};
    if (sortBy === 'price') {
      sort.priceNumeric = sortOrder;
    } else if (sortBy === 'name') {
      sort.name = sortOrder;
    } else if (sortBy === 'bedrooms') {
      sort.bedrooms = sortOrder;
    } else if (sortBy === 'area') {
      sort['location.area'] = sortOrder;
    } else {
      sort.createdAt = sortOrder;
    }

    // Execute queries in parallel for better performance
    const [properties, totalCount, featuredCount, availableCount] = await Promise.all([
      Property.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select({
          id: 1,
          slug: 1,
          name: 1,
          propertyType: 1,
          bedrooms: 1,
          bathrooms: 1,
          builtUpArea: 1,
          carpetArea: 1,
          furnishingStatus: 1,
          facingDirection: 1,
          floorLevel: 1,
          ownershipType: 1,
          propertyStatus: 1,
          availabilityStatus: 1,
          location: 1,
          price: 1,
          priceNumeric: 1,
          pricePerSqFt: 1,
          description: 1,
          overview: 1,
          coverImage: 1,
          gallery: 1,
          amenities: 1,
          paymentPlan: 1,
          flags: 1,
          tags: 1,
          project: 1,
          developer: 1,
          community: 1,
          isActive: 1,
          version: 1,
          createdAt: 1,
          updatedAt: 1,
          createdBy: { email: 1, timestamp: 1 },
          updatedBy: { email: 1, timestamp: 1 }
        })
        .lean(),
      
      Property.countDocuments(query),
      Property.countDocuments({ ...query, 'flags.featured': true }),
      Property.countDocuments({ ...query, availabilityStatus: 'Ready' })
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Transform properties for frontend
    const transformedProperties = properties.map(property => ({
      ...property,
      id: property._id?.toString(),
      _id: undefined // Remove MongoDB _id from response
    }));

    // Log successful fetch
    console.log(`Properties fetched by ${user.email}: ${properties.length} items (page ${page}, tab: ${tab})`);

    return NextResponse.json({
      success: true,
      properties: transformedProperties,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null
      },
      filters: {
        tab,
        search,
        propertyType,
        bedrooms,
        bathrooms,
        furnishingStatus,
        ownershipType,
        availabilityStatus,
        location,
        area,
        city,
        minPrice,
        maxPrice,
        featured,
        tags,
        projectSlug,
        developerSlug,
        sortBy,
        sortOrder: sortOrder === 1 ? 'asc' : 'desc'
      },
      stats: {
        total: totalCount,
        featured: featuredCount,
        ready: availableCount,
        offplan: await Property.countDocuments({ ...query, availabilityStatus: 'Offplan' })
      }
    });

  } catch (error: any) {
    console.error("Error fetching properties:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch properties",
        error: "FETCH_ERROR",
        errors: { general: ["An error occurred while fetching properties"] }
      },
      { status: 500 }
    );
  }
}

// Export with ZeroTrust collection permission validation
export const GET = withCollectionPermission(Collection.PROPERTIES, Action.VIEW)(handler);
