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

  return NextResponse.next();
}

// Only match specific protected routes
export const config = {
  matcher: [
    /*
     * Match all protected routes:
     * - /dashboard/*
     * - /profile/*
     * - /api/* (except /api/auth/* and /api/socket)
     */
    '/dashboard/:path*',
    '/profile/:path*',
    '/api/((?!auth|socket).*)',
  ]
} 