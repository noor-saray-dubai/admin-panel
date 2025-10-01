// app/api/auth/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

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
        { valid: false, error: "No session cookie" },
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          }
        }
      );
    }

    // Verify the session cookie with checkRevoked = true
    // This ensures revoked sessions (from logout) are rejected
    const decodedClaims = await adminAuth.verifySessionCookie(
      sessionCookie,
      true // 🔥 CRITICAL: checkRevoked = true ensures logout works
    );

    console.log('✅ [AUTH VERIFY] Session valid for user:', decodedClaims.uid);

    return NextResponse.json(
      {
        valid: true,
        uid: decodedClaims.uid,
        email: decodedClaims.email,
        role: decodedClaims.role || null,
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      }
    );
  } catch (error: any) {
    console.error('❌ [AUTH VERIFY] Verification failed:', error.code || error.message);
    
    // Specific error messages for debugging
    let errorMessage = "Invalid or expired session";
    if (error.code === 'auth/session-cookie-revoked') {
      errorMessage = "Session has been revoked (logged out)";
    } else if (error.code === 'auth/session-cookie-expired') {
      errorMessage = "Session has expired";
    }

    return NextResponse.json(
      { 
        valid: false, 
        error: errorMessage,
        code: error.code 
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