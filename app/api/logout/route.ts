// app/api/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { adminAuth } from "@/lib/firebaseAdmin";
import { createAuthService } from "@/lib/auth/AuthService";
import { AuditLog, AuditAction, AuditLevel } from "@/models/auditLog";

// All possible cookie names that could contain auth data
const AUTH_COOKIES = [
  "__session",
  "auth-token",
  "firebase-token", 
  "refresh-token",
  "session-id",
  "user-session",
  // Firebase specific
  "firebase-installations-auth-token",
  "firebase-installations-store",
  "firebase-auth-state",
  "firebase-heartbeat-store",
  // Next.js auth
  "next-auth.session-token",
  "next-auth.csrf-token",
  "__Secure-next-auth.session-token",
  // Generic
  "session",
  "token",
  "authToken"
];

export async function POST(request: NextRequest) {
  console.log(" Enhanced logout API called");
  const startTime = Date.now();

  try {
    // Get request data for logout
    const body = await request.json().catch(() => ({}));
    const { firebaseUid, email } = body;

    // Get client info for audit log
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;

    // Get all cookies from request for comprehensive clearing
    const allCookies = request.cookies.getAll();
    console.log("Found cookies:", allCookies.map(c => c.name));

    // Connect to database (don't let DB errors stop logout)
    try {
      await connectToDatabase();
      console.log("Database connected");
    } catch (dbErr) {
      console.warn("Database connection failed during logout:", dbErr);
    }

    // 1️⃣ Revoke Firebase session aggressively
    const sessionCookie = request.cookies.get("__session")?.value;
    if (sessionCookie && sessionCookie.length > 10) {
      try {
        console.log(" Revoking Firebase session...");
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        
        // Revoke ALL refresh tokens for this user
        await adminAuth.revokeRefreshTokens(decodedToken.uid);
        
        // Clear custom claims
        await adminAuth.setCustomUserClaims(decodedToken.uid, {});
        
        console.log(` Firebase session revoked for user: ${decodedToken.uid}`);
        
        // Log successful logout
        try {
          await AuditLog.create({
            action: AuditAction.USER_LOGOUT,
            success: true,
            ip,
            userAgent,
            userEmail: email || decodedToken.email,
            timestamp: new Date(),
          });
        } catch (auditErr) {
          console.error('Failed to log logout audit:', auditErr);
        }
        
      } catch (firebaseErr) {
        console.error(" Firebase revocation failed:", firebaseErr);
        
        // Log failed logout attempt
        try {
          await AuditLog.create({
            action: AuditAction.USER_LOGOUT,
            success: false,
            level: AuditLevel.ERROR,
            errorMessage: firebaseErr instanceof Error ? firebaseErr.message : 'Firebase error',
            ip,
            userAgent,
            userEmail: email,
            timestamp: new Date(),
          });
        } catch (auditErr) {
          console.error('Failed to log failed logout audit:', auditErr);
        }
        
        // Continue - don't let Firebase errors block logout
      }
    } else {
      console.log("⚠️ No valid session cookie found for Firebase revocation");
      
      // Still log the logout attempt even without session
      if (firebaseUid || email) {
        try {
          await AuditLog.create({
            action: AuditAction.USER_LOGOUT,
            success: true,
            ip,
            userAgent,
            userEmail: email,
            details: { note: 'No session cookie found' },
            timestamp: new Date(),
          });
        } catch (auditErr) {
          console.error('Failed to log logout audit:', auditErr);
        }
      }
    }

    // 2️⃣ Create response with anti-cache headers
    const response = NextResponse.json(
      {
        success: true,
        message: "Logged out successfully", 
        timestamp: new Date().toISOString(),
        processTime: Date.now() - startTime,
        cookiesCleared: AUTH_COOKIES.length + allCookies.length,
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Clear-Site-Data': '"cache", "cookies", "storage", "executionContexts"'
        }
      }
    );

    // 3 Generate all domain variations for cookie clearing
    const hostname = request.headers.get("host") || "localhost";
    const domains = [
      undefined, // host-only cookies
      hostname,
    ];

    // Add production domains
    if (process.env.NODE_ENV === "production") {
      domains.push(
        `.${process.env.NEXT_PUBLIC_DOMAIN || "noorsaray.com"}`,
        "noorsaray.com",
        ".noorsaray.com"
      );
    } else {
      domains.push("localhost", ".localhost", "127.0.0.1");
    }

    console.log(" Clearing cookies for domains:", domains);

    // 4️⃣ Clear ALL predefined auth cookies
    AUTH_COOKIES.forEach(cookieName => {
      domains.forEach(domain => {
        const cookieOptions: any = {
          name: cookieName,
          value: "",
          path: "/",
          expires: new Date(0),
          maxAge: 0,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        };

        if (domain) {
          cookieOptions.domain = domain;
        }

        response.cookies.set(cookieOptions);

        // Also try with httpOnly: false for client-side cookies
        response.cookies.set({
          ...cookieOptions,
          httpOnly: false,
        });
      });
    });

    //  Clear ALL cookies found in the request (nuclear option)
    allCookies.forEach(cookie => {
      domains.forEach(domain => {
        const cookieOptions: any = {
          name: cookie.name,
          value: "",
          path: "/",
          expires: new Date(0),
          maxAge: 0,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        };

        if (domain) {
          cookieOptions.domain = domain;
        }

        response.cookies.set(cookieOptions);

        // Also clear as client-side cookie
        response.cookies.set({
          ...cookieOptions,
          httpOnly: false,
        });
      });
    });

    console.log(` Logout completed successfully in ${Date.now() - startTime}ms`);
    return response;

  } catch (error) {
    console.error("❌ Logout API error:", error);

    // Even on error, try to clear cookies
    const response = NextResponse.json(
      {
        success: false,
        error: "Logout processing failed",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        note: "Cookies will still be cleared"
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache', 
          'Expires': '0',
        }
      }
    );

    // Emergency cookie clearing even on error
    AUTH_COOKIES.forEach(cookieName => {
      response.cookies.set({
        name: cookieName,
        value: "",
        path: "/",
        expires: new Date(0),
        maxAge: 0,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      // Also client-side
      response.cookies.set({
        name: cookieName,
        value: "",
        path: "/",
        expires: new Date(0),
        maxAge: 0,
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
    });

    return response;
  }
}

// Support GET for backward compatibility
export async function GET(request: NextRequest) {
  return POST(request);
}