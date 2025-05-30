# Deployment Guide

## Real-Time Messaging Implementation

This application uses **Server-Sent Events (SSE)** for real-time messaging instead of WebSockets/Socket.IO to ensure compatibility with Vercel's serverless deployment model.

### Architecture

- **SSE Endpoint**: `/api/sse` - Maintains persistent HTTP connections for real-time updates
- **Message API**: `/api/messages/send` - Sends messages and triggers SSE notifications
- **Client Hook**: `useSSE()` - React hook for managing SSE connections

### Key Features

1. **Vercel Compatible**: Works with serverless functions (no custom server required)
2. **Automatic Reconnection**: SSE connections automatically reconnect on failure
3. **Role-Based Messaging**: Enforces client-initiated conversations with professional replies
4. **Real-Time Updates**: Instant message delivery without page refresh

### Development vs Production

- **Development**: Uses custom server (`node server.js`) for Socket.IO fallback during development
- **Production**: Uses standard Next.js (`next start`) with SSE for Vercel deployment

### Environment Variables

Ensure these are set in your Vercel deployment:

```
DATABASE_URL=your_database_url
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your_secret
```

### Testing SSE Connection

Visit `/test-sse` to verify the SSE connection is working properly.

### Deployment Steps

1. Push code to your repository
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push

The SSE implementation ensures real-time messaging works seamlessly on Vercel without requiring WebSocket support. 