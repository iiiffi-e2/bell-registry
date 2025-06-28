import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('Suspension API (MAIN-APP): Checking suspension for user:', session.user.email);

    // Get user suspension/ban status from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        isDeleted: true,
        isSuspended: true,
        isBanned: true,
        suspensionReason: true,
        suspensionNote: true,
        suspendedAt: true,
        suspendedBy: true,
        bannedAt: true,
        bannedBy: true,
        suspendedByAdmin: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        bannedByAdmin: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    } as any);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Type cast to access new fields until Prisma client is regenerated
    const userWithEnforcement = user as any;

    const response = {
      isSuspended: userWithEnforcement.isSuspended || false,
      isBanned: userWithEnforcement.isBanned || false,
      isDeleted: user.isDeleted || false,
      suspensionReason: userWithEnforcement.suspensionReason,
      suspensionNote: userWithEnforcement.suspensionNote,
      suspendedAt: userWithEnforcement.suspendedAt,
      bannedAt: userWithEnforcement.bannedAt,
      suspendedByAdmin: userWithEnforcement.suspendedByAdmin ? {
        name: `${userWithEnforcement.suspendedByAdmin.firstName} ${userWithEnforcement.suspendedByAdmin.lastName}`.trim(),
        email: userWithEnforcement.suspendedByAdmin.email
      } : null,
      bannedByAdmin: userWithEnforcement.bannedByAdmin ? {
        name: `${userWithEnforcement.bannedByAdmin.firstName} ${userWithEnforcement.bannedByAdmin.lastName}`.trim(),
        email: userWithEnforcement.bannedByAdmin.email
      } : null
    };

    console.log('Suspension API (MAIN-APP): Response:', response);

    return NextResponse.json(response);

  } catch (error) {
    console.error("Error checking suspension status (MAIN-APP):", error);
    return NextResponse.json(
      { error: "Failed to check suspension status" },
      { status: 500 }
    );
  }
} 