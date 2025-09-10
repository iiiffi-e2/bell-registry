// To use fuzzy search, ensure the pg_trgm extension is enabled in your PostgreSQL database:
// CREATE EXTENSION IF NOT EXISTS pg_trgm;
import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { JobStatus, Prisma } from '@bell-registry/shared'
import { getServerSession } from 'next-auth'
import { generateJobUrlSlug } from '@/lib/job-utils'
import { authOptions } from "@/lib/auth"
import { canPostJob, incrementJobPostCount } from '@/lib/subscription-service'
import { isEmployerOrAgencyRole } from '@/lib/roles'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')
    const searchQuery = searchParams.get('search')
    const jobType = searchParams.get('jobType')
    const professionalRole = searchParams.get('professionalRole')
    // Salary filtering removed - now using compensation field
    const status = searchParams.get('status')
    const employmentType = searchParams.get('employmentType')
    const sortBy = searchParams.get('sortBy') || 'recent'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Check if pg_trgm extension is available before attempting fuzzy search
    let pgTrgmAvailable = false;
    if (searchQuery) {
      try {
        await prisma.$queryRaw`SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm' LIMIT 1`;
        pgTrgmAvailable = true;
      } catch (error) {
        console.warn('pg_trgm extension not available, will use fallback search:', error);
        pgTrgmAvailable = false;
      }
    }

    // Fuzzy search with trigram similarity if searchQuery is present
    if (searchQuery) {
      if (pgTrgmAvailable) {
        try {
          // Parse for 'in' to boost role/location matches
          let roleQuery = searchQuery
          let locationQuery: string | null = null
          if (searchQuery.toLowerCase().includes(' in ')) {
            const [role, loc] = searchQuery.split(/ in /i)
            roleQuery = role.trim()
            locationQuery = loc.trim()
          }
          
          // Build SQL for fuzzy search with similarity threshold
          let whereClauses = [
            'similarity(title, $1) > 0.1',
            'similarity(description, $1) > 0.1',
            'similarity(location, $1) > 0.1'
          ]
          let rankExpr = 'GREATEST(similarity(title, $1), similarity(description, $1), similarity(location, $1))'
          let params = [roleQuery, limit, skip]
          let boostClause = ''
          if (locationQuery) {
            // Boost jobs that also match the location
            whereClauses.push('similarity(location, $4) > 0.1')
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
          
          // Apply additional filters to fuzzy search results
          if (professionalRole) {
            const professionalRoles = professionalRole.split(',');
            jobs = jobs.filter((job: any) => 
              professionalRoles.some(role => 
                job.professionalRole && job.professionalRole.includes(role)
              )
            );
          }
          if (jobType) {
            const jobTypes = jobType.split(',');
            jobs = jobs.filter((job: any) => jobTypes.includes(job.jobType));
          }
          if (employmentType) {
            const employmentTypes = employmentType.split(',');
            jobs = jobs.filter((job: any) => employmentTypes.includes(job.employmentType));
          }
          
          // Fetch employer and employerProfile for each job
          jobs = await Promise.all(jobs.map(async (job: any) => {
            const employer = await prisma.user.findUnique({
              where: { id: job.employerId },
              select: {
                firstName: true,
                lastName: true,
                role: true,
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
        } catch (error) {
          console.warn('Fuzzy search failed, falling back to simple search:', error);
          // Continue to fallback search below
        }
      }
      
      // Fallback to simple ILIKE search if pg_trgm extension is not available or fuzzy search failed
      const fallbackWhere: Prisma.JobWhereInput = {
        status: {
          notIn: ['CLOSED' as JobStatus, 'EXPIRED' as JobStatus, 'FILLED' as JobStatus]
        },
        AND: [
          {
            OR: [
              {
                expiresAt: {
                  gt: new Date()
                }
              },
              {
                expiresAt: null
              }
            ]
          },
          {
            OR: [
              {
                title: {
                  contains: searchQuery,
                  mode: Prisma.QueryMode.insensitive
                }
              },
              {
                description: {
                  contains: searchQuery,
                  mode: Prisma.QueryMode.insensitive
                }
              },
              {
                location: {
                  contains: searchQuery,
                  mode: Prisma.QueryMode.insensitive
                }
              },
              {
                professionalRole: {
                  contains: searchQuery,
                  mode: Prisma.QueryMode.insensitive
                }
              }
            ]
          }
        ]
      };
      
      // Apply additional filters to fallback search results
      if (professionalRole) {
        const professionalRoles = professionalRole.split(',');
        (fallbackWhere.AND as Prisma.JobWhereInput[]).push({
          professionalRole: {
            in: professionalRoles
          }
        });
      }
      if (jobType) {
        const jobTypes = jobType.split(',');
        (fallbackWhere.AND as Prisma.JobWhereInput[]).push({
          jobType: {
            in: jobTypes
          }
        });
      }
      if (employmentType) {
        const employmentTypes = employmentType.split(',');
        (fallbackWhere.AND as Prisma.JobWhereInput[]).push({
          employmentType: {
            in: employmentTypes
          }
        });
      }
      if (location) {
        const locations = location.split(',').reduce((acc: any[], loc, i, arr) => {
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
        }, []);
        if (locations.length > 0) {
          (fallbackWhere.AND as Prisma.JobWhereInput[]).push({ OR: locations });
        }
      }
      // Salary filtering removed - compensation is now a string array
      
      const jobs = await prisma.job.findMany({
        where: fallbackWhere,
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          employer: {
            select: {
              firstName: true,
              lastName: true,
              employerProfile: {
                select: { companyName: true }
              }
            }
          }
        }
      });
      
      const total = await prisma.job.count({ where: fallbackWhere });
      
      return NextResponse.json({
        jobs,
        featured: false,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page,
          limit
        }
      });
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
      ...(professionalRole ? { 
        professionalRole: {
          in: professionalRole.split(',')
        }
      } : {}),
      // Salary filtering removed - compensation is now a string array
    }

    let orderBy: Prisma.JobOrderByWithRelationInput = { createdAt: 'desc' }
    switch (sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' }
        break
      // Salary sorting removed - compensation is now a string array
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
            role: true,
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
              role: true,
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

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!isEmployerOrAgencyRole(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized - Employers and Agencies only" },
        { status: 401 }
      );
    }

    // Check if user can post jobs based on subscription
    const canPost = await canPostJob(session.user.id);
    if (!canPost) {
      return NextResponse.json(
        { 
          error: "Job posting limit reached or subscription expired", 
          code: "SUBSCRIPTION_LIMIT_REACHED" 
        },
        { status: 403 }
      );
    }

    const data = await request.json();

    // Generate URL slug from title
    const urlSlug = `${data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")}-${Math.random().toString(36).substr(2, 6)}`;

    // Set listing close date to 45 days from now
    const listingCloseDate = new Date();
    listingCloseDate.setDate(listingCloseDate.getDate() + 45);

    const job = await prisma.job.create({
      data: {
        title: data.title,
        professionalRole: data.professionalRole,
        description: data.description,
        exceptionalOpportunity: data.exceptionalOpportunity,
        location: data.location,
        requirements: data.requirements,
        compensation: data.compensation,
        salary: data.salary,
        employmentType: data.employmentType,
        featured: data.featured,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        listingCloseDate: listingCloseDate,
        urlSlug,
        employerId: session.user.id,
        status: JobStatus.ACTIVE,
        adminStatus: 'APPROVED', // Auto-approve all jobs
        approvedAt: new Date(),
      },
    });

    // Handle job posting (consumes credits if no unlimited posting active)
    await incrementJobPostCount(session.user.id);

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 }
    );
  }
} 