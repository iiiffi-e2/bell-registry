'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { MessageInput } from './MessageInput'
import { useSSE } from '@/hooks/useSSE'

interface Message {
  id: string
  content: string
  senderId: string
  createdAt: string
  read: boolean
  sender: {
    id: string
    firstName: string | null
    lastName: string | null
    image: string | null
    role: string
  }
}

interface ChatWindowProps {
  conversationId: string
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const { data: session } = useSession()
  const { isConnected, addMessageHandler } = useSSE()
  const [messages, setMessages] = useState<Message[]>([])
  const [conversationData, setConversationData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (conversationId) {
      fetchConversation()
      
      // Listen for new messages via SSE
      const unsubscribe = addMessageHandler((data) => {
        if (data.type === 'new-message' && data.conversationId === conversationId) {
          setMessages(prev => [...prev, data.data.message])
        }
      })
      
      return () => {
        unsubscribe()
      }
    }
  }, [conversationId, addMessageHandler])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchConversation = async () => {
    try {
      const response = await fetch(`/api/messages/conversations/${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        setConversationData(data)
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Error fetching conversation:', error)
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (content: string) => {
    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, content })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Show error toast
    }
  }

  const handleEndConversation = async () => {
    try {
      const response = await fetch(`/api/messages/conversations/${conversationId}`, {
        method: 'PATCH'
      })
      
      if (response.ok) {
        setConversationData((prev: any) => ({ ...prev, status: 'ENDED' }))
      }
    } catch (error) {
      console.error('Error ending conversation:', error)
    }
  }

  if (loading) {
    return <div className="flex-1 p-4">Loading conversation...</div>
  }

  if (!conversationData) {
    return <div className="flex-1 p-4">Select a conversation to start messaging</div>
  }

  const otherUser = session?.user.id === conversationData.client.id
    ? conversationData.professional
    : conversationData.client

  const isClient = session?.user.role === 'EMPLOYER' || session?.user.role === 'AGENCY'
  const isActive = conversationData.status === 'ACTIVE'

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">
              {otherUser.firstName} {otherUser.lastName}
            </h2>
            {conversationData.status === 'ENDED' && (
              <Badge variant="secondary">Conversation Ended</Badge>
            )}
          </div>
          
          {isClient && isActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEndConversation}
            >
              End Conversation
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwnMessage = message.senderId === session?.user.id
          
          return (
            <div
              key={message.id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  isOwnMessage
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {format(new Date(message.createdAt), 'MMMM d, yyyy \'at\' h:mm a')}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput
        onSend={handleSendMessage}
        disabled={!isActive}
        placeholder={
          !isActive
            ? 'This conversation has ended'
            : 'Type a message...'
        }
      />
    </div>
  )
} 