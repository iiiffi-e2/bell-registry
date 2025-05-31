'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useSSE } from '@/hooks/useSSE'

export function MessagesMenuBadge() {
  const { addMessageHandler } = useSSE()
  const [hasUnread, setHasUnread] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // Fetch initial unread count
    fetchUnreadCount()

    // Listen for new message notifications via SSE
    const unsubscribe = addMessageHandler((data) => {
      if (data.type === 'new-message') {
        setHasUnread(true)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [addMessageHandler])

  // Clear the badge when user visits the messages page
  useEffect(() => {
    if (pathname === '/dashboard/messages') {
      setHasUnread(false)
    }
  }, [pathname])

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/messages/unread-count')
      if (response.ok) {
        const { count } = await response.json()
        setHasUnread(count > 0)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  if (!hasUnread) {
    return null
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 ml-2">
      New
    </span>
  )
} 