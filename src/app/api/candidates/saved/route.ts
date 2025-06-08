import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
        { error: 'Only employers and agencies can view saved candidates' },
        { status: 403 }
      );
    }

    const employerId = session.user.id;
    const isEmployerOrAgency = session.user.role === 'EMPLOYER' || session.user.role === 'AGENCY';

    // Fetch saved candidates with their profile information
    const savedCandidates = await prisma.savedCandidate.findMany({
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
    const candidates = savedCandidates.map((saved) => ({
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
        // Apply anonymization for employers/agencies
        firstName: isEmployerOrAgency ? (saved.candidate.firstName?.[0] || '') : saved.candidate.firstName,
        lastName: isEmployerOrAgency ? (saved.candidate.lastName?.[0] || '') : saved.candidate.lastName,
        image: isEmployerOrAgency ? null : saved.candidate.image,
        role: saved.candidate.role,
        profileSlug: saved.candidate.profileSlug,
        email: isEmployerOrAgency ? '' : saved.candidate.email,
        phoneNumber: isEmployerOrAgency ? null : saved.candidate.phoneNumber,
        isAnonymous: isEmployerOrAgency ? true : (saved.candidate.isAnonymous || false),
      },
    }));

    return NextResponse.json({ candidates });
  } catch (error) {
    console.error('Error fetching saved candidates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved candidates' },
      { status: 500 }
    );
  }
} 