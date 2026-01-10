import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ===========================================
// AUTHENTICATION-RELATED FUNCTIONS
// ===========================================

// Get user by ID (excludes sensitive fields)
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }
    // Exclude sensitive fields
    const { passwordHash, refreshTokenHash, ...safeUser } = user;
    return safeUser;
  },
});

// Get user by email (for authentication - includes password hash)
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();
  },
});

// Get user for authentication (with password hash)
export const getUserForAuth = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (!user) return null;

    // Check if user is locked out
    if (user.lockoutUntil && user.lockoutUntil > Date.now()) {
      return {
        ...user,
        isLockedOut: true,
        lockoutRemaining: user.lockoutUntil - Date.now()
      };
    }

    return { ...user, isLockedOut: false };
  },
});

// Create a new user with password (for registration)
export const createUserWithPassword = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    passwordHash: v.string(),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.toLowerCase();

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const userId = await ctx.db.insert("users", {
      email: normalizedEmail,
      name: args.name,
      passwordHash: args.passwordHash,
      avatar: args.avatar,
      role: "user",
      createdAt: Date.now(),
      lastLogin: Date.now(),
      isActive: true,
      emailVerified: false,
      failedLoginAttempts: 0,
      subscription: {
        plan: "free",
        status: "active",
      },
      preferences: {
        theme: "dark",
        units: "metric",
        notifications: true,
        privacy: {
          shareData: false,
          publicProfile: true,
        },
      },
      stats: {
        totalSessions: 0,
        totalLaps: 0,
        totalDistance: 0,
      },
    });

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("Failed to create user");

    // Return safe user without password
    const { passwordHash, refreshTokenHash, ...safeUser } = user;
    return safeUser;
  },
});

// Update last login timestamp
export const updateLastLogin = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      lastLogin: Date.now(),
      failedLoginAttempts: 0,
      lockoutUntil: undefined,
    });
  },
});

// Record failed login attempt
export const recordFailedLogin = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (!user) return;

    const failedAttempts = (user.failedLoginAttempts || 0) + 1;
    const MAX_ATTEMPTS = 5;
    const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

    const updates: Record<string, unknown> = {
      failedLoginAttempts: failedAttempts,
    };

    // Lock account after max attempts
    if (failedAttempts >= MAX_ATTEMPTS) {
      updates.lockoutUntil = Date.now() + LOCKOUT_DURATION;
    }

    await ctx.db.patch(user._id, updates);
  },
});

// Store refresh token hash
export const storeRefreshToken = mutation({
  args: {
    userId: v.id("users"),
    refreshTokenHash: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      refreshTokenHash: args.refreshTokenHash,
    });
  },
});

// Validate refresh token hash
export const validateRefreshToken = query({
  args: {
    userId: v.id("users"),
    refreshTokenHash: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return { valid: false, user: null };

    if (user.refreshTokenHash !== args.refreshTokenHash) {
      return { valid: false, user: null };
    }

    // Return safe user
    const { passwordHash, refreshTokenHash, ...safeUser } = user;
    return { valid: true, user: safeUser };
  },
});

// Clear refresh token (logout)
export const clearRefreshToken = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      refreshTokenHash: undefined,
    });
  },
});

// ===========================================
// USER PROFILE FUNCTIONS
// ===========================================

// Create a new user (legacy - without password)
export const createUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    avatar: v.optional(v.string()),
    role: v.optional(v.union(v.literal('user'), v.literal('admin'), v.literal('premium'))),
    subscription: v.optional(v.object({
      plan: v.union(v.literal('free'), v.literal('premium'), v.literal('pro')),
      status: v.union(v.literal('active'), v.literal('canceled'), v.literal('expired')),
      expiresAt: v.optional(v.number()),
    })),
    preferences: v.optional(v.object({
      theme: v.union(v.literal('light'), v.literal('dark')),
      units: v.union(v.literal('metric'), v.literal('imperial')),
      notifications: v.boolean(),
      privacy: v.object({
        shareData: v.boolean(),
        publicProfile: v.boolean(),
      }),
    })),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.toLowerCase();

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const userId = await ctx.db.insert("users", {
      email: normalizedEmail,
      name: args.name,
      avatar: args.avatar,
      role: args.role || "user",
      createdAt: Date.now(),
      isActive: true,
      subscription: args.subscription || {
        plan: "free",
        status: "active",
      },
      preferences: args.preferences || {
        theme: "dark",
        units: "metric",
        notifications: true,
        privacy: {
          shareData: false,
          publicProfile: true,
        },
      },
      stats: {
        totalSessions: 0,
        totalLaps: 0,
        totalDistance: 0,
      },
    });

    return await ctx.db.get(userId);
  },
});

