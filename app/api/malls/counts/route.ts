// app/api/malls/counts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import Mall from '@/models/malls'
import { withCollectionPermission } from '@/lib/auth/server'
import { Collection, Action } from '@/types/user'

async function handler(request: NextRequest) {
  // User is available on request.user (added by withCollectionPermission)
  const user = (request as any).user;
  try {
    await connectToDatabase()

    // Single aggregated query - much more efficient!
    const counts = await Mall.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          available: [
            { 
              $match: { 
                $or: [
                  { 'saleDetails.isForSale': true },
                  { 'saleDetails.isForInvestment': true }
                ]
              }
            },
            { $count: 'count' }
          ],
          operational: [
            { $match: { status: 'Operational' } },
            { $count: 'count' }
          ],
          sold: [
            { 
              $match: { 
                $or: [
                  { 'saleDetails.isSold': true },
                  { status: 'Sold' }
                ]
              }
            },
            { $count: 'count' }
          ],
          verified: [
            { $match: { isVerified: true } },
            { $count: 'count' }
          ],
          draft: [
            { 
              $match: { 
                $or: [
                  { status: 'Draft' },
                  { isPublished: false }
                ]
              }
            },
            { $count: 'count' }
          ]
        }
      }
    ])

    const result = counts[0]
    const totalCount = result.total[0]?.count || 0
    const availableCount = result.available[0]?.count || 0
    const operationalCount = result.operational[0]?.count || 0
    const soldCount = result.sold[0]?.count || 0
    const verifiedCount = result.verified[0]?.count || 0
    const draftCount = result.draft[0]?.count || 0

    return NextResponse.json({
      success: true,
      counts: {
        total: totalCount,
        available: availableCount,
        operational: operationalCount,
        sold: soldCount,
        verified: verifiedCount,
        draft: draftCount
      }
    })

  } catch (error: any) {
    console.error('Error fetching mall counts:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch mall counts',
        error: error.message 
      },
      { status: 500 }
    )
  }
}

// Export with ZeroTrust collection permission validation
export const GET = withCollectionPermission(Collection.MALLS, Action.VIEW)(handler);
