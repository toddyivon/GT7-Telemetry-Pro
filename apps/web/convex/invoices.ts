import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

const invoiceStatusValidator = v.union(
  v.literal('draft'),
  v.literal('open'),
  v.literal('paid'),
  v.literal('uncollectible'),
  v.literal('void')
);

/**
 * Get user's invoices
 */
export const getInvoices = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    return await ctx.db
      .query('invoices')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .take(limit);
  },
});

/**
 * Get invoice by Stripe ID
 */
export const getByStripeId = query({
  args: { stripeInvoiceId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('invoices')
      .withIndex('by_stripe_invoice', (q) =>
        q.eq('stripeInvoiceId', args.stripeInvoiceId)
      )
      .first();
  },
});

/**
 * Create or update invoice from Stripe webhook
 */
export const upsertInvoice = mutation({
  args: {
    userId: v.id('users'),
    subscriptionId: v.optional(v.id('subscriptions')),
    stripeInvoiceId: v.string(),
    stripeCustomerId: v.string(),
    amountPaid: v.number(),
    amountDue: v.number(),
    currency: v.string(),
    status: invoiceStatusValidator,
    hostedInvoiceUrl: v.optional(v.string()),
    invoicePdf: v.optional(v.string()),
    periodStart: v.number(),
    periodEnd: v.number(),
    paidAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if invoice already exists
    const existing = await ctx.db
      .query('invoices')
      .withIndex('by_stripe_invoice', (q) =>
        q.eq('stripeInvoiceId', args.stripeInvoiceId)
      )
      .first();

    if (existing) {
      // Update existing invoice
      await ctx.db.patch(existing._id, {
        amountPaid: args.amountPaid,
        amountDue: args.amountDue,
        status: args.status,
        hostedInvoiceUrl: args.hostedInvoiceUrl,
        invoicePdf: args.invoicePdf,
        paidAt: args.paidAt,
      });

      return existing._id;
    }

    // Create new invoice
    return await ctx.db.insert('invoices', {
      userId: args.userId,
      subscriptionId: args.subscriptionId,
      stripeInvoiceId: args.stripeInvoiceId,
      stripeCustomerId: args.stripeCustomerId,
      amountPaid: args.amountPaid,
      amountDue: args.amountDue,
      currency: args.currency,
      status: args.status,
      hostedInvoiceUrl: args.hostedInvoiceUrl,
      invoicePdf: args.invoicePdf,
      periodStart: args.periodStart,
      periodEnd: args.periodEnd,
      paidAt: args.paidAt,
      createdAt: now,
    });
  },
});

/**
 * Get total revenue for a user (for admin purposes)
 */
export const getTotalRevenue = query({
  args: { userId: v.optional(v.id('users')) },
  handler: async (ctx, args) => {
    let invoicesQuery = ctx.db.query('invoices');

    if (args.userId) {
      invoicesQuery = invoicesQuery.withIndex('by_user', (q) =>
        q.eq('userId', args.userId)
      );
    }

    const invoices = await invoicesQuery.collect();

    const paidInvoices = invoices.filter((inv) => inv.status === 'paid');
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
    const invoiceCount = paidInvoices.length;

    return {
      totalRevenue,
      invoiceCount,
      currency: invoices[0]?.currency || 'usd',
    };
  },
});
