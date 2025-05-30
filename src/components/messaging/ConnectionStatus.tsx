'use client'

import { useSSE } from '@/hooks/useSSE'
import { Badge } from '@/components/ui/badge'

export function ConnectionStatus() {
  const { isConnected } = useSSE()

  return (
    <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
      {isConnected ? "Connected" : "Connecting..."}
    </Badge>
  )
} 