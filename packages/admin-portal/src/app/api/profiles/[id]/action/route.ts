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

    const userId = params.id;
    const body = await request.json();
    const { action, reason, note } = body;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        candidateProfile: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let updatedUser;
    let updatedProfile;
    let actionType = "";
    let message = "";

    switch (action) {
      case 'approve':
        if (user.candidateProfile) {
          updatedProfile = await (prisma as any).candidateProfile.update({
            where: { userId: userId },
            data: {
              status: 'APPROVED',
              approvedAt: new Date(),
              approvedBy: session.user.id
            }
          });
        }
        actionType = "APPROVE_PROFILE";
        message = "Profile approved successfully";
        break;

      case 'reject':
        if (user.candidateProfile) {
          updatedProfile = await (prisma as any).candidateProfile.update({
            where: { userId: userId },
            data: {
              status: 'REJECTED',
              rejectedAt: new Date(),
              rejectedBy: session.user.id,
              rejectionReason: reason
            }
          });
        }
        actionType = "REJECT_PROFILE";
        message = "Profile rejected successfully";
        break;

      case 'suspend':
        updatedUser = await (prisma as any).user.update({
          where: { id: userId },
          data: {
            isSuspended: true,
            suspensionReason: reason,
            suspensionNote: note,
            suspendedAt: new Date(),
            suspendedBy: session.user.id
          }
        });
        actionType = "SUSPEND_USER";
        message = "User suspended successfully";
        break;

      case 'unsuspend':
        updatedUser = await (prisma as any).user.update({
          where: { id: userId },
          data: {
            isSuspended: false,
            suspensionReason: null,
            suspensionNote: null,
            suspendedAt: null,
            suspendedBy: null
          }
        });
        actionType = "UNSUSPEND_USER";
        message = "User unsuspended successfully";
        break;

      case 'ban':
        updatedUser = await (prisma as any).user.update({
          where: { id: userId },
          data: {
            isBanned: true,
            bannedAt: new Date(),
            bannedBy: session.user.id
          }
        });
        actionType = "BAN_USER";
        message = "User banned successfully";
        break;

      case 'unban':
        updatedUser = await (prisma as any).user.update({
          where: { id: userId },
          data: {
            isBanned: false,
            bannedAt: null,
            bannedBy: null
          }
        });
        actionType = "UNBAN_USER";
        message = "User unbanned successfully";
        break;

      case 'flag':
        // Create a system-generated report for flagged profiles
        try {
          await (prisma as any).profileReport.create({
            data: {
              reportedUserId: userId,
              reason: "FLAGGED_BY_ADMIN",
              details: reason || "Profile flagged by admin for review",
              status: "PENDING"
            }
          });
        } catch (error) {
          // If profileReport table doesn't exist, just log the action
          console.log("ProfileReport table not available, logging flag action only");
        }
        actionType = "FLAG_PROFILE";
        message = "Profile flagged for review";
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Log this admin action
    await logAdminAction(
      session.user.id,
      actionType,
      { 
        targetUserId: userId,
        targetUserEmail: user.email,
        action: action,
        reason: reason,
        note: note
      },
      request.ip,
      request.headers.get("user-agent") || undefined
    );

    return NextResponse.json({ 
      success: true, 
      message: message,
      user: updatedUser,
      profile: updatedProfile
    });

  } catch (error) {
    console.error(`Error performing profile action:`, error);
    return NextResponse.json(
      { error: "Failed to perform action" },
      { status: 500 }
    );
  }
} 