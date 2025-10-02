/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { NextRequest, NextResponse } from "next/server";
import { processProfileReminders } from "@/lib/profile-reminder-service";

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse("Not available in production", { status: 404 });
  }

  try {
    await processProfileReminders();

    return NextResponse.json({ 
      success: true, 
      message: "Profile reminders processed successfully (development mode)" 
    });
  } catch (error) {
    console.error("[TEST_PROFILE_REMINDERS]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 