// app/api/auth/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { SessionValidationService, SessionValidationError } from "@/lib/auth/sessionValidationService";

/**
 * Session verification endpoint
 * CRITICAL: This checks if the session cookie is still valid and not revoked
 */
export async function POST(request: NextRequest) {
  console.log('🔍 [AUTH VERIFY] Starting session verification...');
  
  try {
    const sessionCookie = request.cookies.get("__session")?.value;

    if (!sessionCookie) {
      console.log('❌ [AUTH VERIFY] No session cookie found');
      return NextResponse.json(
        { valid: false, error: "No session cookie", cached: false },
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          }
        }
      );
    }

    // Use SessionValidationService with caching
    const validationResult = await SessionValidationService.validateSession(sessionCookie);

    if (!validationResult.valid) {
      // Type assertion since we know validationResult is SessionValidationError when valid is false
      const errorResult = validationResult as SessionValidationError;
      console.log('❌ [AUTH VERIFY] Session validation failed:', errorResult.error);
      return NextResponse.json(
        {
          valid: false,
          error: errorResult.error,
          code: errorResult.code,
          cached: errorResult.cached || false
        },
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          }
        }
      );
    }

    const cacheStatus = validationResult.cached ? 'CACHE HIT' : 'CACHE MISS';
    console.log(`✅ [AUTH VERIFY] Session valid for user: ${validationResult.uid} (${cacheStatus})`);

    return NextResponse.json(
      {
        valid: true,
        uid: validationResult.uid,
        email: validationResult.email,
        role: validationResult.role,
        cached: validationResult.cached || false
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      }
    );
  } catch (error: any) {
    console.error('❌ [AUTH VERIFY] Verification failed:', error.message || error);
    
    return NextResponse.json(
      { 
        valid: false, 
        error: "Session verification failed",
        cached: false
      },
      { 
        status: 401,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      }
    );
  }
}

// Also support GET for convenience during development
export async function GET(request: NextRequest) {
  return POST(request);
}