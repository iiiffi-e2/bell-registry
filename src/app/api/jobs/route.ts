import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { JobStatus, Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')
    const searchQuery = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where: Prisma.JobWhereInput = {
      status: JobStatus.ACTIVE,
      ...(location ? { location } : {}),
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

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      prisma.job.count({ where })
    ])

    return NextResponse.json({
      jobs,
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