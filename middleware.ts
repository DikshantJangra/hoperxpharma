import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check for logged_in cookie first (set by auth-store after successful auth)
  // This is the most reliable indicator of authentication state
  const loggedInCookie = request.cookies.get('logged_in')?.value;

  // Also check for tokens as fallback
  const token = request.cookies.get('token')?.value ||
    request.cookies.get('refreshToken')?.value ||
    request.headers.get('Authorization')?.replace('Bearer ', '');

  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/forgot-password', '/', '/auth/callback', '/verify-magic-link', '/auth/verify-magic-link', '/magic-link'];
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.') || pathname.startsWith('/setup'));

  // If user is on a public route
  if (isPublicRoute) {
    // If user has logged_in cookie and tries to access login/signup, redirect to dashboard
    if (loggedInCookie && (pathname === '/login' || pathname === '/signup' || pathname === '/')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // Protected routes - require authentication
  // Prioritize logged_in cookie, but allow token as fallback for initial auth
  if (!loggedInCookie && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
