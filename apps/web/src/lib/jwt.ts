import { SignJWT, jwtVerify, JWTPayload } from 'jose';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'gt7-super-secret-key-change-in-production';
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

// Encode secret for jose
const getSecretKey = () => new TextEncoder().encode(JWT_SECRET);

export interface TokenPayload extends JWTPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin' | 'premium';
  type: 'access' | 'refresh';
}

export interface UserPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin' | 'premium';
}

/**
 * Generate an access token (short-lived)
 */
export async function generateAccessToken(payload: UserPayload): Promise<string> {
  const token = await new SignJWT({
    ...payload,
    type: 'access',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .setIssuer('gt7-saas')
    .setSubject(payload.userId)
    .sign(getSecretKey());

  return token;
}

/**
 * Generate a refresh token (long-lived)
 */
export async function generateRefreshToken(payload: UserPayload): Promise<string> {
  const token = await new SignJWT({
    ...payload,
    type: 'refresh',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .setIssuer('gt7-saas')
    .setSubject(payload.userId)
    .sign(getSecretKey());

  return token;
}

/**
 * Generate both access and refresh tokens
 */
export async function generateTokenPair(payload: UserPayload): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(payload),
    generateRefreshToken(payload),
  ]);

  return { accessToken, refreshToken };
}

/**
 * Verify and decode an access token
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: 'gt7-saas',
    });

    // Ensure it's an access token
    if ((payload as TokenPayload).type !== 'access') {
      return null;
    }

    return payload as TokenPayload;
  } catch (error) {
    console.error('Access token verification failed:', error);
    return null;
  }
}

/**
 * Verify and decode a refresh token
 */
export async function verifyRefreshToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: 'gt7-saas',
    });

    // Ensure it's a refresh token
    if ((payload as TokenPayload).type !== 'refresh') {
      return null;
    }

    return payload as TokenPayload;
  } catch (error) {
    console.error('Refresh token verification failed:', error);
    return null;
  }
}

/**
 * Decode token without verification (for debugging/logging)
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf-8')
    );

    return payload as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;

  return decoded.exp * 1000 < Date.now();
}

/**
 * Cookie options for secure token storage
 */
export const ACCESS_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 15 * 60, // 15 minutes in seconds
  path: '/',
};

export const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  path: '/',
};
