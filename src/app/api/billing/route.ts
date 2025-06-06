import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getBillingHistory } from "@/lib/billing-service";
import { isEmployerOrAgencyRole } from "@/lib/roles";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isEmployerOrAgencyRole(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Find the employer profile
    const employerProfile = await prisma.employerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!employerProfile) {
      return NextResponse.json({ error: "Employer profile not found" }, { status: 404 });
    }

    const billingHistory = await getBillingHistory(employerProfile.id);
    
    return NextResponse.json({
      billingHistory,
    });
  } catch (error) {
    console.error("Error fetching billing history:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 