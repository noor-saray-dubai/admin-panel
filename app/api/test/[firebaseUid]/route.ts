// app/api/test/[firebaseUid]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ firebaseUid: string }> }
) {
  const resolvedParams = await params;
  
  console.log('🧪 Test API called with params:', resolvedParams);
  console.log('🧪 Test API firebaseUid:', resolvedParams.firebaseUid);
  
  return NextResponse.json({
    success: true,
    message: "Test API working",
    receivedFirebaseUid: resolvedParams.firebaseUid,
    timestamp: new Date().toISOString()
  });
}
