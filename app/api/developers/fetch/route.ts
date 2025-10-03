import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import { withCollectionPermission } from "@/lib/auth/server"
import { Action, Collection } from "@/types/user"
import Developer from "@/models/developers"

async function handler(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const { searchParams } = new URL(request.url)
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit
    
    // Search parameter
    const search = searchParams.get('search') || ''
    
    // Sort parameter (default: newest first)
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    // Build search query
    const searchQuery = search ? {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { specialization: { $in: [new RegExp(search, 'i')] } }
      ]
    } : {}
    
    // Build sort object
    const sortObject: any = {}
    sortObject[sortBy] = sortOrder === 'desc' ? -1 : 1
    
    // Only select necessary fields for the card view
    const developers = await Developer.find(searchQuery)
      .select('name slug logo location website description overview coverImage email phone awards establishedYear specialization verified createdAt updatedAt')
      .sort(sortObject)
      .skip(skip)
      .limit(limit)
      .lean()
    
    // Get total count for pagination
    const totalDevelopers = await Developer.countDocuments(searchQuery)
    const totalPages = Math.ceil(totalDevelopers / limit)
    
    return NextResponse.json({ 
      success: true, 
      data: developers,
      pagination: {
        currentPage: page,
        totalPages,
        totalDevelopers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      }
    })
  } catch (error) {
    console.error("Error fetching developers:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch developers." },
      { status: 500 }
    )
  }
}

// Export with collection access protection + debug logging
export const GET = withCollectionPermission(Collection.DEVELOPERS, Action.VIEW)(handler);
