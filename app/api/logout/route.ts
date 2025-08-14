// ===== API ROUTE: app/api/auth/logout/route.ts =====
import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"

// Define cookie names that should be cleared
const AUTH_COOKIES = [
  "__session",
  "auth-token", 
  "firebase-token",
  "refresh-token",
  "session-id",
  "user-session"
]

export async function POST(request: NextRequest) {
  console.log("Logout API called")
  
  try {
    // Connect to database if needed for session cleanup
    await connectToDatabase()
    
    // Get user session info from cookies/headers if needed
    const sessionCookie = request.cookies.get("__session")?.value
    
    // TODO: Add any server-side session cleanup logic here
    // For example: invalidate database sessions, revoke tokens, etc.
    if (sessionCookie) {
      console.log("Cleaning up session:", sessionCookie.substring(0, 10) + "...")
      // Add your session cleanup logic here
    }
    
    // Create success response
    const response = NextResponse.json(
      { 
        success: true, 
        message: "Logged out successfully",
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    )
    const host = request.headers.get("host"); // admin.noorsaray.com
    // Clear all authentication cookies
    AUTH_COOKIES.forEach(cookieName => {
      // Clear for current path
      response.cookies.set({
        name: cookieName,
        value: "",
        path: "/",
        expires: new Date(0),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        domain: host ? `.${host.split('.').slice(-2).join('.')}` : undefined // Clear for subdomain
      })
      
      // Clear for root domain (if different)
      response.cookies.set({
        name: cookieName,
        value: "",
        path: "/",
        expires: new Date(0),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        domain: ".noorsaray.com" // Adjust domain as needed
      })
    })
    
    console.log("Logout successful - cookies cleared")
    return response
    
  } catch (error) {
    console.error("Logout API error:", error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error occurred"
      },
      { status: 500 }
    )
  }
}

// Support GET requests for backward compatibility
export async function GET(request: NextRequest) {
  return POST(request)
}