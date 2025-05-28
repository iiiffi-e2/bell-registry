import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
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
        { error: 'Only employers and agencies can save candidates' },
        { status: 403 }
      );
    }

    const candidateId = params.id;
    const employerId = session.user.id;

    // Check if candidate exists
    const candidate = await prisma.user.findUnique({
      where: { id: candidateId },
      include: { candidateProfile: true }
    });

    if (!candidate || !candidate.candidateProfile) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    // Check if candidate is already saved
    const existingSave = await prisma.savedCandidate.findUnique({
      where: {
        candidateId_employerId: {
          candidateId,
          employerId,
        },
      },
    });

    if (existingSave) {
      // If already saved, remove the save
      await prisma.savedCandidate.delete({
        where: {
          candidateId_employerId: {
            candidateId,
            employerId,
          },
        },
      });
      return NextResponse.json({ saved: false });
    } else {
      // If not saved, create a new save
      await prisma.savedCandidate.create({
        data: {
          candidateId,
          employerId,
        },
      });
      return NextResponse.json({ saved: true });
    }
  } catch (error) {
    console.error('Error handling candidate save:', error);
    return NextResponse.json(
      { error: 'Failed to handle candidate save' },
      { status: 500 }
    );
  }
}

// Get save status for a candidate
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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
      return NextResponse.json({ saved: false });
    }

    const candidateId = params.id;
    const employerId = session.user.id;

    const savedCandidate = await prisma.savedCandidate.findUnique({
      where: {
        candidateId_employerId: {
          candidateId,
          employerId,
        },
      },
    });

    return NextResponse.json({ saved: !!savedCandidate });
  } catch (error) {
    console.error('Error getting candidate save status:', error);
    return NextResponse.json(
      { error: 'Failed to get candidate save status' },
      { status: 500 }
    );
  }
} 