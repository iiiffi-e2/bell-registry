/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/message-board/replies/[replyId] - Delete reply
export async function DELETE(
  request: NextRequest,
  { params }: { params: { replyId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow admins to delete replies
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied. Admin access required." }, { status: 403 });
    }

    // Get reply details before deletion for audit log
    const reply = await prisma.messageBoardReply.findUnique({
      where: { id: params.replyId },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        thread: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    });

    if (!reply) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    }

    // Delete reply
    await prisma.messageBoardReply.delete({
      where: { id: params.replyId }
    });

    // Log admin action
    await prisma.adminAuditLog.create({
      data: {
        adminId: session.user.id,
        action: 'MESSAGE_BOARD_REPLY_DELETE',
        targetId: params.replyId,
        targetType: 'MessageBoardReply',
        details: {
          replyContent: reply.content.substring(0, 100) + (reply.content.length > 100 ? '...' : ''),
          replyAuthor: reply.author.email,
          threadId: reply.thread.id,
          threadTitle: reply.thread.title,
        }
      }
    });

    return NextResponse.json({ message: "Reply deleted successfully" });
  } catch (error) {
    console.error("Error deleting reply:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
