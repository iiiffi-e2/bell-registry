import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mkdir } from "fs/promises";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), "public", "uploads");
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }

    // Create unique filename
    const bytes = await file.arrayBuffer();
    const buffer = new Uint8Array(bytes);
    const filename = `${session.user.id}-${Date.now()}.jpg`;
    const relativePath = `/uploads/${filename}`;
    const absolutePath = join(process.cwd(), "public", relativePath);

    // Save file
    await writeFile(absolutePath, buffer);

    // Get the base URL from the request
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const fullUrl = `${protocol}://${host}${relativePath}`;

    // Update both User.image and CandidateProfile.photoUrl
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { image: fullUrl },
      }),
      prisma.candidateProfile.update({
        where: { userId: session.user.id },
        data: { photoUrl: fullUrl },
      }),
    ]);

    return NextResponse.json({ url: fullUrl });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
} 