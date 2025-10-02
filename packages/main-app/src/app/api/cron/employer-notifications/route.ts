/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { NextRequest, NextResponse } from "next/server";
import { processEmployerNotifications } from "@/lib/employer-notification-service";

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a cron service (optional security measure)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await processEmployerNotifications();

    return NextResponse.json({ 
      success: true, 
      message: "Employer notifications processed successfully" 
    });
  } catch (error) {
    console.error("[CRON_EMPLOYER_NOTIFICATIONS]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 