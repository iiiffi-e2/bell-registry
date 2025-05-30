'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface SSEMessage {
  type: string
  data?: any
  conversationId?: string
}

let eventSource: EventSource | null = null
let messageHandlers = new Set<(message: SSEMessage) => void>()

export function useSSE() {
  const { data: session } = useSession()
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<SSEMessage | null>(null)

  const addMessageHandler = useCallback((handler: (message: SSEMessage) => void) => {
    messageHandlers.add(handler)
    return () => messageHandlers.delete(handler)
  }, [])

  useEffect(() => {
    if (!session?.user) return

    if (!eventSource) {
      eventSource = new EventSource('/api/sse')

      eventSource.onopen = () => {
        console.log('SSE connection opened')
        setIsConnected(true)
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as SSEMessage
          
          if (data.type === 'heartbeat') {
            return // Ignore heartbeat messages
          }

          setLastMessage(data)
          
          // Notify all handlers
          messageHandlers.forEach(handler => handler(data))
        } catch (error) {
          console.error('Error parsing SSE message:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error)
        setIsConnected(false)
      }
    }

    return () => {
      // Don't close connection on component unmount, keep it persistent
    }
  }, [session])

  // Cleanup on session end
  useEffect(() => {
    if (!session?.user && eventSource) {
      eventSource.close()
      eventSource = null
      setIsConnected(false)
      messageHandlers.clear()
    }
  }, [session])

  return {
    isConnected,
    lastMessage,
    addMessageHandler,
  }
} 