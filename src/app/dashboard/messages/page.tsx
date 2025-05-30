'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { MessageThreadsList } from '@/components/messaging/MessageThreadsList'
import { ChatWindow } from '@/components/messaging/ChatWindow'
import { ConnectionStatus } from '@/components/messaging/ConnectionStatus'

export default function MessagesPage() {
  const searchParams = useSearchParams()
  const [selectedConversationId, setSelectedConversationId] = useState<string>()

  useEffect(() => {
    // Auto-select conversation if provided in query params
    const conversationId = searchParams?.get('conversation')
    if (conversationId) {
      setSelectedConversationId(conversationId)
    }
  }, [searchParams])

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      <div className="w-80 border-r overflow-y-auto">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-semibold">Messages</h1>
            <ConnectionStatus showReconnectButton={true} />
          </div>
          <p className="text-sm text-gray-600">Real-time messaging status</p>
        </div>
        <MessageThreadsList
          onSelectConversation={setSelectedConversationId}
          selectedConversationId={selectedConversationId}
        />
      </div>
      
      {selectedConversationId ? (
        <ChatWindow conversationId={selectedConversationId} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Select a conversation to start messaging
        </div>
      )}
    </div>
  )
} 