import Stripe from 'stripe';

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

// Subscription Plans Configuration
export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started with basic telemetry analysis',
    price: 0,
    priceId: null,
    features: [
      'Basic telemetry recording',
      'Up to 5 sessions per month',
      'Basic lap time analysis',
      'Community support',
      'Standard data exports',
    ],
    limits: {
      sessionsPerMonth: 5,
      advancedAnalysis: false,
      socialFeatures: false,
      aiAnalysis: false,
      prioritySupport: false,
      cloudStorage: false,
    },
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    description: 'Advanced features for serious racers',
    price: 9.99,
    priceId: process.env.STRIPE_PRICE_PREMIUM || 'price_premium_monthly',
    yearlyPriceId: process.env.STRIPE_PRICE_PREMIUM_YEARLY || 'price_premium_yearly',
    features: [
      'Unlimited telemetry recording',
      'Advanced racing line analysis',
      'Real-time performance insights',
      'Tire degradation tracking',
      'Fuel strategy optimization',
      'Sector-by-sector comparison',
      'Custom setup recommendations',
      'Priority customer support',
      'Advanced data exports (CSV, JSON)',
      'Cloud storage for all sessions',
      'Social features & leaderboards',
      'Brake point optimization',
    ],
    limits: {
      sessionsPerMonth: -1, // Unlimited
      advancedAnalysis: true,
      socialFeatures: true,
      aiAnalysis: false,
      prioritySupport: true,
      cloudStorage: true,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'All features with advanced AI analysis and priority support',
    price: 19.99,
    priceId: process.env.STRIPE_PRICE_PRO || 'price_pro_monthly',
    yearlyPriceId: process.env.STRIPE_PRICE_PRO_YEARLY || 'price_pro_yearly',
    features: [
      'Everything in Premium',
      'Advanced AI-powered analysis',
      'Personalized coaching insights',
      'Race strategy predictions',
      'Weather-based recommendations',
      'Competitor analysis',
      'Team collaboration features',
      'API access for integrations',
      'White-label exports',
      'Dedicated account manager',
      '24/7 priority support',
      'Early access to new features',
    ],
    limits: {
      sessionsPerMonth: -1, // Unlimited
      advancedAnalysis: true,
      socialFeatures: true,
      aiAnalysis: true,
      prioritySupport: true,
      cloudStorage: true,
    },
  },
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;
export type PlanLimits = typeof SUBSCRIPTION_PLANS.free.limits;

// Feature access check
export function canAccessFeature(
  plan: SubscriptionPlan,
  feature: keyof PlanLimits
): boolean {
  const planLimits = SUBSCRIPTION_PLANS[plan].limits;
  return !!planLimits[feature];
}

// Get plan by Stripe price ID
export function getPlanByPriceId(priceId: string): SubscriptionPlan | null {
  for (const [key, plan] of Object.entries(SUBSCRIPTION_PLANS)) {
    if (plan.priceId === priceId) {
      return key as SubscriptionPlan;
    }
    if ('yearlyPriceId' in plan && plan.yearlyPriceId === priceId) {
      return key as SubscriptionPlan;
    }
  }
  return null;
}

// Format price for display
export function formatPrice(price: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price);
}
