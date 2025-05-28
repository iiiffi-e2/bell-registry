import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (session.user.role !== "EMPLOYER") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Get active job listings count (jobs available for applications)
    const now = new Date();
    const activeListings = await prisma.job.count({
      where: {
        employerId: session.user.id,
        status: {
          in: ["ACTIVE" as JobStatus, "INTERVIEWING" as JobStatus],
        },
        OR: [
          {
            expiresAt: {
              gt: now,
            },
          },
          {
            expiresAt: null,
          },
        ],
      },
    });

    // Get recent applications count (last 30 days)
    const recentApplications = await prisma.jobApplication.count({
      where: {
        job: {
          employerId: session.user.id,
        },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        },
      },
    });

    // Get saved candidates count (using ProfileViewEvent)
    const savedCandidates = await prisma.profileViewEvent.count({
      where: {
        userId: session.user.id,
      },
    });

    // Get total views for all jobs posted by this employer (using JobViewEvent)
    const totalViewsResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM "JobViewEvent" jve
      JOIN "Job" j ON jve."jobId" = j.id
      WHERE j."employerId" = ${session.user.id}
    `;
    
    const totalViews = totalViewsResult.length > 0 ? Number(totalViewsResult[0].count) : 0;

    return NextResponse.json({
      activeListings,
      recentApplications,
      savedCandidates,
      totalViews,
    });
  } catch (error) {
    console.error("[EMPLOYER_STATS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 