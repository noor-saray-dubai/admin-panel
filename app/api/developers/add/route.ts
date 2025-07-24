import { NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from 'cloudinary'
import sharp from 'sharp'
import Developer from "../../../../models/developers"
import { connectToDatabase } from "@/lib/db"

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Helper function to compress and convert image to WebP
async function processImage(file: File): Promise<Buffer> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  
  return await sharp(buffer)
    .webp({ quality: 80 })
    .resize(800, 600, { 
      fit: 'inside',
      withoutEnlargement: true 
    })
    .toBuffer()
}

// Helper function to upload to Cloudinary
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

// POST - Create new developer
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase()

    const formData = await req.formData()

    // Extract form fields
    const name = formData.get('name') as string
    const slug = formData.get('slug') as string
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

    // Extract files
    const logoFile = formData.get('logoFile') as File | null
    const coverImageFile = formData.get('coverImageFile') as File | null

    // Basic validation
    if (!name || !description || !email || !phone || !location) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let logoUrl = ''
    let coverImageUrl = ''

    // Process and upload logo
    if (logoFile) {
      try {
        const processedLogo = await processImage(logoFile)
        logoUrl = await uploadToCloudinary(processedLogo, slug, 'logo')
      } catch (error) {
        console.error('Error processing logo:', error)
        return NextResponse.json({ error: "Failed to process logo image" }, { status: 500 })
      }
    }

    // Process and upload cover image
    if (coverImageFile) {
      try {
        const processedCover = await processImage(coverImageFile)
        coverImageUrl = await uploadToCloudinary(processedCover, slug, 'cover')
      } catch (error) {
        console.error('Error processing cover image:', error)
        return NextResponse.json({ error: "Failed to process cover image" }, { status: 500 })
      }
    }

    // Create developer in database
    const newDeveloper = await Developer.create({
      name,
      slug,
      logo: logoUrl,
      coverImage: coverImageUrl,
      description,
      location,
      establishedYear,
      totalProjects,
      activeProjects,
      completedProjects,
      website,
      email,
      phone,
      specialization,
      rating,
      verified,
    })

    return NextResponse.json(newDeveloper, { status: 201 })
  } catch (error) {
    console.error("Error creating developer:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal Server Error" 
    }, { status: 500 })
  }
}

// GET - Fetch all developers
export async function GET() {
  try {
    await connectToDatabase()
    const developers = await Developer.find({}).sort({ createdAt: -1 })
    return NextResponse.json(developers)
  } catch (error) {
    console.error("Error fetching developers:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}