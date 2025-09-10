import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const savedJobs = await prisma.savedJob.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        job: {
          include: {
            employer: {
              select: {
                firstName: true,
                lastName: true,
                role: true,
                employerProfile: {
                  select: {
                    companyName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data to match the expected format
    const jobs = savedJobs.map(savedJob => ({
      ...savedJob.job,
      employer: savedJob.job.employer,
    }));

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Error fetching saved jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved jobs' },
      { status: 500 }
    );
  }
} 