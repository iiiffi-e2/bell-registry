// Store active SSE connections
const connections = new Map<string, ReadableStreamDefaultController>()
const userConnections = new Map<string, Set<string>>()

// Function to register a new connection
export function registerSSEConnection(userId: string, controller: ReadableStreamDefaultController): string {
  const connectionId = Math.random().toString(36).substring(7)
  
  // Store connection
  connections.set(connectionId, controller)
  
  // Associate user with connection
  if (!userConnections.has(userId)) {
    userConnections.set(userId, new Set())
  }
  userConnections.get(userId)!.add(connectionId)
  
  return connectionId
}

// Function to remove a connection
export function removeSSEConnection(userId: string, connectionId: string) {
  connections.delete(connectionId)
  
  const userConns = userConnections.get(userId)
  if (userConns) {
    userConns.delete(connectionId)
    if (userConns.size === 0) {
      userConnections.delete(userId)
    }
  }
}

// Function to send messages to specific users
export function sendToUser(userId: string, data: any) {
  const userConns = userConnections.get(userId)
  if (userConns) {
    userConns.forEach(connectionId => {
      const controller = connections.get(connectionId)
      if (controller) {
        try {
          controller.enqueue(`data: ${JSON.stringify(data)}\n\n`)
        } catch (error) {
          // Connection closed, remove it
          connections.delete(connectionId)
          userConns.delete(connectionId)
        }
      }
    })
  }
}

// Function to send messages to conversation participants
export function sendToConversation(conversationId: string, participantIds: string[], data: any) {
  participantIds.forEach(userId => {
    sendToUser(userId, { ...data, conversationId })
  })
} 