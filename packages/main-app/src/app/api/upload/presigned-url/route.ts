import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { fileName, fileType, uploadType } = await request.json();
    
    if (!fileName || !fileType || !uploadType) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Define allowed file types and sizes
    const allowedTypes = {
      image: {
        mimeTypes: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
        maxSize: 10 * 1024 * 1024, // 10MB for images
      },
      media: {
        mimeTypes: [
          // Videos
          "video/mp4", "video/mpeg", "video/quicktime", "video/webm", "video/x-msvideo",
          // Documents
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        maxSize: 50 * 1024 * 1024, // 50MB for media files
      },
      document: {
        mimeTypes: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        maxSize: 5 * 1024 * 1024, // 5MB for documents
      },
    };

    // Default to image if no upload type specified
    const typeConfig = allowedTypes[uploadType as keyof typeof allowedTypes] || allowedTypes.image;

    // Validate file type
    if (!typeConfig.mimeTypes.includes(fileType)) {
      return new NextResponse(`Invalid file type. Allowed types: ${typeConfig.mimeTypes.join(", ")}`, { status: 400 });
    }

    // Generate unique filename
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (!ext) {
      return new NextResponse("Invalid file name", { status: 400 });
    }

    const originalName = fileName.replace(/\.[^/.]+$/, ""); // Remove extension
    const cleanName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_"); // Clean special chars
    const uniqueId = uuidv4().split('-')[0]; // Use first part of UUID for shorter ID
    const finalFileName = `${uniqueId}_${cleanName}.${ext}`;

    // Generate pre-signed URL for direct upload
    const s3Params = {
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: `uploads/${finalFileName}`,
      ContentType: fileType,
      Expires: 300, // 5 minutes
      // Remove ACL to avoid permission issues - bucket should be configured for public access
    };

    console.log('Generating pre-signed URL with params:', {
      Bucket: s3Params.Bucket,
      Key: s3Params.Key,
      ContentType: s3Params.ContentType,
      Expires: s3Params.Expires
    });

    const presignedUrl = s3.getSignedUrl('putObject', s3Params);

    // Return the pre-signed URL and the final file name
    return NextResponse.json({
      presignedUrl,
      fileName: finalFileName,
      fileUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/uploads/${finalFileName}`
    });

  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
