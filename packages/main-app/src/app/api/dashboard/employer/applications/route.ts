import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isEmployerOrAgencyRole } from '@/lib/roles';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isEmployerOrAgencyRole(session.user.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get all applications for jobs posted by the employer
    const applications = await prisma.jobApplication.findMany({
      where: {
        job: {
          employerId: session.user.id
        }
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            professionalRole: true,
            location: true,
            urlSlug: true,
          }
        },
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileSlug: true,
            candidateProfile: {
              select: {
                title: true,
                location: true,
                yearsOfExperience: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ applications });

  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
} 