/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;

    // Fetch the candidate profile to get the total profile views
    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId },
      select: { profileViews: true }
    });

    if (!candidateProfile) {
      return new NextResponse("Profile not found", { status: 404 });
    }

    const totalViews = candidateProfile.profileViews;

    // Calculate the date ranges for the last 7 days and the previous 7 days
    const now = new Date();
    const last7DaysStart = new Date(now);
    last7DaysStart.setDate(now.getDate() - 7);
    const previous7DaysStart = new Date(last7DaysStart);
    previous7DaysStart.setDate(last7DaysStart.getDate() - 7);

    // Count profile views for the last 7 days
    const last7DaysViews = await prisma.profileViewEvent.count({
      where: {
        userId,
        viewedAt: {
          gte: last7DaysStart,
          lt: now
        }
      }
    });

    // Count profile views for the previous 7 days
    const previous7DaysViews = await prisma.profileViewEvent.count({
      where: {
        userId,
        viewedAt: {
          gte: previous7DaysStart,
          lt: last7DaysStart
        }
      }
    });

    // Calculate the percentage change
    let percentChange = 0;
    if (previous7DaysViews > 0) {
      percentChange = ((last7DaysViews - previous7DaysViews) / previous7DaysViews) * 100;
    } else if (last7DaysViews > 0) {
      percentChange = 100; // If there were no views in the previous period, but there are now, it's a 100% increase
    }

    return NextResponse.json({
      totalViews,
      last7DaysViews,
      previous7DaysViews,
      percentChange
    });
  } catch (error) {
    console.error("[PROFILE_VIEWS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 