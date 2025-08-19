import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import Career from "@/models/careers"

export async function DELETE(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    await connectToDatabase()

    const { slug } = params
    // Find career by slug, not ID
    const career = await Career.findOne({ slug })

    if (!career) {
      return NextResponse.json({ error: "Career not found" }, { status: 404 })
    }

    // Delete career from DB
    await Career.deleteOne({ _id: career._id })

    return NextResponse.json({
      success: true,
      message: "Career deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting career:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
