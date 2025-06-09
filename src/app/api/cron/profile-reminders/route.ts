import { NextRequest, NextResponse } from "next/server";
import { processProfileReminders } from "@/lib/profile-reminder-service";

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a cron service
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await processProfileReminders();

    return NextResponse.json({ 
      success: true, 
      message: "Profile reminders processed successfully" 
    });
  } catch (error) {
    console.error("[CRON_PROFILE_REMINDERS]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 