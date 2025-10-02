/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

"use client";

import { useState, useEffect } from "react";
import { getTimeAgo } from "@/lib/utils";

interface TrustedDevice {
  id: string;
  deviceName: string | null;
  userAgent: string;
  ipAddress: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
}

// Mask IP address for privacy
function maskIpAddress(ipAddress: string): string {
  const parts = ipAddress.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.*.***`;
  }
  return ipAddress.slice(0, 8) + '***'; // For IPv6 or other formats
}

// Get approximate location from IP
function getApproximateLocation(ipAddress: string): string {
  if (ipAddress === '127.0.0.1' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.')) {
    return 'Local Network';
  }
  return 'Unknown Location';
}

export function TrustedDevicesManager() {
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingDevice, setRemovingDevice] = useState<string | null>(null);
  const [removingAll, setRemovingAll] = useState(false);

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/auth/trusted-devices');
      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices || []);
      } else {
        setError('Failed to load trusted devices');
      }
    } catch (error) {
      console.error('Error fetching trusted devices:', error);
      setError('Failed to load trusted devices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const removeDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to remove this trusted device? You&apos;ll need to verify with 2FA the next time you sign in from this device.')) {
      return;
    }

    setRemovingDevice(deviceId);
    try {
      const response = await fetch(`/api/auth/trusted-devices/${deviceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDevices(devices.filter(device => device.id !== deviceId));
      } else {
        setError('Failed to remove device');
      }
    } catch (error) {
      console.error('Error removing device:', error);
      setError('Failed to remove device');
    } finally {
      setRemovingDevice(null);
    }
  };

  const removeAllDevices = async () => {
    if (!confirm('Are you sure you want to remove all trusted devices? You&apos;ll need to verify with 2FA the next time you sign in from any device.')) {
      return;
    }

    setRemovingAll(true);
    try {
      const response = await fetch('/api/auth/trusted-devices', {
        method: 'DELETE',
      });

      if (response.ok) {
        setDevices([]);
      } else {
        setError('Failed to remove all devices');
      }
    } catch (error) {
      console.error('Error removing all devices:', error);
      setError('Failed to remove all devices');
    } finally {
      setRemovingAll(false);
    }
  };

  const getDeviceIcon = (userAgent: string) => {
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return '📱';
    } else if (ua.includes('ipad') || ua.includes('tablet')) {
      return '📱';
    } else {
      return '🖥️';
    }
  };

  const formatExpirationDate = (expiresAt: string) => {
    const expirationDate = new Date(expiresAt);
    const now = new Date();
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiration <= 7) {
      return `Expires in ${daysUntilExpiration} day${daysUntilExpiration === 1 ? '' : 's'}`;
    }
    
    return `Expires ${expirationDate.toLocaleDateString()}`;
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-sm text-gray-500 mt-2">Loading trusted devices...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Trusted devices don&apos;t require 2FA verification for 30 days. Only trust devices you own.
        </p>
        {devices.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            No trusted devices. Trust a device during your next 2FA login to skip SMS verification.
          </p>
        ) : (
          <p className="text-sm text-gray-700">
            You have {devices.length} trusted device{devices.length === 1 ? '' : 's'}.
          </p>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {devices.length > 0 && (
        <div className="space-y-3 mb-4">
          {devices.map((device) => (
            <div key={device.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">{getDeviceIcon(device.userAgent)}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900">
                      {device.deviceName || 'Unknown Device'}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Added {getTimeAgo(device.createdAt)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Last used {getTimeAgo(device.lastUsedAt)}
                    </p>
                    <p className="text-xs text-gray-500">
                      IP: {maskIpAddress(device.ipAddress)} • {getApproximateLocation(device.ipAddress)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatExpirationDate(device.expiresAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeDevice(device.id)}
                  disabled={removingDevice === device.id}
                  className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  {removingDevice === device.id ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {devices.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <button
            onClick={removeAllDevices}
            disabled={removingAll}
            className="w-full flex justify-center py-2 px-4 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            {removingAll ? 'Removing All Devices...' : 'Remove All Trusted Devices'}
          </button>
        </div>
      )}
    </div>
  );
}
