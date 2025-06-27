import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredDevices } from '@/lib/trusted-device-service';

export async function GET(request: NextRequest) {
  try {
    // Check for authorization header (for cron job authentication)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deletedCount = await cleanupExpiredDevices();
    
    return NextResponse.json({ 
      success: true,
      message: `Cleanup completed. Removed ${deletedCount} expired trusted devices.`,
      deletedCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in cleanup-trusted-devices cron:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
