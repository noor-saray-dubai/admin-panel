import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import Developer from "../../../../../models/developers"

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await connectToDatabase()
    
    const { slug } = params
    
    if (!slug) {
      return NextResponse.json(
        { success: false, message: "Developer slug is required" },
        { status: 400 }
      )
    }
    
    // Find developer by slug and return all fields for detailed view
    const developer = await Developer.findOne({ slug }).lean()
    
    if (!developer) {
      return NextResponse.json(
        { success: false, message: "Developer not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      data: developer
    })
  } catch (error) {
    console.error("Error fetching developer:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch developer." },
      { status: 500 }
    )
  }
}