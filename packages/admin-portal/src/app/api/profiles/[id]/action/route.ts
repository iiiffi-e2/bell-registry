import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma, adminAuthOptions, logAdminAction } from "@bell-registry/shared";
import { UserRole, ProfileStatus } from "@bell-registry/shared";

// Import notification service from main app
const MAIN_APP_URL = process.env.MAIN_APP_URL || 'http://localhost:3000';

async function sendProfileActionNotification(user: any, action: string, adminName: string, reason?: string, note?: string) {
  try {
    const response = await fetch(`${MAIN_APP_URL}/api/profile-actions/notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Action': 'true', // Internal API flag
      },
      body: JSON.stringify({
        userEmail: user.email,
        userName: `${user.firstName} ${user.lastName}`.trim() || user.email,
        userRole: user.role,
        action,
        reason,
        adminName,
        adminNote: note,
        profileSlug: user.profileSlug
      })
    });

    if (!response.ok) {
      console.warn(`Failed to send notification for ${action} to ${user.email}: ${response.statusText}`);
    } else {
      console.log(`Notification sent for ${action} to ${user.email}`);
    }
  } catch (error) {
    console.error(`Error sending notification for ${action} to ${user.email}:`, error);
    // Don't fail the main action if notification fails
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(adminAuthOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, reason, note } = await request.json();
    const profileId = params.id;

    if (!['approve', 'reject', 'suspend', 'ban', 'flag'].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Verify the user exists
    const user = await prisma.user.findUnique({
      where: { id: profileId },
      include: {
        candidateProfile: true
      }
    });

    if (!user || !user.candidateProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    let logAction = "";
    let profileUpdateData: any = {};
    let userUpdateData: any = {};

    switch (action) {
      case 'approve':
        logAction = "PROFILE_APPROVED";
        profileUpdateData = {
          status: ProfileStatus.APPROVED,
          approvedAt: new Date(),
          approvedBy: session.user.id,
          rejectedAt: null,
          rejectedBy: null,
          rejectionReason: null,
        };
        // Clear suspension/ban flags when approving
        userUpdateData = {
          isSuspended: false,
          isBanned: false,
          suspensionReason: null,
          suspensionNote: null,
          suspendedAt: null,
          suspendedBy: null,
          bannedAt: null,
          bannedBy: null,
        };
        break;
      case 'reject':
        logAction = "PROFILE_REJECTED";
        profileUpdateData = {
          status: ProfileStatus.REJECTED,
          rejectedAt: new Date(),
          rejectedBy: session.user.id,
          rejectionReason: reason || "Profile rejected by admin",
          approvedAt: null,
          approvedBy: null,
        };
        break;
      case 'suspend':
        logAction = "PROFILE_SUSPENDED";
        profileUpdateData = {
          status: ProfileStatus.SUSPENDED,
        };
        userUpdateData = {
          isSuspended: true,
          isBanned: false, // Clear banned flag when suspending
          suspensionReason: reason,
          suspensionNote: note,
          suspendedAt: new Date(),
          suspendedBy: session.user.id,
          // Clear ban fields
          bannedAt: null,
          bannedBy: null,
        };
        break;
      case 'ban':
        logAction = "PROFILE_BANNED";
        profileUpdateData = {
          status: ProfileStatus.BANNED, // Use the BANNED status
        };
        userUpdateData = {
          isBanned: true,
          isSuspended: false, // Clear suspended flag when banning
          suspensionReason: reason, // Keep reason for now
          suspensionNote: note, // Keep note for now
          bannedAt: new Date(),
          bannedBy: session.user.id,
          // Clear suspension fields
          suspendedAt: null,
          suspendedBy: null,
        };
        break;
      case 'flag':
        logAction = "PROFILE_FLAGGED";
        // Create a profile report (when ProfileReport table is available)
        try {
          await (prisma as any).profileReport.create({
            data: {
              reportedUserId: profileId,
              reporterUserId: session.user.id,
              reason: reason || "Flagged by admin",
              details: note || "Profile flagged for review by admin",
            }
          });
        } catch (error) {
          console.warn("ProfileReport table not available yet:", error);
        }
        break;
    }

    // Update the candidate profile if we have profile data to update
    if (Object.keys(profileUpdateData).length > 0) {
      await prisma.candidateProfile.update({
        where: { userId: profileId },
        data: profileUpdateData,
      });
    }

    // Update the user if we have user data to update
    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: profileId },
        data: userUpdateData,
      });
    }

    // Send email notification to the user (don't fail if this fails)
    const adminName = session.user.name || session.user.email || 'Bell Registry Admin';
    await sendProfileActionNotification(user, action, adminName, reason, note);

    // Log the admin action
    await logAdminAction(
      session.user.id,
      logAction,
      { 
        endpoint: `/api/profiles/${profileId}/action`,
        action,
        reason,
        note,
        targetUserId: profileId,
        targetUserEmail: user.email,
        targetUserName: `${user.firstName} ${user.lastName}`.trim(),
        notificationSent: true
      },
      request.ip,
      request.headers.get("user-agent") || undefined
    );

    const actionPastTense = action === 'ban' ? 'banned' : `${action}d`;
    return NextResponse.json({ 
      success: true, 
      message: `Profile ${actionPastTense} successfully. User has been notified via email.`
    });

  } catch (error) {
    console.error("Error in profile action:", error);
    return NextResponse.json(
      { error: "Failed to perform profile action" },
      { status: 500 }
    );
  }
} 