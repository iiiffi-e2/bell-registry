'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { MessageCircle } from 'lucide-react'
import { useSSE } from '@/hooks/useSSE'

export function NotificationBadge() {
  const { addMessageHandler } = useSSE()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Fetch initial unread count
    fetchUnreadCount()

    // Listen for new message notifications via SSE
    const unsubscribe = addMessageHandler((data) => {
      if (data.type === 'new-message') {
        setUnreadCount(prev => prev + 1)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [addMessageHandler])

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/messages/unread-count')
      if (response.ok) {
        const { count } = await response.json()
        setUnreadCount(count)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  return (
    <div className="relative">
      <MessageCircle className="h-6 w-6" />
      {unreadCount > 0 && (
        <Badge 
          className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center"
          variant="destructive"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}
    </div>
  )
} 