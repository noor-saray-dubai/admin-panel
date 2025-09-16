import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from 'cloudinary';
import { withAuth } from "@/lib/auth-utils";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Force Node.js runtime
export const runtime = "nodejs";

interface UploadResult {
  url: string;
  publicId: string;
  originalName: string;
  size: number;
  format: string;
}

/**
 * Upload image to Cloudinary with optimization
 */
async function uploadImageToCloudinary(
  file: File,
  folder: string = 'temp-uploads',
  identifier?: string
): Promise<UploadResult> {
  const bytes = await file.arrayBuffer();
  const fileBuffer = Buffer.from(bytes);

  // Generate a unique filename
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const fileName = identifier ? 
    `${identifier}-${timestamp}-${randomString}` : 
    `upload-${timestamp}-${randomString}`;

  const uploadConfig = {
    folder: `instant-uploads/${folder}`,
    public_id: fileName,
    format: 'webp',
    quality: 'auto:good',
    fetch_format: 'auto',
    transformation: [
      { width: 1920, height: 1080, crop: 'limit' },
      { quality: 'auto:good' },
      { format: 'auto' }
    ],
    resource_type: 'image' as const,
    secure: true,
    overwrite: false,
  };

  try {
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadConfig,
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      
      uploadStream.end(fileBuffer);
    });

    if (!result?.secure_url) {
      throw new Error('Upload succeeded but no secure URL returned');
    }

    return {
      url: result.secure_url,
      publicId: result.public_id,
      originalName: file.name,
      size: file.size,
      format: result.format || 'unknown'
    };

  } catch (error: any) {
    console.error('Image upload failed:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

/**
 * Delete image from Cloudinary
 */
async function deleteImageFromCloudinary(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Failed to delete image:', error);
    return false;
  }
}

/**
 * Extract public ID from Cloudinary URL
 */
function extractPublicId(url: string): string | null {
  try {
    // Extract public ID from Cloudinary URL
    const match = url.match(/\/v\d+\/(.+)\.(jpg|jpeg|png|webp|gif)$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * POST - Upload single or multiple images
 */
export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    const formData = await request.formData();
    
    // Get upload parameters
    const mode = formData.get('mode') as string || 'single';
    const folder = formData.get('folder') as string || 'general';
    const identifier = formData.get('identifier') as string || undefined;
    
    if (mode === 'single') {
      // Single file upload
      const file = formData.get('file') as File;
      
      if (!file || file.size === 0) {
        return NextResponse.json(
          { success: false, message: 'No file provided' },
          { status: 400 }
        );
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { success: false, message: 'File must be an image' },
          { status: 400 }
        );
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, message: 'File size must be less than 10MB' },
          { status: 400 }
        );
      }

      const result = await uploadImageToCloudinary(file, folder, identifier);
      
      return NextResponse.json({
        success: true,
        data: result
      });

    } else if (mode === 'multiple') {
      // Multiple files upload
      const files = formData.getAll('files') as File[];
      
      if (!files || files.length === 0) {
        return NextResponse.json(
          { success: false, message: 'No files provided' },
          { status: 400 }
        );
      }

      // Limit to 10 files max
      if (files.length > 10) {
        return NextResponse.json(
          { success: false, message: 'Maximum 10 files allowed' },
          { status: 400 }
        );
      }

      const results: UploadResult[] = [];
      const errors: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (!file || file.size === 0) continue;

        // Validate file type
        if (!file.type.startsWith('image/')) {
          errors.push(`File ${i + 1}: Must be an image`);
          continue;
        }

        // Validate file size
        if (file.size > 10 * 1024 * 1024) {
          errors.push(`File ${i + 1}: Size must be less than 10MB`);
          continue;
        }

        try {
          const fileIdentifier = identifier ? `${identifier}-${i}` : undefined;
          const result = await uploadImageToCloudinary(file, folder, fileIdentifier);
          results.push(result);
        } catch (error: any) {
          errors.push(`File ${i + 1}: ${error.message}`);
        }
      }

      return NextResponse.json({
        success: results.length > 0,
        data: results,
        errors: errors.length > 0 ? errors : undefined,
        message: `Uploaded ${results.length} of ${files.length} files`
      });

    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid mode. Use "single" or "multiple"' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'An unexpected error occurred' 
      },
      { status: 500 }
    );
  }
});

/**
 * DELETE - Delete an image
 */
export const DELETE = withAuth(async (request: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    const publicId = searchParams.get('publicId');

    if (!imageUrl && !publicId) {
      return NextResponse.json(
        { success: false, message: 'Image URL or public ID required' },
        { status: 400 }
      );
    }

    let idToDelete = publicId;
    if (!idToDelete && imageUrl) {
      idToDelete = extractPublicId(imageUrl);
    }

    if (!idToDelete) {
      return NextResponse.json(
        { success: false, message: 'Could not extract public ID from URL' },
        { status: 400 }
      );
    }

    const deleted = await deleteImageFromCloudinary(idToDelete);

    if (deleted) {
      return NextResponse.json({
        success: true,
        message: 'Image deleted successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Failed to delete image' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Delete API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'An unexpected error occurred' 
      },
      { status: 500 }
    );
  }
});