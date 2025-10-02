/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma, adminAuthOptions, logAdminAction } from "@bell-registry/shared";
import { UserRole } from "@bell-registry/shared";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(adminAuthOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, content } = body;

    if (!userId || !content?.trim()) {
      return NextResponse.json({ error: "User ID and content are required" }, { status: 400 });
    }

    // Verify the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create the admin note
    const adminNote = await (prisma as any).adminNote.create({
      data: {
        userId,
        adminId: session.user.id,
        content: content.trim()
      },
      include: {
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Log this admin action
    await logAdminAction(
      session.user.id,
      "CREATE_ADMIN_NOTE",
      { 
        targetUserId: userId,
        targetUserEmail: user.email,
        noteId: adminNote.id,
        noteContent: content.trim()
      },
      request.ip,
      request.headers.get("user-agent") || undefined
    );

    return NextResponse.json({
      success: true,
      note: adminNote,
      message: "Admin note created successfully"
    });

  } catch (error) {
    console.error("Error creating admin note:", error);
    return NextResponse.json(
      { error: "Failed to create admin note" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(adminAuthOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Get all admin notes for the user
    const adminNotes = await (prisma as any).adminNote.findMany({
      where: { userId },
      include: {
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      notes: adminNotes
    });

  } catch (error) {
    console.error("Error fetching admin notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin notes" },
      { status: 500 }
    );
  }
}
