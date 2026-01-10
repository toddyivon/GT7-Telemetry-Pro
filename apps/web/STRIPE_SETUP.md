# Stripe Payment Integration Setup

This guide explains how to configure Stripe payments for the GT7 Telemetry Pro SaaS platform.

## Prerequisites

- Stripe account (https://stripe.com)
- Node.js 18+ installed
- Stripe CLI (for local development)

## Quick Start

### 1. Get Stripe API Keys

1. Go to https://dashboard.stripe.com/apikeys
2. Copy your **Publishable key** (starts with `pk_test_` or `pk_live_`)
3. Copy your **Secret key** (starts with `sk_test_` or `sk_live_`)

### 2. Create Products and Prices

Go to https://dashboard.stripe.com/products and create:

#### Premium Plan ($9.99/month)
- **Product name**: GT7 Telemetry Pro - Premium
- **Description**: Advanced telemetry analysis for serious racers
- **Pricing**:
  - Monthly: $9.99/month (recurring)
  - Yearly: $99.90/year (save 17%)

#### Pro Plan ($19.99/month)
- **Product name**: GT7 Telemetry Pro - Pro
- **Description**: All features with AI coaching and priority support
- **Pricing**:
  - Monthly: $19.99/month (recurring)
  - Yearly: $199.90/year (save 17%)
- **Trial**: 7-day free trial

After creating, copy the Price IDs (e.g., `price_1234...`) for each price.

### 3. Configure Environment Variables

Add to your `.env.local`:

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here

# Webhook Secret (see step 4)
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here

# Price IDs from step 2
STRIPE_PRICE_PREMIUM=price_your_premium_monthly_id
STRIPE_PRICE_PREMIUM_YEARLY=price_your_premium_yearly_id
STRIPE_PRICE_PRO=price_your_pro_monthly_id
STRIPE_PRICE_PRO_YEARLY=price_your_pro_yearly_id
```

### 4. Set Up Webhooks

#### For Production:

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter your endpoint URL: `https://your-domain.com/api/stripe/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** to `STRIPE_WEBHOOK_SECRET`

#### For Local Development:

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli

2. Login to Stripe:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. Copy the webhook signing secret from the CLI output

## Subscription Plans

### Free Tier
- 5 sessions per month
- Basic lap time analysis
- Community support
- Standard exports

### Premium Tier ($9.99/month)
- Unlimited sessions
- Advanced racing line analysis
- Tire and fuel analysis
- Cloud storage
- Social features
- Priority email support

### Pro Tier ($19.99/month)
- Everything in Premium
- AI-powered coaching
- Team collaboration
- API access
- White-label exports
- 24/7 priority support
- 7-day free trial

## API Endpoints

### Create Checkout Session
```
POST /api/stripe/create-checkout-session
Body: { planId: 'premium' | 'pro', billingPeriod: 'monthly' | 'yearly' }
Response: { sessionId: string, url: string }
```

### Get Subscription
```
GET /api/stripe/get-subscription
Query: ?customerId=cus_xxx (optional)
Response: { hasSubscription: boolean, subscription: {...}, invoices: [...] }
```

### Create Portal Session
```
POST /api/stripe/create-portal-session
Body: { customerId: string }
Response: { url: string }
```

### Webhook
```
POST /api/stripe/webhook
Headers: stripe-signature: <signature>
Body: Stripe event payload
```

## Testing

Use Stripe's test cards:
- **Success**: 4242 4242 4242 4242
- **Declined**: 4000 0000 0000 0002
- **3D Secure**: 4000 0025 0000 3155

Trigger test events with Stripe CLI:
```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_failed
```

## Security Notes

1. Never commit API keys to version control
2. Use test keys for development, live keys for production
3. Always verify webhook signatures
4. Store customer IDs securely
5. Implement proper error handling

## Troubleshooting

### Webhook not receiving events
- Check the endpoint URL is correct
- Verify the signing secret matches
- Check server logs for errors

### Checkout not redirecting
- Verify publishable key is correct
- Check browser console for errors
- Ensure user is authenticated

### Subscription not updating
- Check webhook handler logs
- Verify database connection
- Check Stripe event types are configured

## Files Reference

- `/src/lib/stripe.ts` - Stripe configuration and plan definitions
- `/src/app/api/stripe/` - API route handlers
- `/src/components/subscription/` - UI components
- `/src/middleware/subscription.ts` - Feature access control
- `/src/hooks/useSubscription.ts` - React hook for subscription state
- `/convex/subscriptions.ts` - Convex mutations/queries
- `/convex/schema.ts` - Database schema
