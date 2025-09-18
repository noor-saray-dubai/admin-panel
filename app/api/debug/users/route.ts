// app/api/debug/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { adminAuth } from "@/lib/firebaseAdmin";
import { EnhancedUser, FullRole } from "@/models/enhancedUser";
import { parse } from "cookie";

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = parse(cookieHeader);
    const sessionCookie = cookies.__session;
    
    if (!sessionCookie) {
      return NextResponse.json({
        error: "Authentication required"
      }, { status: 401 });
    }
    
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    const currentUserFirebaseUid = decodedToken.uid;
    
    // Get current user and check permissions
    await connectToDatabase();
    const currentUser = await EnhancedUser.findOne({ firebaseUid: currentUserFirebaseUid });
    
    if (!currentUser || currentUser.fullRole !== FullRole.SUPER_ADMIN) {
      return NextResponse.json({
        error: "Super admin access required for debug endpoint"
      }, { status: 403 });
    }
    
    // Get all users with essential fields
    const users = await EnhancedUser.find({})
      .select('firebaseUid email displayName fullRole status createdAt')
      .sort({ createdAt: -1 })
      .limit(50);
    
    return NextResponse.json({
      success: true,
      count: users.length,
      currentUser: {
        firebaseUid: currentUser.firebaseUid,
        email: currentUser.email,
        role: currentUser.fullRole
      },
      users: users.map(user => ({
        _id: user._id.toString(),
        firebaseUid: user.firebaseUid,
        email: user.email,
        displayName: user.displayName,
        fullRole: user.fullRole,
        status: user.status,
        createdAt: user.createdAt
      }))
    });
    
  } catch (error: any) {
    console.error('Debug users endpoint error:', error);
    return NextResponse.json({
      error: "Debug endpoint error",
      details: error.message
    }, { status: 500 });
  }
}