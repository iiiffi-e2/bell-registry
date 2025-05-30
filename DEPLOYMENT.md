# Deployment Guide

## Real-Time Messaging Implementation

This application uses **Server-Sent Events (SSE)** for real-time messaging instead of WebSockets/Socket.IO to ensure compatibility with Vercel's serverless deployment model.

### Architecture

- **SSE Endpoint**: `/api/sse` - Maintains persistent HTTP connections for real-time updates
- **Message API**: `/api/messages/send` - Sends messages and triggers SSE notifications
- **Client Hook**: `useSSE()` - React hook for managing SSE connections with auto-reconnection

### Key Features

1. **Vercel Compatible**: Works with serverless functions (no custom server required)
2. **Automatic Reconnection**: SSE connections automatically reconnect with exponential backoff
3. **Role-Based Messaging**: Enforces client-initiated conversations with professional replies
4. **Real-Time Updates**: Instant message delivery without page refresh
5. **Connection Monitoring**: Visual connection status with manual reconnection option
6. **Error Handling**: Graceful degradation when connections fail

### Connection Management

#### Auto-Reconnection Strategy
- **Initial reconnection**: 1 second delay
- **Exponential backoff**: Doubles delay with each failed attempt (max 30 seconds)
- **Max attempts**: 10 reconnection attempts before giving up
- **Heartbeat**: 15-second intervals to maintain connection health

#### Connection States
- **Connected**: Real-time messaging active
- **Reconnecting**: Attempting to restore connection
- **Disconnected**: Manual reconnection required

### Development vs Production

- **Development**: Uses standard Next.js (`next dev`) with SSE for real-time messaging
- **Production**: Uses standard Next.js (`next start`) with SSE for Vercel deployment

### Vercel Considerations

#### Function Limits
- **Hobby Plan**: 10-second execution limit
- **Pro Plan**: 60-second execution limit
- **Automatic Reconnection**: Handles timeout-induced disconnections gracefully

#### Headers Optimization
```
Cache-Control: no-cache, no-store, must-revalidate
Connection: keep-alive
X-Accel-Buffering: no
```

### Environment Variables

Ensure these are set in your Vercel deployment:

```
DATABASE_URL=your_database_url
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your_secret
```

### Testing SSE Connection

1. **Test Page**: Visit `/test-sse` to verify the SSE connection is working properly
2. **Messages Page**: Connection status displayed in real-time in `/dashboard/messages`
3. **Console Logs**: Monitor browser console for connection events and errors

### Troubleshooting

#### Common Issues

1. **Connection Errors**: Normal in serverless environments; auto-reconnection handles this
2. **Frequent Disconnections**: Check Vercel function limits and upgrade plan if needed
3. **No Real-Time Updates**: Verify SSE connection status and use manual reconnect if needed

#### Monitoring

- Connection status badge shows current state
- Browser console logs connection attempts and errors
- Force reconnect button available in UI for manual recovery

### Deployment Steps

1. Push code to your repository
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push

The SSE implementation ensures real-time messaging works seamlessly on Vercel without requiring WebSocket support, with robust error handling and automatic recovery. 