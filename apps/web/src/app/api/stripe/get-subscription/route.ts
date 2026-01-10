import { NextRequest, NextResponse } from 'next/server';
import { stripe, SUBSCRIPTION_PLANS, getPlanByPriceId } from '@/lib/stripe';
import { getCurrentUser } from '@/lib/auth';

export interface SubscriptionResponse {
  hasSubscription: boolean;
  subscription: {
    id: string;
    status: string;
    planId: string;
    planName: string;
    currentPeriodStart: number;
    currentPeriodEnd: number;
    cancelAtPeriodEnd: boolean;
    customerId: string;
    priceId: string;
    interval: string;
    amount: number;
    currency: string;
  } | null;
  invoices: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    created: number;
    invoicePdf: string | null;
    hostedInvoiceUrl: string | null;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get customer ID from query params or user data
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    // If no customer ID, check user's subscription from auth
    if (!customerId) {
      // Return the user's subscription from their auth data
      if (user.subscription) {
        const plan = SUBSCRIPTION_PLANS[user.subscription.plan as keyof typeof SUBSCRIPTION_PLANS];
        return NextResponse.json({
          hasSubscription: user.subscription.plan !== 'free',
          subscription: {
            id: 'local',
            status: user.subscription.status,
            planId: user.subscription.plan,
            planName: plan?.name || 'Free',
            currentPeriodStart: Date.now() / 1000,
            currentPeriodEnd: user.subscription.expiresAt || (Date.now() / 1000 + 30 * 24 * 60 * 60),
            cancelAtPeriodEnd: false,
            customerId: '',
            priceId: plan?.priceId || '',
            interval: 'month',
            amount: (plan?.price || 0) * 100,
            currency: 'usd',
          },
          invoices: [],
        } as SubscriptionResponse);
      }

      return NextResponse.json({
        hasSubscription: false,
        subscription: null,
        invoices: [],
      } as SubscriptionResponse);
    }

    // Fetch subscription from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 1,
      expand: ['data.default_payment_method'],
    });

    const subscription = subscriptions.data[0];

    if (!subscription) {
      return NextResponse.json({
        hasSubscription: false,
        subscription: null,
        invoices: [],
      } as SubscriptionResponse);
    }

    // Get invoices
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 10,
    });

    const priceId = subscription.items.data[0]?.price.id;
    const planId = priceId ? getPlanByPriceId(priceId) || 'free' : 'free';
    const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];

    return NextResponse.json({
      hasSubscription: subscription.status === 'active' || subscription.status === 'trialing',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        planId,
        planName: plan?.name || 'Unknown',
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        customerId: subscription.customer as string,
        priceId: priceId || '',
        interval: subscription.items.data[0]?.price.recurring?.interval || 'month',
        amount: subscription.items.data[0]?.price.unit_amount || 0,
        currency: subscription.items.data[0]?.price.currency || 'usd',
      },
      invoices: invoices.data.map((invoice) => ({
        id: invoice.id,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: invoice.status || 'unknown',
        created: invoice.created,
        invoicePdf: invoice.invoice_pdf,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
      })),
    } as SubscriptionResponse);
  } catch (error) {
    console.error('Error getting subscription:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Error getting subscription' },
      { status: 500 }
    );
  }
}
