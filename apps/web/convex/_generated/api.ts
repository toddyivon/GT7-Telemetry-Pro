/* eslint-disable */
/**
 * Generated API types for Convex
 * This is a stub file - run `npx convex dev` to regenerate with actual types
 */
import type { FunctionReference } from "convex/server";

// Type helper for any API
type AnyApi = {
  [key: string]: {
    [key: string]: FunctionReference<any, any, any, any>;
  };
};

// Export api object with all modules
export const api: AnyApi = {
  users: {
    getUserById: {} as FunctionReference<"query", "public", any, any>,
    getUserByEmail: {} as FunctionReference<"query", "public", any, any>,
    getUserForAuth: {} as FunctionReference<"query", "public", any, any>,
    createUserWithPassword: {} as FunctionReference<"mutation", "public", any, any>,
    updateLastLogin: {} as FunctionReference<"mutation", "public", any, any>,
    recordFailedLogin: {} as FunctionReference<"mutation", "public", any, any>,
    storeRefreshToken: {} as FunctionReference<"mutation", "public", any, any>,
    validateRefreshToken: {} as FunctionReference<"query", "public", any, any>,
    clearRefreshToken: {} as FunctionReference<"mutation", "public", any, any>,
    createUser: {} as FunctionReference<"mutation", "public", any, any>,
    updateUser: {} as FunctionReference<"mutation", "public", any, any>,
    updatePassword: {} as FunctionReference<"mutation", "public", any, any>,
    updateUserStats: {} as FunctionReference<"mutation", "public", any, any>,
    getUserStats: {} as FunctionReference<"query", "public", any, any>,
    searchUsers: {} as FunctionReference<"query", "public", any, any>,
    getTopUsers: {} as FunctionReference<"query", "public", any, any>,
    createTestUser: {} as FunctionReference<"mutation", "public", any, any>,
  },
  sessions: {
    createSession: {} as FunctionReference<"mutation", "public", any, any>,
    getUserSessions: {} as FunctionReference<"query", "public", any, any>,
    getPublicSessions: {} as FunctionReference<"query", "public", any, any>,
    getSessionById: {} as FunctionReference<"query", "public", any, any>,
    updateSession: {} as FunctionReference<"mutation", "public", any, any>,
    deleteSession: {} as FunctionReference<"mutation", "public", any, any>,
    getSessionStats: {} as FunctionReference<"query", "public", any, any>,
    getRecentSessions: {} as FunctionReference<"query", "public", any, any>,
    getSessionsForFeed: {} as FunctionReference<"query", "public", any, any>,
    getTracks: {} as FunctionReference<"query", "public", any, any>,
    getCars: {} as FunctionReference<"query", "public", any, any>,
  },
  laps: {
    createLap: {} as FunctionReference<"mutation", "public", any, any>,
    getLapsBySession: {} as FunctionReference<"query", "public", any, any>,
    getLapById: {} as FunctionReference<"query", "public", any, any>,
    getBestLaps: {} as FunctionReference<"query", "public", any, any>,
    updateLap: {} as FunctionReference<"mutation", "public", any, any>,
  },
  telemetry: {
    storeTelemetry: {} as FunctionReference<"mutation", "public", any, any>,
    getTelemetryBySession: {} as FunctionReference<"query", "public", any, any>,
    getTelemetryByLap: {} as FunctionReference<"query", "public", any, any>,
    deleteTelemetry: {} as FunctionReference<"mutation", "public", any, any>,
  },
  analysis: {
    createAnalysis: {} as FunctionReference<"mutation", "public", any, any>,
    getAnalysisBySession: {} as FunctionReference<"query", "public", any, any>,
    getAnalysisByType: {} as FunctionReference<"query", "public", any, any>,
  },
  social: {
    followUser: {} as FunctionReference<"mutation", "public", any, any>,
    unfollowUser: {} as FunctionReference<"mutation", "public", any, any>,
    getFollowers: {} as FunctionReference<"query", "public", any, any>,
    getFollowing: {} as FunctionReference<"query", "public", any, any>,
    isFollowing: {} as FunctionReference<"query", "public", any, any>,
    likeSession: {} as FunctionReference<"mutation", "public", any, any>,
    unlikeSession: {} as FunctionReference<"mutation", "public", any, any>,
    hasLiked: {} as FunctionReference<"query", "public", any, any>,
    getSessionLikes: {} as FunctionReference<"query", "public", any, any>,
    addComment: {} as FunctionReference<"mutation", "public", any, any>,
    getComments: {} as FunctionReference<"query", "public", any, any>,
    deleteComment: {} as FunctionReference<"mutation", "public", any, any>,
    likeComment: {} as FunctionReference<"mutation", "public", any, any>,
    getNotifications: {} as FunctionReference<"query", "public", any, any>,
    markNotificationRead: {} as FunctionReference<"mutation", "public", any, any>,
    shareSession: {} as FunctionReference<"mutation", "public", any, any>,
    getShareCount: {} as FunctionReference<"query", "public", any, any>,
    getFeed: {} as FunctionReference<"query", "public", any, any>,
    getUserProfile: {} as FunctionReference<"query", "public", any, any>,
    getSocialStats: {} as FunctionReference<"query", "public", any, any>,
  },
  leaderboard: {
    getTrackLeaderboard: {} as FunctionReference<"query", "public", any, any>,
    getGlobalRankings: {} as FunctionReference<"query", "public", any, any>,
    getUserRank: {} as FunctionReference<"query", "public", any, any>,
    getAchievements: {} as FunctionReference<"query", "public", any, any>,
    getUserAchievements: {} as FunctionReference<"query", "public", any, any>,
    submitTime: {} as FunctionReference<"mutation", "public", any, any>,
    updateRankings: {} as FunctionReference<"mutation", "public", any, any>,
    checkAchievements: {} as FunctionReference<"mutation", "public", any, any>,
    unlockAchievement: {} as FunctionReference<"mutation", "internal", any, any>,
    initializeAchievements: {} as FunctionReference<"mutation", "public", any, any>,
    getAvailableTracks: {} as FunctionReference<"query", "public", any, any>,
    getCarClasses: {} as FunctionReference<"query", "public", any, any>,
  },
  subscriptions: {
    getSubscription: {} as FunctionReference<"query", "public", any, any>,
    createSubscription: {} as FunctionReference<"mutation", "public", any, any>,
    updateSubscription: {} as FunctionReference<"mutation", "public", any, any>,
    cancelSubscription: {} as FunctionReference<"mutation", "public", any, any>,
    getSubscriptionHistory: {} as FunctionReference<"query", "public", any, any>,
    handleWebhook: {} as FunctionReference<"mutation", "public", any, any>,
  },
  invoices: {
    createInvoice: {} as FunctionReference<"mutation", "public", any, any>,
    getInvoices: {} as FunctionReference<"query", "public", any, any>,
    getInvoiceById: {} as FunctionReference<"query", "public", any, any>,
    updateInvoice: {} as FunctionReference<"mutation", "public", any, any>,
  },
  usage: {
    getUsage: {} as FunctionReference<"query", "public", any, any>,
    incrementUsage: {} as FunctionReference<"mutation", "public", any, any>,
    resetUsage: {} as FunctionReference<"mutation", "public", any, any>,
    checkLimit: {} as FunctionReference<"query", "public", any, any>,
  },
};

// Internal functions reference
export const internal: AnyApi = {
  leaderboard: {
    unlockAchievement: {} as FunctionReference<"mutation", "internal", any, any>,
  },
};
