import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '../../../../lib/db'
import Career from '../../../../models/careers'

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase()

    // Fetch all active careers, latest first
    const careers = await Career.find({ isActive: true })
      .sort({ postedDate: -1 }) // Latest posted first
      .lean() // Optional: returns plain JS objects instead of Mongoose documents

    return NextResponse.json({
      success: true,
      careers
    }, { status: 200 })

  } catch (error: any) {
    console.error('Error fetching careers:', error)

    return NextResponse.json({
      success: false,
      message: 'Failed to fetch careers',
      error: error.message || 'UNKNOWN_ERROR'
    }, { status: 500 })
  }
}
