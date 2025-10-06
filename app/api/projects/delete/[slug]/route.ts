import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import Project from "@/models/project"
import { withCollectionPermission } from "@/lib/auth/server"
import { Collection, Action } from "@/types/user"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

async function handler(req: NextRequest, { params }: { params: { slug: string } }) {
  // User is available on request.user (added by withCollectionPermission)
  const user = (req as any).user;
  try {
    await connectToDatabase()

    const { slug } = params
    const project = await Project.findOne({ slug })

    if (!project) {
      return NextResponse.json({ 
        success: false,
        error: "NOT_FOUND",
        message: "Project not found" 
      }, { status: 404 })
    }

    // Delete cover image from Cloudinary
    try {
      const coverPublicId = `${slug}/cover`
      await cloudinary.uploader.destroy(coverPublicId, { resource_type: "image" })
    } catch (cloudinaryError) {
      console.warn("Failed to delete cover image from Cloudinary:", cloudinaryError)
    }

    // Delete gallery images
    if (Array.isArray(project.gallery)) {
      try {
        const galleryDestroyPromises = project.gallery.map((_:any, index:any) =>
          cloudinary.uploader.destroy(`${slug}/gallery-${index}`, { resource_type: "image" })
        )
        await Promise.all(galleryDestroyPromises)
      } catch (cloudinaryError) {
        console.warn("Failed to delete gallery images from Cloudinary:", cloudinaryError)
      }
    }

    // Optional: delete the folder (Cloudinary doesn't fully delete folders unless empty)
    try {
      await cloudinary.api.delete_resources_by_prefix(slug)
    } catch (cloudinaryError) {
      console.warn("Failed to delete Cloudinary folder:", cloudinaryError)
    }

    // Soft delete project with audit trail
    const deletedProject = await Project.findOneAndUpdate(
      { slug },
      { 
        $set: {
          isActive: false,
          deletedAt: new Date(),
          deletedBy: {
            email: user.email,
            timestamp: new Date(),
            ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
            userAgent: req.headers.get('user-agent') || 'unknown'
          },
          updatedAt: new Date(),
          updatedBy: {
            email: user.email,
            timestamp: new Date(),
            ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
            userAgent: req.headers.get('user-agent') || 'unknown'
          }
        },
        $inc: { version: 1 }
      },
      { new: true }
    )

    if (!deletedProject) {
      return NextResponse.json({ 
        success: false,
        error: "NOT_FOUND",
        message: "Project not found" 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully",
      project: {
        id: deletedProject._id,
        slug: deletedProject.slug,
        name: deletedProject.name,
        deletedAt: deletedProject.deletedAt,
        deletedBy: deletedProject.deletedBy?.email || 'Unknown'
      }
    })
  } catch (error: any) {
    console.error("Error deleting project:", error)
    return NextResponse.json({ 
      success: false,
      error: "INTERNAL_ERROR",
      message: "Failed to delete project" 
    }, { status: 500 })
  }
}

// Export with ZeroTrust collection permission validation
// Requires DELETE_CONTENT capability for PROJECTS collection (COLLECTION_ADMIN only)
export const DELETE = withCollectionPermission(Collection.PROJECTS, Action.DELETE)(handler);