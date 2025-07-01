import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma, UserRole } from '@bell-registry/shared'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const isEmployerOrAgency = session?.user?.role === "EMPLOYER" || session?.user?.role === "AGENCY"

    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')
    const roleType = searchParams.get('roleType') as UserRole | null
    const searchQuery = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '9')
    const skip = (page - 1) * limit

    const where = {
      // Only show approved profiles in public listings
      status: 'APPROVED',
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

    const [candidates, total] = await Promise.all([
      prisma.candidateProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              image: true,
            },
          },
        },
      }),
      prisma.candidateProfile.count({ where }),
    ])

    // Anonymize data for employers and agencies
    const anonymizedCandidates = candidates.map(candidate => {
      if (isEmployerOrAgency) {
        return {
          ...candidate,
          user: {
            ...candidate.user,
            firstName: candidate.user.firstName?.[0] || '',
            lastName: candidate.user.lastName?.[0] || '',
            image: null, // Hide profile image
            email: '', // Hide email
          }
        };
      }
      return candidate;
    });

    return NextResponse.json({
      candidates: anonymizedCandidates,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    })
  } catch (error) {
    console.error('Error fetching candidates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch candidates' },
      { status: 500 }
    )
  }
} 