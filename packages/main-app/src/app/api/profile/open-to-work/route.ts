import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { openToWork } = body;

    if (typeof openToWork !== 'boolean') {
      return new NextResponse("Invalid openToWork value", { status: 400 });
    }

    // Update the candidate profile
    const updatedProfile = await prisma.candidateProfile.update({
      where: { userId: session.user.id },
      data: { openToWork },
      include: { user: true }
    });

    return NextResponse.json({ 
      success: true, 
      openToWork: updatedProfile.openToWork 
    });
  } catch (error) {
    console.error("[OPEN_TO_WORK_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 