// Update user profile
export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
    role: v.optional(v.union(v.literal('user'), v.literal('admin'), v.literal('premium'))),
    isActive: v.optional(v.boolean()),
    subscription: v.optional(v.object({
      plan: v.union(v.literal('free'), v.literal('premium'), v.literal('pro')),
      status: v.union(v.literal('active'), v.literal('canceled'), v.literal('expired')),
      expiresAt: v.optional(v.number()),
    })),
    preferences: v.optional(v.object({
      theme: v.union(v.literal('light'), v.literal('dark')),
      units: v.union(v.literal('metric'), v.literal('imperial')),
      notifications: v.boolean(),
      privacy: v.object({
        shareData: v.boolean(),
        publicProfile: v.boolean(),
      }),
    })),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Filter out undefined values
    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    if (Object.keys(filteredUpdates).length > 0) {
      await ctx.db.patch(userId, filteredUpdates);
    }

    const updatedUser = await ctx.db.get(userId);
    if (!updatedUser) return null;

    // Return safe user
    const { passwordHash, refreshTokenHash, ...safeUser } = updatedUser;
    return safeUser;
  },
});

// Update password
export const updatePassword = mutation({
  args: {
    userId: v.id("users"),
    newPasswordHash: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.userId, {
      passwordHash: args.newPasswordHash,
      refreshTokenHash: undefined, // Invalidate all sessions
    });
  },
});

// Update user statistics
export const updateUserStats = mutation({
  args: {
    userId: v.id("users"),
    totalSessions: v.optional(v.number()),
    totalLaps: v.optional(v.number()),
    totalDistance: v.optional(v.number()),
    bestLapTime: v.optional(v.number()),
    favoriteTrack: v.optional(v.string()),
    incrementSessions: v.optional(v.number()),
    incrementLaps: v.optional(v.number()),
    incrementDistance: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const currentStats = user.stats || {
      totalSessions: 0,
      totalLaps: 0,
      totalDistance: 0,
    };

    const newStats = {
      totalSessions: args.totalSessions !== undefined
        ? args.totalSessions
        : currentStats.totalSessions + (args.incrementSessions || 0),
      totalLaps: args.totalLaps !== undefined
        ? args.totalLaps
        : currentStats.totalLaps + (args.incrementLaps || 0),
      totalDistance: args.totalDistance !== undefined
        ? args.totalDistance
        : currentStats.totalDistance + (args.incrementDistance || 0),
      bestLapTime: args.bestLapTime !== undefined
        ? args.bestLapTime
        : currentStats.bestLapTime,
      favoriteTrack: args.favoriteTrack !== undefined
        ? args.favoriteTrack
        : currentStats.favoriteTrack,
    };

    await ctx.db.patch(args.userId, { stats: newStats });
    return newStats;
  },
});

// Get user statistics
export const getUserStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    // Calculate stats from sessions if not available
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const totalSessions = sessions.length;
    const totalLaps = sessions.reduce((sum, s) => sum + s.lapCount, 0);
    const totalDistance = sessions.reduce((sum, s) => sum + (s.lapCount * 5), 0);
    const validLapTimes = sessions.filter(s => s.bestLapTime > 0).map(s => s.bestLapTime);
    const bestLapTime = validLapTimes.length > 0 ? Math.min(...validLapTimes) : undefined;

    // Find favorite track
    const trackCounts: Record<string, number> = {};
    sessions.forEach(s => {
      trackCounts[s.trackName] = (trackCounts[s.trackName] || 0) + 1;
    });
    const favoriteTrack = Object.entries(trackCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    return {
      totalSessions,
      totalLaps,
      totalDistance,
      bestLapTime,
      favoriteTrack,
      averageLapTime: validLapTimes.length > 0
        ? validLapTimes.reduce((sum, t) => sum + t, 0) / validLapTimes.length
        : undefined,
      recentSessions: sessions.slice(0, 5),
    };
  },
});

// ===========================================
// SOCIAL & SEARCH FUNCTIONS
// ===========================================

