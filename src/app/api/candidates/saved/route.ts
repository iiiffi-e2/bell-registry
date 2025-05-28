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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format the response to match the expected structure
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
      payCurrency: saved.candidate.candidateProfile?.payCurrency,
      savedAt: saved.createdAt,
      user: {
        id: saved.candidate.id,
        firstName: saved.candidate.firstName,
        lastName: saved.candidate.lastName,
        image: saved.candidate.image,
        role: saved.candidate.role,
        profileSlug: saved.candidate.profileSlug,
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