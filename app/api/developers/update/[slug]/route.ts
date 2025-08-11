// app/api/developers/update/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import Developer from "@/models/developers";
import { connectToDatabase } from "@/lib/db";

export const runtime = "nodejs"; // Prevent Edge runtime (sharp-safe)

// Helper: generate slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Helper: ensure unique slug
async function ensureUniqueSlug(baseSlug: string, currentSlug?: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    if (slug === currentSlug) return slug;
    const existingDeveloper = await Developer.findOne({ slug });
    if (!existingDeveloper) return slug;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// Process image using sharp (lazy import)
async function processImage(file: File): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return sharp(buffer)
    .webp({ quality: 80 })
    .resize(800, 600, { fit: "inside", withoutEnlargement: true })
    .toBuffer();
}

// Upload to Cloudinary (lazy import + config inside function)
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

// PUT - Update existing developer
export async function PUT(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    await connectToDatabase();
    const { slug: currentSlug } = params;
    const formData = await req.formData();

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

    const developer = await Developer.findOne({ slug: currentSlug });
    if (!developer) {
      return NextResponse.json({ error: "Developer not found" }, { status: 404 });
    }

    // Update slug if name changed
    let newSlug = currentSlug;
    if (name !== developer.name) {
      const baseSlug = generateSlug(name);
      newSlug = await ensureUniqueSlug(baseSlug, currentSlug);
    }

    // Update logo if provided
    if (logoFile) {
      try {
        const processedLogo = await processImage(logoFile);
        developer.logo = await uploadToCloudinary(processedLogo, newSlug, "logo");
      } catch (err) {
        console.error("Error processing logo:", err);
        return NextResponse.json({ error: "Failed to process logo image" }, { status: 500 });
      }
    }

    // Update cover image if provided
    if (coverImageFile) {
      try {
        const processedCover = await processImage(coverImageFile);
        developer.coverImage = await uploadToCloudinary(processedCover, newSlug, "cover");
      } catch (err) {
        console.error("Error processing cover image:", err);
        return NextResponse.json({ error: "Failed to process cover image" }, { status: 500 });
      }
    }

    // Update other fields
    developer.name = name;
    developer.slug = newSlug;
    developer.description = description;
    developer.location = location;
    developer.establishedYear = establishedYear;
    developer.totalProjects = totalProjects;
    developer.activeProjects = activeProjects;
    developer.completedProjects = completedProjects;
    developer.website = website;
    developer.email = email;
    developer.phone = phone;
    developer.rating = rating;
    developer.verified = verified;
    developer.specialization = specialization;

    await developer.save();

    return NextResponse.json(developer, { status: 200 });
  } catch (error) {
    console.error("Error updating developer:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
