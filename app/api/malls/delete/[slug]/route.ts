import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '../../../../../lib/db'
import Mall from '../../../../../models/malls'
import { withCollectionPermission } from '@/lib/auth/server'
import { Collection, Action } from '@/types/user'

// Force Node.js runtime
export const runtime = "nodejs"

/**
 * DELETE handler with ZeroTrust authentication
 */
async function handler(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  // User is available on request.user (added by withCollectionPermission)
  const user = (req as any).user;
  
  // Create audit context for logging
  const audit = {
    email: user.email || 'unknown',
    ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
    userAgent: req.headers.get('user-agent') || 'unknown'
  };
  try {
    await connectToDatabase()

    const { slug } = await params

    if (!slug) {
      return NextResponse.json({
        success: false,
        message: 'Mall slug is required',
        error: 'MISSING_SLUG'
      }, { status: 400 })
    }

    // Find the mall first to check if it exists
    const mall = await Mall.findOne({ slug: slug })

    if (!mall) {
      return NextResponse.json({
        success: false,
        message: 'Mall not found',
        error: 'NOT_FOUND'
      }, { status: 404 })
    }

    // Log deletion attempt
    console.log(`Mall deletion requested by ${user.email}:`, {
      id: mall._id,
      mallId: mall.mallId,
      name: mall.name,
      slug: mall.slug,
      location: mall.location
    })

    // Delete the mall
    await Mall.findOneAndDelete({ slug: slug })

    // Log successful deletion
    console.log(`Mall deleted successfully by ${user.email}:`, {
      id: mall._id,
      mallId: mall.mallId,
      name: mall.name,
      slug: mall.slug
    })

    return NextResponse.json({
      success: true,
      message: 'Mall deleted successfully',
      deletedMall: {
        id: mall._id,
        slug: mall.slug,
        name: mall.name,
        mallId: mall.mallId,
        location: mall.location,
        deletedBy: user.firebaseUid,
        deletedByEmail: user.email,
        deletedAt: new Date().toISOString()
      }
    }, { status: 200 })

  } catch (error: any) {
    console.error('Error deleting mall:', error)

    // Handle specific database connection errors
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      return NextResponse.json({
        success: false,
        message: 'Database connection failed',
        error: 'DATABASE_CONNECTION_ERROR'
      }, { status: 503 })
    }

    // Handle cast errors (invalid ObjectId)
    if (error.name === 'CastError') {
      return NextResponse.json({
        success: false,
        message: 'Invalid mall identifier',
        error: 'INVALID_MALL_ID'
      }, { status: 400 })
    }

    // Generic error response
    return NextResponse.json({
      success: false,
      message: 'Failed to delete mall',
      error: error.message || 'UNKNOWN_ERROR'
    }, { status: 500 })
  }
}

// Export with ZeroTrust collection permission validation
export const DELETE = withCollectionPermission(Collection.MALLS, Action.DELETE)(handler);
