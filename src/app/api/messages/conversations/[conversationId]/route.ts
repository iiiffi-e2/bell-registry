import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/types'

export const dynamic = 'force-dynamic'

// GET messages for a specific conversation
export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: userId } = session.user
    const { conversationId } = params

    // Verify user has access to this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { clientId: userId },
          { professionalId: userId }
        ]
      },
      include: {
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                image: true,
                role: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            image: true,
            employerProfile: {
              select: { companyName: true }
            }
          }
        },
        professional: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            image: true,
            role: true,
            isAnonymous: true,
            candidateProfile: {
              select: { title: true }
            }
          }
        }
      }
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        read: false
      },
      data: {
        read: true,
        readAt: new Date()
      }
    })

    // For employers/agencies viewing professionals, check if names should be revealed
    const { role } = session.user
    const isEmployerViewingProfessional = 
      (role === 'EMPLOYER' || role === 'AGENCY') && conversation.clientId === userId

    if (isEmployerViewingProfessional) {
      // Check if there's an existing job application between them
      const hasApplication = await prisma.jobApplication.findFirst({
        where: {
          candidateId: conversation.professionalId,
          job: {
            employerId: userId
          }
        }
      })

      // If no application exists, anonymize the professional's info
      if (!hasApplication) {
        const anonymizedConversation = {
          ...conversation,
          professional: {
            ...conversation.professional,
            firstName: conversation.professional.firstName?.[0] || '',
            lastName: conversation.professional.lastName?.[0] || '',
            image: null,
            isAnonymous: true
          },
          messages: conversation.messages.map(message => ({
            ...message,
            sender: message.sender.id === conversation.professionalId
              ? {
                  ...message.sender,
                  firstName: message.sender.firstName?.[0] || '',
                  lastName: message.sender.lastName?.[0] || ''
                }
              : message.sender
          }))
        }
        return NextResponse.json(anonymizedConversation)
      }
    }

    return NextResponse.json(conversation)
  } catch (error) {
    console.error('Error fetching conversation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    )
  }
}

// PATCH to end a conversation (Clients only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: userId, role } = session.user
    const { conversationId } = params

    // Only clients can end conversations
    if (role !== UserRole.EMPLOYER && role !== UserRole.AGENCY) {
      return NextResponse.json(
        { error: 'Only clients can end conversations' },
        { status: 403 }
      )
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        clientId: userId
      }
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    const updatedConversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: { status: 'ENDED' }
    })

    return NextResponse.json(updatedConversation)
  } catch (error) {
    console.error('Error ending conversation:', error)
    return NextResponse.json(
      { error: 'Failed to end conversation' },
      { status: 500 }
    )
  }
} 