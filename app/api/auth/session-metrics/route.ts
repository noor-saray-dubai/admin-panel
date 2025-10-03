// app/api/auth/session-metrics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { SessionValidationService } from '@/lib/auth/sessionValidationService';
import { withSystemAdmin } from '@/lib/auth/server';

/**
 * GET handler - View session validation performance metrics
 * Requires system admin access
 */
async function handler(request: NextRequest) {
  try {
    // Get performance metrics
    const metrics = SessionValidationService.getMetrics();
    
    // Get health status
    const health = await SessionValidationService.healthCheck();
    
    // Calculate some additional insights
    const insights = {
      performance_grade: metrics.avg_response_time < 50 ? 'A' : 
                        metrics.avg_response_time < 100 ? 'B' : 
                        metrics.avg_response_time < 200 ? 'C' : 'D',
      
      cache_effectiveness: metrics.cache_hit_rate > 80 ? 'Excellent' : 
                          metrics.cache_hit_rate > 60 ? 'Good' : 
                          metrics.cache_hit_rate > 40 ? 'Fair' : 'Poor',
      
      firebase_calls_saved: Math.max(0, metrics.cache_hits),
      
      estimated_time_saved_ms: Math.round(metrics.cache_hits * 150), // Assume ~150ms saved per cache hit
    };

    const response = {
      success: true,
      data: {
        metrics,
        health,
        insights,
        recommendations: getRecommendations(metrics, health)
      },
      timestamp: new Date().toISOString()
    };

    console.log('Session Metrics API Response:', JSON.stringify(response, null, 2));
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching session metrics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch session metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST handler - Reset performance metrics
 * Requires system admin access
 */
async function resetHandler(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'reset_metrics') {
      SessionValidationService.resetMetrics();
      
      return NextResponse.json({
        success: true,
        message: 'Performance metrics reset successfully',
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "reset_metrics"' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error resetting session metrics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to reset session metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Generate recommendations based on metrics
 */
function getRecommendations(metrics: any, health: any) {
  const recommendations = [];
  
  if (metrics.cache_hit_rate < 50) {
    recommendations.push({
      type: 'performance',
      priority: 'high',
      message: 'Cache hit rate is low. Consider increasing cache TTL or investigating session patterns.'
    });
  }
  
  if (metrics.avg_response_time > 100) {
    recommendations.push({
      type: 'performance',
      priority: 'medium',
      message: 'Average response time is high. Check Redis connection and network latency.'
    });
  }
  
  if (health.details.redis_response_time > 50) {
    recommendations.push({
      type: 'infrastructure',
      priority: 'medium',
      message: 'Redis response time is elevated. Consider checking Redis server performance.'
    });
  }
  
  if (metrics.total_requests > 1000 && metrics.cache_hit_rate > 80) {
    recommendations.push({
      type: 'success',
      priority: 'info',
      message: '🎉 Excellent cache performance! Session validation is highly optimized.'
    });
  }
  
  return recommendations;
}

// Export with system admin protection
export const GET = withSystemAdmin(handler);
export const POST = withSystemAdmin(resetHandler);