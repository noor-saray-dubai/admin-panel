// app/api/logout/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from '../../../lib/db'

export async function GET() {
  await connectToDatabase();
  const response = NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"));
  
  response.cookies.set({
    name: "__session",
    value: "",
    path: "/",
    expires: new Date(0),
    httpOnly: true,
    secure: true,
  });

  return response;
}
