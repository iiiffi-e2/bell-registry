import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyCode } from '@/lib/sms-service';
import { createTrustedDevice } from '@/lib/trusted-device-service';

export async function POST(request: NextRequest) {
  try {
    const { email, code, trustDevice } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ 
        error: 'Email and verification code are required' 
      }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
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
            (c: string) => c !== code.toUpperCase()
          ),
        },
      });

      return NextResponse.json({ 
        success: true,
        message: 'Backup code verified successfully',
        type: 'backup'
      });
    }

    let verificationType: 'sms' | 'backup' = 'sms';

    // Check if it's a backup code
    if (user.twoFactorBackupCodes.includes(code.toUpperCase())) {
      // Remove used backup code
      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorBackupCodes: user.twoFactorBackupCodes.filter(
            (c: string) => c !== code.toUpperCase()
          ),
        },
      });
      verificationType = 'backup';
    } else {
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
    }

    let deviceToken: string | undefined;

    // If user wants to trust this device, create a trusted device
    if (trustDevice) {
      try {
        const userAgent = request.headers.get('user-agent') || 'Unknown';
        const forwarded = request.headers.get('x-forwarded-for');
        const ipAddress = forwarded ? forwarded.split(',')[0].trim() : 
          request.ip || 
          request.headers.get('x-real-ip') || 
          '127.0.0.1';

        const result = await createTrustedDevice(user.id, {
          userAgent,
          ipAddress,
        });
        
        deviceToken = result.token;
      } catch (error) {
        console.error('Error creating trusted device:', error);
        // Don't fail the entire request if device trust fails
      }
    }

    const response = NextResponse.json({ 
      success: true,
      message: 'Verification code confirmed',
      type: verificationType,
      deviceTrusted: !!deviceToken
    });

    // Set the device token as an HTTP-only cookie if created
    if (deviceToken) {
      response.cookies.set('device_token', deviceToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 