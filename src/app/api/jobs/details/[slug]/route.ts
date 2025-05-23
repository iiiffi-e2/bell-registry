import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession();
    const currentUserId = session?.user?.id;

    // Find the job by URL slug
    const job = await prisma.job.findUnique({
      where: {
        urlSlug: params.slug,
      } as any,
      include: {
        employer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employerProfile: {
              select: {
                companyName: true,
                description: true,
                website: true,
                logoUrl: true,
                location: true,
              },
            },
          },
        },
        applications: currentUserId ? {
          where: {
            candidateId: currentUserId,
          },
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        } : false,
        savedBy: currentUserId ? {
          where: {
            userId: currentUserId,
          },
          select: {
            id: true,
          },
        } : false,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Check if job is expired
    const isExpired = job.expiresAt && new Date() > job.expiresAt;
    if (isExpired && job.status === 'ACTIVE') {
      // Optionally auto-expire the job
      await prisma.job.update({
        where: { id: job.id },
        data: { status: 'EXPIRED' },
      });
    }

    // Format the response
    const jobResponse = {
      ...job,
      isBookmarked: currentUserId ? (job as any).savedBy?.length > 0 : false,
      hasApplied: currentUserId ? (job as any).applications?.length > 0 : false,
      userApplications: currentUserId ? (job as any).applications : [],
    };

    // Remove the savedBy and applications arrays from the response
    // since we've transformed them into boolean flags
    delete (jobResponse as any).savedBy;
    if (!currentUserId) {
      delete (jobResponse as any).applications;
    }

    return NextResponse.json({
      job: jobResponse,
    });
  } catch (error) {
    console.error("Error fetching job details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 