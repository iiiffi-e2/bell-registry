import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isDeleted: true,
        // isSuspended: true, // Uncomment when available
      }
    });

    const isSuspended = (user as any)?.isSuspended || false;

    return NextResponse.json({
      success: true,
      message: "Enforcement system test",
      user: {
        id: user?.id,
        email: user?.email,
        name: `${user?.firstName} ${user?.lastName}`.trim(),
        isDeleted: user?.isDeleted || false,
        isSuspended,
      },
      enforcement: {
        authChecks: "✅ Authentication working",
        suspensionCheck: isSuspended ? "⚠️ User is suspended" : "✅ User is not suspended",
        profileVisibility: "🔄 Will be hidden if suspended",
        apiAccess: "🔄 Will be restricted if suspended",
      }
    });

  } catch (error) {
    console.error("Test enforcement error:", error);
    return NextResponse.json(
      { 
        error: "Test failed", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  try {
    const { action, userId } = await request.json();

    if (!userId || !action) {
      return NextResponse.json({ 
        error: "Missing userId or action" 
      }, { status: 400 });
    }

    if (action === 'suspend') {
      // Test suspending a user (when isSuspended field is available)
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { 
            // isSuspended: true 
          }
        });

        return NextResponse.json({
          success: true,
          message: `User ${userId} suspended (field not available yet)`,
          note: "Run database migration to add isSuspended field"
        });
      } catch (error) {
        return NextResponse.json({
          success: false,
          message: "isSuspended field not available yet",
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    if (action === 'unsuspend') {
      // Test unsuspending a user
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { 
            // isSuspended: false 
          }
        });

        return NextResponse.json({
          success: true,
          message: `User ${userId} unsuspended (field not available yet)`,
        });
      } catch (error) {
        return NextResponse.json({
          success: false,
          message: "isSuspended field not available yet",
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return NextResponse.json({ 
      error: "Invalid action. Use 'suspend' or 'unsuspend'" 
    }, { status: 400 });

  } catch (error) {
    console.error("Test enforcement POST error:", error);
    return NextResponse.json(
      { 
        error: "Test failed", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 