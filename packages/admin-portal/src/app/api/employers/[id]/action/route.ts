import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma, adminAuthOptions, logAdminAction } from "@bell-registry/shared";
import { UserRole } from "@bell-registry/shared";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(adminAuthOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: employerId } = params;
    const { action, reason, note } = await request.json();

    if (!action || !['approve', 'reject', 'suspend', 'flag', 'ban', 'remove'].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Verify the user exists and is an employer/agency
    const user = await prisma.user.findUnique({
      where: { 
        id: employerId,
        isDeleted: false,
        role: { in: ['EMPLOYER', 'AGENCY'] }
      },
      include: {
        employerProfile: true
      }
    });

    if (!user || !user.employerProfile) {
      return NextResponse.json({ error: "Employer not found" }, { status: 404 });
    }

    let message = '';

    switch (action) {
      case 'approve':
        // For employers, approve means unsuspend and unban
        await prisma.user.update({
          where: { id: employerId },
          data: {
            isSuspended: false,
            isBanned: false,
            suspensionReason: null,
            suspensionNote: null
          }
        });
        message = 'Employer approved successfully';
        break;

      case 'reject':
        // For employers, reject could mean suspend or flag
        await prisma.user.update({
          where: { id: employerId },
          data: {
            isSuspended: true,
            suspensionReason: reason || 'Rejected by admin',
            suspensionNote: note || null
          }
        });
        message = 'Employer rejected';
        break;

      case 'suspend':
        await prisma.user.update({
          where: { id: employerId },
          data: {
            isSuspended: true,
            isBanned: false,
            suspensionReason: reason || 'Suspended by admin',
            suspensionNote: note || null
          }
        });
        message = 'Employer suspended successfully';
        break;

      case 'ban':
        await prisma.user.update({
          where: { id: employerId },
          data: {
            isBanned: true,
            isSuspended: false,
            suspensionReason: reason || 'Banned by admin',
            suspensionNote: note || null
          }
        });
        message = 'Employer banned successfully';
        break;

      case 'flag':
        // Create a report entry for flagged employer
        try {
          await (prisma as any).profileReport.create({
            data: {
              reportedUserId: employerId,
              reporterId: session.user.id,
              reason: reason || 'Flagged by admin',
              details: reason || "Employer flagged by admin for review",
              status: 'PENDING',
              createdAt: new Date()
            }
          });
        } catch (reportError) {
          console.warn('Could not create report entry:', reportError);
        }
        message = "Employer flagged for review";
        break;

      case 'remove':
        await prisma.user.update({
          where: { id: employerId },
          data: {
            isRemoved: true,
            removedAt: new Date(),
            removedBy: session.user.id
          }
        });
        message = 'Employer removed successfully';
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Log this admin action
    await logAdminAction(
      session.user.id,
      `EMPLOYER_${action.toUpperCase()}`,
      { 
        endpoint: `/api/employers/${employerId}/action`,
        targetId: employerId,
        action,
        reason: reason || undefined,
        note: note || undefined
      },
      request.ip,
      request.headers.get("user-agent") || undefined
    );

    return NextResponse.json({ message });

  } catch (error) {
    console.error("Error in employer action:", error);
    return NextResponse.json(
      { error: "Failed to perform action" },
      { status: 500 }
    );
  }
}
