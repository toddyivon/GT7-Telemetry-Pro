import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '../../../../lib/jwt';
import { convexClient, api } from '../../../../lib/convex-server';
import { Id } from '../../../../convex/_generated/dataModel';

// Demo user for development when Convex is not available
const DEMO_USER = {
  id: 'demo_user_missola',
  email: 'missola@test.com',
  name: 'Missola',
  role: 'premium' as const,
  subscription: {
    plan: 'premium' as const,
    status: 'active' as const,
  },
};

export async function GET(request: NextRequest) {
  try {
    // Get access token from cookies
    const accessToken = request.cookies.get('access_token')?.value;

    // Also check for legacy auth_token
    const legacyToken = request.cookies.get('auth_token')?.value;

    // Handle legacy demo tokens
    if (!accessToken && legacyToken) {
      if (legacyToken === 'demo_token_missola' || legacyToken.startsWith('demo_token_')) {
        return NextResponse.json(DEMO_USER);
      }
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify the access token
    const payload = await verifyAccessToken(accessToken);

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // If Convex is not available, return from token payload
    if (!convexClient) {
      return NextResponse.json({
        id: payload.userId,
        email: payload.email,
        role: payload.role,
        name: 'User',
        subscription: {
          plan: 'free',
          status: 'active',
        },
      });
    }

    // Get fresh user data from Convex
    const user = await convexClient.query(api.users.getUserById, {
      userId: payload.userId as Id<"users">,
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 403 }
      );
    }

    // Return user data
    return NextResponse.json({
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      subscription: user.subscription,
      preferences: user.preferences,
      stats: user.stats,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}
