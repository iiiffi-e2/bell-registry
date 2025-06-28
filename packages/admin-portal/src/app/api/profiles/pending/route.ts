import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma, adminAuthOptions, logAdminAction } from "@bell-registry/shared";
import { UserRole } from "@bell-registry/shared";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(adminAuthOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Log this admin action
    await logAdminAction(
      session.user.id,
      "VIEW_PENDING_PROFILES",
      { endpoint: "/api/profiles/pending" },
      request.ip,
      request.headers.get("user-agent") || undefined
    );

    const pendingProfiles = await prisma.candidateProfile.findMany({
      where: {
        user: { isDeleted: false }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            createdAt: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit to 50 most recent
    });

    return NextResponse.json(pendingProfiles);
  } catch (error) {
    console.error("Error fetching pending profiles:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending profiles" },
      { status: 500 }
    );
  }
} 