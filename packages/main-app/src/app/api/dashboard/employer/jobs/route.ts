/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@bell-registry/shared";
import { isEmployerOrAgencyRole } from "@/lib/roles";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!isEmployerOrAgencyRole(session.user.role)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Get all jobs for the employer, regardless of status
    const jobs = await prisma.job.findMany({
      where: {
        employerId: session.user.id,
      },
      include: {
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

    // Get view counts for all jobs using raw SQL
    const viewCounts = jobs.length > 0 ? await prisma.$queryRaw<Array<{ jobId: string; count: bigint }>>`
      SELECT "jobId", COUNT(*) as count
      FROM "JobViewEvent"
      WHERE "jobId" = ANY(${jobs.map(j => j.id)})
      GROUP BY "jobId"
    ` : [];

    // Create a map of job IDs to view counts
    const viewCountMap = new Map<string, number>();
    viewCounts.forEach(vc => {
      viewCountMap.set(vc.jobId, Number(vc.count));
    });

    // Transform the data to include views, applicants, and handle expiry
    const now = new Date();
    const transformedJobs = jobs.map((job) => {
      let status = job.status;
      if (
        job.expiresAt &&
        new Date(job.expiresAt) < now &&
        job.status !== "FILLED"
      ) {
        status = "EXPIRED";
      }
      return {
        id: job.id,
        title: job.title,
        location: job.location,
        status,
        views: viewCountMap.get(job.id) || 0,
        applicants: job._count.applications,
        createdAt: job.createdAt,
        urlSlug: job.urlSlug,
      };
    });

    return NextResponse.json({
      jobs: transformedJobs,
    });
  } catch (error) {
    console.error("[EMPLOYER_JOBS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 