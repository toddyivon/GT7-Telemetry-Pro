import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// User profile interface matching our auth system
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin' | 'premium';
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
  createdAt?: number;
  lastLogin?: number;
}

// Authentication state interface
interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

// Authentication actions interface
interface AuthActions {
  // Core auth actions
  setUser: (user: UserProfile) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;

  // Profile update actions
  updateProfile: (updates: Partial<UserProfile>) => void;
  updateSubscription: (subscription: UserProfile['subscription']) => void;
  updatePreferences: (preferences: Partial<NonNullable<UserProfile['preferences']>>) => void;
  updateStats: (stats: Partial<NonNullable<UserProfile['stats']>>) => void;

  // Auth flow actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  fetchCurrentUser: () => Promise<boolean>;
}

type UserStore = AuthState & AuthActions;

// Create the store with persistence
export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      error: null,

      // Core auth actions
      setUser: (user: UserProfile) =>
        set({
          user,
          isAuthenticated: true,
          error: null,
        }),

      clearUser: () =>
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        }),

      setLoading: (isLoading: boolean) => set({ isLoading }),

      setError: (error: string | null) => set({ error }),

      setInitialized: (isInitialized: boolean) => set({ isInitialized }),

      // Profile update actions
      updateProfile: (updates: Partial<UserProfile>) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      updateSubscription: (subscription: UserProfile['subscription']) =>
        set((state) => ({
          user: state.user ? { ...state.user, subscription } : null,
        })),

      updatePreferences: (preferences: Partial<NonNullable<UserProfile['preferences']>>) =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                preferences: {
                  theme: 'dark',
                  units: 'metric',
                  notifications: true,
                  privacy: { shareData: false, publicProfile: true },
                  ...state.user.preferences,
                  ...preferences,
                },
              }
            : null,
        })),

      updateStats: (stats: Partial<NonNullable<UserProfile['stats']>>) =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                stats: {
                  totalSessions: 0,
                  totalLaps: 0,
                  totalDistance: 0,
                  ...state.user.stats,
                  ...stats,
                },
              }
            : null,
        })),

      // Login action
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include',
          });

          const data = await response.json();

          if (!response.ok) {
            set({ isLoading: false, error: data.error || 'Login failed' });
            return { success: false, error: data.error || 'Login failed' };
          }

          // Transform the user data
          const user: UserProfile = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            role: data.user.role,
            avatar: data.user.avatar,
            subscription: data.user.subscription,
            preferences: data.user.preferences,
            stats: data.user.stats,
          };

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
            error: null,
          });

          return { success: true };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      // Register action
      register: async (name: string, email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
            credentials: 'include',
          });

          const data = await response.json();

          if (!response.ok) {
            set({ isLoading: false, error: data.error || 'Registration failed' });
            return { success: false, error: data.error || 'Registration failed' };
          }

          // Transform the user data
          const user: UserProfile = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            role: data.user.role,
            avatar: data.user.avatar,
            subscription: data.user.subscription,
          };

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
            error: null,
          });

          return { success: true };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Registration failed';
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      // Logout action
      logout: async () => {
        set({ isLoading: true });

        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
          });
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      // Refresh auth (silent token refresh)
      refreshAuth: async () => {
        try {
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include',
          });

          if (!response.ok) {
            // Token refresh failed, clear auth state
            set({
              user: null,
              isAuthenticated: false,
              isInitialized: true,
            });
            return false;
          }

          const data = await response.json();

          // Update user if returned
          if (data.user) {
            set((state) => ({
              user: state.user
                ? { ...state.user, ...data.user }
                : {
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.name,
                    role: data.user.role,
                    subscription: data.user.subscription,
                  },
              isAuthenticated: true,
            }));
          }

          return true;
        } catch (error) {
          console.error('Token refresh error:', error);
          return false;
        }
      },

      // Fetch current user from API
      fetchCurrentUser: async () => {
        set({ isLoading: true });

        try {
          const response = await fetch('/api/auth/me', {
            credentials: 'include',
          });

          if (!response.ok) {
            // Not authenticated
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              isInitialized: true,
            });
            return false;
          }

          const data = await response.json();

          const user: UserProfile = {
            id: data.id,
            email: data.email,
            name: data.name,
            role: data.role,
            avatar: data.avatar,
            subscription: data.subscription,
            preferences: data.preferences,
            stats: data.stats,
            createdAt: data.createdAt,
            lastLogin: data.lastLogin,
          };

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
            error: null,
          });

          return true;
        } catch (error) {
          console.error('Fetch user error:', error);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
          });
          return false;
        }
      },
    }),
    {
      name: 'gt7-user-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      // Don't rehydrate if tokens might be invalid
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Mark as needing initialization check
          state.isInitialized = false;
        }
      },
    }
  )
);

// Selector hooks for specific parts of state
export const useUser = () => useUserStore((state) => state.user);
export const useIsAuthenticated = () => useUserStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useUserStore((state) => state.isLoading);
export const useAuthError = () => useUserStore((state) => state.error);
export const useIsInitialized = () => useUserStore((state) => state.isInitialized);

// Helper to check subscription
export const useHasPremium = () =>
  useUserStore((state) => {
    if (!state.user) return false;
    return state.user.role === 'premium' || state.user.role === 'admin';
  });

// Helper to get subscription status
export const useSubscriptionStatus = () =>
  useUserStore((state) => state.user?.subscription?.status ?? null);
