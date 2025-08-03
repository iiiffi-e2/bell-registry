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
        { error: 'Only employers and agencies can save professionals' },
        { status: 403 }
      );
    }

    const professionalId = params.id;
    const employerId = session.user.id;
    
    // Parse request body for note and jobId
    const body = await request.json().catch(() => ({}));
    const { note, jobId } = body;

    // Check if professional exists
    const professional = await prisma.user.findUnique({
      where: { id: professionalId },
      include: { candidateProfile: true }
    });

    if (!professional || !professional.candidateProfile) {
      return NextResponse.json(
        { error: 'Professional not found' },
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

    // Check if professional is already saved
    const existingSave = await prisma.savedCandidate.findUnique({
      where: {
        candidateId_employerId: {
          candidateId: professionalId,
          employerId,
        },
      },
    });

    if (existingSave) {
      // If already saved, update the save with new note and jobId
      await prisma.savedCandidate.update({
        where: {
          candidateId_employerId: {
            candidateId: professionalId,
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
          candidateId: professionalId,
          employerId,
          note: note || null,
          jobId: jobId || null,
        },
      });
      return NextResponse.json({ saved: true });
    }
  } catch (error) {
    console.error('Error saving professional:', error);
    return NextResponse.json(
      { error: 'Failed to save professional' },
      { status: 500 }
    );
  }
}

// Get save status for a professional
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

    const professionalId = params.id;
    const employerId = session.user.id;

    const savedProfessional = await prisma.savedCandidate.findUnique({
      where: {
        candidateId_employerId: {
          candidateId: professionalId,
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
      saved: !!savedProfessional,
      savedProfessional: savedProfessional ? {
        note: savedProfessional.note,
        jobId: savedProfessional.jobId,
        job: savedProfessional.job,
        createdAt: savedProfessional.createdAt,
      } : null
    });
  } catch (error) {
    console.error('Error getting professional save status:', error);
    return NextResponse.json(
      { error: 'Failed to get professional save status' },
      { status: 500 }
    );
  }
}

// Remove saved professional
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
        { error: 'Only employers and agencies can remove saved professionals' },
        { status: 403 }
      );
    }

    const professionalId = params.id;
    const employerId = session.user.id;

    // Check if professional is saved
    const existingSave = await prisma.savedCandidate.findUnique({
      where: {
        candidateId_employerId: {
          candidateId: professionalId,
          employerId,
        },
      },
    });

    if (!existingSave) {
      return NextResponse.json(
        { error: 'Professional is not saved' },
        { status: 404 }
      );
    }

    // Remove the save
    await prisma.savedCandidate.delete({
      where: {
        candidateId_employerId: {
          candidateId: professionalId,
          employerId,
        },
      },
    });

    return NextResponse.json({ saved: false });
  } catch (error) {
    console.error('Error removing saved professional:', error);
    return NextResponse.json(
      { error: 'Failed to remove saved professional' },
      { status: 500 }
    );
  }
}