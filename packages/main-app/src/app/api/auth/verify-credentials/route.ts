import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ 
        success: false,
        error: 'Email and password are required' 
      }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        password: true,
        isDeleted: true
      }
    });

    if (!user || !user.password) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 });
    }

    // Check if account is deleted
    if (user.isDeleted) {
      return NextResponse.json({ 
        success: false,
        error: 'This account has been deleted'
      }, { status: 401 });
    }

    const isCorrectPassword = await bcrypt.compare(password, user.password);

    if (!isCorrectPassword) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Credentials verified'
    });
  } catch (error) {
    console.error('Verify credentials error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 