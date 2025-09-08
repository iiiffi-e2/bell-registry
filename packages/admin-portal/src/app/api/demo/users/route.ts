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

    console.log('🧹 Admin requested demo users removal:', session.user.email);

    // First, count how many demo users exist
    const demoUserCount = await prisma.user.count({
      where: { isDemo: true }
    });

    console.log(`Found ${demoUserCount} demo users to remove`);

    if (demoUserCount === 0) {
      return NextResponse.json({
        success: true,
        message: 'No demo users found. Database is already clean.',
        removedCount: 0
      });
    }

    // Get some details about the users we're about to remove for logging
    const demoUsers = await prisma.user.findMany({
      where: { isDemo: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      },
      take: 5 // Just a sample for logging
    });

    console.log('Sample demo users to be removed:', demoUsers);

    // Delete all demo users (this will cascade delete related records like employer profiles, jobs, etc.)
    const deleteResult = await prisma.user.deleteMany({
      where: { isDemo: true }
    });

    console.log(`✅ Successfully removed ${deleteResult.count} demo users`);

    return NextResponse.json({
      success: true,
      message: `Successfully removed ${deleteResult.count} demo users from the database.`,
      removedCount: deleteResult.count,
      sampleUsers: demoUsers.map(user => ({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        createdAt: user.createdAt
      }))
    });

  } catch (error) {
    console.error('❌ Error removing demo users:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to remove demo users', 
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

    // Count demo users
    const demoUserCount = await prisma.user.count({
      where: { isDemo: true }
    });

    // Get some sample demo users
    const sampleDemoUsers = await prisma.user.findMany({
      where: { isDemo: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        employerProfile: {
          select: {
            companyName: true
          }
        }
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      demoUserCount,
      sampleDemoUsers
    });

  } catch (error) {
    console.error('❌ Error fetching demo users info:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch demo users information', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
