/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dismissSurveyPermanently, dismissSurveyTemporarily } from "@/lib/survey-service";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;
    
    // Get the dismissal type from request body
    const body = await request.json().catch(() => ({}));
    const { type = 'permanent' } = body; // Default to permanent for backward compatibility

    if (type === 'temporary') {
      // Temporarily dismiss until next login
      await dismissSurveyTemporarily(userId);
      
      return NextResponse.json({ 
        success: true, 
        message: "Survey dismissed until next login",
        type: 'temporary'
      });
    } else {
      // Permanently dismiss (default behavior)
      await dismissSurveyPermanently(userId);
      
      return NextResponse.json({ 
        success: true, 
        message: "Survey dismissed permanently",
        type: 'permanent'
      });
    }
  } catch (error) {
    const err = error as Error;
    console.error("[SURVEY_DISMISS] Error dismissing survey:", {
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