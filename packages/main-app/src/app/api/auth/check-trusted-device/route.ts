import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyTrustedDevice } from '@/lib/trusted-device-service';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ 
        error: 'Email is required' 
      }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        twoFactorEnabled: true,
        isDeleted: true
      }
    });

    if (!user || user.isDeleted) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If 2FA is not enabled, device trust is not relevant
    if (!user.twoFactorEnabled) {
      return NextResponse.json({ 
        isTrusted: false,
        requires2FA: false 
      });
    }

    // Check for device token in cookies
    const deviceToken = request.cookies.get('device_token')?.value;
    
    if (!deviceToken) {
      return NextResponse.json({ 
        isTrusted: false,
        requires2FA: true 
      });
    }

    // Verify the device token
    const verification = await verifyTrustedDevice(user.id, deviceToken);
    
    return NextResponse.json({ 
      isTrusted: verification.isValid,
      requires2FA: !verification.isValid 
    });
  } catch (error) {
    console.error('Error checking trusted device:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
