import { NextRequest } from 'next/server';
import { verifyAccessToken, TokenPayload } from './jwt';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'premium';
  avatar?: string;
  subscription?: {
    plan: 'free' | 'premium' | 'pro';
    status: 'active' | 'canceled' | 'expired';
    expiresAt?: number;
  };
  preferences?: {
    theme: 'light' | 'dark';
    units: 'metric' | 'imperial';
    notifications: boolean;
    privacy: {
      shareData: boolean;
      publicProfile: boolean;
    };
  };
  stats?: {
    totalSessions: number;
    totalLaps: number;
    totalDistance: number;
    bestLapTime?: number;
    favoriteTrack?: string;
  };
}

// Demo user for development
const DEMO_USER: User = {
  id: 'demo_user_missola',
  email: 'missola@test.com',
  name: 'Missola',
  role: 'premium',
  subscription: {
    plan: 'premium',
    status: 'active',
  },
};

/**
 * Get the current user from the request
 * Checks JWT access token and legacy demo tokens
 */
export async function getCurrentUser(request: NextRequest): Promise<User | null> {
  // Try to get JWT access token first
  const accessToken = request.cookies.get('access_token')?.value;

  if (accessToken) {
    const payload = await verifyAccessToken(accessToken);
    if (payload) {
      return {
        id: payload.userId,
        email: payload.email,
        name: 'User', // Name will be fetched from DB if needed
        role: payload.role,
      };
    }
  }

  // Fallback to legacy auth_token for backwards compatibility
  const legacyToken = request.cookies.get('auth_token')?.value;

  if (legacyToken) {
    // Handle demo tokens
    if (legacyToken === 'demo_token_missola') {
      return DEMO_USER;
    }

    if (legacyToken.startsWith('demo_token_')) {
      const userId = legacyToken.replace('demo_token_', '');
      return {
        id: userId,
        email: `${userId}@test.com`,
        name: 'Demo User',
        role: 'premium',
        subscription: {
          plan: 'premium',
          status: 'active',
        },
      };
    }
  }

  return null;
}

/**
 * Get the token payload from request (for middleware)
 */
export async function getTokenPayload(request: NextRequest): Promise<TokenPayload | null> {
  const accessToken = request.cookies.get('access_token')?.value;

  if (!accessToken) {
    return null;
  }

  return verifyAccessToken(accessToken);
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false;

  switch (permission) {
    case 'view_analytics':
    case 'record_laps':
    case 'export_data':
    case 'advanced_analysis':
      return user.role === 'premium' || user.role === 'admin';
    case 'admin_panel':
      return user.role === 'admin';
    case 'basic_access':
      return true;
    default:
      return true;
  }
}

/**
 * Check if user has premium access
 */
export function hasPremiumAccess(user: User | null): boolean {
  if (!user) return false;
  return user.role === 'premium' || user.role === 'admin';
}

/**
 * Check if user's subscription is active
 */
export function hasActiveSubscription(user: User | null): boolean {
  if (!user) return false;

  // Admin always has access
  if (user.role === 'admin') return true;

  // Check subscription status
  if (!user.subscription) return false;
  if (user.subscription.status !== 'active') return false;

  // Check expiration
  if (user.subscription.expiresAt && user.subscription.expiresAt < Date.now()) {
    return false;
  }

  return true;
}

/**
 * Authentication error types
 */
export enum AuthError {
  NOT_AUTHENTICATED = 'NOT_AUTHENTICATED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
}

/**
 * Create auth error response
 */
export function createAuthError(error: AuthError): { error: string; code: AuthError } {
  const messages: Record<AuthError, string> = {
    [AuthError.NOT_AUTHENTICATED]: 'Authentication required',
    [AuthError.INVALID_TOKEN]: 'Invalid authentication token',
    [AuthError.TOKEN_EXPIRED]: 'Session has expired. Please log in again.',
    [AuthError.ACCOUNT_LOCKED]: 'Account is temporarily locked',
    [AuthError.ACCOUNT_DISABLED]: 'Account has been disabled',
    [AuthError.INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions for this action',
  };

  return {
    error: messages[error],
    code: error,
  };
}
