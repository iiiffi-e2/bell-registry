import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { adminAuthOptions } from '@bell-registry/shared';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE() {
  try {
    // Check authentication and admin role
    const session = await getServerSession(adminAuthOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    console.log('🧹 Admin requested demo jobs removal:', session.user.email);

    // First, count how many demo jobs exist
    const demoJobCount = await prisma.job.count({
      where: { isDemo: true }
    });

    console.log(`Found ${demoJobCount} demo jobs to remove`);

    if (demoJobCount === 0) {
      return NextResponse.json({
        success: true,
        message: 'No demo jobs found. Database is already clean.',
        removedCount: 0
      });
    }

    // Get some details about the jobs we're about to remove for logging
    const demoJobs = await prisma.job.findMany({
      where: { isDemo: true },
      select: {
        id: true,
        title: true,
        createdAt: true
      },
      take: 5 // Just a sample for logging
    });

    console.log('Sample demo jobs to be removed:', demoJobs);

    // Delete all demo jobs
    const deleteResult = await prisma.job.deleteMany({
      where: { isDemo: true }
    });

    console.log(`✅ Successfully removed ${deleteResult.count} demo jobs`);

    return NextResponse.json({
      success: true,
      message: `Successfully removed ${deleteResult.count} demo jobs from the database.`,
      removedCount: deleteResult.count,
      sampleJobs: demoJobs.map(job => ({
        title: job.title,
        createdAt: job.createdAt
      }))
    });

  } catch (error) {
    console.error('❌ Error removing demo jobs:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to remove demo jobs', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  try {
    // Check authentication and admin role
    const session = await getServerSession(adminAuthOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    // Count demo jobs
    const demoJobCount = await prisma.job.count({
      where: { isDemo: true }
    });

    // Get some sample demo jobs
    const sampleDemoJobs = await prisma.job.findMany({
      where: { isDemo: true },
      select: {
        id: true,
        title: true,
        professionalRole: true,
        location: true,
        createdAt: true,
        employer: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      demoJobCount,
      sampleDemoJobs
    });

  } catch (error) {
    console.error('❌ Error fetching demo jobs info:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch demo jobs information', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
