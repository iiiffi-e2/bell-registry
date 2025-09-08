import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma, adminAuthOptions, logAdminAction } from "@bell-registry/shared";
import { UserRole } from "@bell-registry/shared";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(adminAuthOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jobId = params.id;

    // First, get the job details for logging
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        employer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            employerProfile: {
              select: {
                companyName: true
              }
            }
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      }
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Log this admin action before deletion
    await logAdminAction(
      session.user.id,
      "DELETE_JOB",
      {
        jobId: job.id,
        jobTitle: job.title,
        employerId: job.employerId,
        employerEmail: job.employer.email,
        companyName: job.employer.employerProfile?.companyName,
        applicationCount: job._count.applications,
        adminStatus: job.adminStatus,
        reason: "Admin deletion via admin portal"
      },
      request.ip,
      request.headers.get("user-agent") || undefined
    );

    // Delete the job (this will cascade delete related records like applications, matches, etc.)
    await prisma.job.delete({
      where: { id: jobId }
    });

    console.log(`✅ Admin ${session.user.email} deleted job: ${job.title} (ID: ${jobId})`);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted job "${job.title}"`,
      deletedJob: {
        id: job.id,
        title: job.title,
        companyName: job.employer.employerProfile?.companyName,
        applicationCount: job._count.applications
      }
    });

  } catch (error) {
    console.error("Error deleting job:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to delete job", 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(adminAuthOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jobId = params.id;

    // Get job details
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        employer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            employerProfile: {
              select: {
                companyName: true,
                industry: true,
                location: true
              }
            }
          }
        },
        approver: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        rejecter: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        _count: {
          select: {
            applications: true,
            viewEvents: true,
            savedBy: true
          }
        }
      }
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ job });

  } catch (error) {
    console.error("Error fetching job details:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch job details", 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
