import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma, adminAuthOptions, logAdminAction } from "@bell-registry/shared";
import { UserRole, ProfileStatus } from "@bell-registry/shared";

// Import notification service from main app
const MAIN_APP_URL = process.env.MAIN_APP_URL || 'http://localhost:3000';

async function sendBulkProfileActionNotifications(users: any[], action: string, adminName: string, reason?: string, note?: string) {
  try {
    const response = await fetch(`${MAIN_APP_URL}/api/profile-actions/bulk-notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Action': 'true', // Internal API flag
      },
      body: JSON.stringify({
        users: users.map(user => ({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`.trim() || user.email,
          role: user.role,
          profileSlug: user.profileSlug
        })),
        action,
        reason,
        adminName,
        adminNote: note
      })
    });

    if (!response.ok) {
      console.warn(`Failed to send bulk notifications for ${action}: ${response.statusText}`);
      return { success: false, error: response.statusText };
    } else {
      const result = await response.json();
      console.log(`Bulk notifications sent for ${action}:`, result);
      return { success: true, result };
    }
  } catch (error) {
    console.error(`Error sending bulk notifications for ${action}:`, error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(adminAuthOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { profileIds, action, reason, note } = await request.json();

    if (!profileIds || !Array.isArray(profileIds) || profileIds.length === 0) {
      return NextResponse.json({ error: "Profile IDs are required" }, { status: 400 });
    }

    if (!['approve', 'suspend', 'ban', 'flag'].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Get user information for notifications
    const users = await prisma.user.findMany({
      where: { 
        id: { in: profileIds }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        profileSlug: true
      }
    });

    let profileUpdateData: any = {};
    let userUpdateData: any = {};
    let logAction = "";

    switch (action) {
      case 'approve':
        logAction = "BULK_PROFILE_APPROVED";
        profileUpdateData = {
          status: ProfileStatus.APPROVED,
          approvedAt: new Date(),
          approvedBy: session.user.id,
          rejectedAt: null,
          rejectedBy: null,
          rejectionReason: null,
        };
        break;
      case 'suspend':
        logAction = "BULK_PROFILE_SUSPENDED";
        profileUpdateData = {
          status: ProfileStatus.SUSPENDED,
        };
        userUpdateData = {
          isSuspended: true,
          suspensionReason: reason,
          suspensionNote: note,
          suspendedAt: new Date(),
          suspendedBy: session.user.id,
        };
        break;
      case 'ban':
        logAction = "BULK_PROFILE_BANNED";
        profileUpdateData = {
          status: ProfileStatus.SUSPENDED, // Use suspended status for now, add BANNED later
        };
        userUpdateData = {
          isBanned: true,
          suspensionReason: reason, // Use suspension reason for ban reason for now
          suspensionNote: note, // Use suspension note for ban note for now
          bannedAt: new Date(),
          bannedBy: session.user.id,
        };
        break;
      case 'flag':
        logAction = "BULK_PROFILE_FLAGGED";
        // Create profile reports for all selected profiles (when ProfileReport table is available)
        try {
          const reportPromises = profileIds.map((profileId: string) => 
            (prisma as any).profileReport.create({
              data: {
                reportedUserId: profileId,
                reporterUserId: session.user.id,
                reason: reason || "Flagged by admin",
                details: note || "Profile flagged for review by admin (bulk action)",
              }
            })
          );
          await Promise.all(reportPromises);
        } catch (error) {
          console.warn("ProfileReport table not available yet:", error);
        }
        break;
    }

    // Update candidate profiles if we have profile data to update
    if (Object.keys(profileUpdateData).length > 0) {
      await prisma.candidateProfile.updateMany({
        where: { 
          userId: { in: profileIds }
        },
        data: profileUpdateData,
      });
    }

    // Update users if we have user data to update
    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.updateMany({
        where: { 
          id: { in: profileIds }
        },
        data: userUpdateData,
      });
    }

    // Send bulk email notifications (don't fail if this fails)
    const adminName = session.user.name || session.user.email || 'Bell Registry Admin';
    const notificationResult = await sendBulkProfileActionNotifications(users, action, adminName, reason, note);

    // Log the admin action
    await logAdminAction(
      session.user.id,
      logAction,
      { 
        endpoint: "/api/profiles/bulk-action",
        action,
        reason,
        note,
        profileIds,
        profileCount: profileIds.length,
        notificationResult
      },
      request.ip,
      request.headers.get("user-agent") || undefined
    );

    const actionPastTense = action === 'ban' ? 'banned' : `${action}d`;
    const message = notificationResult.success 
      ? `Bulk ${actionPastTense} completed successfully for ${profileIds.length} profiles. Users have been notified via email.`
      : `Bulk ${actionPastTense} completed successfully for ${profileIds.length} profiles. (Note: Some email notifications may have failed)`;

    return NextResponse.json({ 
      success: true, 
      message,
      notificationResult
    });

  } catch (error) {
    console.error("Error in bulk profile action:", error);
    return NextResponse.json(
      { error: "Failed to perform bulk action" },
      { status: 500 }
    );
  }
} 