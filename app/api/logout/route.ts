// app/api/logout/route.ts - ENHANCED VERSION
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

// All possible cookie names that could contain auth data
const AUTH_COOKIES = [
  "__session",
  "auth-token",
  "firebase-token", 
  "refresh-token",
  "session-id",
  "user-session",
  "firebase-installations-auth-token",
  "firebase-installations-store",
  "firebase-auth-state",
  "firebase-heartbeat-store",
  "next-auth.session-token",
  "next-auth.csrf-token",
  "__Secure-next-auth.session-token",
  "session",
  "token",
  "authToken"
];

export async function POST(request: NextRequest) {
  console.log("🚪 [LOGOUT] Enhanced logout API called");
  const startTime = Date.now();

  try {
    // Get all cookies from request for comprehensive clearing
    const allCookies = request.cookies.getAll();
    console.log("🍪 [LOGOUT] Found cookies:", allCookies.map(c => c.name));

    // 1️⃣ Revoke Firebase session - MOST CRITICAL STEP
    const sessionCookie = request.cookies.get("__session")?.value;
    let uid: string | null = null;

    if (sessionCookie && sessionCookie.length > 10) {
      try {
        console.log("🔥 [LOGOUT] Revoking Firebase session...");
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, false);
        uid = decodedToken.uid;
        
        // 🔥 CRITICAL: Revoke ALL refresh tokens for this user
        await adminAuth.revokeRefreshTokens(decodedToken.uid);
        
        // Clear custom claims
        await adminAuth.setCustomUserClaims(decodedToken.uid, {});
        
        console.log(`✅ [LOGOUT] Firebase session revoked for user: ${decodedToken.uid}`);
      } catch (firebaseErr: any) {
        console.error("❌ [LOGOUT] Firebase revocation failed:", firebaseErr.message);
        // Continue - don't let Firebase errors block logout
      }
    } else {
      console.log("⚠️ [LOGOUT] No valid session cookie found for Firebase revocation");
    }

    // 2️⃣ Create response with aggressive anti-cache and cookie-clearing headers
    const response = NextResponse.json(
      {
        success: true,
        message: "Logged out successfully", 
        uid: uid,
        timestamp: new Date().toISOString(),
        processTime: Date.now() - startTime,
        cookiesCleared: AUTH_COOKIES.length + allCookies.length,
      },
      { 
        status: 200,
        headers: {
          // 🔥 NUCLEAR OPTION: Clear-Site-Data tells browser to wipe everything
          'Clear-Site-Data': '"cache", "cookies", "storage", "executionContexts"',
          // Anti-cache headers
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0, private',
          'Pragma': 'no-cache',
          'Expires': '0',
          // Additional security
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
        }
      }
    );

    // 3️⃣ Generate all domain variations for cookie clearing
    const hostname = request.headers.get("host") || "localhost";
    const domains = [
      undefined, // host-only cookies
      hostname,
    ];

    // Add production domains
    if (process.env.NODE_ENV === "production") {
      const mainDomain = process.env.NEXT_PUBLIC_DOMAIN || "noorsaray.com";
      domains.push(
        `.${mainDomain}`,
        mainDomain,
        `.${mainDomain}`.replace('..', '.') // Clean up any double dots
      );
    } else {
      domains.push("localhost", ".localhost", "127.0.0.1");
    }

    console.log("🧹 [LOGOUT] Clearing cookies for domains:", domains);

    // 4️⃣ Clear ALL predefined auth cookies with all variations
    AUTH_COOKIES.forEach(cookieName => {
      domains.forEach(domain => {
        // HttpOnly version (server-side cookies)
        const httpOnlyCookie: any = {
          name: cookieName,
          value: "",
          path: "/",
          expires: new Date(0),
          maxAge: 0,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        };

        if (domain) httpOnlyCookie.domain = domain;
        response.cookies.set(httpOnlyCookie);

        // Non-HttpOnly version (client-side cookies)
        const clientCookie: any = {
          name: cookieName,
          value: "",
          path: "/",
          expires: new Date(0),
          maxAge: 0,
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        };

        if (domain) clientCookie.domain = domain;
        response.cookies.set(clientCookie);

        // Also try with sameSite: "strict" and "none"
        if (process.env.NODE_ENV === "production") {
          response.cookies.set({ ...httpOnlyCookie, sameSite: "strict" });
          response.cookies.set({ 
            ...httpOnlyCookie, 
            sameSite: "none", 
            secure: true // Required for sameSite=none
          });
        }
      });
    });

    // 5️⃣ Clear ALL cookies found in the request (nuclear option)
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

        if (domain) cookieOptions.domain = domain;
        response.cookies.set(cookieOptions);

        // Also clear as client-side cookie
        response.cookies.set({
          ...cookieOptions,
          httpOnly: false,
        });
      });
    });

    console.log(`✅ [LOGOUT] Completed successfully in ${Date.now() - startTime}ms`);
    return response;

  } catch (error) {
    console.error("❌ [LOGOUT] API error:", error);

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
          'Clear-Site-Data': '"cache", "cookies", "storage"',
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