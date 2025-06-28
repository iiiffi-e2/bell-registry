import { NextRequest, NextResponse } from "next/server";
import { processJobAlerts } from "@/lib/job-alert-service";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const frequency = searchParams.get('frequency') as 'DAILY' | 'WEEKLY' || 'WEEKLY';

    if (!['DAILY', 'WEEKLY'].includes(frequency)) {
      return new NextResponse("Invalid frequency parameter", { status: 400 });
    }

    await processJobAlerts(frequency);

    return NextResponse.json({ 
      success: true, 
      message: `${frequency} job alerts processed successfully` 
    });
  } catch (error) {
    console.error("[TEST_JOB_ALERTS]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 