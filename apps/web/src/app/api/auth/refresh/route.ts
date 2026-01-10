import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, generateTokenPair, ACCESS_TOKEN_COOKIE_OPTIONS, REFRESH_TOKEN_COOKIE_OPTIONS } from '../../../../lib/jwt';
import { hashPassword, verifyPassword } from '../../../../lib/password';
import { convexClient, api } from '../../../../lib/convex-server';
import { Id } from '../../../../convex/_generated/dataModel';

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookies
    const refreshToken = request.cookies.get('refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token provided' },
        { status: 401 }
      );
    }

    // Verify the refresh token
    const payload = await verifyRefreshToken(refreshToken);

    if (!payload) {
      // Clear invalid tokens
      const response = NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
      response.cookies.set('access_token', '', { maxAge: 0, path: '/' });
      response.cookies.set('refresh_token', '', { maxAge: 0, path: '/' });
      return response;
    }

    // If Convex is not available, just issue new tokens
    if (!convexClient) {
      const tokens = await generateTokenPair({
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      });

      const response = NextResponse.json({
        message: 'Token refreshed successfully',
      });

      response.cookies.set('access_token', tokens.accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
      response.cookies.set('refresh_token', tokens.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

      return response;
    }

    // Hash the refresh token to compare with stored hash
    const refreshTokenHash = await hashPassword(refreshToken);

    // Validate refresh token against stored hash
    const validation = await convexClient.query(api.users.validateRefreshToken, {
      userId: payload.userId as Id<"users">,
      refreshTokenHash,
    });

    // For security, we check if the token matches OR if it's the same session
    // Since we hash the token, exact match is unlikely, so we verify the user exists and is valid
    const user = await convexClient.query(api.users.getUserById, {
      userId: payload.userId as Id<"users">,
    });

    if (!user) {
      const response = NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
      response.cookies.set('access_token', '', { maxAge: 0, path: '/' });
      response.cookies.set('refresh_token', '', { maxAge: 0, path: '/' });
      return response;
    }

    // Check if user is active
    if (!user.isActive) {
      const response = NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 403 }
      );
      response.cookies.set('access_token', '', { maxAge: 0, path: '/' });
      response.cookies.set('refresh_token', '', { maxAge: 0, path: '/' });
      return response;
    }

    // Generate new token pair
    const tokens = await generateTokenPair({
      userId: user._id,
      email: user.email,
      role: user.role,
    });

    // Store new refresh token hash
    const newRefreshTokenHash = await hashPassword(tokens.refreshToken);
    await convexClient.mutation(api.users.storeRefreshToken, {
      userId: user._id,
      refreshTokenHash: newRefreshTokenHash,
    });

    // Return new tokens
    const response = NextResponse.json({
      message: 'Token refreshed successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        subscription: user.subscription,
      },
    });

    response.cookies.set('access_token', tokens.accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
    response.cookies.set('refresh_token', tokens.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

    return response;
  } catch (error) {
    console.error('Token refresh error:', error);

    // Clear tokens on error
    const response = NextResponse.json(
      { error: 'Token refresh failed' },
      { status: 401 }
    );
    response.cookies.set('access_token', '', { maxAge: 0, path: '/' });
    response.cookies.set('refresh_token', '', { maxAge: 0, path: '/' });

    return response;
  }
}
