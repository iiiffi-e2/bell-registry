import { NextRequest, NextResponse } from "next/server";
import { sendBulkProfileActionNotificationEmails } from "@/lib/profile-action-notification-service";
import { UserRole } from "@/types";

export async function POST(request: NextRequest) {
  try {
    // Verify this is an internal admin action
    const adminFlag = request.headers.get('X-Admin-Action');
    if (adminFlag !== 'true') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      users,
      action,
      reason,
      adminName
    } = await request.json();

    if (!users || !Array.isArray(users) || users.length === 0 || !action) {
      return NextResponse.json({ 
        error: "Missing required fields or empty users array" 
      }, { status: 400 });
    }

    if (!['approve', 'suspend', 'flag'].includes(action)) {
      return NextResponse.json({ 
        error: "Invalid action for bulk operations" 
      }, { status: 400 });
    }

    // Convert users data and ensure role enums
    const processedUsers = users.map(user => ({
      email: user.email,
      name: user.name,
      role: typeof user.role === 'string' ? user.role as UserRole : user.role,
      profileSlug: user.profileSlug
    }));

    const result = await sendBulkProfileActionNotificationEmails(
      processedUsers,
      action,
      adminName,
      reason
    );

    return NextResponse.json({ 
      success: true,
      message: `Bulk ${action} notifications processed`,
      ...result
    });

  } catch (error) {
    console.error("Error sending bulk profile action notifications:", error);
    return NextResponse.json(
      { 
        error: "Failed to send bulk notifications",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 