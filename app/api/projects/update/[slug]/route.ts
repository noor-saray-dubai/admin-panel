import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Project from "@/models/project";
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function PUT(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    await connectToDatabase();

    const { slug } = params;
    const formData = await req.formData();
    const projectDataString = formData.get("projectData") as string;

    if (!projectDataString) {
      return NextResponse.json({ error: "Missing project data" }, { status: 400 });
    }

    let projectData;
    try {
      projectData = JSON.parse(projectDataString);
    } catch {
      return NextResponse.json({ error: "Invalid project data format" }, { status: 400 });
    }

    const project = await Project.findOne({ slug });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Update cover image if provided
    const coverImageFile = formData.get('coverImage') as File;
    if (coverImageFile && coverImageFile.size > 0) {
      const buffer = Buffer.from(await coverImageFile.arrayBuffer());
      const coverUrl = await cloudinary.uploader.upload_stream({
        folder: slug,
        public_id: 'cover',
        format: 'webp',
        overwrite: true,
        width: 1920,
        height: 1080,
        crop: 'limit',
        resource_type: 'image'
      }, (error, result) => {
        if (error) throw new Error("Cover image upload failed");
        project.coverImage = result?.secure_url;
        project.image = result?.secure_url;
      }).end(buffer);
    }

    // Update gallery images if provided
    let galleryUrls: string[] = [];
    let galleryIndex = 0;
    while (formData.get(`gallery_${galleryIndex}`)) {
      const galleryFile = formData.get(`gallery_${galleryIndex}`) as File;
      if (galleryFile) {
        const galleryBuffer = Buffer.from(await galleryFile.arrayBuffer());
        const result: any = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream({
            folder: slug,
            public_id: `gallery-${galleryIndex}`,
            format: 'webp',
            overwrite: true,
            width: 1200,
            height: 800,
            crop: 'limit',
            resource_type: 'image',
          }, (err, res) => (err ? reject(err) : resolve(res))
          ).end(galleryBuffer);
        });
        galleryUrls.push(result.secure_url);
      }
      galleryIndex++;
    }

    if (galleryUrls.length > 0) {
      project.gallery = galleryUrls;
    }

    // Update the rest of the fields
    Object.assign(project, {
      ...projectData,
      slug,
      statusSlug: 'hey', // Or generate dynamically
      locationSlug: 'hey', // Or generate dynamically
      updatedAt: new Date(),
    });

    await project.save();

    return NextResponse.json({
      success: true,
      message: "Project updated successfully",
      project: {
        id: project._id,
        name: project.name,
        slug: project.slug,
        location: project.location,
        developer: project.developer,
        developerSlug: project.developerSlug,
        coverImage: project.coverImage,
        gallery: project.gallery,
        updatedAt: project.updatedAt,
      },
    });

  } catch (error: any) {
    console.error("Error updating project:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
