import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasActiveSubscription } from '@/lib/subscription-service';
import { SubscriptionType } from '@bell-registry/shared';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'EMPLOYER' && session.user.role !== 'AGENCY') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const professionalId = searchParams.get('professionalId');

    if (!professionalId) {
      return NextResponse.json({ error: 'Professional ID is required' }, { status: 400 });
    }

    // Get employer's subscription info
    const employer = await prisma.employerProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        subscriptionType: true,
        hasNetworkAccess: true,
      }
    });

    if (!employer) {
      return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 });
    }

    // Check if employer has an active subscription
    const hasActive = await hasActiveSubscription(session.user.id);
    if (!hasActive) {
      return NextResponse.json({ canMessage: false, reason: 'NO_ACTIVE_SUBSCRIPTION' });
    }

    // If employer has network access, they can message any professional
    if (employer.hasNetworkAccess) {
      return NextResponse.json({ canMessage: true });
    }

    // For trial subscriptions, no messaging allowed
    if (employer.subscriptionType === SubscriptionType.TRIAL) {
      return NextResponse.json({ canMessage: false, reason: 'TRIAL_SUBSCRIPTION' });
    }

    // For other subscription types (SPOTLIGHT, BUNDLE, UNLIMITED), check if professional has applied to any active jobs
    const hasActiveApplication = await prisma.jobApplication.findFirst({
      where: {
        candidateId: professionalId,
        job: {
          employerId: session.user.id,
          status: 'ACTIVE',
        }
      }
    });

    if (!hasActiveApplication) {
      return NextResponse.json({ 
        canMessage: false, 
        reason: 'NO_ACTIVE_APPLICATION',
        subscriptionType: employer.subscriptionType
      });
    }

    return NextResponse.json({ canMessage: true });
  } catch (error) {
    console.error('Error checking messaging permission:', error);
    return NextResponse.json(
      { error: 'Failed to check messaging permission' },
      { status: 500 }
    );
  }
} 