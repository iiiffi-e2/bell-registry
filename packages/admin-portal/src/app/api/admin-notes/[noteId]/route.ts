/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma, adminAuthOptions, logAdminAction } from "@bell-registry/shared";
import { UserRole } from "@bell-registry/shared";

export async function PUT(
  request: NextRequest,
  { params }: { params: { noteId: string } }
) {
  try {
    const session = await getServerSession(adminAuthOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const noteId = params.noteId;
    const body = await request.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Get the existing note to verify ownership and get user info
    const existingNote = await (prisma as any).adminNote.findUnique({
      where: { id: noteId },
      include: {
        user: {
          select: { email: true, firstName: true, lastName: true }
        }
      }
    });

    if (!existingNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Only allow the original admin who created the note to edit it
    if (existingNote.adminId !== session.user.id) {
      return NextResponse.json({ error: "You can only edit your own notes" }, { status: 403 });
    }

    // Update the note
    const updatedNote = await (prisma as any).adminNote.update({
      where: { id: noteId },
      data: { content: content.trim() },
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
      "UPDATE_ADMIN_NOTE",
      { 
        targetUserId: existingNote.userId,
        targetUserEmail: existingNote.user.email,
        noteId: noteId,
        oldContent: existingNote.content,
        newContent: content.trim()
      },
      request.ip,
      request.headers.get("user-agent") || undefined
    );

    return NextResponse.json({
      success: true,
      note: updatedNote,
      message: "Admin note updated successfully"
    });

  } catch (error) {
    console.error("Error updating admin note:", error);
    return NextResponse.json(
      { error: "Failed to update admin note" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { noteId: string } }
) {
  try {
    const session = await getServerSession(adminAuthOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const noteId = params.noteId;

    // Get the existing note to verify ownership and get user info
    const existingNote = await (prisma as any).adminNote.findUnique({
      where: { id: noteId },
      include: {
        user: {
          select: { email: true, firstName: true, lastName: true }
        }
      }
    });

    if (!existingNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Only allow the original admin who created the note to delete it
    if (existingNote.adminId !== session.user.id) {
      return NextResponse.json({ error: "You can only delete your own notes" }, { status: 403 });
    }

    // Delete the note
    await (prisma as any).adminNote.delete({
      where: { id: noteId }
    });

    // Log this admin action
    await logAdminAction(
      session.user.id,
      "DELETE_ADMIN_NOTE",
      { 
        targetUserId: existingNote.userId,
        targetUserEmail: existingNote.user.email,
        noteId: noteId,
        deletedContent: existingNote.content
      },
      request.ip,
      request.headers.get("user-agent") || undefined
    );

    return NextResponse.json({
      success: true,
      message: "Admin note deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting admin note:", error);
    return NextResponse.json(
      { error: "Failed to delete admin note" },
      { status: 500 }
    );
  }
}
