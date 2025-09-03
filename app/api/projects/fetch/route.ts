import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '../../../../lib/db'
import Project from '../../../../models/project'

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
    const featured = searchParams.get('featured')

    // Build filter query
    let filterQuery: any = { isActive: true }

    // Search functionality
    if (search) {
      filterQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { developer: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
        { categories: { $in: [new RegExp(search, 'i')] } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ]
    }

    // Tab-specific filtering
    if (tab === 'elite') {
      filterQuery['flags.elite'] = true
    } else if (tab === 'new-launch') {
      filterQuery.status = { $in: ['Launching Soon', 'Launched', 'Pre-Launch'] }
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
    
    if (featured && featured !== 'all') {
      if (featured === 'true') {
        filterQuery.featured = true
      } else if (featured === 'false') {
        filterQuery.featured = false
      }
    }

    // Execute queries in parallel for better performance
    const [projects, totalProjects, filtersData] = await Promise.all([
      // Main query with pagination
      Project.find(filterQuery)
        .select('-__v') // Exclude version key
        .sort({ updatedAt: -1, createdAt: -1 }) // Latest first
        .skip(skip)
        .limit(limit)
        .lean(), // Use lean for better performance

      // Count total documents
      Project.countDocuments(filterQuery),

      // Get filter data (only when no specific filters are applied for better performance)
      search || location || developer || type || status ? 
        Promise.resolve(null) : 
        Promise.all([
          Project.distinct('location', { isActive: true }),
          Project.distinct('developer', { isActive: true }),
          Project.distinct('type', { isActive: true }),
          Project.distinct('status', { isActive: true })
        ])
    ])

    // Calculate pagination info
    const totalPages = Math.ceil(totalProjects / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    const pagination = {
      currentPage: page,
      totalPages,
      totalProjects,
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
    } = {
      locations: [],
      developers: [],
      types: [],
      statuses: []
    }

    if (filtersData) {
      filters = {
        locations: (filtersData[0] as string[]).sort(),
        developers: (filtersData[1] as string[]).sort(),
        types: (filtersData[2] as string[]).sort(),
        statuses: (filtersData[3] as string[]).sort()
      }
    }

    return NextResponse.json({
      success: true,
      projects,
      pagination,
      filters
    }, { status: 200 })

  } catch (error: any) {
    console.error('Error fetching projects:', error)

    return NextResponse.json({
      success: false,
      message: 'Failed to fetch projects',
      error: error.message || 'UNKNOWN_ERROR'
    }, { status: 500 })
  }
}