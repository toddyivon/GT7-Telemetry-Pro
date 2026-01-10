import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken, verifyRefreshToken, isTokenExpired, decodeToken } from './lib/jwt';

// Public paths that don't require authentication
const publicPaths = [
  '/login',
  '/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/health',
  '/',
];

// Protected paths that require authentication
const protectedPaths = [
  '/dashboard',
  '/analysis',
  '/telemetry',
  '/record-lap',
  '/settings',
  '/subscribe',
];

// API paths that require authentication
const protectedApiPaths = [
  '/api/telemetry',
  '/api/analysis',
  '/api/stripe/create-checkout-session',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths without authentication
  if (publicPaths.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/public') ||
    pathname.includes('.') // Static files like favicon.ico
  ) {
    return NextResponse.next();
  }

  // Check if path requires authentication
  const requiresAuth =
    protectedPaths.some(path => pathname.startsWith(path)) ||
    protectedApiPaths.some(path => pathname.startsWith(path));

  if (!requiresAuth) {
    return NextResponse.next();
  }

  // Get tokens from cookies
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;
  const legacyToken = request.cookies.get('auth_token')?.value;

  // Handle legacy demo tokens for backwards compatibility
  if (!accessToken && legacyToken) {
    if (legacyToken === 'demo_token_missola' || legacyToken.startsWith('demo_token_')) {
      return NextResponse.next();
    }
  }

  // No tokens at all - redirect to login
  if (!accessToken && !refreshToken) {
    return redirectToLogin(request);
  }

  // Try to verify access token
  if (accessToken) {
    const payload = await verifyAccessToken(accessToken);
    if (payload) {
      // Token is valid, continue
      return NextResponse.next();
    }
  }

  // Access token is invalid or expired, try to refresh
  if (refreshToken) {
    const refreshPayload = await verifyRefreshToken(refreshToken);

    if (refreshPayload) {
      // Refresh token is valid, let the refresh endpoint handle token renewal
      // For API routes, return 401 so the client can refresh
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Token expired', code: 'TOKEN_EXPIRED' },
          { status: 401 }
        );
      }

      // For page routes, we could:
      // 1. Redirect to a refresh page that handles token refresh
      // 2. Or allow the request and let the client-side handle refresh
      // We'll allow it and let useAuth hook handle the refresh
      return NextResponse.next();
    }
  }

  // Both tokens are invalid
  return redirectToLogin(request);
}

function redirectToLogin(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;

  // For API routes, return 401 instead of redirect
  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'NOT_AUTHENTICATED' },
      { status: 401 }
    );
  }

  // Create login URL with redirect parameter
  const loginUrl = new URL('/login', request.url);

  // Store the intended destination for redirect after login
  if (pathname !== '/login' && pathname !== '/') {
    loginUrl.searchParams.set('redirect', `${pathname}${search}`);
  }

  const response = NextResponse.redirect(loginUrl);

  // Clear any invalid tokens
  response.cookies.set('access_token', '', { maxAge: 0, path: '/' });
  response.cookies.set('refresh_token', '', { maxAge: 0, path: '/' });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
