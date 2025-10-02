/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get unique locations from approved candidate profiles only
    const locations = await (prisma.candidateProfile as any).findMany({
      select: {
        location: true,
      },
      where: {
        location: {
          not: null,
        },
        // Only include locations from approved profiles
        status: 'APPROVED',
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