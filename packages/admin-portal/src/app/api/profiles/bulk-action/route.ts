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

    // Get users for these profiles
    const profiles = await prisma.candidateProfile.findMany({
      where: {
        id: { in: profileIds }
      },
      include: {
        user: true
      }
    });

    if (profiles.length === 0) {
      return NextResponse.json({ error: "No valid profiles found" }, { status: 404 });
    }

    let actionType = "";
    let message = "";
    let updatedUsers: any[] = [];

    switch (action) {
      case 'approve':
        // Update profile status to approved
        await prisma.candidateProfile.updateMany({
          where: {
            id: { in: profileIds }
          },
          data: {
            status: 'APPROVED',
            approvedAt: new Date(),
            approvedBy: session.user.id
          }
        });
        actionType = "BULK_APPROVE_PROFILES";
        message = `${profiles.length} profile${profiles.length > 1 ? 's' : ''} approved successfully`;
        break;

      case 'suspend':
        // Update user suspension status
        const suspendPromises = profiles.map(async (profile) => {
          const updatedUser = await prisma.user.update({
            where: { id: profile.user.id },
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
            const userAny = profile.user as any;
            await sendSuspensionNotification({
              userEmail: profile.user.email,
              userName: `${userAny.firstName || ''} ${userAny.lastName || ''}`.trim() || 'User',
              userRole: profile.user.role || 'UNKNOWN',
              suspensionReason: reason,
              suspensionNote: note,
              suspendedByAdmin: {
                name: `${(session.user as any).firstName || ''} ${(session.user as any).lastName || ''}`.trim() || 'Admin',
                email: session.user.email || ''
              },
              suspendedAt: new Date()
            });
            console.log('[BULK_ADMIN_ACTION] Suspension notification sent to:', profile.user.email);
          } catch (emailError) {
            console.error('[BULK_ADMIN_ACTION] Failed to send suspension notification:', emailError);
            // Don't fail the whole action if email fails
          }

          return updatedUser;
        });

        updatedUsers = await Promise.all(suspendPromises);
        actionType = "BULK_SUSPEND_USERS";
        message = `${profiles.length} user${profiles.length > 1 ? 's' : ''} suspended successfully`;
        break;

      case 'ban':
        // Update user ban status
        const banPromises = profiles.map(async (profile) => {
          const updatedUser = await prisma.user.update({
            where: { id: profile.user.id },
            data: {
              isBanned: true,
              bannedAt: new Date(),
              bannedBy: session.user.id
            }
          });

          // Send ban notification email
          try {
            const userAny = profile.user as any;
            await sendBanNotification({
              userEmail: profile.user.email,
              userName: `${userAny.firstName || ''} ${userAny.lastName || ''}`.trim() || 'User',
              userRole: profile.user.role || 'UNKNOWN',
              bannedByAdmin: {
                name: `${(session.user as any).firstName || ''} ${(session.user as any).lastName || ''}`.trim() || 'Admin',
                email: session.user.email || ''
              },
              bannedAt: new Date()
            });
            console.log('[BULK_ADMIN_ACTION] Ban notification sent to:', profile.user.email);
          } catch (emailError) {
            console.error('[BULK_ADMIN_ACTION] Failed to send ban notification:', emailError);
            // Don't fail the whole action if email fails
          }

          return updatedUser;
        });

        updatedUsers = await Promise.all(banPromises);
        actionType = "BULK_BAN_USERS";
        message = `${profiles.length} user${profiles.length > 1 ? 's' : ''} banned successfully`;
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
        affectedCount: profiles.length,
        userEmails: profiles.map(p => p.user.email)
      },
      request.ip,
      request.headers.get("user-agent") || undefined
    );

    return NextResponse.json({ 
      success: true, 
      message,
      affectedCount: profiles.length,
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