// Search users (for social features)
export const searchUsers = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const searchQuery = args.query.toLowerCase();

    const allUsers = await ctx.db
      .query("users")
      .collect();

    const matchingUsers = allUsers
      .filter(user => {
        const nameMatch = user.name.toLowerCase().includes(searchQuery);
        const emailMatch = user.email.toLowerCase().includes(searchQuery);
        const isPublic = user.preferences?.privacy?.publicProfile !== false;
        return (nameMatch || emailMatch) && isPublic && user.isActive;
      })
      .slice(0, limit)
      .map(user => ({
        _id: user._id,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        stats: user.stats,
      }));

    return matchingUsers;
  },
});

// Get top users (leaderboard)
export const getTopUsers = query({
  args: {
    sortBy: v.optional(v.union(
      v.literal('totalSessions'),
      v.literal('totalLaps'),
      v.literal('totalDistance'),
      v.literal('bestLapTime')
    )),
    trackName: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const sortBy = args.sortBy || 'totalSessions';

    const allUsers = await ctx.db
      .query("users")
      .collect();

    const publicUsers = allUsers.filter(user =>
      user.isActive && user.preferences?.privacy?.publicProfile !== false
    );

    if (args.trackName) {
      const userStats = await Promise.all(
        publicUsers.map(async (user) => {
          const sessions = await ctx.db
            .query("sessions")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();

          const trackSessions = sessions.filter(s => s.trackName === args.trackName);
          const validLapTimes = trackSessions.filter(s => s.bestLapTime > 0).map(s => s.bestLapTime);

          return {
            user: {
              _id: user._id,
              name: user.name,
              avatar: user.avatar,
              role: user.role,
            },
            stats: {
              totalSessions: trackSessions.length,
              totalLaps: trackSessions.reduce((sum, s) => sum + s.lapCount, 0),
              totalDistance: trackSessions.reduce((sum, s) => sum + (s.lapCount * 5), 0),
              bestLapTime: validLapTimes.length > 0 ? Math.min(...validLapTimes) : undefined,
            },
          };
        })
      );

      return userStats
        .filter(u => u.stats.totalSessions > 0)
        .sort((a, b) => {
          if (sortBy === 'bestLapTime') {
            const aTime = a.stats.bestLapTime ?? Infinity;
            const bTime = b.stats.bestLapTime ?? Infinity;
            return aTime - bTime;
          }
          const aVal = a.stats[sortBy] || 0;
          const bVal = b.stats[sortBy] || 0;
          return bVal - aVal;
        })
        .slice(0, limit);
    }

    const usersWithStats = publicUsers
      .filter(user => user.stats && (user.stats.totalSessions ?? 0) > 0)
      .sort((a, b) => {
        if (sortBy === 'bestLapTime') {
          const aTime = a.stats?.bestLapTime ?? Infinity;
          const bTime = b.stats?.bestLapTime ?? Infinity;
          return aTime - bTime;
        }
        const aVal = a.stats?.[sortBy] ?? 0;
        const bVal = b.stats?.[sortBy] ?? 0;
        return bVal - aVal;
      })
      .slice(0, limit)
      .map(user => ({
        user: {
          _id: user._id,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
        },
        stats: user.stats,
      }));

    return usersWithStats;
  },
});

// Create test user (for development)
export const createTestUser = mutation({
  args: {
    passwordHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "missola@test.com"))
      .first();

    if (existingUser) {
      // Update with password hash if provided
      if (args.passwordHash && !existingUser.passwordHash) {
        await ctx.db.patch(existingUser._id, {
          passwordHash: args.passwordHash,
        });
      }
      const { passwordHash, refreshTokenHash, ...safeUser } = existingUser;
      return safeUser;
    }

    const userId = await ctx.db.insert("users", {
      email: "missola@test.com",
      name: "Missola",
      passwordHash: args.passwordHash,
      role: "premium",
      createdAt: Date.now(),
      lastLogin: Date.now(),
      isActive: true,
      emailVerified: true,
      failedLoginAttempts: 0,
      subscription: {
        plan: "premium",
        status: "active",
        expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000),
      },
      preferences: {
        theme: "dark",
        units: "metric",
        notifications: true,
        privacy: {
          shareData: false,
          publicProfile: true,
        },
      },
      stats: {
        totalSessions: 0,
        totalLaps: 0,
        totalDistance: 0,
      },
    });

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("Failed to create test user");

    const { passwordHash, refreshTokenHash, ...safeUser } = user;
    return safeUser;
  },
});
