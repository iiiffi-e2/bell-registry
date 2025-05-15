import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return new NextResponse("No file uploaded", { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return new NextResponse("Invalid file type", { status: 400 });
    }

    // Get file extension
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext) {
      return new NextResponse("Invalid file name", { status: 400 });
    }

    // Generate unique filename
    const fileName = `${uuidv4()}.${ext}`;
    const bytes = await file.arrayBuffer();
    const buffer = new Uint8Array(bytes);

    // Save file to public/uploads directory
    const uploadDir = join(process.cwd(), "public", "uploads");
    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // Return the URL
    const url = `/uploads/${fileName}`;

    // Update both User.image and CandidateProfile.photoUrl
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { image: url },
      }),
      prisma.candidateProfile.update({
        where: { userId: session.user.id },
        data: { photoUrl: url },
      }),
    ]);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error uploading file:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 