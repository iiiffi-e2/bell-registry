import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/types'

export const dynamic = 'force-dynamic'

// GET all conversations for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: userId, role } = session.user

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { clientId: userId },
          { professionalId: userId }
        ]
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            image: true,
            employerProfile: {
              select: {
                companyName: true
              }
            }
          }
        },
        professional: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            image: true,
            candidateProfile: {
              select: {
                title: true
              }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        _count: {
          select: {
            messages: {
              where: {
                read: false,
                senderId: { not: userId }
              }
            }
          }
        }
      },
      orderBy: { lastMessageAt: 'desc' }
    })

    return NextResponse.json(conversations)
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

// POST to initiate a new conversation (Clients only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role, id: clientId } = session.user

    // Only employers and agencies can initiate conversations
    if (role !== UserRole.EMPLOYER && role !== UserRole.AGENCY) {
      return NextResponse.json(
        { error: 'Only clients can initiate conversations' },
        { status: 403 }
      )
    }

    const { professionalId } = await request.json()

    if (!professionalId) {
      return NextResponse.json(
        { error: 'Professional ID is required' },
        { status: 400 }
      )
    }

    // Check if conversation already exists
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        clientId,
        professionalId
      }
    })

    if (existingConversation) {
      // If conversation was ended, reactivate it
      if (existingConversation.status === 'ENDED') {
        const updatedConversation = await prisma.conversation.update({
          where: { id: existingConversation.id },
          data: { status: 'ACTIVE' }
        })
        return NextResponse.json(updatedConversation)
      }
      return NextResponse.json(existingConversation)
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        clientId,
        professionalId,
        status: 'ACTIVE'
      },
      include: {
        client: true,
        professional: true
      }
    })

    return NextResponse.json(conversation)
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    )
  }
} 