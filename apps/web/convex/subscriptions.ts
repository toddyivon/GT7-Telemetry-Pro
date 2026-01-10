import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

// Plan types
const planValidator = v.union(v.literal('free'), v.literal('premium'), v.literal('pro'));
const statusValidator = v.union(
  v.literal('active'),
  v.literal('canceled'),
  v.literal('incomplete'),
  v.literal('incomplete_expired'),
  v.literal('past_due'),
  v.literal('trialing'),
  v.literal('unpaid')
);

/**
 * Get user's current subscription
 */
export const getSubscription = query({
  args: { userId: v.optional(v.id('users')) },
  handler: async (ctx, args) => {
    if (!args.userId) return null;

    const subscriptions = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .first();

    return subscriptions;
  },
});

/**
 * Get subscription by Stripe subscription ID
 */
export const getByStripeId = query({
  args: { stripeSubscriptionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('subscriptions')
      .withIndex('by_stripe_subscription', (q) =>
        q.eq('stripeSubscriptionId', args.stripeSubscriptionId)
      )
      .first();
  },
});

/**
 * Create or update subscription from Stripe webhook
 */
export const upsertSubscription = mutation({
  args: {
    userId: v.id('users'),
    stripeSubscriptionId: v.string(),
    stripeCustomerId: v.string(),
    planId: planValidator,
    priceId: v.string(),
    status: statusValidator,
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
    canceledAt: v.optional(v.number()),
    trialStart: v.optional(v.number()),
    trialEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if subscription already exists
    const existing = await ctx.db
      .query('subscriptions')
      .withIndex('by_stripe_subscription', (q) =>
        q.eq('stripeSubscriptionId', args.stripeSubscriptionId)
      )
      .first();

    if (existing) {
      // Determine if this is a plan change
      const isUpgrade =
        (existing.planId === 'free' && (args.planId === 'premium' || args.planId === 'pro')) ||
        (existing.planId === 'premium' && args.planId === 'pro');
      const isDowngrade =
        (existing.planId === 'pro' && (args.planId === 'premium' || args.planId === 'free')) ||
        (existing.planId === 'premium' && args.planId === 'free');

      // Update existing subscription
      await ctx.db.patch(existing._id, {
        planId: args.planId,
        priceId: args.priceId,
        status: args.status,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
        canceledAt: args.canceledAt,
        updatedAt: now,
      });

      // Log plan change if applicable
      if (isUpgrade) {
        await ctx.db.insert('subscriptionHistory', {
          userId: args.userId,
          subscriptionId: existing._id,
          event: 'upgraded',
          fromPlan: existing.planId,
          toPlan: args.planId,
          createdAt: now,
        });
      } else if (isDowngrade) {
        await ctx.db.insert('subscriptionHistory', {
          userId: args.userId,
          subscriptionId: existing._id,
          event: 'downgraded',
          fromPlan: existing.planId,
          toPlan: args.planId,
          createdAt: now,
        });
      }

      // Update user's subscription info
      await ctx.db.patch(args.userId, {
        stripeSubscriptionId: args.stripeSubscriptionId,
        subscription: {
          plan: args.planId,
          status: args.status === 'active' || args.status === 'trialing' ? 'active' :
                  args.status === 'canceled' ? 'canceled' : 'expired',
          expiresAt: args.currentPeriodEnd,
        },
      });

      return existing._id;
    }

    // Create new subscription
    const subscriptionId = await ctx.db.insert('subscriptions', {
      userId: args.userId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      stripeCustomerId: args.stripeCustomerId,
      planId: args.planId,
      priceId: args.priceId,
      status: args.status,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd,
      canceledAt: args.canceledAt,
      trialStart: args.trialStart,
      trialEnd: args.trialEnd,
      createdAt: now,
      updatedAt: now,
    });

    // Log creation
    await ctx.db.insert('subscriptionHistory', {
      userId: args.userId,
      subscriptionId,
      event: args.trialStart ? 'trial_started' : 'created',
      toPlan: args.planId,
      createdAt: now,
    });

    // Update user
    await ctx.db.patch(args.userId, {
      stripeCustomerId: args.stripeCustomerId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      subscription: {
        plan: args.planId,
        status: args.status === 'active' || args.status === 'trialing' ? 'active' :
                args.status === 'canceled' ? 'canceled' : 'expired',
        expiresAt: args.currentPeriodEnd,
      },
    });

    return subscriptionId;
  },
});

/**
 * Cancel subscription
 */
export const cancelSubscription = mutation({
  args: {
    stripeSubscriptionId: v.string(),
    cancelAtPeriodEnd: v.boolean(),
    canceledAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_stripe_subscription', (q) =>
        q.eq('stripeSubscriptionId', args.stripeSubscriptionId)
      )
      .first();

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Update subscription
    await ctx.db.patch(subscription._id, {
      status: args.cancelAtPeriodEnd ? subscription.status : 'canceled',
      cancelAtPeriodEnd: args.cancelAtPeriodEnd,
      canceledAt: args.canceledAt || now,
      updatedAt: now,
    });

    // Log cancellation
    await ctx.db.insert('subscriptionHistory', {
      userId: subscription.userId,
      subscriptionId: subscription._id,
      event: 'canceled',
      fromPlan: subscription.planId,
      createdAt: now,
    });

    // Update user if fully canceled
    if (!args.cancelAtPeriodEnd) {
      await ctx.db.patch(subscription.userId, {
        subscription: {
          plan: 'free',
          status: 'canceled',
        },
      });
    }

    return subscription._id;
  },
});

/**
 * Get subscription history
 */
export const getHistory = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('subscriptionHistory')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .take(50);
  },
});

/**
 * Record payment event
 */
export const recordPaymentEvent = mutation({
  args: {
    userId: v.id('users'),
    subscriptionId: v.optional(v.id('subscriptions')),
    success: v.boolean(),
    stripeEventId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.insert('subscriptionHistory', {
      userId: args.userId,
      subscriptionId: args.subscriptionId,
      event: args.success ? 'payment_succeeded' : 'payment_failed',
      stripeEventId: args.stripeEventId,
      metadata: args.metadata,
      createdAt: now,
    });
  },
});

/**
 * Get user by Stripe customer ID
 */
export const getUserByStripeCustomer = query({
  args: { stripeCustomerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_stripe_customer', (q) =>
        q.eq('stripeCustomerId', args.stripeCustomerId)
      )
      .first();
  },
});
