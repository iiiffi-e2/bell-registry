import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

// Store temporary 2FA session tokens (in production, use Redis or database)
const twoFactorSessions = new Map<string, { email: string; expiresAt: number }>();

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

    // Create a temporary session token that will be used by NextAuth
    const sessionToken = randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes

    // Store the session token temporarily
    twoFactorSessions.set(sessionToken, {
      email: user.email,
      expiresAt
    });

    // Clean up expired sessions
    Array.from(twoFactorSessions.entries()).forEach(([token, session]) => {
      if (session.expiresAt < Date.now()) {
        twoFactorSessions.delete(token);
      }
    });

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

// Helper function to verify 2FA session token
export function verifyTwoFactorSession(token: string): { valid: boolean; email?: string } {
  const session = twoFactorSessions.get(token);
  
  if (!session) {
    return { valid: false };
  }

  if (session.expiresAt < Date.now()) {
    twoFactorSessions.delete(token);
    return { valid: false };
  }

  return { valid: true, email: session.email };
} 