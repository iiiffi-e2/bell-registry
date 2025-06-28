import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'EMPLOYER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await req.json();
    const { status } = body;

    // Validate status
    const validStatuses = ['PENDING', 'REVIEWED', 'INTERVIEW', 'OFFER', 'REJECTED', 'ACCEPTED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Check if the application exists and belongs to a job posted by this employer
    const application = await prisma.jobApplication.findFirst({
      where: {
        id: params.id,
        job: {
          employerId: session.user.id
        }
      }
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Update the application status
    const updatedApplication = await prisma.jobApplication.update({
      where: { id: params.id },
      data: { status }
    });

    return NextResponse.json({ application: updatedApplication });

  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    );
  }
} 