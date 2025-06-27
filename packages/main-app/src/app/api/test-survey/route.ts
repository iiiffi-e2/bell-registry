import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSurveyStatus } from "@/lib/survey-service";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
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
    const surveyStatus = await getSurveyStatus(userId);

    return NextResponse.json({ 
      success: true,
      userId,
      surveyStatus,
      message: "Survey status retrieved successfully",
      debug: {
        isDevelopment: true,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("[TEST_SURVEY]", error);
    return NextResponse.json(
      { 
        error: "Failed to get survey status", 
        details: error instanceof Error ? error.message : String(error) 
      }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse("Not available in production", { status: 404 });
  }

  try {
    const body = await request.json();
    const { action = 'status' } = body;

    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No session found" }, { status: 401 });
    }

    const userId = session.user.id;

    if (action === 'dismiss') {
      // Test dismissing the survey
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/survey/dismiss`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('Cookie') || '',
        },
      });

      const result = await response.json();

      return NextResponse.json({
        success: true,
        action: 'dismiss',
        result,
        message: "Survey dismissal tested successfully"
      });
    }

    // Default to status check
    const surveyStatus = await getSurveyStatus(userId);

    // Also get raw user data for debugging
    const userResult = await prisma.$queryRaw`
              SELECT 
          "createdAt",
          "surveyDismissedAt",
          "lastLoginAt"
        FROM "User" 
      WHERE id = ${userId}
      LIMIT 1
    `;

    return NextResponse.json({ 
      success: true,
      action: 'status',
      userId,
      surveyStatus,
      rawUserData: userResult[0],
      message: "Survey status test completed",
      instructions: {
        dismissTest: "POST with { \"action\": \"dismiss\" } to test dismissing",
        statusTest: "GET or POST with no action to check status"
      }
    });
  } catch (error) {
    console.error("[TEST_SURVEY]", error);
    return NextResponse.json(
      { 
        error: "Failed to test survey", 
        details: error instanceof Error ? error.message : String(error) 
      }, 
      { status: 500 }
    );
  }
} 