import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { UserRole } from "@bell-registry/shared";

export async function middleware(req: NextRequest) {
  // Allow access to login page and API auth routes
  if (req.nextUrl.pathname.startsWith('/login') || 
      req.nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  try {
    // Get the token using our admin JWT secret
    const token = await getToken({ 
      req, 
      secret: process.env.ADMIN_JWT_SECRET 
    });

    // For all other routes, require admin role
    if (token?.role === UserRole.ADMIN) {
      return NextResponse.next();
    } else {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  } catch (error) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}; 