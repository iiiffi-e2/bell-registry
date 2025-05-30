// To use fuzzy search, ensure the pg_trgm extension is enabled in your PostgreSQL database:
// CREATE EXTENSION IF NOT EXISTS pg_trgm;
import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { JobStatus, Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { generateJobUrlSlug } from '@/lib/job-utils'
import { authOptions } from "@/lib/auth"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')
    const searchQuery = searchParams.get('search')
    const jobType = searchParams.get('jobType')
    const salaryMin = searchParams.get('salaryMin')
    const salaryMax = searchParams.get('salaryMax')
    const status = searchParams.get('status')
    const employmentType = searchParams.get('employmentType')
    const sortBy = searchParams.get('sortBy') || 'recent'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Fuzzy search with trigram similarity if searchQuery is present
    if (searchQuery) {
      // Parse for 'in' to boost role/location matches
      let roleQuery = searchQuery
      let locationQuery: string | null = null
      if (searchQuery.toLowerCase().includes(' in ')) {
        const [role, loc] = searchQuery.split(/ in /i)
        roleQuery = role.trim()
        locationQuery = loc.trim()
      }
      // Build SQL for fuzzy search
      let whereClauses = [
        'title % $1',
        'description % $1',
        'location % $1'
      ]
      let rankExpr = 'GREATEST(similarity(title, $1), similarity(description, $1), similarity(location, $1))'
      let params = [roleQuery, limit, skip]
      let boostClause = ''
      if (locationQuery) {
        // Boost jobs that also match the location
        whereClauses.push('location % $4')
        rankExpr = `GREATEST(similarity(title, $1), similarity(description, $1), similarity(location, $1)) + 0.5 * similarity(location, $4)`
        params = [roleQuery, limit, skip, locationQuery]
      }
      const query = `
        SELECT *,
          ${rankExpr} AS rank
        FROM "Job"
        WHERE (${whereClauses.join(' OR ')})
        AND status NOT IN ('CLOSED', 'EXPIRED', 'FILLED')
        AND ("expiresAt" > NOW() OR "expiresAt" IS NULL)
        ORDER BY rank DESC
        LIMIT $2 OFFSET $3
      `
      let jobs = await prisma.$queryRawUnsafe(query, ...params) as any[];
      // Fetch employer and employerProfile for each job
      jobs = await Promise.all(jobs.map(async (job: any) => {
        const employer = await prisma.user.findUnique({
          where: { id: job.employerId },
          select: {
            firstName: true,
            lastName: true,
            employerProfile: {
              select: { companyName: true }
            }
          }
        });
        // Handle null professionalRole by using title as fallback
        if (!job.professionalRole) {
          job.professionalRole = job.title.split(' - ')[0];
        }
        return { ...job, employer };
      }));
      // Count
      const countQuery = `
        SELECT COUNT(*) FROM "Job"
        WHERE (${whereClauses.join(' OR ')})
        AND status NOT IN ('CLOSED', 'EXPIRED', 'FILLED')
        AND ("expiresAt" > NOW() OR "expiresAt" IS NULL)
      `
      const countResult = await prisma.$queryRawUnsafe(countQuery, ...params.slice(0, locationQuery ? 4 : 1)) as { count: string }[]
      const total = parseInt(countResult[0].count, 10)
      return NextResponse.json({
        jobs,
        featured: false,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page,
          limit
        }
      })
    }

    const baseWhere: Prisma.JobWhereInput = {
      status: status ? (status as JobStatus) : {
        notIn: ['CLOSED' as JobStatus, 'EXPIRED' as JobStatus, 'FILLED' as JobStatus]
      },
      OR: [
        {
          expiresAt: {
            gt: new Date()
          }
        },
        {
          expiresAt: null
        }
      ],
      ...(location ? {
        OR: location.split(',').reduce((acc: any[], loc, i, arr) => {
          if (i % 2 === 1) {
            const cityPart = arr[i - 1].trim();
            const statePart = loc.trim();
            acc.push({
              location: {
                equals: `${cityPart}, ${statePart}`,
                mode: Prisma.QueryMode.insensitive
              }
            });
          }
          return acc;
        }, [])
      } : {}),
      ...(jobType ? { 
        jobType: {
          in: jobType.split(',')
        }
      } : {}),
      ...(employmentType ? { 
        employmentType: {
          in: employmentType.split(',')
        }
      } : {}),
      ...(salaryMin || salaryMax ? {
        salary: {
          path: ['min'],
          gte: salaryMin ? parseInt(salaryMin) : undefined,
          lte: salaryMax ? parseInt(salaryMax) : undefined,
        }
      } : {}),
    }

    let orderBy: Prisma.JobOrderByWithRelationInput = { createdAt: 'desc' }
    switch (sortBy) {
      case 'salary-high':
        orderBy = { 
          salary: 'desc'
        }
        break
      case 'salary-low':
        orderBy = { 
          salary: 'asc'
        }
        break
      case 'oldest':
        orderBy = { createdAt: 'asc' }
        break
    }

    const featuredJobs = await prisma.job.findMany({
      where: {
        ...baseWhere,
        featured: true,
      },
      take: 3,
      orderBy,
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
    })

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where: {
          ...baseWhere,
          ...(page === 1 ? { featured: false } : {}),
        },
        skip: page === 1 ? 0 : skip,
        take: page === 1 ? limit - featuredJobs.length : limit,
        orderBy,
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
      }),
      prisma.job.count({ 
        where: {
          ...baseWhere,
          featured: false,
        }
      })
    ])

    // Handle null professionalRole values
    const processedJobs = jobs.map(job => ({
      ...job,
      professionalRole: job.professionalRole || job.title.split(' - ')[0]
    }));

    const processedFeaturedJobs = featuredJobs.map(job => ({
      ...job,
      professionalRole: job.professionalRole || job.title.split(' - ')[0]
    }));

    const combinedJobs = page === 1 ? [...processedFeaturedJobs, ...processedJobs] : processedJobs;

    return NextResponse.json({
      jobs: combinedJobs,
      featured: page === 1,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "EMPLOYER") {
      return NextResponse.json(
        { error: "Unauthorized - Employers only" },
        { status: 401 }
      );
    }

    const data = await request.json();

    // Generate URL slug from title
    const urlSlug = `${data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")}-${Math.random().toString(36).substr(2, 6)}`;

    const job = await prisma.job.create({
      data: {
        title: data.title,
        professionalRole: data.professionalRole,
        description: data.description,
        location: data.location,
        requirements: data.requirements,
        salary: data.salary,
        jobType: data.jobType,
        employmentType: data.employmentType,
        featured: data.featured,
        expiresAt: new Date(data.expiresAt),
        urlSlug,
        employerId: session.user.id,
        status: JobStatus.ACTIVE,
      },
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 }
    );
  }
} 