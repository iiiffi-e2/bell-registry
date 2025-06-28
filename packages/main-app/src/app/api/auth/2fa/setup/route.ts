import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendVerificationCode, validatePhoneNumber, formatPhoneNumber } from '@/lib/sms-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phoneNumber } = await request.json();
    
    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    if (!validatePhoneNumber(formattedPhone)) {
      return NextResponse.json({ 
        error: 'Invalid phone number format. Please use format: +1234567890' 
      }, { status: 400 });
    }

    // Send verification code using Twilio Verify
    const verifyResult = await sendVerificationCode(formattedPhone);
    if (!verifyResult.success) {
      console.error('Failed to send verification code:', verifyResult.error);
      return NextResponse.json({ 
        error: 'Failed to send verification code. Please check your phone number and try again.',
        details: verifyResult.error 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Verification code sent successfully',
      verificationSid: verifyResult.verificationSid,
      status: verifyResult.status
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 