// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // ═══════════════════════════════════════════════════════════
  // PHASE 0: BYPASS - LET THESE THROUGH IMMEDIATELY
  // ═══════════════════════════════════════════════════════════
  
  const bypassPaths = [
    "/api/",           // ALL API routes
    "/_next/",         // Next.js internals
    "/favicon.ico",
    "/forgot-password" // Password reset
  ];
  
  if (bypassPaths.some(path => pathname.startsWith(path))) {
    // console.log('⚡ [MIDDLEWARE] BYPASS:', pathname);
    return NextResponse.next();
  }

  // ═══════════════════════════════════════════════════════════
  // PHASE 1: LOGOUT DETECTION
  // ═══════════════════════════════════════════════════════════
  
  const logoutCookie = request.cookies.get("__logout")?.value === "true";
  const logoutParam = searchParams.get('logout') === 'true';
  const logoutHeader = request.headers.get('x-logout-in-progress') === 'true';
  const isLogoutAPI = pathname === '/api/logout';
  
  const isLoggingOut = logoutCookie || logoutParam || logoutHeader || isLogoutAPI;
  
  if (isLoggingOut) {
    // console.log('🚫 [MIDDLEWARE] LOGOUT DETECTED');
    
    // PREVENT REDIRECT LOOP: If already on login page, just clear cookies and continue
    if (pathname === '/login') {
      const response = NextResponse.next();
      
      // Clear all auth cookies
      const authCookies = [
        "__session", "__logout", "auth-token", "firebase-token",
        "refresh-token", "session-id", "user-session"
      ];
      
      const isProduction = process.env.NODE_ENV === "production";
      
      authCookies.forEach(cookieName => {
        response.cookies.set({
          name: cookieName,
          value: "",
          path: "/",
          expires: new Date(0),
          maxAge: 0,
          httpOnly: true,
          secure: isProduction,
          sameSite: "lax",
        });
      });
      
      response.headers.set('Clear-Site-Data', '"cache", "cookies", "storage"');
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      
      return response;
    }
    
    // Redirect to login page only if not already there
    const targetUrl = new URL('/login?logout=true', request.url);
    const response = NextResponse.redirect(targetUrl);
    
    // Clear all auth cookies
    const authCookies = [
      "__session", "__logout", "auth-token", "firebase-token",
      "refresh-token", "session-id", "user-session"
    ];
    
    const isProduction = process.env.NODE_ENV === "production";
    
    authCookies.forEach(cookieName => {
      response.cookies.set({
        name: cookieName,
        value: "",
        path: "/",
        expires: new Date(0),
        maxAge: 0,
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
      });
    });
    
    response.headers.set('Clear-Site-Data', '"cache", "cookies", "storage"');
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    return response;
  }

  // ═══════════════════════════════════════════════════════════
  // PHASE 2: SESSION CHECK
  // ═══════════════════════════════════════════════════════════
  
  const sessionCookie = request.cookies.get("__session")?.value;
  const hasSessionCookie = sessionCookie && 
                           sessionCookie.length > 20 && 
                           sessionCookie.includes('.');
  
  // console.log('🔍 [MIDDLEWARE DEBUG] Path:', pathname, 'Cookie exists:', !!sessionCookie, 'Has valid cookie:', hasSessionCookie);
  
  // ═══════════════════════════════════════════════════════════
  // PHASE 3: HANDLE PUBLIC ROUTES (login, register)
  // ═══════════════════════════════════════════════════════════
  
  const publicRoutes = ["/login", "/register"];
  const isPublicRoute = publicRoutes.includes(pathname);
  
  if (isPublicRoute) {
    // If already logged in, redirect to dashboard
    if (hasSessionCookie) {
      // console.log('✅ [MIDDLEWARE] Already logged in, redirecting /login → /dashboard');
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    
    // Not logged in, allow access to login/register
    // console.log('🌐 [MIDDLEWARE] Public route allowed:', pathname);
    return NextResponse.next();
  }

  // ═══════════════════════════════════════════════════════════
  // PHASE 4: HANDLE ROOT PATH (/)
  // ═══════════════════════════════════════════════════════════
  
  if (pathname === "/") {
    if (hasSessionCookie) {
      // Logged in: redirect / → /dashboard
      // console.log('✅ [MIDDLEWARE] Root with session, redirecting / → /dashboard');
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      // Not logged in: redirect / → /login
      // console.log('🔒 [MIDDLEWARE] Root without session, redirecting / → /login');
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // ═══════════════════════════════════════════════════════════
  // PHASE 5: PROTECTED ROUTES
  // ═══════════════════════════════════════════════════════════
  
  const protectedRoutes = ["/dashboard", "/profile", "/settings", "/admin"];
  const isProtected = protectedRoutes.some((path) => pathname.startsWith(path));
  
  // If not protected, allow through
  if (!isProtected) {
    // console.log('🌐 [MIDDLEWARE] Non-protected path, allowing:', pathname);
    return NextResponse.next();
  }

  // Protected route - need valid session
  if (!hasSessionCookie) {
    // console.log('❌ [MIDDLEWARE] No session cookie, redirecting to login');
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  // Verify session with lightweight cache check
  let isValidSession = false;
  
  try {
    // console.log('🔍 [MIDDLEWARE] Verifying session with cache...');
    
    // Use the /api/auth/verify endpoint which now uses SessionValidationService internally
    const verifyUrl = new URL('/api/auth/verify', request.url);
    const verifyResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Cookie': `__session=${sessionCookie}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(3000),
    });
    
    if (verifyResponse.ok) {
      const data = await verifyResponse.json();
      isValidSession = data.valid === true;
      
      // Log cache performance
      if (data.cached) {
        // console.log('⚡ [MIDDLEWARE] Session validated from cache');
      } else {
        // console.log('🔥 [MIDDLEWARE] Session validated from Firebase (cache miss)');
      }
    }
  } catch (error) {
    // console.error('⚠️ [MIDDLEWARE] Session verification failed:', error);
    isValidSession = false;
  }

  // Invalid session? Clear cookie and redirect
  if (!isValidSession) {
    // console.log('🔒 [MIDDLEWARE] Invalid session, redirecting to login');
    
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.set({
      name: "__session",
      value: "",
      path: "/",
      expires: new Date(0),
      maxAge: 0,
    });
    return response;
  }

  // ═══════════════════════════════════════════════════════════
  // VALID SESSION - ALLOW ACCESS
  // ═══════════════════════════════════════════════════════════
  
  // console.log('✅ [MIDDLEWARE] Valid session, allowing access to:', pathname);
  
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};