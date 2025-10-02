/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { MessageThreadsList } from '@/components/messaging/MessageThreadsList'
import { ChatWindow } from '@/components/messaging/ChatWindow'
import { ConnectionStatus } from '@/components/messaging/ConnectionStatus'

export default function MessagesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selectedConversationId, setSelectedConversationId] = useState<string>()
  const [showMobileChat, setShowMobileChat] = useState(false)

  useEffect(() => {
    // Auto-select conversation if provided in query params
    const conversationId = searchParams?.get('conversation')
    if (conversationId) {
      setSelectedConversationId(conversationId)
      setShowMobileChat(true) // Show chat on mobile when conversation is selected
    }
  }, [searchParams])

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId)
    setShowMobileChat(true) // Show chat window on mobile
    // Update URL to include conversation ID
    router.push(`/dashboard/messages?conversation=${conversationId}`)
  }

  const handleBackToList = () => {
    setShowMobileChat(false) // Go back to chat list on mobile
    setSelectedConversationId(undefined) // Clear selection
    // Update URL to remove conversation ID
    router.push('/dashboard/messages')
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Chat List - Hidden on mobile when chat is open */}
      <div className={`w-full md:w-80 border-r overflow-y-auto ${
        showMobileChat ? 'hidden md:block' : 'block'
      }`}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-semibold">Messages</h1>
            <ConnectionStatus showReconnectButton={true} />
          </div>
          <p className="text-sm text-gray-600">Real-time messaging status</p>
        </div>
        <MessageThreadsList
          onSelectConversation={handleSelectConversation}
          selectedConversationId={selectedConversationId}
        />
      </div>
      
      {/* Chat Window - Takes full width on mobile */}
      <div className={`w-full md:flex-1 ${
        showMobileChat ? 'flex flex-col' : 'hidden md:flex md:items-center md:justify-center'
      }`}>
        {selectedConversationId ? (
          <ChatWindow 
            conversationId={selectedConversationId} 
            onBackToList={handleBackToList}
          />
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-gray-500">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  )
} 