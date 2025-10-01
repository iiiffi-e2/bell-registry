import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma, adminAuthOptions, logAdminAction } from "@bell-registry/shared";
import { UserRole } from "@bell-registry/shared";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(adminAuthOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { employerIds, action, reason, note } = await request.json();

    if (!employerIds || !Array.isArray(employerIds) || employerIds.length === 0) {
      return NextResponse.json({ error: "Invalid employer IDs" }, { status: 400 });
    }

    if (!action || !['approve', 'suspend', 'flag', 'ban', 'remove', 'delete'].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    let message = '';
    let updatedCount = 0;

    // Process each employer
    for (const employerId of employerIds) {
      try {
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
          console.warn(`Employer ${employerId} not found or invalid`);
          continue;
        }

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
            message = 'Employers approved successfully';
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
            message = 'Employers suspended successfully';
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
            message = 'Employers banned successfully';
            break;

          case 'flag':
            // Create a report entry for flagged employers
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
            message = 'Employers flagged for review';
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
            message = 'Employers removed successfully';
            break;

          case 'delete':
            await prisma.user.update({
              where: { id: employerId },
              data: {
                isDeleted: true,
                deletedAt: new Date()
              }
            });
            message = 'Employers deleted successfully';
            break;
        }

        updatedCount++;

        // Log individual admin action
        await logAdminAction(
          session.user.id,
          `BULK_EMPLOYER_${action.toUpperCase()}`,
          { 
            endpoint: "/api/employers/bulk-action",
            targetId: employerId,
            action,
            reason: reason || undefined,
            note: note || undefined
          },
          request.ip,
          request.headers.get("user-agent") || undefined
        );

      } catch (error) {
        console.error(`Error processing employer ${employerId}:`, error);
      }
    }

    // Log the bulk action summary
    await logAdminAction(
      session.user.id,
      "BULK_EMPLOYER_ACTION",
      { 
        endpoint: "/api/employers/bulk-action",
        action,
        employerIds,
        updatedCount,
        reason: reason || undefined,
        note: note || undefined
      },
      request.ip,
      request.headers.get("user-agent") || undefined
    );

    return NextResponse.json({ 
      message,
      updatedCount,
      totalRequested: employerIds.length
    });

  } catch (error) {
    console.error("Error in bulk employer action:", error);
    return NextResponse.json(
      { error: "Failed to perform bulk action" },
      { status: 500 }
    );
  }
}
