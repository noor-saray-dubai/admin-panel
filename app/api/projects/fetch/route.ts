import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '../../../../lib/db'
import Project from '../../../../models/project'

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase()

    const projects = await Project.find().sort({ createdAt: -1 }) // Latest first

    return NextResponse.json({
      success: true,
      projects
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
