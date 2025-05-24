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

    // Get active jobs with application counts
    const jobs = await prisma.job.findMany({
      where: {
        employerId: session.user.id,
        status: "ACTIVE",
      },
      select: {
        id: true,
        title: true,
        location: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform the data to include views and applicants
    const transformedJobs = jobs.map((job) => ({
      id: job.id,
      title: job.title,
      location: job.location,
      status: job.status,
      views: 0, // TODO: Implement job views tracking
      applicants: job._count.applications,
      createdAt: job.createdAt,
    }));

    return NextResponse.json({
      jobs: transformedJobs,
    });
  } catch (error) {
    console.error("[EMPLOYER_JOBS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 