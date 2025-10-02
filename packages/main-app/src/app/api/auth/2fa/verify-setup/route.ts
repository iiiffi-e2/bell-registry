/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateBackupCodes, formatPhoneNumber, verifyCode } from '@/lib/sms-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code, phoneNumber } = await request.json();

    if (!code || !phoneNumber) {
      return NextResponse.json({ 
        error: 'Verification code and phone number are required' 
      }, { status: 400 });
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Verify code with Twilio Verify
    const verifyResult = await verifyCode(formattedPhone, code);
    if (!verifyResult.success) {
      return NextResponse.json({ 
        error: verifyResult.error || 'Invalid or expired verification code' 
      }, { status: 400 });
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes();

    // Enable 2FA for user
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorPhone: formattedPhone,
        twoFactorBackupCodes: backupCodes,
      },
    });

    return NextResponse.json({ 
      success: true, 
      backupCodes,
      message: 'Two-factor authentication has been enabled successfully'
    });
  } catch (error) {
    console.error('2FA setup verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 