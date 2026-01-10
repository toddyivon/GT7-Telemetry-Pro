import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

/**
 * Get current billing period string (YYYY-MM format)
 */
function getCurrentBillingPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get or create usage record for current billing period
 */
export const getUsage = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const billingPeriod = getCurrentBillingPeriod();

    const usage = await ctx.db
      .query('usageRecords')
      .withIndex('by_user_period', (q) =>
        q.eq('userId', args.userId).eq('billingPeriod', billingPeriod)
      )
      .first();

    if (!usage) {
      return {
        userId: args.userId,
        billingPeriod,
        sessionsRecorded: 0,
        sessionsAnalyzed: 0,
        storageUsedBytes: 0,
        apiCallsCount: 0,
      };
    }

    return usage;
  },
});

/**
 * Increment session count
 */
export const incrementSessions = mutation({
  args: {
    userId: v.id('users'),
    count: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const billingPeriod = getCurrentBillingPeriod();
    const increment = args.count ?? 1;
    const now = Date.now();

    const existing = await ctx.db
      .query('usageRecords')
      .withIndex('by_user_period', (q) =>
        q.eq('userId', args.userId).eq('billingPeriod', billingPeriod)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        sessionsRecorded: existing.sessionsRecorded + increment,
        updatedAt: now,
      });
      return existing.sessionsRecorded + increment;
    }

    await ctx.db.insert('usageRecords', {
      userId: args.userId,
      billingPeriod,
      sessionsRecorded: increment,
      sessionsAnalyzed: 0,
      storageUsedBytes: 0,
      apiCallsCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return increment;
  },
});

/**
 * Increment analysis count
 */
export const incrementAnalysis = mutation({
  args: {
    userId: v.id('users'),
    count: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const billingPeriod = getCurrentBillingPeriod();
    const increment = args.count ?? 1;
    const now = Date.now();

    const existing = await ctx.db
      .query('usageRecords')
      .withIndex('by_user_period', (q) =>
        q.eq('userId', args.userId).eq('billingPeriod', billingPeriod)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        sessionsAnalyzed: existing.sessionsAnalyzed + increment,
        updatedAt: now,
      });
      return existing.sessionsAnalyzed + increment;
    }

    await ctx.db.insert('usageRecords', {
      userId: args.userId,
      billingPeriod,
      sessionsRecorded: 0,
      sessionsAnalyzed: increment,
      storageUsedBytes: 0,
      apiCallsCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return increment;
  },
});

/**
 * Update storage usage
 */
export const updateStorageUsage = mutation({
  args: {
    userId: v.id('users'),
    bytes: v.number(),
  },
  handler: async (ctx, args) => {
    const billingPeriod = getCurrentBillingPeriod();
    const now = Date.now();

    const existing = await ctx.db
      .query('usageRecords')
      .withIndex('by_user_period', (q) =>
        q.eq('userId', args.userId).eq('billingPeriod', billingPeriod)
      )
      .first();

    if (existing) {
      const newStorage = Math.max(0, existing.storageUsedBytes + args.bytes);
      await ctx.db.patch(existing._id, {
        storageUsedBytes: newStorage,
        updatedAt: now,
      });
      return newStorage;
    }

    const storage = Math.max(0, args.bytes);
    await ctx.db.insert('usageRecords', {
      userId: args.userId,
      billingPeriod,
      sessionsRecorded: 0,
      sessionsAnalyzed: 0,
      storageUsedBytes: storage,
      apiCallsCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return storage;
  },
});

/**
 * Increment API call count
 */
export const incrementApiCalls = mutation({
  args: {
    userId: v.id('users'),
    count: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const billingPeriod = getCurrentBillingPeriod();
    const increment = args.count ?? 1;
    const now = Date.now();

    const existing = await ctx.db
      .query('usageRecords')
      .withIndex('by_user_period', (q) =>
        q.eq('userId', args.userId).eq('billingPeriod', billingPeriod)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        apiCallsCount: existing.apiCallsCount + increment,
        updatedAt: now,
      });
      return existing.apiCallsCount + increment;
    }

    await ctx.db.insert('usageRecords', {
      userId: args.userId,
      billingPeriod,
      sessionsRecorded: 0,
      sessionsAnalyzed: 0,
      storageUsedBytes: 0,
      apiCallsCount: increment,
      createdAt: now,
      updatedAt: now,
    });

    return increment;
  },
});

/**
 * Get usage history for multiple periods
 */
export const getUsageHistory = query({
  args: {
    userId: v.id('users'),
    months: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const monthsToFetch = args.months ?? 6;
    const periods: string[] = [];

    const now = new Date();
    for (let i = 0; i < monthsToFetch; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      periods.push(
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      );
    }

    const usageRecords = await Promise.all(
      periods.map(async (period) => {
        const record = await ctx.db
          .query('usageRecords')
          .withIndex('by_user_period', (q) =>
            q.eq('userId', args.userId).eq('billingPeriod', period)
          )
          .first();

        return (
          record || {
            billingPeriod: period,
            sessionsRecorded: 0,
            sessionsAnalyzed: 0,
            storageUsedBytes: 0,
            apiCallsCount: 0,
          }
        );
      })
    );

    return usageRecords;
  },
});

/**
 * Check if user can record a new session based on their plan limits
 */
export const canRecordSession = query({
  args: {
    userId: v.id('users'),
    planId: v.union(v.literal('free'), v.literal('premium'), v.literal('pro')),
  },
  handler: async (ctx, args) => {
    // Premium and Pro have unlimited sessions
    if (args.planId !== 'free') {
      return { canRecord: true, remaining: -1, used: 0 };
    }

    const billingPeriod = getCurrentBillingPeriod();
    const FREE_LIMIT = 5;

    const usage = await ctx.db
      .query('usageRecords')
      .withIndex('by_user_period', (q) =>
        q.eq('userId', args.userId).eq('billingPeriod', billingPeriod)
      )
      .first();

    const used = usage?.sessionsRecorded ?? 0;
    const remaining = Math.max(0, FREE_LIMIT - used);

    return {
      canRecord: used < FREE_LIMIT,
      remaining,
      used,
      limit: FREE_LIMIT,
    };
  },
});
