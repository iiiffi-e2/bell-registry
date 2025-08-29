import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/message-board/threads - Get all threads for admin view
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow admins to access
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied. Admin access required." }, { status: 403 });
    }

    const threads = await prisma.messageBoardThread.findMany({
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
          select: {
            id: true,
            authorId: true,
            createdAt: true,
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
          }
        },
        _count: {
          select: {
            replies: true
          }
        }
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Transform threads for admin view (show full names and emails)
    const threadsWithStats = threads.map(thread => {
      const uniqueParticipants = new Set([
        thread.authorId,
        ...thread.replies.map(reply => reply.authorId)
      ]);

      // Admin view shows full names and emails
      const getAdminDisplayName = (user: any) => {
        const firstName = user.firstName || '';
        const lastName = user.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        return fullName || user.email || 'Unknown User';
      };

      return {
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
        replyCount: thread._count.replies,
        participantCount: uniqueParticipants.size,
      };
    });

    return NextResponse.json(threadsWithStats);
  } catch (error) {
    console.error("Error fetching threads for admin:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
