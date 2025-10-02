/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { NextResponse } from 'next/server'
import { UserRole } from '@bell-registry/shared'

export async function GET() {
  try {
    // Return all user roles except ADMIN
    const roles = Object.values(UserRole).filter(role => role !== UserRole.ADMIN)
    return NextResponse.json(roles)
  } catch (error) {
    console.error('Error fetching role types:', error)
    return NextResponse.json(
      { error: 'Failed to fetch role types' },
      { status: 500 }
    )
  }
} 