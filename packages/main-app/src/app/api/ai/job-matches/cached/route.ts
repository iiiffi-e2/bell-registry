import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get cached matches from database
    const cachedMatches = await prisma.$queryRaw`
      SELECT 
        jm.id,
        jm."jobId",
        jm.score,
        jm.reasoning,
        jm."matchFactors",
        jm."createdAt",
        j.id as job_id,
        j.title,
        j.description,
        j.location,
        j.salary,
        j."urlSlug",
        j."employmentType",
        j."jobType",
        j.status,
        e."firstName" as employer_first_name,
        e."lastName" as employer_last_name,
        ep."companyName"
      FROM "JobMatch" jm
      INNER JOIN "Job" j ON jm."jobId" = j.id
      INNER JOIN "User" e ON j."employerId" = e.id
      LEFT JOIN "EmployerProfile" ep ON e.id = ep."userId"
      WHERE jm."userId" = ${session.user.id}
        AND j.status = 'ACTIVE'
      ORDER BY jm.score DESC
      LIMIT 5
    ` as any[];

    if (cachedMatches.length === 0) {
      return NextResponse.json({ 
        matches: [],
        totalMatches: 0,
        cached: false,
        hasCache: false
      });
    }

    // Transform the raw query results
    const enrichedMatches = cachedMatches.map(match => ({
      jobId: match.jobId,
      score: match.score,
      reasoning: match.reasoning,
      matchFactors: match.matchFactors,
      job: {
        id: match.job_id,
        title: match.title,
        description: match.description,
        location: match.location,
        salary: match.salary,
        urlSlug: match.urlSlug,
        employmentType: match.employmentType,
        jobType: match.jobType,
        status: match.status,
        employer: {
          firstName: match.employer_first_name,
          lastName: match.employer_last_name,
          employerProfile: match.companyName ? {
            companyName: match.companyName
          } : null
        }
      },
      link: `/dashboard/jobs/${match.urlSlug}`
    }));

    // Check if matches are recent (within last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const isRecent = cachedMatches[0]?.createdAt > oneDayAgo;

    return NextResponse.json({ 
      matches: enrichedMatches,
      totalMatches: enrichedMatches.length,
      cached: true,
      hasCache: true,
      isRecent,
      lastUpdated: cachedMatches[0]?.createdAt
    });

  } catch (error: any) {
    console.error('Error fetching cached job matches:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch cached job matches',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 