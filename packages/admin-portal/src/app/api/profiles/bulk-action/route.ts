import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma, adminAuthOptions, logAdminAction, sendSuspensionNotification, sendBanNotification } from "@bell-registry/shared";
import { UserRole } from "@bell-registry/shared";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(adminAuthOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { profileIds, action, reason, note } = body;

    if (!profileIds || !Array.isArray(profileIds) || profileIds.length === 0) {
      return NextResponse.json({ error: "Profile IDs are required" }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    // Get users for these user IDs (profileIds actually contains user IDs)
    const users = await prisma.user.findMany({
      where: {
        id: { in: profileIds },
        isDeleted: false
      },
      include: {
        candidateProfile: true
      }
    });

    if (users.length === 0) {
      return NextResponse.json({ error: "No valid users found" }, { status: 404 });
    }

    let actionType = "";
    let message = "";
    let updatedUsers: any[] = [];

    switch (action) {
      case 'approve':
        // Update profile status to approved for users that have candidate profiles
        const userIdsWithProfiles = users.filter(u => u.candidateProfile).map(u => u.id);
        if (userIdsWithProfiles.length > 0) {
          await prisma.candidateProfile.updateMany({
            where: {
              userId: { in: userIdsWithProfiles }
            },
            data: {
              status: 'APPROVED',
              approvedAt: new Date(),
              approvedBy: session.user.id
            }
          });
        }
        actionType = "BULK_APPROVE_PROFILES";
        message = `${users.length} profile${users.length > 1 ? 's' : ''} approved successfully`;
        break;

      case 'suspend':
        // Update user suspension status
        const suspendPromises = users.map(async (user) => {
          const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
              isSuspended: true,
              suspensionReason: reason,
              suspensionNote: note,
              suspendedAt: new Date(),
              suspendedBy: session.user.id
            }
          });

          // Send suspension notification email
          try {
            const userAny = user as any;
            await sendSuspensionNotification({
              userEmail: user.email,
              userName: `${userAny.firstName || ''} ${userAny.lastName || ''}`.trim() || 'User',
              userRole: user.role || 'UNKNOWN',
              suspensionReason: reason,
              suspensionNote: note,
              suspendedByAdmin: {
                name: `${(session.user as any).firstName || ''} ${(session.user as any).lastName || ''}`.trim() || 'Admin',
                email: session.user.email || ''
              },
              suspendedAt: new Date()
            });
            console.log('[BULK_ADMIN_ACTION] Suspension notification sent to:', user.email);
          } catch (emailError) {
            console.error('[BULK_ADMIN_ACTION] Failed to send suspension notification:', emailError);
            // Don't fail the whole action if email fails
          }

          return updatedUser;
        });

        updatedUsers = await Promise.all(suspendPromises);
        actionType = "BULK_SUSPEND_USERS";
        message = `${users.length} user${users.length > 1 ? 's' : ''} suspended successfully`;
        break;

      case 'ban':
        // Update user ban status
        const banPromises = users.map(async (user) => {
          const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
              isBanned: true,
              bannedAt: new Date(),
              bannedBy: session.user.id
            }
          });

          // Send ban notification email
          try {
            const userAny = user as any;
            await sendBanNotification({
              userEmail: user.email,
              userName: `${userAny.firstName || ''} ${userAny.lastName || ''}`.trim() || 'User',
              userRole: user.role || 'UNKNOWN',
              bannedByAdmin: {
                name: `${(session.user as any).firstName || ''} ${(session.user as any).lastName || ''}`.trim() || 'Admin',
                email: session.user.email || ''
              },
              bannedAt: new Date()
            });
            console.log('[BULK_ADMIN_ACTION] Ban notification sent to:', user.email);
          } catch (emailError) {
            console.error('[BULK_ADMIN_ACTION] Failed to send ban notification:', emailError);
            // Don't fail the whole action if email fails
          }

          return updatedUser;
        });

        updatedUsers = await Promise.all(banPromises);
        actionType = "BULK_BAN_USERS";
        message = `${users.length} user${users.length > 1 ? 's' : ''} banned successfully`;
        break;

      case 'remove':
        // Mark users as removed (no email notifications)
        const removePromises = users.map(async (user) => {
          const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
              isRemoved: true,
              removedAt: new Date(),
              removedBy: session.user.id
            }
          });

          // Update profile status to REMOVED if it exists
          if (user.candidateProfile) {
            await prisma.candidateProfile.update({
              where: { userId: user.id },
              data: {
                status: 'REMOVED'
              }
            });
          }

          return updatedUser;
        });

        updatedUsers = await Promise.all(removePromises);
        actionType = "BULK_REMOVE_USERS";
        message = `${users.length} user${users.length > 1 ? 's' : ''} removed successfully`;
        break;

      case 'pending':
        // Set profile status back to PENDING for re-review
        const userIdsWithProfilesForPending = users.filter(u => u.candidateProfile).map(u => u.id);
        if (userIdsWithProfilesForPending.length > 0) {
          await prisma.candidateProfile.updateMany({
            where: {
              userId: { in: userIdsWithProfilesForPending }
            },
            data: {
              status: 'PENDING',
              approvedAt: null,
              approvedBy: null,
              rejectedAt: null,
              rejectedBy: null,
              rejectionReason: null
            }
          });
        }
        actionType = "BULK_SET_PROFILES_PENDING";
        message = `${users.length} profile${users.length > 1 ? 's' : ''} set to pending for re-review`;
        break;

      case 'delete':
        // Soft delete users
        const deletePromises = users.map(async (user) => {
          const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
              isDeleted: true,
              deletedAt: new Date()
            }
          });
          return updatedUser;
        });

        updatedUsers = await Promise.all(deletePromises);
        actionType = "BULK_DELETE_PROFILES";
        message = `${users.length} profile${users.length > 1 ? 's' : ''} deleted successfully`;
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Log this admin action
    await logAdminAction(
      session.user.id,
      actionType,
      { 
        profileIds,
        action,
        reason,
        note,
        affectedCount: users.length,
        userEmails: users.map(u => u.email)
      },
      request.ip,
      request.headers.get("user-agent") || undefined
    );

    return NextResponse.json({ 
      success: true, 
      message,
      affectedCount: users.length,
      users: updatedUsers
    });

  } catch (error) {
    console.error(`Error performing bulk action:`, error);
    return NextResponse.json(
      { error: "Failed to perform bulk action" },
      { status: 500 }
    );
  }
} 