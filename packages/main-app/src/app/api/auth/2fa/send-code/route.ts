import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendVerificationCode } from '@/lib/sms-service';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        twoFactorEnabled: true,
        twoFactorPhone: true,
        isDeleted: true
      }
    });

    if (!user || user.isDeleted) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.twoFactorEnabled || !user.twoFactorPhone) {
      return NextResponse.json({ 
        error: 'Two-factor authentication is not properly configured' 
      }, { status: 400 });
    }

    // Send verification code using Twilio Verify
    const verifyResult = await sendVerificationCode(user.twoFactorPhone);
    if (!verifyResult.success) {
      console.error('Failed to send 2FA verification code:', verifyResult.error);
      return NextResponse.json({ 
        error: 'Failed to send verification code. Please try again.',
        details: verifyResult.error 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Verification code sent to your phone',
      verificationSid: verifyResult.verificationSid,
      status: verifyResult.status
    });
  } catch (error) {
    console.error('2FA send code error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 