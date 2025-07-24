import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import Developer from "../../../../models/developers"

export async function GET() {
  try {
    await connectToDatabase()
    const developers = await Developer.find()
    return NextResponse.json({ success: true, data: developers })
  } catch (error) {
    console.error("Error fetching developers:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch developers." },
      { status: 500 }
    )
  }
}
