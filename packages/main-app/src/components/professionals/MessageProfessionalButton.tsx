'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'
import { UserRole } from '@/types'

interface MessageProfessionalButtonProps {
  professionalId: string
  className?: string
  dontContactMe?: boolean
}

interface MessagePermission {
  canMessage: boolean
  reason?: 'NO_ACTIVE_SUBSCRIPTION' | 'TRIAL_SUBSCRIPTION' | 'NO_ACTIVE_APPLICATION'
  subscriptionType?: string
}

export function MessageProfessionalButton({ professionalId, className, dontContactMe }: MessageProfessionalButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [permission, setPermission] = useState<MessagePermission | null>(null)
  const [checkingPermission, setCheckingPermission] = useState(true)

  useEffect(() => {
    async function checkPermission() {
      if (!session?.user?.id || (session.user.role !== UserRole.EMPLOYER && session.user.role !== UserRole.AGENCY)) {
        setCheckingPermission(false)
        return
      }

      try {
        const response = await fetch(`/api/messages/can-message?professionalId=${professionalId}`)
        if (response.ok) {
          const data = await response.json()
          setPermission(data)
        }
      } catch (error) {
        console.error('Error checking messaging permission:', error)
      } finally {
        setCheckingPermission(false)
      }
    }

    checkPermission()
  }, [session, professionalId])

  // Don't show if not an employer/agency
  if (!session || (session.user.role !== UserRole.EMPLOYER && session.user.role !== UserRole.AGENCY)) {
    return null
  }

  // Don't show if professional has disabled contact
  if (dontContactMe) {
    return null
  }

  // Don't show if checking permission
  if (checkingPermission) {
    return null
  }

  // Don't show if no permission to message
  if (!permission?.canMessage) {
    return null
  }

  const handleInitiateChat = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ professionalId })
      })

      if (response.ok) {
        const conversation = await response.json()
        router.push(`/dashboard/messages?conversation=${conversation.id}`)
      }
    } catch (error) {
      console.error('Error initiating conversation:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleInitiateChat} disabled={loading} className={className}>
      <MessageCircle className="mr-2 h-4 w-4" />
      {loading ? 'Starting...' : 'Message'}
    </Button>
  )
} 