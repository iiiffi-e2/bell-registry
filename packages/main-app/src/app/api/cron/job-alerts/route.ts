import { NextRequest, NextResponse } from "next/server";
import { processJobAlerts } from "@/lib/job-alert-service";

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a cron service (optional security measure)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const frequency = searchParams.get('frequency') as 'DAILY' | 'WEEKLY';

    if (!frequency || !['DAILY', 'WEEKLY'].includes(frequency)) {
      return new NextResponse("Invalid frequency parameter", { status: 400 });
    }

    await processJobAlerts(frequency);

    return NextResponse.json({ 
      success: true, 
      message: `${frequency} job alerts processed successfully` 
    });
  } catch (error) {
    console.error("[CRON_JOB_ALERTS]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 