import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canPostJob, hasActiveSubscription } from "@/lib/subscription-service";
import { isEmployerOrAgencyRole } from "@/lib/roles";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isEmployerOrAgencyRole(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const canPost = await canPostJob(session.user.id);
    const hasActive = await hasActiveSubscription(session.user.id);

    return NextResponse.json({
      canPostJob: canPost,
      hasActiveSubscription: hasActive,
    });
  } catch (error) {
    console.error("Error checking job posting permission:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 