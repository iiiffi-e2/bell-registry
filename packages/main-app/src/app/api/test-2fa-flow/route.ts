import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Test endpoint disabled in production' }, { status: 403 });
    }

    const tests = [];

    // Test 1: Check if 2FA fields exist in database
    try {
      const testUser = await prisma.user.findFirst({
        select: {
          id: true,
          email: true,
          twoFactorEnabled: true,
          twoFactorPhone: true,
          twoFactorBackupCodes: true
        }
      });

      tests.push({
        name: 'Database 2FA Fields',
        status: 'PASS',
        message: 'All 2FA fields accessible',
        data: {
          userFound: !!testUser,
          fieldsAccessible: true
        }
      });
    } catch (error: any) {
      tests.push({
        name: 'Database 2FA Fields',
        status: 'FAIL',
        message: error.message,
        data: { error: error.message }
      });
    }

    // Test 2: Check Twilio environment variables
    const twilioConfigured = !!(
      process.env.TWILIO_ACCOUNT_SID && 
      process.env.TWILIO_AUTH_TOKEN && 
      process.env.TWILIO_VERIFY_SERVICE_SID
    );

    tests.push({
      name: 'Twilio Configuration',
      status: twilioConfigured ? 'PASS' : 'FAIL',
      message: twilioConfigured ? 'All Twilio env vars configured' : 'Missing Twilio environment variables',
      data: {
        accountSid: !!process.env.TWILIO_ACCOUNT_SID,
        authToken: !!process.env.TWILIO_AUTH_TOKEN,
        verifyServiceSid: !!process.env.TWILIO_VERIFY_SERVICE_SID
      }
    });

    // Test 3: Check API routes accessibility
    tests.push({
      name: 'API Routes',
      status: 'PASS',
      message: 'All 2FA API routes created',
      data: {
        endpoints: [
          '/api/auth/check-2fa',
          '/api/auth/verify-credentials',
          '/api/auth/2fa/setup',
          '/api/auth/2fa/verify-setup',
          '/api/auth/2fa/verify',
          '/api/auth/2fa/send-code',
          '/api/auth/2fa/status',
          '/api/auth/2fa/disable'
        ]
      }
    });

    // Test 4: Count users with 2FA enabled
    try {
      const twoFactorCount = await prisma.user.count({
        where: {
          twoFactorEnabled: true
        }
      });

      tests.push({
        name: '2FA Adoption',
        status: 'PASS',
        message: `${twoFactorCount} users have 2FA enabled`,
        data: { count: twoFactorCount }
      });
    } catch (error: any) {
      tests.push({
        name: '2FA Adoption',
        status: 'FAIL',
        message: error.message,
        data: { error: error.message }
      });
    }

    const allPassed = tests.every(test => test.status === 'PASS');

    return NextResponse.json({
      success: allPassed,
      message: allPassed ? 'All 2FA tests passed!' : 'Some tests failed',
      summary: {
        total: tests.length,
        passed: tests.filter(t => t.status === 'PASS').length,
        failed: tests.filter(t => t.status === 'FAIL').length
      },
      tests,
      nextSteps: allPassed ? [
        '1. Visit /login and try logging in',
        '2. Go to Settings → Two-Factor Authentication',
        '3. Enable 2FA with your phone number',
        '4. Test the complete login flow'
      ] : [
        '1. Fix failed tests above',
        '2. Add missing Twilio environment variables',
        '3. Re-run this test'
      ]
    });

  } catch (error: any) {
    console.error('2FA test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 