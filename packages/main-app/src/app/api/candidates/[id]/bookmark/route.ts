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
    
    // Parse request body for note and jobId
    const body = await request.json().catch(() => ({}));
    const { note, jobId } = body;

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

    // If jobId is provided, verify the job exists and belongs to the employer
    if (jobId) {
      const job = await prisma.job.findUnique({
        where: { id: jobId }
      });

      if (!job || job.employerId !== employerId) {
        return NextResponse.json(
          { error: 'Job not found or does not belong to you' },
          { status: 404 }
        );
      }
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
      // If already saved, update the save with new note and jobId
      await prisma.savedCandidate.update({
        where: {
          candidateId_employerId: {
            candidateId,
            employerId,
          },
        },
        data: {
          note: note || null,
          jobId: jobId || null,
        },
      });
      return NextResponse.json({ saved: true });
    } else {
      // If not saved, create a new save
      await prisma.savedCandidate.create({
        data: {
          candidateId,
          employerId,
          note: note || null,
          jobId: jobId || null,
        },
      });
      return NextResponse.json({ saved: true });
    }
  } catch (error) {
    console.error('Error saving candidate:', error);
    return NextResponse.json(
      { error: 'Failed to save candidate' },
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
      include: {
        job: {
          select: {
            id: true,
            title: true,
            location: true,
          },
        },
      },
    });

    return NextResponse.json({ 
      saved: !!savedCandidate,
      savedCandidate: savedCandidate ? {
        note: savedCandidate.note,
        jobId: savedCandidate.jobId,
        job: savedCandidate.job,
        createdAt: savedCandidate.createdAt,
      } : null
    });
  } catch (error) {
    console.error('Error getting candidate save status:', error);
    return NextResponse.json(
      { error: 'Failed to get candidate save status' },
      { status: 500 }
    );
  }
}

// Remove saved candidate
export async function DELETE(
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
        { error: 'Only employers and agencies can remove saved candidates' },
        { status: 403 }
      );
    }

    const candidateId = params.id;
    const employerId = session.user.id;

    // Check if candidate is saved
    const existingSave = await prisma.savedCandidate.findUnique({
      where: {
        candidateId_employerId: {
          candidateId,
          employerId,
        },
      },
    });

    if (!existingSave) {
      return NextResponse.json(
        { error: 'Candidate is not saved' },
        { status: 404 }
      );
    }

    // Remove the save
    await prisma.savedCandidate.delete({
      where: {
        candidateId_employerId: {
          candidateId,
          employerId,
        },
      },
    });

    return NextResponse.json({ saved: false });
  } catch (error) {
    console.error('Error removing saved candidate:', error);
    return NextResponse.json(
      { error: 'Failed to remove saved candidate' },
      { status: 500 }
    );
  }
} 