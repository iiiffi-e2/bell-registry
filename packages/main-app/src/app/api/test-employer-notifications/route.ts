/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { NextRequest, NextResponse } from "next/server";
import { processEmployerNotifications } from "@/lib/employer-notification-service";

export async function POST(request: NextRequest) {
  try {
    // Only allow in development mode for security
    if (process.env.NODE_ENV !== 'development') {
      return new NextResponse("Not available in production", { status: 403 });
    }

    await processEmployerNotifications();

    return NextResponse.json({ 
      success: true, 
      message: "Employer notifications processed successfully (test mode)" 
    });
  } catch (error) {
    console.error("[TEST_EMPLOYER_NOTIFICATIONS]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 