/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserTrustedDevices, removeAllTrustedDevices } from '@/lib/trusted-device-service';

// GET - Get all trusted devices for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const devices = await getUserTrustedDevices(session.user.id);
    
    return NextResponse.json({ devices });
  } catch (error) {
    console.error('Error fetching trusted devices:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove all trusted devices for the current user
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const removedCount = await removeAllTrustedDevices(session.user.id);
    
    const response = NextResponse.json({ 
      success: true, 
      message: `Removed ${removedCount} trusted devices`,
      removedCount 
    });

    // Clear the device token cookie
    response.cookies.delete('device_token');
    
    return response;
  } catch (error) {
    console.error('Error removing all trusted devices:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 