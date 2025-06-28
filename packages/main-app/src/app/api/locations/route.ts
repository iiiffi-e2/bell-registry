import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get unique locations from candidate profiles
    const locations = await prisma.candidateProfile.findMany({
      select: {
        location: true,
      },
      where: {
        location: {
          not: null,
        },
      },
      distinct: ['location'],
    })

    // Extract and sort locations
    const uniqueLocations = locations
      .map(profile => profile.location)
      .filter((location): location is string => location !== null)
      .sort()

    return NextResponse.json(uniqueLocations)
  } catch (error) {
    console.error('Error fetching locations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    )
  }
} 