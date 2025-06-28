import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { twoFactorEnabled: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.twoFactorEnabled) {
      return NextResponse.json({ 
        error: 'Two-factor authentication is not enabled' 
      }, { status: 400 });
    }

    // Disable 2FA and clear all related data
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorPhone: null,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      },
    });

    // Remove all trusted devices since 2FA is disabled
    await prisma.trustedDevice.deleteMany({
      where: { userId: session.user.id },
    });

    // Note: Twilio Verify handles verification cleanup automatically

    const response = NextResponse.json({ 
      success: true,
      message: 'Two-factor authentication has been disabled. All trusted devices have been removed.'
    });

    // Clear device token cookie
    response.cookies.delete('device_token');

    return response;
  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 