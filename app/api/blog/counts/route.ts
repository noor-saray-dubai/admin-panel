// app/api/blog/counts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import Blog from '@/models/blog'
import { withCollectionPermission } from '@/lib/auth/server'
import { Collection, Action } from '@/types/user'

async function handler(request: NextRequest) {
  try {
    await connectToDatabase()

    // Single aggregated query - much more efficient!
    const counts = await Blog.aggregate([
      {
        $facet: {
          total: [{ $match: { isActive: true } }, { $count: 'count' }],
          published: [
            { 
              $match: { 
                isActive: true,
                status: 'Published'
              }
            },
            { $count: 'count' }
          ],
          draft: [
            { 
              $match: { 
                isActive: true,
                status: 'Draft'
              }
            },
            { $count: 'count' }
          ],
          featured: [
            { 
              $match: { 
                isActive: true,
                featured: true
              }
            },
            { $count: 'count' }
          ],
          popular: [
            { 
              $match: { 
                isActive: true,
                views: { $gte: 100 }
              }
            },
            { $count: 'count' }
          ]
        }
      }
    ])

    const result = counts[0]
    const totalCount = result.total[0]?.count || 0
    const publishedCount = result.published[0]?.count || 0
    const draftCount = result.draft[0]?.count || 0
    const featuredCount = result.featured[0]?.count || 0
    const popularCount = result.popular[0]?.count || 0

    return NextResponse.json({
      success: true,
      counts: {
        all: totalCount,
        published: publishedCount,
        draft: draftCount,
        featured: featuredCount,
        popular: popularCount
      }
    })

  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch blog counts',
        error: 'INTERNAL_ERROR' 
      },
      { status: 500 }
    )
  }
}

// Export with ZeroTrust collection permission validation
export const GET = withCollectionPermission(Collection.BLOGS, Action.VIEW)(handler);