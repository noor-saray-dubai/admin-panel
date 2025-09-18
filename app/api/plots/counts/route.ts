// app/api/plots/counts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import Plot from '@/models/plots'

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    // Single aggregated query - much more efficient!
    const counts = await Plot.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          industrial: [
            { $match: { type: 'industrial' } },
            { $count: 'count' }
          ],
          community: [
            { $match: { type: 'community' } },
            { $count: 'count' }
          ],
          building: [
            { $match: { type: 'building' } },
            { $count: 'count' }
          ],
          available: [
            { $match: { isAvailable: true, isActive: true } },
            { $count: 'count' }
          ]
        }
      }
    ])

    const result = counts[0]
    const totalCount = result.total[0]?.count || 0
    const industrialCount = result.industrial[0]?.count || 0
    const communityCount = result.community[0]?.count || 0
    const buildingCount = result.building[0]?.count || 0
    const availableCount = result.available[0]?.count || 0

    return NextResponse.json({
      success: true,
      counts: {
        total: totalCount,
        industrial: industrialCount,
        community: communityCount,
        building: buildingCount,
        available: availableCount
      }
    })

  } catch (error: any) {
    console.error('Error fetching plot counts:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch plot counts',
        error: error.message 
      },
      { status: 500 }
    )
  }
}