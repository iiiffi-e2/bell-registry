import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { JobStatus, Prisma } from '@bell-registry/shared'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        preferredRole: true,
        seekingOpportunities: true,
        location: true,
        workLocations: true,
      }
    })

    if (!profile) {
      return NextResponse.json({ jobs: [] })
    }

    // Build search criteria based on profile
    const searchCriteria: Prisma.JobWhereInput = {
      status: JobStatus.ACTIVE,
      AND: [
        // Match by preferred role
        ...(profile.preferredRole ? [{
          title: {
            contains: profile.preferredRole,
            mode: Prisma.QueryMode.insensitive
          }
        }] : []),
        // Match by seeking opportunities
        ...(profile.seekingOpportunities?.length ? [{
          OR: profile.seekingOpportunities.map(opportunity => ({
            jobType: {
              contains: opportunity,
              mode: Prisma.QueryMode.insensitive
            }
          }))
        }] : []),
        // Match by location if available
        ...(profile.location || profile.workLocations?.length ? [{
          OR: [
            ...(profile.location ? [{
              location: {
                contains: profile.location,
                mode: Prisma.QueryMode.insensitive
              }
            }] : []),
            ...(profile.workLocations?.map(loc => ({
              location: {
                contains: loc,
                mode: Prisma.QueryMode.insensitive
              }
            })) || [])
          ]
        }] : [])
      ].filter(Boolean) // Remove empty conditions
    }

    // Get recommended jobs
    const jobs = await prisma.job.findMany({
      where: searchCriteria,
      take: 5,
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
    })

    if (jobs.length === 0) {
      // If no jobs found with strict criteria, try a more lenient search
      const lenientJobs = await prisma.job.findMany({
        where: {
          status: JobStatus.ACTIVE,
          OR: [
            ...(profile.preferredRole ? [{
              title: {
                contains: profile.preferredRole,
                mode: Prisma.QueryMode.insensitive
              }
            }] : []),
            ...(profile.seekingOpportunities?.map(opportunity => ({
              jobType: {
                contains: opportunity,
                mode: Prisma.QueryMode.insensitive
              }
            })) || []),
            ...(profile.location ? [{
              location: {
                contains: profile.location,
                mode: Prisma.QueryMode.insensitive
              }
            }] : []),
            ...(profile.workLocations?.map(loc => ({
              location: {
                contains: loc,
                mode: Prisma.QueryMode.insensitive
              }
            })) || [])
          ]
        },
        take: 5,
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
      })
      return NextResponse.json({ jobs: lenientJobs })
    }

    return NextResponse.json({ jobs })
  } catch (error) {
    console.error('Error fetching recommended jobs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recommended jobs' },
      { status: 500 }
    )
  }
} 