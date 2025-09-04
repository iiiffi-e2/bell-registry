'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'

interface SSEMessage {
  type: string
  data?: any
  conversationId?: string
}

let eventSource: EventSource | null = null
let messageHandlers = new Set<(message: SSEMessage) => void>()
let reconnectAttempts = 0
let reconnectTimeout: NodeJS.Timeout | null = null

export function useSSE() {
  const { data: session } = useSession()
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<SSEMessage | null>(null)
  const reconnectAttemptsRef = useRef(0)

  const addMessageHandler = useCallback((handler: (message: SSEMessage) => void) => {
    messageHandlers.add(handler)
    return () => messageHandlers.delete(handler)
  }, [])

  const connectSSE = useCallback(() => {
    if (!session?.user) return

    // Clear any existing timeout
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }

    // Close existing connection
    if (eventSource) {
      eventSource.close()
    }

    eventSource = new EventSource('/api/sse')

    eventSource.onopen = () => {
      setIsConnected(true)
      reconnectAttemptsRef.current = 0 // Reset on successful connection
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as SSEMessage
        
        if (data.type === 'heartbeat') {
          return // Ignore heartbeat messages
        }

        if (data.type === 'connected') {
          return
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
      
      // Attempt to reconnect with exponential backoff
      const maxReconnectAttempts = 10
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000) // Max 30 seconds
        reconnectAttemptsRef.current++
        
        
        reconnectTimeout = setTimeout(() => {
          connectSSE()
        }, delay)
      } else {
      }
    }
  }, [session])

  useEffect(() => {
    if (session?.user) {
      connectSSE()
    }

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
      // Don't close connection on component unmount, keep it persistent
    }
  }, [session, connectSSE])

  // Cleanup on session end
  useEffect(() => {
    if (!session?.user && eventSource) {
      eventSource.close()
      eventSource = null
      setIsConnected(false)
      messageHandlers.clear()
      reconnectAttemptsRef.current = 0
      
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
        reconnectTimeout = null
      }
    }
  }, [session])

  // Force reconnection function (can be used by components if needed)
  const forceReconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0
    connectSSE()
  }, [connectSSE])

  return {
    isConnected,
    lastMessage,
    addMessageHandler,
    forceReconnect,
  }
} 