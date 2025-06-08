'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'
import { UserRole } from '@/types'

interface MessageProfessionalButtonProps {
  professionalId: string
  className?: string
}

export function MessageProfessionalButton({ professionalId, className }: MessageProfessionalButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Only show for employers and agencies
  if (!session || (session.user.role !== UserRole.EMPLOYER && session.user.role !== UserRole.AGENCY)) {
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