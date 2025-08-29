import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        twoFactorEnabled: true,
        twoFactorPhone: true,
        isDeleted: true
      }
    });

    if (!user || user.isDeleted) {
      // Don't reveal if user exists for security
      return NextResponse.json({ 
        has2FA: false,
        message: 'User status checked'
      });
    }

    // Mask the phone number for privacy
    let maskedPhone = '';
    if (user.twoFactorPhone) {
      const phone = user.twoFactorPhone;
      if (phone.length >= 4) {
        maskedPhone = `***-***-${phone.slice(-4)}`;
      } else {
        maskedPhone = '***-***-****';
      }
    }

    return NextResponse.json({
      has2FA: user.twoFactorEnabled,
      phone: maskedPhone
    });
  } catch (error) {
    console.error('Check 2FA error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 