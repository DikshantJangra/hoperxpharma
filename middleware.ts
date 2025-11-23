import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get token from cookies (httpOnly) or header
  // We check for 'token' (access token) OR 'refreshToken' (httpOnly cookie) OR 'logged_in' (client hint)
  const token = request.cookies.get('token')?.value ||
    request.cookies.get('refreshToken')?.value ||
    request.cookies.get('logged_in')?.value ||
    request.headers.get('Authorization')?.replace('Bearer ', '');
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/forgot-password', '/'];
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.'));

  // If user is on a public route
  if (isPublicRoute) {
    // If user has token and tries to access login/signup, redirect to dashboard
    if (token && (pathname === '/login' || pathname === '/signup' || pathname === '/')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // Protected routes - require authentication
  if (!token) {
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
