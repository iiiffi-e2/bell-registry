import { NextRequest, NextResponse } from "next/server";
import { closeExpiredListings, getListingLifecycleStats } from "@/lib/job-lifecycle-service";

export async function POST(request: NextRequest) {
  try {
    // Verify this is a cron job request (you might want to add authentication)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("Starting expired job listings cleanup...");

    // Close expired listings
    const { closedCount } = await closeExpiredListings();

    // Get current stats
    const stats = await getListingLifecycleStats();

    console.log("Expired job listings cleanup completed:", {
      closedCount,
      stats
    });

    return NextResponse.json({
      success: true,
      closedCount,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error in close-expired-listings cron job:", error);
    return NextResponse.json(
      { 
        error: "Failed to close expired listings",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Allow GET for manual testing
export async function GET(request: NextRequest) {
  try {
    const stats = await getListingLifecycleStats();
    return NextResponse.json({
      message: "Job listing lifecycle stats",
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error getting listing stats:", error);
    return NextResponse.json(
      { error: "Failed to get stats" },
      { status: 500 }
    );
  }
}
