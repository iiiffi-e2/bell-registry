import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canPostJob, handleJobPosting } from "@/lib/subscription-service";
import { isEmployerOrAgencyRole } from "@/lib/auth-helpers";
import { JobStatus } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!isEmployerOrAgencyRole(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized - Employers and Agencies only" },
        { status: 401 }
      );
    }

    // Find the job by URL slug and verify ownership
    const job = await prisma.job.findUnique({
      where: {
        urlSlug: params.slug,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    if (job.employerId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized - You don't own this job" },
        { status: 403 }
      );
    }

    // Check if user can post jobs (relist follows same rules as new posting)
    const canPost = await canPostJob(session.user.id);
    if (!canPost) {
      return NextResponse.json(
        { 
          error: "Cannot relist job. No credits available and no active unlimited posting subscription.", 
          code: "SUBSCRIPTION_LIMIT_REACHED" 
        },
        { status: 403 }
      );
    }

    // Set new listing close date to 45 days from now
    const listingCloseDate = new Date();
    listingCloseDate.setDate(listingCloseDate.getDate() + 45);

    // Update the job to relist it
    const updatedJob = await prisma.job.update({
      where: { id: job.id },
      data: {
        status: JobStatus.ACTIVE,
        listingCloseDate: listingCloseDate,
        updatedAt: new Date(),
      },
    });

    // Handle job posting (consumes credits if no unlimited posting active)
    await handleJobPosting(session.user.id);

    return NextResponse.json({ 
      job: updatedJob,
      message: "Job successfully relisted for 45 days"
    }, { status: 200 });

  } catch (error) {
    console.error("Error relisting job:", error);
    return NextResponse.json(
      { error: "Failed to relist job" },
      { status: 500 }
    );
  }
}
