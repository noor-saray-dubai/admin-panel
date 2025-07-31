import { NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from 'cloudinary'
import sharp from 'sharp'
import Developer from "@/models/developers"
import { connectToDatabase } from "@/lib/db"

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Helper to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

// Helper to ensure unique slug
async function ensureUniqueSlug(baseSlug: string, currentSlug?: string): Promise<string> {
  let slug = baseSlug
  let counter = 1

  while (true) {
    // If this is the current developer's slug, it's allowed
    if (slug === currentSlug) {
      return slug
    }

    // Check if slug exists
    const existingDeveloper = await Developer.findOne({ slug })
    
    if (!existingDeveloper) {
      return slug
    }

    // Generate new slug with counter
    slug = `${baseSlug}-${counter}`
    counter++
  }
}

// Helper to compress and convert image to WebP
async function processImage(file: File): Promise<Buffer> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  
  return await sharp(buffer)
    .webp({ quality: 80 })
    .resize(800, 600, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .toBuffer()
}

// Helper to upload to Cloudinary
async function uploadToCloudinary(buffer: Buffer, folder: string, fileName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: `developers/${folder}`,
        public_id: fileName,
        format: 'webp',
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve(result?.secure_url || '')
        }
      }
    ).end(buffer)
  })
}

// PUT - Update existing developer
export async function PUT(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    await connectToDatabase()
    const { slug: currentSlug } = params

    const formData = await req.formData()

    // Extract form fields (slug is NOT in form data - it's auto-generated from name)
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const location = formData.get('location') as string
    const establishedYear = parseInt(formData.get('establishedYear') as string)
    const totalProjects = parseInt(formData.get('totalProjects') as string)
    const activeProjects = parseInt(formData.get('activeProjects') as string)
    const completedProjects = parseInt(formData.get('completedProjects') as string)
    const website = formData.get('website') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const rating = parseFloat(formData.get('rating') as string)
    const verified = formData.get('verified') === 'true'
    const specialization = JSON.parse(formData.get('specialization') as string || '[]')

    // Extract new files if provided
    const logoFile = formData.get('logoFile') as File | null
    const coverImageFile = formData.get('coverImageFile') as File | null

    // Basic validation
    if (!name || !description || !email || !phone || !location) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const developer = await Developer.findOne({ slug: currentSlug })

    if (!developer) {
      return NextResponse.json({ error: "Developer not found" }, { status: 404 })
    }

    // Auto-generate new slug if name changed (slug is not from form data)
    let newSlug = currentSlug
    if (name !== developer.name) {
      const baseSlug = generateSlug(name)
      newSlug = await ensureUniqueSlug(baseSlug, currentSlug)
    }

    // Update logo if provided
    if (logoFile) {
      try {
        const processedLogo = await processImage(logoFile)
        const logoUrl = await uploadToCloudinary(processedLogo, newSlug, 'logo')
        developer.logo = logoUrl
      } catch (error) {
        console.error('Error processing logo:', error)
        return NextResponse.json({ error: "Failed to process logo image" }, { status: 500 })
      }
    }

    // Update cover image if provided
    if (coverImageFile) {
      try {
        const processedCover = await processImage(coverImageFile)
        const coverImageUrl = await uploadToCloudinary(processedCover, newSlug, 'cover')
        developer.coverImage = coverImageUrl
      } catch (error) {
        console.error('Error processing cover image:', error)
        return NextResponse.json({ error: "Failed to process cover image" }, { status: 500 })
      }
    }

    // Update all fields (slug is auto-generated, not from form)
    developer.name = name
    developer.slug = newSlug  // This is the auto-generated slug
    developer.description = description
    developer.location = location
    developer.establishedYear = establishedYear
    developer.totalProjects = totalProjects
    developer.activeProjects = activeProjects
    developer.completedProjects = completedProjects
    developer.website = website
    developer.email = email
    developer.phone = phone
    developer.rating = rating
    developer.verified = verified
    developer.specialization = specialization

    await developer.save()

    return NextResponse.json(developer, { status: 200 })
  } catch (error) {
    console.error("Error updating developer:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    )
  }
}