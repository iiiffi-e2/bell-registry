import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createTwoFactorSession } from '@/lib/2fa-session';

export async function POST(request: NextRequest) {
  try {
    const { email, verified } = await request.json();

    if (!email || !verified) {
      return NextResponse.json({ 
        success: false,
        error: 'Email and verification status are required' 
      }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        isDeleted: true
      }
    });

    if (!user || user.isDeleted) {
      return NextResponse.json({ 
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Create a temporary session token using the utility function
    const { sessionToken } = createTwoFactorSession(user.email);

    return NextResponse.json({ 
      success: true,
      sessionToken,
      message: '2FA session created'
    });
  } catch (error) {
    console.error('Create 2FA session error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 