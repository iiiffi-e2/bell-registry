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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role, id: userId } = session.user
    const { conversationId } = params

    // Check if employer has network access
    let hasNetworkAccess = false
    const isEmployerOrAgency = role === 'EMPLOYER' || role === 'AGENCY'
    if (isEmployerOrAgency && userId) {
      const employerProfile = await prisma.employerProfile.findUnique({
        where: { userId },
        select: { hasNetworkAccess: true }
      })
      hasNetworkAccess = employerProfile?.hasNetworkAccess || false
    }

    // Verify user has access to this conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
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
            role: true,
            isAnonymous: true,
            candidateProfile: {
              select: {
                title: true
              }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                image: true,
                role: true,
              }
            }
          }
        }
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Verify user has access to this conversation
    if (conversation.clientId !== userId && conversation.professionalId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Manually fetch customInitials for all users in the conversation
    const allUserIds = new Set<string>()
    allUserIds.add(conversation.clientId)
    allUserIds.add(conversation.professionalId)
    conversation.messages.forEach(msg => allUserIds.add(msg.sender.id))

    // Use raw query to get customInitials to work around Prisma client issues
    const usersWithInitials = await prisma.$queryRaw`
      SELECT id, "customInitials" FROM "User" WHERE id = ANY(${Array.from(allUserIds)})
    ` as Array<{ id: string; customInitials: string | null }>

    const initialsMap = new Map(usersWithInitials.map(u => [u.id, u.customInitials]))

    // Add customInitials to the response
    const enhancedConversation = {
      ...conversation,
      client: {
        ...conversation.client,
        customInitials: initialsMap.get(conversation.clientId) || null
      },
      professional: {
        ...conversation.professional,
        customInitials: initialsMap.get(conversation.professionalId) || null
      },
      messages: conversation.messages.map(msg => ({
        ...msg,
        sender: {
          ...msg.sender,
          customInitials: initialsMap.get(msg.sender.id) || null
        }
      }))
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
    const isEmployerViewingProfessional = 
      (role === 'EMPLOYER' || role === 'AGENCY') && conversation.clientId === userId

    if (isEmployerViewingProfessional) {
      // If employer has network access, show full professional info
      if (hasNetworkAccess) {
        return NextResponse.json(enhancedConversation)
      }

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
          ...enhancedConversation,
          professional: {
            ...enhancedConversation.professional,
            firstName: enhancedConversation.professional.firstName?.[0] || '',
            lastName: enhancedConversation.professional.lastName?.[0] || '',
            image: null,
            isAnonymous: true,
            customInitials: enhancedConversation.professional.customInitials
          },
          messages: enhancedConversation.messages.map(message => ({
            ...message,
            sender: message.sender.id === enhancedConversation.professionalId
              ? {
                  ...message.sender,
                  firstName: message.sender.firstName?.[0] || '',
                  lastName: message.sender.lastName?.[0] || '',
                  customInitials: message.sender.customInitials
                }
              : message.sender
          }))
        }
        return NextResponse.json(anonymizedConversation)
      }
    }

    return NextResponse.json(enhancedConversation)
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