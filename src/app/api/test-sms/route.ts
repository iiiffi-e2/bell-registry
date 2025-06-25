import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationCode } from '@/lib/sms-service';

export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Test endpoint disabled in production' }, { status: 403 });
    }

    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const result = await sendVerificationCode(phoneNumber);

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Test verification code sent successfully' : 'Failed to send verification code',
      error: result.error,
      code: result.code,
      verificationSid: result.verificationSid,
      status: result.status
    });

  } catch (error) {
    console.error('Test SMS error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 