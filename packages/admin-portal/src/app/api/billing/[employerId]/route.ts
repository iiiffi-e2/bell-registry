/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma, adminAuthOptions, logAdminAction } from "@bell-registry/shared";
import { UserRole } from "@bell-registry/shared";

export async function GET(
  request: NextRequest,
  { params }: { params: { employerId: string } }
) {
  try {
    const session = await getServerSession(adminAuthOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { employerId } = params;

    // Log this admin action
    await logAdminAction(
      session.user.id,
      "VIEW_EMPLOYER_BILLING",
      { endpoint: `/api/billing/${employerId}`, targetId: employerId },
      request.ip,
      request.headers.get("user-agent") || undefined
    );

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const skip = (page - 1) * limit;

    // First get the employer profile
    const employerProfile = await prisma.employerProfile.findUnique({
      where: { userId: employerId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            createdAt: true
          }
        }
      }
    });

    if (!employerProfile) {
      return NextResponse.json({ error: "Employer not found" }, { status: 404 });
    }

    // Get billing history for this employer
    const [billingRecords, totalCount] = await Promise.all([
      prisma.billingHistory.findMany({
        where: { employerProfileId: employerProfile.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.billingHistory.count({
        where: { employerProfileId: employerProfile.id }
      })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    // Get summary for this employer
    const [totalSpent, completedPurchases, lastPurchase] = await Promise.all([
      prisma.billingHistory.aggregate({
        where: { 
          employerProfileId: employerProfile.id,
          status: 'COMPLETED'
        },
        _sum: { amount: true }
      }),
      prisma.billingHistory.count({
        where: { 
          employerProfileId: employerProfile.id,
          status: 'COMPLETED'
        }
      }),
      prisma.billingHistory.findFirst({
        where: { 
          employerProfileId: employerProfile.id,
          status: 'COMPLETED'
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    return NextResponse.json({
      employer: {
        id: employerProfile.user.id,
        email: employerProfile.user.email,
        firstName: employerProfile.user.firstName,
        lastName: employerProfile.user.lastName,
        role: employerProfile.user.role,
        companyName: employerProfile.companyName,
        industry: employerProfile.industry,
        location: employerProfile.location,
        subscriptionType: employerProfile.subscriptionType,
        subscriptionStartDate: employerProfile.subscriptionStartDate,
        subscriptionEndDate: employerProfile.subscriptionEndDate,
        jobCredits: employerProfile.jobCredits,
        jobsPostedCount: employerProfile.jobsPostedCount,
        hasNetworkAccess: employerProfile.hasNetworkAccess,
        stripeCustomerId: employerProfile.stripeCustomerId,
        createdAt: employerProfile.user.createdAt
      },
      billingRecords,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      summary: {
        totalSpent: totalSpent._sum.amount || 0,
        completedPurchases,
        lastPurchaseDate: lastPurchase?.createdAt || null
      }
    });
  } catch (error) {
    console.error("Error fetching employer billing:", error);
    return NextResponse.json(
      { error: "Failed to fetch employer billing" },
      { status: 500 }
    );
  }
}
