import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is an employer or agency
    if (session.user.role !== 'EMPLOYER' && session.user.role !== 'AGENCY') {
      return NextResponse.json(
        { error: 'Only employers and agencies can access these stats' },
        { status: 403 }
      );
    }

    const employerId = session.user.id;

    // Get various statistics
    const [
      activeJobsCount,
      totalApplicationsCount,
      newApplicationsCount,
      savedCandidatesCount,
      totalViewsCount
    ] = await Promise.all([
      // Active jobs count
      prisma.job.count({
        where: {
          employerId,
          status: 'ACTIVE'
        }
      }),
      
      // Total applications count
      prisma.jobApplication.count({
        where: {
          job: {
            employerId
          }
        }
      }),
      
      // New applications count (pending status)
      prisma.jobApplication.count({
        where: {
          job: {
            employerId
          },
          status: 'PENDING'
        }
      }),
      
      // Saved candidates count
      prisma.savedCandidate.count({
        where: {
          employerId
        }
      }),
      
      // Total job views count
      prisma.jobViewEvent.count({
        where: {
          job: {
            employerId
          }
        }
      })
    ]);

    return NextResponse.json({
      activeJobs: activeJobsCount,
      totalApplications: totalApplicationsCount,
      newApplications: newApplicationsCount,
      savedCandidates: savedCandidatesCount,
      totalViews: totalViewsCount
    });
  } catch (error) {
    console.error('Error fetching employer stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employer stats' },
      { status: 500 }
    );
  }
} 