// app/api/auth/refresh-session/route.ts

import { NextRequest, NextResponse } from "next/server";
import { SessionValidationService } from "@/lib/auth/sessionValidationService";
import { UnifiedServerAuth } from "@/lib/auth/server";

/**
 * POST /api/auth/refresh-session
 * Manually refresh/extend a user's session
 */
export async function POST(request: NextRequest) {
  try {
    // Get current user to ensure they're authenticated
    const authResult = await UnifiedServerAuth.getAuthenticatedUser(request);
    
    if (authResult.error) {
      return NextResponse.json(
        { 
          success: false, 
          error: authResult.error,
          message: "Session refresh failed - not authenticated"
        },
        { status: 401 }
      );
    }

    // Get session cookie
    const sessionCookie = request.cookies.get('__session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json(
        { 
          success: false, 
          error: "No session cookie found",
          message: "Cannot refresh session without existing session"
        },
        { status: 400 }
      );
    }

    // Validate and refresh session
    const validationResult = await SessionValidationService.validateSession(sessionCookie);
    
    if (!validationResult.valid) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid session",
          message: "Cannot refresh invalid session"
        },
        { status: 401 }
      );
    }

    // Session is now refreshed (if it was close to expiring)
    return NextResponse.json({
      success: true,
      message: "Session refreshed successfully",
      session: {
        uid: validationResult.uid,
        email: validationResult.email,
        verified_at: validationResult.verified_at,
        expires_at: validationResult.expires_at,
        was_cached: validationResult.cached || false
      }
    });

  } catch (error) {
    console.error("Session refresh error:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: "INTERNAL_ERROR",
        message: "Session refresh failed due to server error"
      },
      { status: 500 }
    );
  }
}