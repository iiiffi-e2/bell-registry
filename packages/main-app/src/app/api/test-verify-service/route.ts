import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

export async function GET(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Test endpoint disabled in production' }, { status: 403 });
    }

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );

    // Test the Verify service configuration
    try {
      const service = await client.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
        .fetch();

      return NextResponse.json({
        success: true,
        message: 'Twilio Verify service is configured correctly',
        service: {
          sid: service.sid,
          friendlyName: service.friendlyName,
          codeLength: service.codeLength
        }
      });
    } catch (serviceError: any) {
      return NextResponse.json({
        success: false,
        error: 'Verify service configuration error',
        details: serviceError.message,
        code: serviceError.code
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Verify service test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to test Verify service',
      details: error.message
    }, { status: 500 });
  }
} 