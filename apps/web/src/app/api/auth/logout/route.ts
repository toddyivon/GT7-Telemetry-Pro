import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '../../../../lib/jwt';
import { convexClient, api } from '../../../../lib/convex-server';
import { Id } from '../../../../convex/_generated/dataModel';

export async function POST(request: NextRequest) {
  try {
    // Get access token from cookies
    const accessToken = request.cookies.get('access_token')?.value;

    // If we have a valid token, clear the refresh token in the database
    if (accessToken && convexClient) {
      const payload = await verifyAccessToken(accessToken);
      if (payload) {
        try {
          await convexClient.mutation(api.users.clearRefreshToken, {
            userId: payload.userId as Id<"users">,
          });
        } catch (error) {
          // Ignore errors when clearing refresh token
          console.warn('Failed to clear refresh token:', error);
        }
      }
    }

    // Create response
    const response = NextResponse.json({
      message: 'Logged out successfully',
    });

    // Clear all auth cookies
    response.cookies.set('access_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    response.cookies.set('refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    // Also clear the legacy auth_token cookie if it exists
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);

    // Even if there's an error, still clear cookies
    const response = NextResponse.json({
      message: 'Logged out',
    });

    response.cookies.set('access_token', '', { maxAge: 0, path: '/' });
    response.cookies.set('refresh_token', '', { maxAge: 0, path: '/' });
    response.cookies.set('auth_token', '', { maxAge: 0, path: '/' });

    return response;
  }
}

// Also support GET for simple logout links
export async function GET(request: NextRequest) {
  return POST(request);
}
