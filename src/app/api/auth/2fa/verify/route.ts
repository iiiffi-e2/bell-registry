import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyCode } from '@/lib/sms-service';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ 
        error: 'Email and verification code are required' 
      }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        twoFactorEnabled: true,
        twoFactorBackupCodes: true,
        twoFactorPhone: true,
        isDeleted: true
      }
    });

    if (!user || user.isDeleted) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.twoFactorEnabled) {
      return NextResponse.json({ 
        error: 'Two-factor authentication is not enabled' 
      }, { status: 400 });
    }

    // Check if it's a backup code
    if (user.twoFactorBackupCodes.includes(code.toUpperCase())) {
      // Remove used backup code
      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorBackupCodes: user.twoFactorBackupCodes.filter(
            c => c !== code.toUpperCase()
          ),
        },
      });

      return NextResponse.json({ 
        success: true,
        message: 'Backup code verified successfully',
        type: 'backup'
      });
    }

    // Verify with Twilio Verify API
    if (!user.twoFactorPhone) {
      return NextResponse.json({ 
        error: 'Two-factor authentication phone number not configured' 
      }, { status: 400 });
    }

    const verifyResult = await verifyCode(user.twoFactorPhone, code);
    if (!verifyResult.success) {
      return NextResponse.json({ 
        error: verifyResult.error || 'Invalid or expired verification code' 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Verification code confirmed',
      type: 'sms'
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 