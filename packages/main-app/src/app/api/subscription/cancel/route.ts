import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cancelSubscription } from "@/lib/subscription-service";
import { isEmployerOrAgencyRole } from "@/lib/roles";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!isEmployerOrAgencyRole(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized - Employers and Agencies only" },
        { status: 401 }
      );
    }

    await cancelSubscription(session.user.id);

    return NextResponse.json({
      success: true,
      message: "Subscription cancelled. Benefits will continue until the end of your current term."
    });

  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return NextResponse.json(
      { 
        error: "Failed to cancel subscription",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
