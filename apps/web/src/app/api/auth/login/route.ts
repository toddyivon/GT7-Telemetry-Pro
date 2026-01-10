import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, hashPassword } from '../../../../lib/password';
import { generateTokenPair, ACCESS_TOKEN_COOKIE_OPTIONS, REFRESH_TOKEN_COOKIE_OPTIONS } from '../../../../lib/jwt';
import { convexClient, api } from '../../../../lib/convex-server';

// Demo user for development (password: Master123!)
const DEMO_USER = {
  email: 'missola@test.com',
  passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X.vXoXqH4VQ9.wqli', // Master123!
  _id: 'demo_user_missola',
  name: 'Missola',
  role: 'premium' as const,
  subscription: {
    plan: 'premium' as const,
    status: 'active' as const,
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();

    // Check if Convex client is available
    if (!convexClient) {
      // Fallback for development without Convex
      console.warn('Convex not available, using mock authentication');

      // Check demo user
      if (normalizedEmail === DEMO_USER.email) {
        // For demo, accept both old password and new format
        const isValidPassword = password === 'master' ||
          password === 'Master123!' ||
          await verifyPassword(password, DEMO_USER.passwordHash);

        if (!isValidPassword) {
          return NextResponse.json(
            { error: 'Invalid email or password' },
            { status: 401 }
          );
        }

        const tokens = await generateTokenPair({
          userId: DEMO_USER._id,
          email: DEMO_USER.email,
          role: DEMO_USER.role,
        });

        const response = NextResponse.json({
          user: {
            id: DEMO_USER._id,
            email: DEMO_USER.email,
            name: DEMO_USER.name,
            role: DEMO_USER.role,
            subscription: DEMO_USER.subscription,
          },
          message: 'Login successful',
        });

        response.cookies.set('access_token', tokens.accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
        response.cookies.set('refresh_token', tokens.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

        return response;
      }

      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Get user from Convex with auth info
    const user = await convexClient.query(api.users.getUserForAuth, {
      email: normalizedEmail,
    });

    if (!user) {
      // Don't reveal that the user doesn't exist
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if account is locked
    if ('isLockedOut' in user && user.isLockedOut) {
      const remainingMinutes = Math.ceil((user.lockoutRemaining || 0) / 60000);
      return NextResponse.json(
        { error: `Account temporarily locked. Please try again in ${remainingMinutes} minutes.` },
        { status: 423 }
      );
    }

    // Check if account is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is deactivated. Please contact support.' },
        { status: 403 }
      );
    }

    // Check if password hash exists
    if (!user.passwordHash) {
      // Handle legacy users without password - check for demo credentials
      if (normalizedEmail === 'missola@test.com' && (password === 'master' || password === 'Master123!')) {
        // Migrate to hashed password
        const newPasswordHash = await hashPassword('Master123!');
        await convexClient.mutation(api.users.updatePassword, {
          userId: user._id,
          newPasswordHash,
        });
      } else {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }
    } else {
      // Verify password
      const isValidPassword = await verifyPassword(password, user.passwordHash);

      if (!isValidPassword) {
        // Record failed login attempt
        await convexClient.mutation(api.users.recordFailedLogin, {
          email: normalizedEmail,
        });

        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }
    }

    // Update last login timestamp
    await convexClient.mutation(api.users.updateLastLogin, {
      userId: user._id,
    });

    // Generate tokens
    const tokens = await generateTokenPair({
      userId: user._id,
      email: user.email,
      role: user.role,
    });

    // Hash refresh token and store it
    const refreshTokenHash = await hashPassword(tokens.refreshToken);
    await convexClient.mutation(api.users.storeRefreshToken, {
      userId: user._id,
      refreshTokenHash,
    });

    // Create response with user data (exclude sensitive fields)
    const response = NextResponse.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        subscription: user.subscription,
        avatar: user.avatar,
        preferences: user.preferences,
        stats: user.stats,
      },
      message: 'Login successful',
    });

    // Set HTTP-only cookies
    response.cookies.set('access_token', tokens.accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
    response.cookies.set('refresh_token', tokens.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
