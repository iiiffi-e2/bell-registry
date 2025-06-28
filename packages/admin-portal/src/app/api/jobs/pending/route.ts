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
      "VIEW_PENDING_JOBS",
      { endpoint: "/api/jobs/pending" },
      request.ip,
      request.headers.get("user-agent") || undefined
    );

    const pendingJobs = await prisma.job.findMany({
      where: {
        employer: { isDeleted: false }
      },
      include: {
        employer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employerProfile: {
              select: {
                companyName: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit to 50 most recent
    });

    return NextResponse.json(pendingJobs);
  } catch (error) {
    console.error("Error fetching pending jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending jobs" },
      { status: 500 }
    );
  }
} 