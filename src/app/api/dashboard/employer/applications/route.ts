import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'EMPLOYER') {
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
          include: {
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