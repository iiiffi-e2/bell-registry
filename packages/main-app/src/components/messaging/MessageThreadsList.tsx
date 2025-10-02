/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { getDisplayName } from '@/lib/name-utils'
import { containsUrls } from '@/lib/url-utils'

interface Conversation {
  id: string
  status: 'ACTIVE' | 'ENDED'
  lastMessageAt: string | null
  client: {
    id: string
    firstName: string | null
    lastName: string | null
    image: string | null
    customInitials?: string | null
    employerProfile: {
      companyName: string
    } | null
  }
  professional: {
    id: string
    firstName: string | null
    lastName: string | null
    image: string | null
    role: string
    isAnonymous: boolean
    customInitials?: string | null
    candidateProfile: {
      title: string | null
    } | null
  }
  messages: Array<{
    id: string
    content: string
    createdAt: string
    sender: {
      id: string
      firstName: string | null
      lastName: string | null
      customInitials?: string | null
    }
  }>
  _count: {
    messages: number
  }
}

interface MessageThreadsListProps {
  onSelectConversation: (conversationId: string) => void
  selectedConversationId?: string
}

export function MessageThreadsList({ 
  onSelectConversation, 
  selectedConversationId 
}: MessageThreadsListProps) {
  const { data: session } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/messages/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data)
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-4">Loading conversations...</div>
  }

  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No conversations yet
      </div>
    )
  }

  return (
    <div className="space-y-1 md:space-y-2">
      {conversations.map((conversation) => {
        const otherUser = session?.user.id === conversation.client.id
          ? conversation.professional
          : conversation.client
        
        // Determine if the other user is a professional for anonymization
        const isOtherUserProfessional = session?.user.id === conversation.client.id
        
        const lastMessage = conversation.messages[0]
        const unreadCount = conversation._count.messages

        return (
          <Card
            key={conversation.id}
            className={`p-4 md:p-4 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors min-h-[4rem] md:min-h-0 ${
              selectedConversationId === conversation.id ? 'bg-blue-50' : ''
            }`}
            onClick={() => onSelectConversation(conversation.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">
                    {getDisplayName({
                      firstName: otherUser.firstName,
                      lastName: otherUser.lastName,
                      role: isOtherUserProfessional ? 'PROFESSIONAL' : 'EMPLOYER',
                      isAnonymous: isOtherUserProfessional ? conversation.professional.isAnonymous : false,
                      customInitials: isOtherUserProfessional ? conversation.professional.customInitials : conversation.client.customInitials
                    })}
                  </h3>
                  {conversation.status === 'ENDED' && (
                    <Badge variant="secondary" className="text-xs">
                      Ended
                    </Badge>
                  )}
                </div>
                
                {session?.user.id === conversation.professional.id && 
                 conversation.client.employerProfile && (
                  <p className="text-sm text-gray-500">
                    {conversation.client.employerProfile.companyName}
                  </p>
                )}
                
                {session?.user.id === conversation.client.id && 
                 conversation.professional.candidateProfile?.title && (
                  <p className="text-sm text-gray-500">
                    {conversation.professional.candidateProfile.title}
                  </p>
                )}
                
                {lastMessage && (
                  <p className="text-sm text-gray-600 mt-1 truncate">
                    {lastMessage.sender.id === session?.user.id ? 'You: ' : ''}
                    {containsUrls(lastMessage.content) ? '🔗 ' : ''}{lastMessage.content}
                  </p>
                )}
              </div>
              
              <div className="text-right">
                {unreadCount > 0 && (
                  <Badge className="mb-1">{unreadCount}</Badge>
                )}
                {conversation.lastMessageAt && (
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(conversation.lastMessageAt), { 
                      addSuffix: true 
                    })}
                  </p>
                )}
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
} 