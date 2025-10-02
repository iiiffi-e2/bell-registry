/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find job by slug
    const job = await prisma.job.findUnique({
      where: { urlSlug: params.slug } as any,
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    const jobId = job.id;
    const userId = session.user.id;

    // Check if job is already bookmarked
    const existingBookmark = await prisma.savedJob.findUnique({
      where: {
        jobId_userId: {
          jobId,
          userId,
        },
      },
    });

    if (existingBookmark) {
      // If already bookmarked, remove the bookmark
      await prisma.savedJob.delete({
        where: {
          jobId_userId: {
            jobId,
            userId,
          },
        },
      });
      return NextResponse.json({ bookmarked: false });
    } else {
      // If not bookmarked, create a new bookmark
      await prisma.savedJob.create({
        data: {
          jobId,
          userId,
        },
      });
      return NextResponse.json({ bookmarked: true });
    }
  } catch (error) {
    console.error('Error handling job bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to handle job bookmark' },
      { status: 500 }
    );
  }
}

// Get bookmark status for a job
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      // Return false for public users - not bookmarked
      return NextResponse.json({ bookmarked: false });
    }

    // Find job by slug
    const job = await prisma.job.findUnique({
      where: { urlSlug: params.slug } as any,
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    const jobId = job.id;
    const userId = session.user.id;

    const bookmark = await prisma.savedJob.findUnique({
      where: {
        jobId_userId: {
          jobId,
          userId,
        },
      },
    });

    return NextResponse.json({ bookmarked: !!bookmark });
  } catch (error) {
    console.error('Error getting bookmark status:', error);
    return NextResponse.json(
      { error: 'Failed to get bookmark status' },
      { status: 500 }
    );
  }
} 