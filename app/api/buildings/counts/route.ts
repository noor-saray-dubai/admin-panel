// app/api/buildings/counts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import Building from '@/models/buildings'

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    // Single aggregated query - much more efficient!
    const counts = await Building.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          residential: [
            { $match: { category: 'residential', isActive: true } },
            { $count: 'count' }
          ],
          commercial: [
            { $match: { category: 'commercial', isActive: true } },
            { $count: 'count' }
          ],
          mixed: [
            { $match: { category: 'mixed', isActive: true } },
            { $count: 'count' }
          ],
          forSale: [
            { 
              $match: { 
                'saleInformation.isForSale': true,
                isActive: true
              }
            },
            { $count: 'count' }
          ],
          verified: [
            { $match: { verified: true } },
            { $count: 'count' }
          ]
        }
      }
    ])

    const result = counts[0]
    const totalCount = result.total[0]?.count || 0
    const residentialCount = result.residential[0]?.count || 0
    const commercialCount = result.commercial[0]?.count || 0
    const mixedCount = result.mixed[0]?.count || 0
    const forSaleCount = result.forSale[0]?.count || 0
    const verifiedCount = result.verified[0]?.count || 0

    return NextResponse.json({
      success: true,
      counts: {
        total: totalCount,
        residential: residentialCount,
        commercial: commercialCount,
        mixed: mixedCount,
        forSale: forSaleCount,
        verified: verifiedCount
      }
    })

  } catch (error: any) {
    console.error('Error fetching building counts:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch building counts',
        error: error.message 
      },
      { status: 500 }
    )
  }
}