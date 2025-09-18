import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import { storageProvider } from "@/lib/storage";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const uploadType = formData.get("uploadType") as string; // "image", "media", "document"
    
    if (!file) {
      return new NextResponse("No file uploaded", { status: 400 });
    }

    // Define allowed file types
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

    // Default to image if no upload type specified (for backward compatibility)
    const typeConfig = allowedTypes[uploadType as keyof typeof allowedTypes] || allowedTypes.image;

    // Validate file type
    if (!typeConfig.mimeTypes.includes(file.type)) {
      return new NextResponse(`Invalid file type. Allowed types: ${typeConfig.mimeTypes.join(", ")}`, { status: 400 });
    }

    // Validate file size
    if (file.size > typeConfig.maxSize) {
      const maxSizeMB = Math.round(typeConfig.maxSize / (1024 * 1024));
      return new NextResponse(`File size too large. Maximum size: ${maxSizeMB}MB`, { status: 400 });
    }

    // Get file extension
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext) {
      return new NextResponse("Invalid file name", { status: 400 });
    }

    // Generate unique filename while preserving original name
    const originalName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
    const cleanName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_"); // Clean special chars
    const uniqueId = uuidv4().split('-')[0]; // Use first part of UUID for shorter ID
    const fileName = `${uniqueId}_${cleanName}.${ext}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload file using storage provider
    const url = await storageProvider.uploadFile(buffer, fileName, file.type);

    // Just return the URL - let the frontend components decide what to do with it
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error uploading file:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 