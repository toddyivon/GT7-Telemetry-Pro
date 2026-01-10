import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, validatePasswordStrength, isWeakPassword } from '../../../../lib/password';
import { generateTokenPair, ACCESS_TOKEN_COOKIE_OPTIONS, REFRESH_TOKEN_COOKIE_OPTIONS } from '../../../../lib/jwt';
import { convexClient, api } from '../../../../lib/convex-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate name length
    if (name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { error: 'Name must be between 2 and 100 characters' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.errors[0] },
        { status: 400 }
      );
    }

    // Check for weak passwords
    if (isWeakPassword(password)) {
      return NextResponse.json(
        { error: 'This password is too common. Please choose a stronger password.' },
        { status: 400 }
      );
    }

    // Check if Convex client is available
    if (!convexClient) {
      // Fallback for development without Convex
      console.warn('Convex not available, using mock registration');

      const passwordHash = await hashPassword(password);
      const mockUser = {
        _id: `user_${Date.now()}`,
        email: email.toLowerCase(),
        name,
        role: 'user' as const,
        createdAt: Date.now(),
        isActive: true,
        subscription: { plan: 'free' as const, status: 'active' as const },
      };

      const tokens = await generateTokenPair({
        userId: mockUser._id,
        email: mockUser.email,
        role: mockUser.role,
      });

      const response = NextResponse.json({
        user: mockUser,
        message: 'Registration successful',
      });

      // Set cookies
      response.cookies.set('access_token', tokens.accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
      response.cookies.set('refresh_token', tokens.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

      return response;
    }

    // Check if user already exists
    const existingUser = await convexClient.query(api.users.getUserByEmail, {
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash the password
    const passwordHash = await hashPassword(password);

    // Create the user in Convex
    const user = await convexClient.mutation(api.users.createUserWithPassword, {
      email: email.toLowerCase(),
      name,
      passwordHash,
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

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

    // Create response with user data
    const response = NextResponse.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        subscription: user.subscription,
        avatar: user.avatar,
      },
      message: 'Registration successful',
    });

    // Set HTTP-only cookies
    response.cookies.set('access_token', tokens.accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
    response.cookies.set('refresh_token', tokens.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

    return response;
  } catch (error) {
    console.error('Registration error:', error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
