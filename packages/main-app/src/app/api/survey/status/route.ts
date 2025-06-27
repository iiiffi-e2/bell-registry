import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSurveyStatus } from "@/lib/survey-service";

export async function GET(request: NextRequest) {
  try {
    console.log("[SURVEY_STATUS] Checking survey status");
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log("[SURVEY_STATUS] No session found");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;
    const surveyStatus = await getSurveyStatus(userId);

    console.log("[SURVEY_STATUS] Survey status for user:", userId, surveyStatus);

    return NextResponse.json(surveyStatus);
  } catch (error) {
    const err = error as Error;
    console.error("[SURVEY_STATUS] Error checking survey status:", {
      error,
      message: err.message,
      stack: err.stack
    });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" }, 
      { status: 500 }
    );
  }
} 