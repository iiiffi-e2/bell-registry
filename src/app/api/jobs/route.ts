import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { JobStatus, Prisma } from '@prisma/client'

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

    const baseWhere: Prisma.JobWhereInput = {
      status: status ? (status as JobStatus) : JobStatus.ACTIVE,
      ...(location ? { location } : {}),
      ...(jobType ? { jobType } : {}),
      ...(employmentType ? { employmentType } : {}),
      ...(salaryMin || salaryMax ? {
        salary: {
          path: ['min'],
          gte: salaryMin ? parseInt(salaryMin) : undefined,
          lte: salaryMax ? parseInt(salaryMax) : undefined,
        }
      } : {}),
      ...(searchQuery
        ? {
            OR: [
              {
                title: {
                  contains: searchQuery,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                description: {
                  contains: searchQuery,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                requirements: {
                  has: searchQuery,
                },
              },
            ],
          }
        : {}),
    }

    // Determine sort order
    let orderBy: Prisma.JobOrderByWithRelationInput = { createdAt: 'desc' }
    switch (sortBy) {
      case 'salary-high':
        orderBy = { 
          salary: {
            path: ['max'],
            order: 'desc'
          }
        }
        break
      case 'salary-low':
        orderBy = { 
          salary: {
            path: ['min'],
            order: 'asc'
          }
        }
        break
      case 'oldest':
        orderBy = { createdAt: 'asc' }
        break
      // Default is 'recent' which is already set
    }

    // Fetch featured jobs first (limited to 3)
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

    // Fetch regular jobs, excluding featured ones if we're on the first page
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

    // Combine featured and regular jobs on the first page
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