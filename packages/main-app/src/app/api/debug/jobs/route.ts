import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@bell-registry/shared";

export async function GET(request: NextRequest) {
  try {
    // Get all active jobs
    const jobs = await prisma.job.findMany({
      where: {
        status: JobStatus.ACTIVE,
        OR: [
          { expiresAt: { gte: new Date() } },
          { expiresAt: null }
        ]
      },
      select: {
        id: true,
        title: true,
        professionalRole: true,
        location: true,
        description: true,
        salary: true,
        requirements: true,
        urlSlug: true,
        employer: {
          select: {
            firstName: true,
            lastName: true,
            employerProfile: {
              select: {
                companyName: true,
              }
            }
          }
        }
      },
      take: 50,
      orderBy: { createdAt: 'desc' }
    });

    // Test specific search for estate manager
    const estateManagerJobs = await prisma.job.findMany({
      where: {
        status: JobStatus.ACTIVE,
        OR: [
          { expiresAt: { gte: new Date() } },
          { expiresAt: null },
          {
            title: { contains: "estate", mode: "insensitive" }
          },
          {
            title: { contains: "manager", mode: "insensitive" }
          },
          {
            professionalRole: { contains: "estate", mode: "insensitive" }
          },
          {
            professionalRole: { contains: "manager", mode: "insensitive" }
          }
        ]
      },
      select: {
        id: true,
        title: true,
        professionalRole: true,
        location: true,
        description: true,
      }
    });

    return NextResponse.json({
      totalJobs: jobs.length,
      jobs: jobs.map(job => ({
        id: job.id,
        title: job.title,
        professionalRole: job.professionalRole,
        location: job.location,
        description: job.description.substring(0, 200) + "...",
        salary: job.salary,
        requirements: job.requirements?.slice(0, 3),
        urlSlug: job.urlSlug,
        employer: job.employer?.employerProfile?.companyName || `${job.employer?.firstName} ${job.employer?.lastName}`
      })),
      estateManagerMatches: estateManagerJobs.length,
      estateManagerJobs: estateManagerJobs
    });

  } catch (error: any) {
    console.error('Error fetching debug jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs', details: error.message },
      { status: 500 }
    );
  }
} 