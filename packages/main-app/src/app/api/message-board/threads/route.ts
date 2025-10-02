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

// Schema for creating a new thread
const createThreadSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  content: z.string().min(1, "Content is required").max(10000, "Content must be less than 10,000 characters"),
});

// GET /api/message-board/threads - Get all threads with stats
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow professionals to access message board
    if (session.user.role !== "PROFESSIONAL") {
      return NextResponse.json({ error: "Access denied. Only professionals can access the message board." }, { status: 403 });
    }

    // Get sorting parameter
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'recent'; // recent, replies, likes

    const threads = await prisma.messageBoardThread.findMany({
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            customInitials: true,
            isAnonymous: true,
          }
        },
        replies: {
          select: {
            id: true,
            authorId: true,
            createdAt: true,
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
        },
        likes: {
          select: {
            userId: true
          }
        },
        _count: {
          select: {
            replies: true,
            likes: true
          }
        }
      },
      orderBy: [
        { isPinned: 'desc' },
        ...(sortBy === 'replies' ? [
          { replies: { _count: 'desc' } }
        ] : sortBy === 'likes' ? [
          { likes: { _count: 'desc' } }
        ] : [
          { lastReplyAt: 'desc' }
        ])
      ]
    });

    // Transform threads to include stats and display names
    const threadsWithStats = threads.map(thread => {
      const uniqueParticipants = new Set([
        thread.authorId,
        ...thread.replies.map(reply => reply.authorId)
      ]);

      // Helper function to get display initials
      const getDisplayInitials = (user: any) => {
        const firstName = user.firstName || '';
        const lastName = user.lastName || '';
        
        // Use custom initials if provided, otherwise use name initials
        if (user.customInitials && user.customInitials.length >= 2) {
          const initials = user.customInitials.toUpperCase();
          return initials.length === 2 ? `${initials[0]}.${initials[1]}.` : `${initials[0]}.${initials[1]}.${initials[2]}.`;
        }
        
        // Fallback to name initials
        const firstInitial = firstName[0] || '';
        const lastInitial = lastName[0] || '';
        return `${firstInitial}.${lastInitial}.`;
      };

      return {
        id: thread.id,
        title: thread.title,
        authorInitials: getDisplayInitials(thread.author),
        createdAt: thread.createdAt,
        lastReplyAt: thread.lastReplyAt,
        isPinned: thread.isPinned,
        isLocked: thread.isLocked,
        replyCount: thread._count.replies,
        participantCount: uniqueParticipants.size,
        isAuthor: thread.authorId === session.user.id,
        likeCount: thread._count.likes,
        isLiked: thread.likes.some(like => like.userId === session.user.id),
      };
    });

    return NextResponse.json(threadsWithStats);
  } catch (error) {
    console.error("Error fetching threads:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/message-board/threads - Create a new thread
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow professionals to create threads
    if (session.user.role !== "PROFESSIONAL") {
      return NextResponse.json({ error: "Access denied. Only professionals can create threads." }, { status: 403 });
    }

    const body = await request.json();
    const { title, content } = createThreadSchema.parse(body);

    const thread = await prisma.messageBoardThread.create({
      data: {
        title,
        content,
        authorId: session.user.id,
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
        },
        _count: {
          select: {
            replies: true
          }
        }
      }
    });

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

    const threadResponse = {
      id: thread.id,
      title: thread.title,
      content: thread.content,
      authorInitials: getDisplayInitials(thread.author),
      createdAt: thread.createdAt,
      lastReplyAt: thread.lastReplyAt,
      isPinned: thread.isPinned,
      isLocked: thread.isLocked,
      replyCount: thread._count.replies,
      participantCount: 1, // Only the author initially
      isAuthor: true,
    };

    return NextResponse.json(threadResponse, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Error creating thread:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
