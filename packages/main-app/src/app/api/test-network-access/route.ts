/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'EMPLOYER' && session.user.role !== 'AGENCY') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get employer profile with all subscription details
    const employerProfile = await prisma.employerProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        userId: true,
        subscriptionType: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        jobPostLimit: true,
        jobsPostedCount: true,
        hasNetworkAccess: true,
        stripeCustomerId: true,
        stripeSessionId: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!employerProfile) {
      return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: session.user.id,
        role: session.user.role,
        email: session.user.email,
      },
      employerProfile,
      debug: {
        hasNetworkAccess: employerProfile.hasNetworkAccess,
        subscriptionType: employerProfile.subscriptionType,
        isNetworkSubscription: employerProfile.subscriptionType === 'NETWORK',
      }
    });

  } catch (error) {
    console.error('Error checking network access:', error);
    return NextResponse.json(
      { error: 'Failed to check network access' },
      { status: 500 }
    );
  }
} 