import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isEmployerOrAgencyRole } from "@/lib/roles";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isEmployerOrAgencyRole(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get current employer profile
    const employer = await prisma.employerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!employer) {
      return NextResponse.json({ error: "Employer profile not found" }, { status: 404 });
    }

    // Return all subscription-related fields for debugging
    const debugInfo = {
      userId: session.user.id,
      subscriptionType: (employer as any).subscriptionType,
      subscriptionStartDate: (employer as any).subscriptionStartDate,
      subscriptionEndDate: (employer as any).subscriptionEndDate,
      jobPostLimit: (employer as any).jobPostLimit,
      jobsPostedCount: (employer as any).jobsPostedCount,
      stripeCustomerId: (employer as any).stripeCustomerId,
      stripeSessionId: (employer as any).stripeSessionId,
      hasNetworkAccess: (employer as any).hasNetworkAccess,
      createdAt: employer.createdAt,
      updatedAt: employer.updatedAt,
    };

    return NextResponse.json({ 
      success: true, 
      debugInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error in subscription debug:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 