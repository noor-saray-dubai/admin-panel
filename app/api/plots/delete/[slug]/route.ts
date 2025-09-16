import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '../../../../../lib/db'
import Plot from '../../../../../models/plots'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await connectToDatabase()

    const { slug } = params

    if (!slug) {
      return NextResponse.json({
        success: false,
        message: 'Plot slug is required'
      }, { status: 400 })
    }

    // Find the plot first to check if it exists
    const plot = await Plot.findOne({ slug: slug })

    if (!plot) {
      return NextResponse.json({
        success: false,
        message: 'Plot not found'
      }, { status: 404 })
    }

    // Delete the plot
    await Plot.findOneAndDelete({ slug: slug })

    return NextResponse.json({
      success: true,
      message: 'Plot deleted successfully',
      deletedPlot: {
        id: plot._id,
        slug: plot.slug,
        title: plot.title,
        plotId: plot.plotId
      }
    }, { status: 200 })

  } catch (error: any) {
    console.error('Error deleting plot:', error)

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
        message: 'Invalid plot identifier',
        error: 'INVALID_PLOT_ID'
      }, { status: 400 })
    }

    // Generic error response
    return NextResponse.json({
      success: false,
      message: 'Failed to delete plot',
      error: error.message || 'UNKNOWN_ERROR'
    }, { status: 500 })
  }
}