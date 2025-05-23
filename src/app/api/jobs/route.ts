// To use fuzzy search, ensure the pg_trgm extension is enabled in your PostgreSQL database:
// CREATE EXTENSION IF NOT EXISTS pg_trgm;
import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { JobStatus, Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { generateJobUrlSlug } from '@/lib/job-utils'

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
      let locationQuery = null
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
        return { ...job, employer };
      }));
      // Count
      const countQuery = `
        SELECT COUNT(*) FROM "Job"
        WHERE (${whereClauses.join(' OR ')})
      `
      const countResult = await prisma.$queryRawUnsafe(countQuery, ...params.slice(0, locationQuery ? 4 : 1))
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
      status: status ? (status as JobStatus) : JobStatus.ACTIVE,
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

    const combinedJobs = page === 1 ? [...featuredJobs, ...jobs] : jobs

    return NextResponse.json({
      jobs: combinedJobs,
      featured: featuredJobs.length > 0,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    })
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      location,
      type,
      salaryMin,
      salaryMax,
      requirements,
      benefits,
      applicationDeadline
    } = body;

    // Validate required fields
    if (!title || !description || !location || !type || !salaryMin || !salaryMax || !requirements) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate URL slug
    const urlSlug = generateJobUrlSlug(title);

    // Parse requirements (assuming it's a string that needs to be split into array)
    const requirementsArray = requirements.split('\n').filter((req: string) => req.trim());

    // Create salary object
    const salary = {
      min: parseInt(salaryMin),
      max: parseInt(salaryMax),
      currency: 'USD'
    };

    // Set expiry date (30 days from now by default)
    const expiresAt = applicationDeadline 
      ? new Date(applicationDeadline)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    const job = await prisma.job.create({
      data: {
        employerId: session.user.id,
        title,
        description,
        location,
        requirements: requirementsArray,
        salary,
        status: JobStatus.ACTIVE,
        jobType: type,
        employmentType: 'On-site', // Default value, you might want to add this to the form
        urlSlug,
        expiresAt,
        featured: false,
        isDemo: false,
      } as any,
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

    return NextResponse.json({
      success: true,
      job,
    });

  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
} 