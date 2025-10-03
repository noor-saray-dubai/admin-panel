// app/api/projects/counts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import Project from '@/models/project'
import { withCollectionPermission } from '@/lib/auth/server'
import { Collection, Action } from '@/types/user'

async function handler(request: NextRequest) {
  try {
    await connectToDatabase()

    // Single aggregated query - much more efficient!
    const counts = await Project.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          elite: [
            { $match: { 'flags.elite': true } },
            { $count: 'count' }
          ],
          featured: [
            { 
              $match: { 
                $or: [
                  { 'flags.featured': true },
                  { featured: true }
                ]
              }
            },
            { $count: 'count' }
          ],
          launched: [
            { 
              $match: { 
                status: { 
                  $in: ['Launched', 'Launching Soon', 'Pre-Launch'] 
                }
              }
            },
            { $count: 'count' }
          ],
          completed: [
            { 
              $match: { 
                $or: [
                  { status: 'Completed' },
                  { status: 'Ready to Move' }
                ]
              }
            },
            { $count: 'count' }
          ],
          draft: [
            { 
              $match: { 
                $or: [
                  { status: 'Draft' },
                  { isActive: false }
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
    const eliteCount = result.elite[0]?.count || 0
    const featuredCount = result.featured[0]?.count || 0
    const launchedCount = result.launched[0]?.count || 0
    const completedCount = result.completed[0]?.count || 0
    const draftCount = result.draft[0]?.count || 0

    return NextResponse.json({
      success: true,
      counts: {
        total: totalCount,
        elite: eliteCount,
        featured: featuredCount,
        launched: launchedCount,
        completed: completedCount,
        draft: draftCount
      }
    })

  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch project counts',
        error: 'INTERNAL_ERROR' 
      },
      { status: 500 }
    )
  }
}

// Export with ZeroTrust collection permission validation
export const GET = withCollectionPermission(Collection.PROJECTS, Action.VIEW)(handler);
