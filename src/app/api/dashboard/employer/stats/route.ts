import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (session.user.role !== "EMPLOYER") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Get active job listings count
    const activeListings = await prisma.job.count({
      where: {
        employerId: session.user.id,
        status: "ACTIVE",
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

    // Get total views for all jobs (using ProfileViewEvent)
    const totalViews = await prisma.profileViewEvent.count({
      where: {
        user: {
          postedJobs: {
            some: {
              employerId: session.user.id,
            },
          },
        },
      },
    });

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