import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import Project from "@/models/project"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function DELETE(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    await connectToDatabase()

    const { slug } = params
    const project = await Project.findOne({ slug })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Delete cover image from Cloudinary
    const coverPublicId = `${slug}/cover`
    await cloudinary.uploader.destroy(coverPublicId, { resource_type: "image" })

    // Delete gallery images
    if (Array.isArray(project.gallery)) {
      const galleryDestroyPromises = project.gallery.map((_:any, index:any) =>
        cloudinary.uploader.destroy(`${slug}/gallery-${index}`, { resource_type: "image" })
      )
      await Promise.all(galleryDestroyPromises)
    }

    // Optional: delete the folder (Cloudinary doesn't fully delete folders unless empty)
    await cloudinary.api.delete_resources_by_prefix(slug)

    // Delete project from DB
    await Project.deleteOne({ slug })

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting project:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
