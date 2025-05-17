import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import AWS from 'aws-sdk';

// Configure AWS
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
    const buffer = Buffer.from(bytes);

    // Upload to S3 - removed ACL parameter since bucket has ACLs disabled
    const uploadResult = await s3.upload({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: `uploads/${fileName}`,
      Body: buffer,
      ContentType: file.type,
    }).promise();

    const url = uploadResult.Location;

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