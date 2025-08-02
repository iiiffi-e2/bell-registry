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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role, id: userId } = session.user

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
                id: true,
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
                id: true,
                title: true
              }
            }
          }
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          },
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
                senderId: { not: userId },
                read: false
              }
            }
          }
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      }
    })

    // Manually fetch customInitials for all users in the conversations
    const allUserIds = new Set<string>()
    conversations.forEach(conv => {
      allUserIds.add(conv.clientId)
      allUserIds.add(conv.professionalId)
      conv.messages.forEach(msg => allUserIds.add(msg.sender.id))
    })

    // Use raw query to get customInitials to work around Prisma client issues
    const usersWithInitials = await prisma.$queryRaw`
      SELECT id, "customInitials" FROM "User" WHERE id = ANY(${Array.from(allUserIds)})
    ` as Array<{ id: string; customInitials: string | null }>

    const initialsMap = new Map(usersWithInitials.map(u => [u.id, u.customInitials]))

    // Add customInitials to the response
    const enhancedConversations = conversations.map(conv => ({
      ...conv,
      client: {
        ...conv.client,
        customInitials: initialsMap.get(conv.clientId) || null
      },
      professional: {
        ...conv.professional,
        customInitials: initialsMap.get(conv.professionalId) || null
      },
      messages: conv.messages.map(msg => ({
        ...msg,
        sender: {
          ...msg.sender,
          customInitials: initialsMap.get(msg.sender.id) || null
        }
      }))
    }))

    // For employers/agencies viewing professionals, check if names should be revealed
    const processedConversations = await Promise.all(
      enhancedConversations.map(async (conversation) => {
        const isEmployerViewingProfessional = 
          (role === 'EMPLOYER' || role === 'AGENCY') && conversation.clientId === userId

        if (isEmployerViewingProfessional) {
          // If employer has network access, show full professional info
          if (hasNetworkAccess) {
            return conversation
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
            return {
              ...conversation,
              professional: {
                ...conversation.professional,
                firstName: conversation.professional.firstName?.[0] || '',
                lastName: conversation.professional.lastName?.[0] || '',
                image: null,
                isAnonymous: true,
                customInitials: conversation.professional.customInitials
              }
            }
          }
        }

        return conversation
      })
    )

    return NextResponse.json(processedConversations)
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