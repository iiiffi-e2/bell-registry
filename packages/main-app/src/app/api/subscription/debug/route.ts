import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get employer profile
    const employer = await prisma.employerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!employer) {
      return NextResponse.json({ error: "Employer profile not found" }, { status: 404 });
    }

    // Get all jobs for this employer
    const allJobs = await prisma.job.findMany({
      where: { employerId: session.user.id },
      select: {
        id: true,
        title: true,
        createdAt: true,
        status: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'asc' }
    });

    const subscriptionStartDate = (employer as any).subscriptionStartDate || employer.createdAt;
    const subscriptionType = (employer as any).subscriptionType;

    // Filter jobs based on subscription start date
    const jobsAfterSubscriptionStart = allJobs.filter(job => 
      new Date(job.createdAt) >= new Date(subscriptionStartDate)
    );

    const activeJobsAfterSubscriptionStart = jobsAfterSubscriptionStart.filter(job => 
      job.status === 'ACTIVE' || job.status === 'FILLED'
    );

    return NextResponse.json({
      employer: {
        subscriptionType,
        subscriptionStartDate,
        subscriptionEndDate: (employer as any).subscriptionEndDate,
        jobPostLimit: (employer as any).jobPostLimit,
        jobsPostedCount: (employer as any).jobsPostedCount, // Database field
        createdAt: employer.createdAt,
      },
      allJobs: allJobs.map(job => ({
        ...job,
        createdAt: job.createdAt.toISOString(),
        expiresAt: job.expiresAt?.toISOString(),
        isAfterSubscriptionStart: new Date(job.createdAt) >= new Date(subscriptionStartDate),
        isActive: job.status === 'ACTIVE' || job.status === 'FILLED'
      })),
      counts: {
        totalJobs: allJobs.length,
        activeJobs: allJobs.filter(j => j.status === 'ACTIVE' || j.status === 'FILLED').length,
        jobsAfterSubscriptionStart: jobsAfterSubscriptionStart.length,
        activeJobsAfterSubscriptionStart: activeJobsAfterSubscriptionStart.length,
      },
      dates: {
        now: new Date().toISOString(),
        employerCreatedAt: employer.createdAt.toISOString(),
        subscriptionStartDate: new Date(subscriptionStartDate).toISOString(),
      }
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }, { status: 500 });
  }
} 