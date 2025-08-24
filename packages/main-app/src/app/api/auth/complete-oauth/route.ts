import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const completeOAuthSchema = z.object({
  membershipAccess: z.enum(["BELL_REGISTRY_REFERRAL", "PROFESSIONAL_REFERRAL", "NEW_APPLICANT", "EMPLOYER", "AGENCY"]),
  referralProfessionalName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = completeOAuthSchema.parse(body);

    // Update the user's membership access data
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        membershipAccess: validatedData.membershipAccess,
        referralProfessionalName: validatedData.referralProfessionalName,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        membershipAccess: updatedUser.membershipAccess,
        referralProfessionalName: updatedUser.referralProfessionalName,
      },
    });
  } catch (error) {
    console.error("Error completing OAuth registration:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 