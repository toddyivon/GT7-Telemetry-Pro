import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe, getPlanByPriceId } from '@/lib/stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Disable body parsing for webhooks
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// In-memory store for demo purposes
// In production, this would be your database (Convex, etc.)
const subscriptionStore = new Map<string, {
  id: string;
  customerId: string;
  status: string;
  planId: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
}>();

async function updateUserSubscription(
  userId: string,
  subscriptionData: {
    id: string;
    customerId: string;
    status: string;
    planId: string;
    currentPeriodStart: number;
    currentPeriodEnd: number;
    cancelAtPeriodEnd: boolean;
  }
) {
  // Store subscription data
  subscriptionStore.set(userId, subscriptionData);

  console.log(`[Subscription Updated] User: ${userId}`, subscriptionData);

  // In production, update your database here
  // Example with Convex:
  // await convex.mutation(api.subscriptions.updateSubscription, {
  //   userId,
  //   ...subscriptionData,
  // });
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const planId = session.metadata?.planId;

  if (!userId) {
    console.error('No userId in session metadata');
    return;
  }

  // Retrieve the subscription to get full details
  const subscriptionId = session.subscription as string;
  if (!subscriptionId) {
    console.error('No subscription ID in session');
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  await updateUserSubscription(userId, {
    id: subscription.id,
    customerId: session.customer as string,
    status: subscription.status,
    planId: planId || 'premium',
    currentPeriodStart: subscription.current_period_start,
    currentPeriodEnd: subscription.current_period_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });

  console.log(`[Checkout Complete] User ${userId} subscribed to ${planId}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.log('No userId in subscription metadata, skipping update');
    return;
  }

  // Get plan from price ID
  const priceId = subscription.items.data[0]?.price.id;
  const planId = priceId ? getPlanByPriceId(priceId) || 'free' : 'free';

  await updateUserSubscription(userId, {
    id: subscription.id,
    customerId: subscription.customer as string,
    status: subscription.status,
    planId,
    currentPeriodStart: subscription.current_period_start,
    currentPeriodEnd: subscription.current_period_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });

  console.log(`[Subscription Updated] User ${userId}: ${subscription.status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.log('No userId in subscription metadata, skipping deletion');
    return;
  }

  await updateUserSubscription(userId, {
    id: subscription.id,
    customerId: subscription.customer as string,
    status: 'canceled',
    planId: 'free',
    currentPeriodStart: subscription.current_period_start,
    currentPeriodEnd: subscription.current_period_end,
    cancelAtPeriodEnd: true,
  });

  console.log(`[Subscription Deleted] User ${userId} downgraded to free`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;

  console.log(`[Payment Failed] Customer: ${customerId}, Subscription: ${subscriptionId}`);

  // In production:
  // 1. Send email notification to customer
  // 2. Update subscription status to 'past_due'
  // 3. Maybe schedule a retry or grace period
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  console.log(`[Invoice Paid] Customer: ${customerId}, Amount: ${invoice.amount_paid / 100}`);

  // Store invoice for billing history
  // In production, save to database
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log(`[Webhook] Received event: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        console.log(`[Trial Ending] User ${userId} trial ends at ${subscription.trial_end}`);
        // Send notification email about trial ending
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Export subscription store for other routes (demo only)
export { subscriptionStore };