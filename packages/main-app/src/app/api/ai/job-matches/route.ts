import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { aiJobMatchingService } from '@/lib/ai-job-matching-service';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get AI-generated matches
    const matches = await aiJobMatchingService.findMatchingJobs(session.user.id);
    
    // Save matches to database
    await aiJobMatchingService.saveJobMatches(session.user.id, matches);

    // Get full job details for matched jobs
    const jobDetails = await prisma.job.findMany({
      where: {
        id: {
          in: matches.map(m => m.jobId)
        }
      },
      include: {
        employer: {
          select: {
            firstName: true,
            lastName: true,
            employerProfile: {
              select: {
                companyName: true,
              }
            }
          }
        }
      }
    });

    // Combine match data with job details
    const enrichedMatches = matches.map(match => {
      const job = jobDetails.find(j => j.id === match.jobId);
      return {
        ...match,
        job,
        link: `/dashboard/jobs/${job?.urlSlug}`
      };
    }).filter(match => match.job); // Only include matches where job was found

    return NextResponse.json({ 
      matches: enrichedMatches,
      totalMatches: enrichedMatches.length 
    });

  } catch (error: any) {
    console.error('Error in AI job matching:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate job matches',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Force refresh of matches
    const matches = await aiJobMatchingService.findMatchingJobs(session.user.id);
    await aiJobMatchingService.saveJobMatches(session.user.id, matches);

    return NextResponse.json({ 
      message: 'Job matches refreshed successfully',
      count: matches.length 
    });

  } catch (error: any) {
    console.error('Error refreshing job matches:', error);
    return NextResponse.json(
      { 
        error: 'Failed to refresh job matches',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 