/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Simple test to see if Prisma client is working
    const userCount = await prisma.user.count();
    
    return NextResponse.json({
      success: true,
      message: 'Prisma is working',
      userCount
    });
  } catch (error: any) {
    console.error('Prisma test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 