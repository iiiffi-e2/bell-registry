/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    console.log('Starting URL normalization for existing jobs...');
    
    // Get all jobs that have customApplicationUrl
    const jobs = await prisma.job.findMany({
      where: {
        customApplicationUrl: {
          not: null,
        },
      },
      select: {
        id: true,
        title: true,
        customApplicationUrl: true,
      },
    });

    console.log(`Found ${jobs.length} jobs with custom application URLs`);

    const results = [];
    let updatedCount = 0;
    let skippedCount = 0;

    for (const job of jobs) {
      if (!job.customApplicationUrl) {
        skippedCount++;
        continue;
      }

      const originalUrl = job.customApplicationUrl;
      let normalizedUrl = originalUrl.trim();

      // Only normalize if it doesn't already start with http:// or https://
      if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
        normalizedUrl = "https://" + normalizedUrl;

        // Update the job with the normalized URL
        await prisma.job.update({
          where: { id: job.id },
          data: { customApplicationUrl: normalizedUrl },
        });

        results.push({
          jobTitle: job.title,
          originalUrl,
          normalizedUrl,
          action: 'updated'
        });

        console.log(`Updated job "${job.title}": ${originalUrl} -> ${normalizedUrl}`);
        updatedCount++;
      } else {
        results.push({
          jobTitle: job.title,
          originalUrl,
          normalizedUrl: originalUrl,
          action: 'skipped'
        });
        console.log(`Skipped job "${job.title}" - already has protocol: ${originalUrl}`);
        skippedCount++;
      }
    }

    const summary = {
      totalJobs: jobs.length,
      updated: updatedCount,
      skipped: skippedCount,
      results
    };

    console.log(`Normalization complete! Updated: ${updatedCount}, Skipped: ${skippedCount}`);

    return NextResponse.json({
      success: true,
      message: `URL normalization complete! Updated ${updatedCount} jobs, skipped ${skippedCount} jobs.`,
      summary
    });

  } catch (error) {
    console.error('Error normalizing URLs:', error);
    return NextResponse.json(
      { 
        error: "Failed to normalize URLs", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
