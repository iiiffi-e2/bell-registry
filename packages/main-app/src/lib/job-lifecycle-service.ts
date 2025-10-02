/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";

/**
 * Close job listings that have passed their 45-day listing period
 */
export async function closeExpiredListings(): Promise<{ closedCount: number }> {
  try {
    const now = new Date();
    
    // Find all active jobs where listingCloseDate has passed
    const expiredJobs = await prisma.job.findMany({
      where: {
        status: JobStatus.ACTIVE,
        listingCloseDate: {
          lte: now,
        },
      },
      select: {
        id: true,
        title: true,
        urlSlug: true,
        listingCloseDate: true,
        employer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            employerProfile: {
              select: {
                companyName: true,
              },
            },
          },
        },
      },
    });

    if (expiredJobs.length === 0) {
      return { closedCount: 0 };
    }

    // Close the expired jobs
    const jobIds = expiredJobs.map(job => job.id);
    await prisma.job.updateMany({
      where: {
        id: { in: jobIds },
      },
      data: {
        status: JobStatus.CLOSED,
        updatedAt: now,
      },
    });

    // Log the closed jobs for monitoring
    console.log(`Closed ${expiredJobs.length} expired job listings:`, 
      expiredJobs.map(job => ({ 
        id: job.id, 
        title: job.title, 
        slug: job.urlSlug,
        closeDate: job.listingCloseDate 
      }))
    );

    // TODO: Send notification emails to employers about closed listings
    // This could be implemented later as part of the notification system

    return { closedCount: expiredJobs.length };
  } catch (error) {
    console.error("Error closing expired job listings:", error);
    throw error;
  }
}

/**
 * Get jobs that will expire soon (within 7 days) for warning notifications
 */
export async function getJobsExpiringSoon(): Promise<any[]> {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const expiringSoonJobs = await prisma.job.findMany({
      where: {
        status: JobStatus.ACTIVE,
        listingCloseDate: {
          gte: now,
          lte: sevenDaysFromNow,
        },
      },
      include: {
        employer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            employerProfile: {
              select: {
                companyName: true,
              },
            },
          },
        },
      },
    });

    return expiringSoonJobs;
  } catch (error) {
    console.error("Error getting jobs expiring soon:", error);
    throw error;
  }
}

/**
 * Get listing lifecycle stats for monitoring
 */
export async function getListingLifecycleStats(): Promise<{
  activeListings: number;
  expiringSoon: number;
  expiredToday: number;
}> {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const [activeListings, expiringSoon, expiredToday] = await Promise.all([
      prisma.job.count({
        where: {
          status: JobStatus.ACTIVE,
          listingCloseDate: {
            gt: now,
          },
        },
      }),
      prisma.job.count({
        where: {
          status: JobStatus.ACTIVE,
          listingCloseDate: {
            gte: now,
            lte: sevenDaysFromNow,
          },
        },
      }),
      prisma.job.count({
        where: {
          status: JobStatus.CLOSED,
          updatedAt: {
            gte: startOfDay,
            lt: endOfDay,
          },
          listingCloseDate: {
            lte: now,
          },
        },
      }),
    ]);

    return {
      activeListings,
      expiringSoon,
      expiredToday,
    };
  } catch (error) {
    console.error("Error getting listing lifecycle stats:", error);
    throw error;
  }
}
