'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  useUserStore,
  useUser,
  useIsAuthenticated,
  useAuthLoading,
  useAuthError,
  useIsInitialized,
  useHasPremium,
  UserProfile,
} from '@/lib/stores/userStore';

// Token refresh interval (14 minutes - slightly less than 15 min token expiry)
const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000;

interface UseAuthOptions {
  /**
   * Redirect to login if not authenticated
   */
  requireAuth?: boolean;
  /**
   * Redirect to dashboard if already authenticated (for login/register pages)
   */
  redirectIfAuthenticated?: boolean;
  /**
   * Custom redirect path after login
   */
  redirectTo?: string;
}

interface UseAuthReturn {
  // User data
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  hasPremium: boolean;

  // Actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<boolean>;
  refreshAuth: () => Promise<boolean>;
  clearError: () => void;
}

/**
 * Custom hook for authentication management
 * Handles token refresh, auth state initialization, and redirects
 */
export function useAuth(options: UseAuthOptions = {}): UseAuthReturn {
  const { requireAuth = false, redirectIfAuthenticated = false, redirectTo } = options;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Store state
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthLoading();
  const isInitialized = useIsInitialized();
  const error = useAuthError();
  const hasPremium = useHasPremium();

  // Store actions
  const {
    login: storeLogin,
    register: storeRegister,
    logout: storeLogout,
    fetchCurrentUser,
    refreshAuth: storeRefreshAuth,
    setError,
    setInitialized,
  } = useUserStore();

  // Refs for interval cleanup
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializingRef = useRef(false);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      // Prevent double initialization
      if (isInitializingRef.current || isInitialized) return;
      isInitializingRef.current = true;

      try {
        // Try to fetch current user to validate tokens
        await fetchCurrentUser();
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setInitialized(true);
        isInitializingRef.current = false;
      }
    };

    initAuth();
  }, [fetchCurrentUser, setInitialized, isInitialized]);

  // Setup token refresh interval
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear interval if not authenticated
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      return;
    }

    // Setup refresh interval
    refreshIntervalRef.current = setInterval(async () => {
      const success = await storeRefreshAuth();
      if (!success) {
        // Token refresh failed, redirect to login
        router.push('/login?expired=true');
      }
    }, TOKEN_REFRESH_INTERVAL);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [isAuthenticated, storeRefreshAuth, router]);

  // Handle requireAuth redirect
  useEffect(() => {
    if (!isInitialized || isLoading) return;

    if (requireAuth && !isAuthenticated) {
      const currentPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [requireAuth, isAuthenticated, isInitialized, isLoading, pathname, searchParams, router]);

  // Handle redirectIfAuthenticated
  useEffect(() => {
    if (!isInitialized || isLoading) return;

    if (redirectIfAuthenticated && isAuthenticated) {
      const redirect = searchParams?.get('redirect') || redirectTo || '/dashboard';
      router.push(redirect);
    }
  }, [redirectIfAuthenticated, isAuthenticated, isInitialized, isLoading, searchParams, redirectTo, router]);

  // Login with redirect handling
  const login = useCallback(
    async (email: string, password: string) => {
      const result = await storeLogin(email, password);

      if (result.success) {
        // Get redirect from URL or use default
        const redirect = searchParams?.get('redirect') || redirectTo || '/dashboard';
        router.push(redirect);
      }

      return result;
    },
    [storeLogin, searchParams, redirectTo, router]
  );

  // Register with redirect handling
  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const result = await storeRegister(name, email, password);

      if (result.success) {
        // Redirect to dashboard after registration
        const redirect = redirectTo || '/dashboard';
        router.push(redirect);
      }

      return result;
    },
    [storeRegister, redirectTo, router]
  );

  // Logout with redirect
  const logout = useCallback(async () => {
    await storeLogout();
    router.push('/login');
  }, [storeLogout, router]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    return await fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Refresh auth tokens
  const refreshAuth = useCallback(async () => {
    return await storeRefreshAuth();
  }, [storeRefreshAuth]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  return {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,
    hasPremium,
    login,
    register,
    logout,
    refreshUser,
    refreshAuth,
    clearError,
  };
}

/**
 * Hook for protected pages - redirects to login if not authenticated
 */
export function useRequireAuth(redirectTo: string = '/login'): UseAuthReturn {
  return useAuth({ requireAuth: true, redirectTo });
}

/**
 * Hook for auth pages (login/register) - redirects to dashboard if already authenticated
 */
export function useGuestOnly(): UseAuthReturn {
  return useAuth({ redirectIfAuthenticated: true });
}

/**
 * Hook to check if user has specific permission
 */
export function usePermission(permission: string): boolean {
  const user = useUser();

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
 * Hook for subscription-gated features
 */
export function useRequireSubscription(
  requiredPlan: 'premium' | 'pro' = 'premium',
  redirectTo: string = '/subscribe'
): UseAuthReturn & { hasAccess: boolean } {
  const authState = useRequireAuth();
  const router = useRouter();

  const hasAccess = authState.user?.subscription?.status === 'active' &&
    (authState.user?.subscription?.plan === requiredPlan ||
     authState.user?.subscription?.plan === 'pro');

  useEffect(() => {
    if (!authState.isLoading && authState.isAuthenticated && !hasAccess) {
      router.push(redirectTo);
    }
  }, [authState.isLoading, authState.isAuthenticated, hasAccess, router, redirectTo]);

  return { ...authState, hasAccess };
}

export default useAuth;
