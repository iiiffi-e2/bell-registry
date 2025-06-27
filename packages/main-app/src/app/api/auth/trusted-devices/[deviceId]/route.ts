import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { removeTrustedDevice } from '@/lib/trusted-device-service';

// DELETE - Remove a specific trusted device
export async function DELETE(
  request: NextRequest,
  { params }: { params: { deviceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { deviceId } = params;
    const success = await removeTrustedDevice(session.user.id, deviceId);
    
    if (!success) {
      return NextResponse.json({ error: 'Device not found or already removed' }, { status: 404 });
    }

    const response = NextResponse.json({ 
      success: true, 
      message: 'Trusted device removed successfully' 
    });

    // If this is the current device (check by cookie), clear it
    const currentDeviceToken = request.cookies.get('device_token')?.value;
    if (currentDeviceToken) {
      // Note: We can't easily verify if this specific device matches the cookie
      // without storing device ID in cookie, but clearing is safer
      response.cookies.delete('device_token');
    }
    
    return response;
  } catch (error) {
    console.error('Error removing trusted device:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
