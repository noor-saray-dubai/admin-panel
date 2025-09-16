import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '../../../../lib/db'
import Plot from '../../../../models/plots'

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase()

    const { searchParams } = new URL(req.url)
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Filter parameters
    const search = searchParams.get('search') || ''
    const tab = searchParams.get('tab') || 'all'
    const location = searchParams.get('location')
    const developer = searchParams.get('developer')
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const ownership = searchParams.get('ownership')
    const verified = searchParams.get('verified')

    // Build filter query
    let filterQuery: any = { isActive: true }

    // Search functionality
    if (search) {
      filterQuery.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subtitle: { $regex: search, $options: 'i' } },
        { plotId: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { subLocation: { $regex: search, $options: 'i' } },
        { developer: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
        { subtype: { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } },
        { 'permissions.usage': { $regex: search, $options: 'i' } },
        { features: { $in: [new RegExp(search, 'i')] } },
        { 'locationDetails.accessibility': { $in: [new RegExp(search, 'i')] } }
      ]
    }

    // Tab-specific filtering
    if (tab === 'industrial') {
      filterQuery.type = 'industrial'
    } else if (tab === 'community') {
      filterQuery.type = 'community'
    } else if (tab === 'building') {
      filterQuery.type = 'building'
    } else if (tab === 'available') {
      filterQuery.isAvailable = true
      filterQuery.isActive = true
    }

    // Additional filters
    if (location && location !== 'all') {
      filterQuery.location = location
    }
    
    if (developer && developer !== 'all') {
      filterQuery.developer = developer
    }
    
    if (type && type !== 'all') {
      filterQuery.type = type
    }
    
    if (status && status !== 'all') {
      filterQuery.status = status
    }
    
    if (ownership && ownership !== 'all') {
      filterQuery.ownership = ownership
    }
    
    if (verified && verified !== 'all') {
      if (verified === 'true') {
        filterQuery.verified = true
      } else if (verified === 'false') {
        filterQuery.verified = false
      }
    }

    // Execute queries in parallel for better performance
    const [plots, totalPlots, filtersData] = await Promise.all([
      // Main query with pagination
      Plot.find(filterQuery)
        .select('-__v') // Exclude version key
        .sort({ updatedAt: -1, createdAt: -1 }) // Latest first
        .skip(skip)
        .limit(limit)
        .lean(), // Use lean for better performance

      // Count total documents
      Plot.countDocuments(filterQuery),

      // Get filter data (only when no specific filters are applied for better performance)
      search || location || developer || type || status || ownership ? 
        Promise.resolve(null) : 
        Promise.all([
          Plot.distinct('location', { isActive: true }),
          Plot.distinct('developer', { isActive: true }).then(devs => devs.filter(Boolean)), // Filter out null/undefined developers
          Plot.distinct('type', { isActive: true }),
          Plot.distinct('status', { isActive: true }),
          Plot.distinct('subtype', { isActive: true, subtype: { $exists: true, $ne: null } }),
          Plot.distinct('ownership', { isActive: true })
        ])
    ])

    // Calculate pagination info
    const totalPages = Math.ceil(totalPlots / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    const pagination = {
      currentPage: page,
      totalPages,
      totalPlots,
      limit,
      hasNextPage,
      hasPrevPage
    }

    // Format filters data
    let filters: {
      locations: string[];
      developers: string[];
      types: string[];
      statuses: string[];
      subtypes: string[];
      ownershipTypes: string[];
    } = {
      locations: [],
      developers: [],
      types: [],
      statuses: [],
      subtypes: [],
      ownershipTypes: []
    }

    if (filtersData) {
      filters = {
        locations: (filtersData[0] as string[]).sort(),
        developers: (filtersData[1] as string[]).sort(),
        types: (filtersData[2] as string[]).sort(),
        statuses: (filtersData[3] as string[]).sort(),
        subtypes: (filtersData[4] as string[]).sort(),
        ownershipTypes: (filtersData[5] as string[]).sort()
      }
    }

    return NextResponse.json({
      success: true,
      plots,
      pagination,
      filters
    }, { status: 200 })

  } catch (error: any) {
    console.error('Error fetching plots:', error)

    // Handle specific database connection errors
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      return NextResponse.json({
        success: false,
        message: 'Database connection failed',
        error: 'DATABASE_CONNECTION_ERROR'
      }, { status: 503 })
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return NextResponse.json({
        success: false,
        message: 'Invalid query parameters',
        error: 'VALIDATION_ERROR',
        details: error.message
      }, { status: 400 })
    }

    // Handle timeout errors
    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      return NextResponse.json({
        success: false,
        message: 'Request timeout - please try again',
        error: 'REQUEST_TIMEOUT'
      }, { status: 408 })
    }

    // Generic error response
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch plots',
      error: error.message || 'UNKNOWN_ERROR'
    }, { status: 500 })
  }
}