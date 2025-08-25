import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
// import Career from "@/models/careers"
import Developer from "@/models/developers";


export async function DELETE(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    await connectToDatabase()

    const { slug } = params
    // Find career by slug, not ID
    const developer = await Developer.findOne({ slug })

    if (!Developer) {
      return NextResponse.json({ error: "Developer not found" }, { status: 404 })
    }

    // Delete Developer from DB
    await Developer.deleteOne({ _id: developer._id })

    return NextResponse.json({
      success: true,
      message: "Developer deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting Developer:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
