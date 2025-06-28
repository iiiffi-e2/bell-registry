import { NextResponse } from "next/server";
import type { NextRequest } from 'next/server';
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/jobs',
    '/candidates',
    '/auth/signin', 
    '/auth/signup',
    '/auth/error',
    '/auth/verify-request',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/account-suspended', // Add suspension page to public routes
  ];

  // Check if it's a public route (including dynamic job routes)
  const isPublicRoute = publicRoutes.some(route => pathname === route) || 
                       pathname.startsWith('/jobs/') ||
                       pathname.startsWith('/candidates/');

  // Add dynamic header for API routes
  if (pathname.startsWith('/api/')) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-middleware-cache', 'no-cache');
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Check for authentication
  const token = await getToken({ req: request });
  if (!token && !isPublicRoute) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // Check for suspension (only for authenticated users)
  if (token) {
    // Note: We can't directly check isSuspended from JWT token since it's not stored there
    // The suspension check will be handled by the auth callbacks and session updates
    // If a user gets suspended, they'll be signed out on their next request that requires auth
  }

  return NextResponse.next();
}

// Only match specific protected routes
export const config = {
  matcher: [
    /*
     * Match all protected routes:
     * - /dashboard/*
     * - /profile/*
     * - /browse-professionals/*
     * - /api/* (except /api/auth/* and /api/socket)
     */
    '/dashboard/:path*',
    '/profile/:path*',
    '/browse-professionals/:path*',
    '/api/((?!auth|socket).*)',
  ]
} 