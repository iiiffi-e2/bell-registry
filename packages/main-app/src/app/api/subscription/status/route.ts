import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSubscriptionStatus } from "@/lib/subscription-service";
import { isEmployerOrAgencyRole } from "@/lib/roles";

export async function GET(request: NextRequest) {
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

    const status = await getSubscriptionStatus(session.user.id);

    return NextResponse.json({
      success: true,
      status
    });

  } catch (error) {
    console.error("Error getting subscription status:", error);
    return NextResponse.json(
      { 
        error: "Failed to get subscription status",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
