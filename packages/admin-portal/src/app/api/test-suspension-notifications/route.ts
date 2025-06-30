import { NextRequest, NextResponse } from "next/server";
import { sendSuspensionNotification, sendBanNotification, sendUnsuspensionNotification } from "@bell-registry/shared";

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse("Not available in production", { status: 404 });
  }

  try {
    const body = await request.json();
    const { 
      type = 'suspension',
      userEmail = 'test@example.com',
      userName = 'Test User',
      userRole = 'PROFESSIONAL',
      suspensionReason = 'Test suspension for email verification',
      suspensionNote = 'This is a test suspension to verify email functionality'
    } = body;

    console.log(`[ADMIN_TEST_NOTIFICATIONS] Testing ${type} notification email`);

    let result;
    
    switch (type) {
      case 'suspension':
        result = await sendSuspensionNotification({
          userEmail,
          userName,
          userRole,
          suspensionReason,
          suspensionNote,
          suspendedByAdmin: {
            name: 'Test Admin',
            email: 'admin@example.com'
          },
          suspendedAt: new Date()
        });
        break;
        
      case 'ban':
        result = await sendBanNotification({
          userEmail,
          userName,
          userRole,
          bannedByAdmin: {
            name: 'Test Admin',
            email: 'admin@example.com'
          },
          bannedAt: new Date()
        });
        break;
        
      case 'unsuspension':
        result = await sendUnsuspensionNotification({
          userEmail,
          userName,
          userRole,
          unsuspendedByAdmin: {
            name: 'Test Admin',
            email: 'admin@example.com'
          },
          unsuspendedAt: new Date()
        });
        break;
        
      default:
        return NextResponse.json({ error: "Invalid notification type" }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Test ${type} notification email sent from admin portal`,
      details: {
        type,
        userEmail,
        userName,
        userRole,
        isDevelopment: true,
        source: 'admin-portal',
        result
      }
    });
  } catch (error) {
    console.error("[ADMIN_TEST_NOTIFICATIONS]", error);
    return NextResponse.json(
      { 
        error: "Failed to send test notification", 
        details: error instanceof Error ? error.message : String(error) 
      }, 
      { status: 500 }
    );
  }
} 