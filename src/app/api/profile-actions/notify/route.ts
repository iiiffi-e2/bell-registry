import { NextRequest, NextResponse } from "next/server";
import { sendProfileActionNotificationEmail } from "@/lib/profile-action-notification-service";
import { UserRole } from "@/types";

export async function POST(request: NextRequest) {
  try {
    // Verify this is an internal admin action
    const adminFlag = request.headers.get('X-Admin-Action');
    if (adminFlag !== 'true') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      userEmail,
      userName,
      userRole,
      action,
      reason,
      adminName,
      profileSlug
    } = await request.json();

    if (!userEmail || !userName || !userRole || !action) {
      return NextResponse.json({ 
        error: "Missing required fields" 
      }, { status: 400 });
    }

    if (!['approve', 'reject', 'suspend', 'flag'].includes(action)) {
      return NextResponse.json({ 
        error: "Invalid action" 
      }, { status: 400 });
    }

    // Convert role string to enum if needed
    const role = typeof userRole === 'string' ? userRole as UserRole : userRole;

    await sendProfileActionNotificationEmail({
      userEmail,
      userName,
      userRole: role,
      action,
      reason,
      adminName,
      profileSlug
    });

    return NextResponse.json({ 
      success: true,
      message: `Profile ${action} notification sent to ${userEmail}`
    });

  } catch (error) {
    console.error("Error sending profile action notification:", error);
    return NextResponse.json(
      { 
        error: "Failed to send notification",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 