/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for thread updates
const updateThreadSchema = z.object({
  isLocked: z.boolean().optional(),
  isPinned: z.boolean().optional(),
});

// GET /api/message-board/threads/[threadId] - Get thread details for admin
export async function GET(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow admins to access
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied. Admin access required." }, { status: 403 });
    }

    const thread = await prisma.messageBoardThread.findUnique({
      where: { id: params.threadId },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            customInitials: true,
            isAnonymous: true,
          }
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                customInitials: true,
                isAnonymous: true,
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Admin view shows full names and emails
    const getAdminDisplayName = (user: any) => {
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      return fullName || user.email || 'Unknown User';
    };

    const threadWithReplies = {
      id: thread.id,
      title: thread.title,
      content: thread.content,
      authorName: getAdminDisplayName(thread.author),
      authorEmail: thread.author.email,
      authorId: thread.authorId,
      createdAt: thread.createdAt,
      lastReplyAt: thread.lastReplyAt,
      isPinned: thread.isPinned,
      isLocked: thread.isLocked,
      replies: thread.replies.map(reply => ({
        id: reply.id,
        content: reply.content,
        authorName: getAdminDisplayName(reply.author),
        authorEmail: reply.author.email,
        authorId: reply.authorId,
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt,
      }))
    };

    return NextResponse.json(threadWithReplies);
  } catch (error) {
    console.error("Error fetching thread for admin:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/message-board/threads/[threadId] - Update thread (lock/unlock, pin/unpin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow admins to modify threads
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied. Admin access required." }, { status: 403 });
    }

    const body = await request.json();
    const updates = updateThreadSchema.parse(body);

    const thread = await prisma.messageBoardThread.update({
      where: { id: params.threadId },
      data: updates,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    // Log admin action
    await prisma.adminAuditLog.create({
      data: {
        adminId: session.user.id,
        action: 'MESSAGE_BOARD_THREAD_UPDATE',
        targetId: params.threadId,
        targetType: 'MessageBoardThread',
        details: {
          updates,
          threadTitle: thread.title,
          threadAuthor: thread.author.email,
        }
      }
    });

    return NextResponse.json({ message: "Thread updated successfully", thread });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Error updating thread:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/message-board/threads/[threadId] - Delete thread
export async function DELETE(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow admins to delete threads
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied. Admin access required." }, { status: 403 });
    }

    // Get thread details before deletion for audit log
    const thread = await prisma.messageBoardThread.findUnique({
      where: { id: params.threadId },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        _count: {
          select: {
            replies: true
          }
        }
      }
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Delete thread (replies will be deleted via cascade)
    await prisma.messageBoardThread.delete({
      where: { id: params.threadId }
    });

    // Log admin action
    await prisma.adminAuditLog.create({
      data: {
        adminId: session.user.id,
        action: 'MESSAGE_BOARD_THREAD_DELETE',
        targetId: params.threadId,
        targetType: 'MessageBoardThread',
        details: {
          threadTitle: thread.title,
          threadAuthor: thread.author.email,
          replyCount: thread._count.replies,
        }
      }
    });

    return NextResponse.json({ message: "Thread deleted successfully" });
  } catch (error) {
    console.error("Error deleting thread:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
