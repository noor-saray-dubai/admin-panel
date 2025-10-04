// app/api/debug/health/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { redis } from "@/lib/redis/redisClient";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function GET() {
  const startTime = Date.now();
  const results: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    status: 'checking...'
  };

  try {
    // 1. Check Database Connection
    console.log('🔍 [HEALTH] Checking database...');
    const dbStart = Date.now();
    try {
      await connectToDatabase();
      results.database = {
        status: 'connected',
        responseTime: Date.now() - dbStart
      };
    } catch (dbError: any) {
      results.database = {
        status: 'error',
        error: dbError.message,
        responseTime: Date.now() - dbStart
      };
    }

    // 2. Check Redis Connection
    console.log('🔍 [HEALTH] Checking Redis...');
    const redisStart = Date.now();
    try {
      const pingResult = await redis.ping();
      results.redis = {
        status: pingResult === 'PONG' ? 'connected' : 'error',
        responseTime: Date.now() - redisStart,
        response: pingResult
      };
    } catch (redisError: any) {
      results.redis = {
        status: 'error',
        error: redisError.message,
        responseTime: Date.now() - redisStart
      };
    }

    // 3. Check Firebase Admin SDK
    console.log('🔍 [HEALTH] Checking Firebase Admin...');
    const firebaseStart = Date.now();
    try {
      // Just check if adminAuth is initialized
      const authObject = adminAuth.app;
      results.firebase = {
        status: 'initialized',
        responseTime: Date.now() - firebaseStart,
        projectId: authObject?.options?.projectId || 'unknown'
      };
    } catch (firebaseError: any) {
      results.firebase = {
        status: 'error',
        error: firebaseError.message,
        responseTime: Date.now() - firebaseStart
      };
    }

    // 4. Overall Status
    const allHealthy = results.database?.status === 'connected' && 
                      results.redis?.status === 'connected' && 
                      results.firebase?.status === 'initialized';
    
    results.status = allHealthy ? 'healthy' : 'degraded';
    results.totalResponseTime = Date.now() - startTime;

    return NextResponse.json(results, { 
      status: allHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error: any) {
    console.error('❌ [HEALTH] Health check failed:', error);
    
    return NextResponse.json({
      ...results,
      status: 'unhealthy',
      error: error.message,
      totalResponseTime: Date.now() - startTime
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
}