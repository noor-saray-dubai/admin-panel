import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { parse } from "cookie";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookie = request.headers.get("cookie") || "";
  const cookies = parse(cookie);
  const sessionCookie = cookies.__session;

  const isLoggedIn = !!sessionCookie;

  const publicPaths = ["/login", "/api", "/_next", "/favicon.ico"];

  const isPublic = publicPaths.some((path) => pathname.startsWith(path));
  const isLoginPage = pathname === "/login";
  const isRoot = pathname === "/";

  // 🔒 Redirect logged-in user away from /login or /
  if (isLoggedIn && (isLoginPage || isRoot)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 🔐 Protect dashboard and similar routes
  const protectedRoutes = ["/dashboard", "/profile", "/settings"];
  const isProtected = protectedRoutes.some((path) =>
    pathname.startsWith(path)
  );

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect unauthenticated user from root `/` to `/login`
  if (isRoot && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
