/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { NextRequest, NextResponse } from "next/server";
import { processSubscriptionRenewals } from "@/lib/subscription-service";

export async function POST(request: NextRequest) {
  try {
    // Verify this is a cron job request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("Starting subscription renewals processing...");

    const { renewedCount, failedCount } = await processSubscriptionRenewals();

    console.log("Subscription renewals processing completed:", {
      renewedCount,
      failedCount
    });

    return NextResponse.json({
      success: true,
      renewedCount,
      failedCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error in process-renewals cron job:", error);
    return NextResponse.json(
      { 
        error: "Failed to process renewals",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Allow GET for manual testing
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      message: "Subscription renewals endpoint",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error in renewals endpoint:", error);
    return NextResponse.json(
      { error: "Failed to get status" },
      { status: 500 }
    );
  }
}
