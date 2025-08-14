// middleware.ts - CORRECTED VERSION
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { parse } from "cookie";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const cookie = request.headers.get("cookie") || "";
  const cookies = parse(cookie);
  const sessionCookie = cookies.__session;

  // 🚨 CRITICAL: Skip ALL auth logic during logout process
  const isLogoutRequest = pathname.startsWith('/api/logout');
  const isLoggingOut = searchParams.get('logout') === 'true';
  const hasLogoutHeader = request.headers.get('x-logout-in-progress') === 'true';
  
  // Skip middleware entirely during logout
  if (isLogoutRequest || isLoggingOut || hasLogoutHeader) {
    console.log('🚫 Middleware: Skipping auth checks during logout');
    const response = NextResponse.next();
    // Add headers to prevent caching during logout
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }

  // Define paths
  const publicPaths = ["/login", "/api", "/_next", "/favicon.ico"];
  const isPublic = publicPaths.some((path) => pathname.startsWith(path));
  const isLoginPage = pathname === "/login";
  const isRoot = pathname === "/";

  // 🔍 Enhanced session validation - check both existence and validity
  const isValidSession = sessionCookie && 
                         sessionCookie.length > 20 && // Basic length check
                         sessionCookie.includes('.') && // JWT-like structure
                         !sessionCookie.includes('deleted'); // Not a cleared cookie

  // 🔒 Redirect authenticated users away from login/root
  if (isValidSession && (isLoginPage || isRoot)) {
    console.log('🔄 Redirecting authenticated user to dashboard');
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 🔐 Protect routes that require authentication
  const protectedRoutes = ["/dashboard", "/profile", "/settings"];
  const isProtected = protectedRoutes.some((path) =>
    pathname.startsWith(path)
  );

  if (isProtected && !isValidSession) {
    console.log('🔒 Redirecting unauthenticated user to login');
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    return response;
  }

  // Redirect unauthenticated users from root to login
  if (isRoot && !isValidSession) {
    console.log('🏠 Redirecting from root to login');
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 🔧 For all other requests, add security headers
  const response = NextResponse.next();
  
  // Prevent caching of auth-sensitive pages
  if (isProtected || isLoginPage) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files
     * - Skip _next/static (static files)
     * - Skip _next/image (image optimization)
     * - Skip favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)"],
};