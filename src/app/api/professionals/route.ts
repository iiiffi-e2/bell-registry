import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma, UserRole } from '@prisma/client'
import { SortOption } from '@/types/candidate'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')
    const roleType = searchParams.get('roleType') as UserRole | null
    const searchQuery = searchParams.get('search')
    const sortBy = searchParams.get('sort') as SortOption || 'recent'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '9')
    const skip = (page - 1) * limit

    const where: Prisma.CandidateProfileWhereInput = {
      // Basic profile completion requirements
      NOT: {
        OR: [
          { bio: null },
          { bio: '' },
          { location: null },
          { location: '' }
        ]
      },
      // Filter conditions
      ...(location ? { location } : {}),
      ...(roleType ? { user: { role: roleType } } : {}),
      ...(searchQuery
        ? {
            OR: [
              {
                user: {
                  OR: [
                    {
                      firstName: {
                        contains: searchQuery,
                        mode: 'insensitive' as Prisma.QueryMode,
                      },
                    },
                    {
                      lastName: {
                        contains: searchQuery,
                        mode: 'insensitive' as Prisma.QueryMode,
                      },
                    },
                  ],
                },
              },
              {
                bio: {
                  contains: searchQuery,
                  mode: 'insensitive' as Prisma.QueryMode,
                },
              },
              {
                skills: {
                  has: searchQuery,
                },
              },
            ],
          }
        : {}),
    }

    // Define sorting based on sortBy parameter
    const orderBy = (() => {
      switch (sortBy) {
        case 'recent':
          return { updatedAt: 'desc' as const }
        case 'experience':
          return { updatedAt: 'desc' as const } // Fallback to recent as experience count is not directly sortable
        case 'certifications':
          return { certifications: 'desc' as const }
        case 'views':
          return { profileViews: 'desc' as const }
        case 'relevance':
          return searchQuery
            ? { updatedAt: 'desc' as const } // Fallback to recent as relevance sorting is not supported
            : { updatedAt: 'desc' as const }
        default:
          return { updatedAt: 'desc' as const }
      }
    })()

    console.log('Fetching professionals with where clause:', where)
    console.log('Sorting by:', orderBy)

    const [professionals, total] = await Promise.all([
      prisma.candidateProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              image: true,
              role: true,
              profileSlug: true,
            },
          },
        },
      }),
      prisma.candidateProfile.count({ where }),
    ])

    console.log('Found professionals:', professionals)

    return NextResponse.json({
      professionals,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    })
  } catch (error) {
    console.error('Error fetching professionals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch professionals' },
      { status: 500 }
    )
  }
} 