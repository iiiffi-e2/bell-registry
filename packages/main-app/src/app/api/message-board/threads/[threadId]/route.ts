import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/message-board/threads/[threadId] - Get thread details with replies
export async function GET(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow professionals to access message board
    if (session.user.role !== "PROFESSIONAL") {
      return NextResponse.json({ error: "Access denied. Only professionals can access the message board." }, { status: 403 });
    }

    const thread = await prisma.messageBoardThread.findUnique({
      where: { id: params.threadId },
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
        likes: {
          select: {
            userId: true
          }
        },
        replies: {
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
            likes: {
              select: {
                userId: true
              }
            },
            _count: {
              select: {
                likes: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        _count: {
          select: {
            likes: true
          }
        }
      }
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

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

    const threadWithReplies = {
      id: thread.id,
      title: thread.title,
      content: thread.content,
      authorInitials: getDisplayInitials(thread.author),
      createdAt: thread.createdAt,
      lastReplyAt: thread.lastReplyAt,
      isPinned: thread.isPinned,
      isLocked: thread.isLocked,
      isAuthor: thread.authorId === session.user.id,
      likeCount: thread._count.likes,
      isLiked: thread.likes.some(like => like.userId === session.user.id),
      replies: thread.replies.map(reply => ({
        id: reply.id,
        content: reply.content,
        authorInitials: getDisplayInitials(reply.author),
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt,
        isAuthor: reply.authorId === session.user.id,
        likeCount: reply._count.likes,
        isLiked: reply.likes.some(like => like.userId === session.user.id),
      }))
    };

    return NextResponse.json(threadWithReplies);
  } catch (error) {
    console.error("Error fetching thread:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
