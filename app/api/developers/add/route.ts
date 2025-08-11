// app/api/developers/add/route.ts
import { NextRequest, NextResponse } from "next/server";
import Developer from "@/models/developers";
import { connectToDatabase } from "@/lib/db";

export const runtime = "nodejs"; // Force Node.js runtime (sharp + Cloudinary safe)

// Helper to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Ensure unique slug in DB
async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const existingDeveloper = await Developer.findOne({ slug });
    if (!existingDeveloper) return slug;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// Process image to WebP using sharp (lazy-loaded)
async function processImage(file: File): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return await sharp(buffer)
    .webp({ quality: 80 })
    .resize(800, 600, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .toBuffer();
}

// Upload to Cloudinary (lazy-loaded + config inside function)
async function uploadToCloudinary(buffer: Buffer, folder: string, fileName: string): Promise<string> {
  const { v2: cloudinary } = await import("cloudinary");
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
  });

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: "image",
          folder: `developers/${folder}`,
          public_id: fileName,
          format: "webp",
          overwrite: true,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result?.secure_url || "");
        }
      )
      .end(buffer);
  });
}

// POST - Create new developer
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const formData = await req.formData();

    // Fields
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const location = formData.get("location") as string;
    const establishedYear = parseInt(formData.get("establishedYear") as string);
    const totalProjects = parseInt(formData.get("totalProjects") as string);
    const activeProjects = parseInt(formData.get("activeProjects") as string);
    const completedProjects = parseInt(formData.get("completedProjects") as string);
    const website = formData.get("website") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const rating = parseFloat(formData.get("rating") as string);
    const verified = formData.get("verified") === "true";
    const specialization = JSON.parse(formData.get("specialization") as string || "[]");

    const logoFile = formData.get("logoFile") as File | null;
    const coverImageFile = formData.get("coverImageFile") as File | null;

    if (!name || !description || !email || !phone || !location) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const baseSlug = generateSlug(name);
    const slug = await ensureUniqueSlug(baseSlug);

    let logoUrl = "";
    let coverImageUrl = "";

    if (logoFile) {
      try {
        const processedLogo = await processImage(logoFile);
        logoUrl = await uploadToCloudinary(processedLogo, slug, "logo");
      } catch (err) {
        console.error("Error processing logo:", err);
        return NextResponse.json({ error: "Failed to process logo image" }, { status: 500 });
      }
    }

    if (coverImageFile) {
      try {
        const processedCover = await processImage(coverImageFile);
        coverImageUrl = await uploadToCloudinary(processedCover, slug, "cover");
      } catch (err) {
        console.error("Error processing cover image:", err);
        return NextResponse.json({ error: "Failed to process cover image" }, { status: 500 });
      }
    }

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
    });

    return NextResponse.json(newDeveloper, { status: 201 });
  } catch (error) {
    console.error("Error creating developer:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

// GET - Fetch all developers
export async function GET() {
  try {
    await connectToDatabase();
    const developers = await Developer.find({}).sort({ createdAt: -1 });
    return NextResponse.json(developers);
  } catch (error) {
    console.error("Error fetching developers:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
