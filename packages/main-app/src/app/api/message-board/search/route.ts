import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for search query
const searchSchema = z.object({
  query: z.string().min(1, "Search query is required").max(100, "Search query must be less than 100 characters"),
});

// GET /api/message-board/search - Search threads by title and content
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow professionals to search message board
    if (session.user.role !== "PROFESSIONAL") {
      return NextResponse.json({ error: "Access denied. Only professionals can search the message board." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const queryParam = searchParams.get('q');
    const sortBy = searchParams.get('sortBy') || 'recent';
    
    if (!queryParam) {
      return NextResponse.json({ error: "Search query parameter 'q' is required" }, { status: 400 });
    }

    const { query } = searchSchema.parse({ query: queryParam });

    // Search threads by title and content using case-insensitive search
    const threads = await prisma.messageBoardThread.findMany({
      where: {
        OR: [
          {
            title: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            content: {
              contains: query,
              mode: 'insensitive'
            }
          }
        ]
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
        _count: {
          select: {
            replies: true
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
      };
    });

    return NextResponse.json({
      threads: threadsWithStats,
      query: query,
      totalResults: threadsWithStats.length
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Error searching threads:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
