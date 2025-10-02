/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is an employer or agency
    if (session.user.role !== 'EMPLOYER' && session.user.role !== 'AGENCY') {
      return NextResponse.json(
        { error: 'Only employers and agencies can view saved professionals' },
        { status: 403 }
      );
    }

    const employerId = session.user.id;
    const isEmployerOrAgency = session.user.role === 'EMPLOYER' || session.user.role === 'AGENCY';

    // Check if employer has network access
    let hasNetworkAccess = false
    if (isEmployerOrAgency && session?.user?.id) {
      const employerProfile = await prisma.employerProfile.findUnique({
        where: { userId: session.user.id },
        select: { hasNetworkAccess: true }
      })
      hasNetworkAccess = employerProfile?.hasNetworkAccess || false
    }

    // Fetch saved professionals with their profile information
    const savedProfessionals = await prisma.savedCandidate.findMany({
      where: {
        employerId,
      },
      include: {
        candidate: {
          include: {
            candidateProfile: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
            location: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format the response to match the expected structure with anonymization
    const professionals = savedProfessionals.map((saved: any) => ({
      id: saved.candidate.candidateProfile?.id || saved.candidate.id,
      bio: saved.candidate.candidateProfile?.bio,
      title: saved.candidate.candidateProfile?.title,
      preferredRole: saved.candidate.candidateProfile?.preferredRole,
      location: saved.candidate.candidateProfile?.location,
      skills: saved.candidate.candidateProfile?.skills || [],
      yearsOfExperience: saved.candidate.candidateProfile?.yearsOfExperience,
      payRangeMin: saved.candidate.candidateProfile?.payRangeMin,
      payRangeMax: saved.candidate.candidateProfile?.payRangeMax,
      payType: saved.candidate.candidateProfile?.payType,
      openToWork: (saved.candidate.candidateProfile as any)?.openToWork || false,
      savedAt: saved.createdAt.toISOString(),
      note: saved.note,
      job: saved.job,
      user: {
        id: saved.candidate.id,
        // Apply anonymization based on network access and user preference
        firstName: ((isEmployerOrAgency && !hasNetworkAccess) || saved.candidate.isAnonymous) ? (saved.candidate.firstName?.[0] || '') : saved.candidate.firstName,
        lastName: ((isEmployerOrAgency && !hasNetworkAccess) || saved.candidate.isAnonymous) ? (saved.candidate.lastName?.[0] || '') : saved.candidate.lastName,
        image: (isEmployerOrAgency && !hasNetworkAccess) ? null : saved.candidate.image,
        role: saved.candidate.role,
        profileSlug: saved.candidate.profileSlug,
        email: (isEmployerOrAgency && !hasNetworkAccess) ? '' : saved.candidate.email,
        phoneNumber: (isEmployerOrAgency && !hasNetworkAccess) ? null : saved.candidate.phoneNumber,
        isAnonymous: ((isEmployerOrAgency && !hasNetworkAccess) || saved.candidate.isAnonymous) ? true : false,
      },
    }));

    return NextResponse.json({ professionals });
  } catch (error) {
    console.error('Error fetching saved professionals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved professionals' },
      { status: 500 }
    );
  }
} 