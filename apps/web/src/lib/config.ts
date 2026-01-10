// Application configuration
// Central place for all configuration values

export const config = {
  // App info
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'GT7 Telemetry Pro',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    version: '1.0.0',
  },

  // Authentication
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'development-secret-key-change-in-production',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'development-refresh-secret',
    jwtExpiration: process.env.JWT_EXPIRATION || '1h',
    jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
    cookieName: 'gt7_auth_token',
    refreshCookieName: 'gt7_refresh_token',
  },

  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    prices: {
      premium: process.env.STRIPE_PRICE_PREMIUM || '',
      pro: process.env.STRIPE_PRICE_PRO || '',
      premiumYearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY || '',
      proYearly: process.env.STRIPE_PRICE_PRO_YEARLY || '',
    },
  },

  // Convex
  convex: {
    url: process.env.NEXT_PUBLIC_CONVEX_URL || '',
  },

  // Subscription plans
  plans: {
    free: {
      name: 'Free',
      price: 0,
      sessionsPerMonth: 5,
      features: [
        'Basic telemetry capture',
        'Up to 5 sessions/month',
        'Basic lap comparison',
        'Community access',
      ],
    },
    premium: {
      name: 'Premium',
      price: 9.99,
      priceYearly: 99.99,
      sessionsPerMonth: -1, // unlimited
      features: [
        'Unlimited sessions',
        'Advanced lap analysis',
        'Racing line visualization',
        'Tire & fuel analysis',
        'Social features',
        'Export data (CSV/JSON)',
        'Priority support',
      ],
    },
    pro: {
      name: 'Pro',
      price: 19.99,
      priceYearly: 199.99,
      sessionsPerMonth: -1, // unlimited
      features: [
        'Everything in Premium',
        'AI-powered insights',
        'Corner analysis',
        'Brake point optimization',
        'Custom dashboards',
        'API access',
        'Team features',
        'Dedicated support',
      ],
    },
  },

  // Ranking tiers
  rankingTiers: [
    { name: 'Bronze', minPoints: 0, maxPoints: 999, color: '#CD7F32' },
    { name: 'Silver', minPoints: 1000, maxPoints: 4999, color: '#C0C0C0' },
    { name: 'Gold', minPoints: 5000, maxPoints: 9999, color: '#FFD700' },
    { name: 'Platinum', minPoints: 10000, maxPoints: 24999, color: '#E5E4E2' },
    { name: 'Diamond', minPoints: 25000, maxPoints: Infinity, color: '#B9F2FF' },
  ],

  // Points system
  points: {
    sessionComplete: 10,
    personalBest: 50,
    trackRecord: 100,
    firstLap: 5,
    consistentLaps: 25,
    socialFollow: 2,
    socialShare: 5,
  },

  // Telemetry settings
  telemetry: {
    udpPort: 33740,
    defaultSampleRate: 60, // Hz
    maxSessionDuration: 4 * 60 * 60 * 1000, // 4 hours in ms
  },

  // Feature flags
  features: {
    socialEnabled: true,
    leaderboardEnabled: true,
    aiInsightsEnabled: true,
    exportEnabled: true,
    teamFeaturesEnabled: false, // Coming soon
  },
} as const;

export type Plan = keyof typeof config.plans;
export type RankingTier = typeof config.rankingTiers[number];

// Helper function to get user's tier based on points
export function getUserTier(points: number): RankingTier {
  for (let i = config.rankingTiers.length - 1; i >= 0; i--) {
    if (points >= config.rankingTiers[i].minPoints) {
      return config.rankingTiers[i];
    }
  }
  return config.rankingTiers[0];
}

// Helper to check if feature is available for plan
export function isFeatureAvailable(feature: string, plan: Plan): boolean {
  const planFeatures = config.plans[plan].features;
  return planFeatures.some(f => f.toLowerCase().includes(feature.toLowerCase()));
}
