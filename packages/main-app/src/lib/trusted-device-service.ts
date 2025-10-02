/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export interface DeviceInfo {
  userAgent: string;
  ipAddress: string;
}

export interface TrustedDeviceData {
  id: string;
  deviceName: string | null;
  userAgent: string;
  ipAddress: string;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
}

// Generate a cryptographically secure token
export function generateDeviceToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Hash the device token for database storage
export async function hashDeviceToken(token: string): Promise<string> {
  return bcrypt.hash(token, 12);
}

// Verify a device token against the hashed version
export async function verifyDeviceToken(token: string, hashedToken: string): Promise<boolean> {
  return bcrypt.compare(token, hashedToken);
}

// Extract device name from user agent
export function extractDeviceName(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  
  // Browser detection
  let browser = 'Unknown Browser';
  if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari')) browser = 'Safari';
  else if (ua.includes('edge')) browser = 'Edge';
  else if (ua.includes('opera')) browser = 'Opera';
  
  // OS detection
  let os = 'Unknown OS';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  
  return `${browser} on ${os}`;
}

// Create a new trusted device
export async function createTrustedDevice(
  userId: string,
  deviceInfo: DeviceInfo
): Promise<{ token: string; deviceId: string }> {
  const token = generateDeviceToken();
  const hashedToken = await hashDeviceToken(token);
  const deviceName = extractDeviceName(deviceInfo.userAgent);
  
  // Set expiration to 30 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  
  const trustedDevice = await prisma.trustedDevice.create({
    data: {
      userId,
      deviceToken: hashedToken,
      deviceName,
      userAgent: deviceInfo.userAgent,
      ipAddress: deviceInfo.ipAddress,
      expiresAt,
    },
  });
  
  return {
    token,
    deviceId: trustedDevice.id,
  };
}

// Verify if a device is trusted and not expired
export async function verifyTrustedDevice(
  userId: string,
  token: string
): Promise<{ isValid: boolean; deviceId?: string }> {
  if (!token) {
    return { isValid: false };
  }
  
  // Get all trusted devices for the user
  const trustedDevices = await prisma.trustedDevice.findMany({
    where: {
      userId,
      expiresAt: {
        gt: new Date(), // Not expired
      },
    },
  });
  
  // Check each device token
  for (const device of trustedDevices) {
    const isValid = await verifyDeviceToken(token, device.deviceToken);
    if (isValid) {
      // Update last used timestamp (sliding expiration)
      await updateDeviceLastUsed(device.id);
      return { isValid: true, deviceId: device.id };
    }
  }
  
  return { isValid: false };
}

// Update device last used timestamp and extend expiration (sliding expiration)
export async function updateDeviceLastUsed(deviceId: string): Promise<void> {
  const newExpiresAt = new Date();
  newExpiresAt.setDate(newExpiresAt.getDate() + 30);
  
  await prisma.trustedDevice.update({
    where: { id: deviceId },
    data: {
      lastUsedAt: new Date(),
      expiresAt: newExpiresAt, // Sliding expiration
    },
  });
}

// Get all trusted devices for a user
export async function getUserTrustedDevices(userId: string): Promise<TrustedDeviceData[]> {
  const devices = await prisma.trustedDevice.findMany({
    where: {
      userId,
      expiresAt: {
        gt: new Date(), // Only non-expired devices
      },
    },
    orderBy: {
      lastUsedAt: 'desc',
    },
    select: {
      id: true,
      deviceName: true,
      userAgent: true,
      ipAddress: true,
      createdAt: true,
      lastUsedAt: true,
      expiresAt: true,
    },
  });
  
  return devices;
}

// Remove a specific trusted device
export async function removeTrustedDevice(userId: string, deviceId: string): Promise<boolean> {
  try {
    await prisma.trustedDevice.delete({
      where: {
        id: deviceId,
        userId, // Ensure user owns the device
      },
    });
    return true;
  } catch (error) {
    console.error('Error removing trusted device:', error);
    return false;
  }
}

// Remove all trusted devices for a user
export async function removeAllTrustedDevices(userId: string): Promise<number> {
  const result = await prisma.trustedDevice.deleteMany({
    where: { userId },
  });
  
  return result.count;
}

// Clean up expired trusted devices (for cron job)
export async function cleanupExpiredDevices(): Promise<number> {
  const result = await prisma.trustedDevice.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
  
  return result.count;
}

// Get approximate location from IP (you might want to integrate with a geo service)
export function getApproximateLocation(ipAddress: string): string {
  // This is a placeholder - in production you'd use a service like MaxMind or ipapi
  if (ipAddress === '127.0.0.1' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.')) {
    return 'Local Network';
  }
  return 'Unknown Location';
}

// Mask IP address for privacy
export function maskIpAddress(ipAddress: string): string {
  const parts = ipAddress.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.*.***`;
  }
  return ipAddress.slice(0, 8) + '***'; // For IPv6 or other formats
} 