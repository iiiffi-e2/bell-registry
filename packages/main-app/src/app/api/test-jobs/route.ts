import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";

export async function GET() {
  try {
    // Simple count of all jobs
    const totalJobs = await prisma.job.count();
    
    // Count of active jobs
    const activeJobs = await prisma.job.count({
      where: {
        status: JobStatus.ACTIVE
      }
    });

    // Get a few sample jobs
    const sampleJobs = await prisma.job.findMany({
      take: 5,
      select: {
        id: true,
        title: true,
        professionalRole: true,
        location: true,
        status: true,
        expiresAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      totalJobs,
      activeJobs,
      sampleJobs,
      message: 'Database connection successful'
    });

  } catch (error: any) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { error: 'Database connection failed', details: error.message },
      { status: 500 }
    );
  }
} 