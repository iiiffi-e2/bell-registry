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

// Schema for creating a new reply
const createReplySchema = z.object({
  content: z.string().min(1, "Reply content is required").max(5000, "Reply must be less than 5000 characters"),
});

// POST /api/message-board/threads/[threadId]/replies - Create a new reply
export async function POST(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow professionals to reply
    if (session.user.role !== "PROFESSIONAL") {
      return NextResponse.json({ error: "Access denied. Only professionals can reply to threads." }, { status: 403 });
    }

    const body = await request.json();
    const { content } = createReplySchema.parse(body);

    // Check if thread exists and is not locked
    const thread = await prisma.messageBoardThread.findUnique({
      where: { id: params.threadId }
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    if (thread.isLocked) {
      return NextResponse.json({ error: "This thread is locked and cannot receive new replies" }, { status: 403 });
    }

    // Create the reply and update thread's lastReplyAt
    const [reply] = await prisma.$transaction([
      prisma.messageBoardReply.create({
        data: {
          content,
          authorId: session.user.id,
          threadId: params.threadId,
        },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              customInitials: true,
              isAnonymous: true,
            }
          }
        }
      }),
      prisma.messageBoardThread.update({
        where: { id: params.threadId },
        data: { lastReplyAt: new Date() }
      })
    ]);

    // Helper function to get display initials
    const getDisplayInitials = (user: any) => {
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      
      if (user.customInitials && user.customInitials.length >= 2) {
        const initials = user.customInitials.toUpperCase();
        return initials.length === 2 ? `${initials[0]}.${initials[1]}.` : `${initials[0]}.${initials[1]}.${initials[2]}.`;
      }
      
      const firstInitial = firstName[0] || '';
      const lastInitial = lastName[0] || '';
      return `${firstInitial}.${lastInitial}.`;
    };

    const replyResponse = {
      id: reply.id,
      content: reply.content,
      authorInitials: getDisplayInitials(reply.author),
      createdAt: reply.createdAt,
      updatedAt: reply.updatedAt,
      isAuthor: true,
    };

    return NextResponse.json(replyResponse, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Error creating reply:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
