import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse("Not available in production", { status: 404 });
  }

  try {
    const body = await request.json();
    const { daysAgo = 3, resetSurvey = false } = body;

    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No session found" }, { status: 401 });
    }

    const userId = session.user.id;

    // Calculate the date X days ago
    const testCreatedAt = new Date();
    testCreatedAt.setDate(testCreatedAt.getDate() - daysAgo);



    // Update user's created date and optionally reset survey dismissal
    // Also reset lastLoginAt to simulate first login since the new date
    if (resetSurvey) {
          await prisma.$executeRaw`
      UPDATE "User" 
      SET "createdAt" = ${testCreatedAt}::timestamptz, "lastLoginAt" = NULL
      WHERE id = ${userId}
    `;
    } else {
      await prisma.$executeRaw`
        UPDATE "User" 
        SET "createdAt" = ${testCreatedAt}::timestamptz, "lastLoginAt" = NULL
        WHERE id = ${userId}
      `;
    }

    // Get updated user info
    const updatedUserResult = await prisma.$queryRaw`
      SELECT id, email, "createdAt", "surveyDismissedAt"
      FROM "User"
      WHERE id = ${userId}
      LIMIT 1
    `;
    
    const updatedUser = Array.isArray(updatedUserResult) ? updatedUserResult[0] : null;

    return NextResponse.json({
      success: true,
      message: `Test setup complete! User simulated as new user (lastLoginAt reset).`,
      user: updatedUser,
      instructions: {
        next: "Refresh your dashboard to see the survey banner appear immediately",
        note: "Survey now appears on first login regardless of signup date",
        testDismiss: "Use 'Take Survey' for permanent dismiss, 'Maybe Later' for temporary",
        revert: "DELETE /api/test-survey-setup to reset to normal user"
      }
    });
  } catch (error) {
    console.error("[TEST_SURVEY_SETUP]", error);
    return NextResponse.json(
      { 
        error: "Failed to setup test", 
        details: error instanceof Error ? error.message : String(error) 
      }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse("Not available in production", { status: 404 });
  }

  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No session found" }, { status: 401 });
    }

    const userId = session.user.id;

    // Reset to current date (essentially creating a "new" user)
    const now = new Date();
    
    await prisma.$executeRaw`
      UPDATE "User" 
      SET "createdAt" = ${now}::timestamptz, "surveyDismissedAt" = NULL
      WHERE id = ${userId}
    `;

    return NextResponse.json({
      success: true,
      message: "User reset to 'new' status - created today with no survey dismissal",
      user: {
        createdAt: now,
        surveyDismissedAt: null
      }
    });
  } catch (error) {
    console.error("[TEST_SURVEY_SETUP] Reset error:", error);
    return NextResponse.json(
      { 
        error: "Failed to reset test", 
        details: error instanceof Error ? error.message : String(error) 
      }, 
      { status: 500 }
    );
  }
} 