import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@bell-registry/shared";
import { isEmployerOrAgencyRole } from "@/lib/roles";

export async function PUT(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !isEmployerOrAgencyRole(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized - Employers and Agencies only" },
        { status: 401 }
      );
    }

    const data = await request.json();

    // Find the job first to verify ownership
    const existingJob = await prisma.job.findUnique({
      where: {
        urlSlug: params.slug
      } as any,
      select: { id: true, employerId: true, status: true }
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (existingJob.employerId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized - You can only edit your own jobs" },
        { status: 403 }
      );
    }

    // Update the job
    const updateData = {
      title: data.title,
      professionalRole: data.professionalRole,
      description: data.description,
      exceptionalOpportunity: data.exceptionalOpportunity,
      location: data.location,
      requirements: data.requirements,
      compensation: data.compensation,
      jobType: data.jobType,
      employmentType: data.employmentType,
      status: data.status as JobStatus,
      featured: data.featured,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    };

    const job = await prisma.job.update({
      where: { id: existingJob.id },
      data: updateData,
    });

    return NextResponse.json({ job });
  } catch (error) {
    console.error("Error updating job:", error);
    return NextResponse.json(
      { error: "Failed to update job" },
      { status: 500 }
    );
  }
} 