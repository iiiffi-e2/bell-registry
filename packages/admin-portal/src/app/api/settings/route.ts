import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { adminAuthOptions } from "@bell-registry/shared";
import { prisma } from "@bell-registry/shared/lib/prisma";
import { UserRole } from "@bell-registry/shared";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(adminAuthOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all system settings
    const settings = await (prisma as any).systemSettings.findMany({
      include: {
        admin: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(adminAuthOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { settingKey, settingValue, description } = await request.json();

    if (!settingKey || !settingValue) {
      return NextResponse.json(
        { error: "settingKey and settingValue are required" },
        { status: 400 }
      );
    }

    // Validate the setting based on key
    if (settingKey === 'DEFAULT_PROFILE_STATUS') {
      const validStatuses = ['PENDING', 'APPROVED'];
      if (!validStatuses.includes(settingValue)) {
        return NextResponse.json(
          { error: "Invalid profile status value. Must be PENDING or APPROVED" },
          { status: 400 }
        );
      }
    }

    // Upsert the setting (create or update)
    const setting = await (prisma as any).systemSettings.upsert({
      where: {
        settingKey: settingKey
      },
      update: {
        settingValue: settingValue,
        description: description,
        updatedBy: session.user.id,
      },
      create: {
        settingKey: settingKey,
        settingValue: settingValue,
        description: description,
        updatedBy: session.user.id,
      },
      include: {
        admin: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    // Log the admin action
    await (prisma as any).adminAuditLog.create({
      data: {
        adminId: session.user.id,
        action: 'SYSTEM_SETTING_UPDATED',
        targetType: 'SYSTEM_SETTING',
        targetId: setting.id,
        details: {
          settingKey: settingKey,
          oldValue: null, // We could track this if needed
          newValue: settingValue,
          description: description,
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    });

    return NextResponse.json(setting);
  } catch (error) {
    console.error('Error saving setting:', error);
    return NextResponse.json(
      { error: 'Failed to save setting' },
      { status: 500 }
    );
  }
} 