import { NextRequest, NextResponse } from 'next/server';
import { SUBSCRIPTION_PLANS, SubscriptionPlan, PlanLimits } from '@/lib/stripe';

export interface SubscriptionMiddlewareResult {
  hasAccess: boolean;
  currentPlan: SubscriptionPlan;
  requiredPlan: SubscriptionPlan | null;
  message?: string;
}

/**
 * Feature access control for subscription-based features
 */
export function checkFeatureAccess(
  currentPlan: SubscriptionPlan,
  feature: keyof PlanLimits
): SubscriptionMiddlewareResult {
  const planLimits = SUBSCRIPTION_PLANS[currentPlan].limits;
  const hasAccess = !!planLimits[feature];

  if (hasAccess) {
    return {
      hasAccess: true,
      currentPlan,
      requiredPlan: null,
    };
  }

  // Find the minimum plan that has this feature
  const requiredPlan = (['premium', 'pro'] as const).find(
    (plan) => SUBSCRIPTION_PLANS[plan].limits[feature]
  );

  return {
    hasAccess: false,
    currentPlan,
    requiredPlan: requiredPlan || 'premium',
    message: `This feature requires a ${requiredPlan || 'premium'} subscription`,
  };
}

/**
 * Check session usage limits
 */
export function checkSessionLimit(
  currentPlan: SubscriptionPlan,
  sessionsUsedThisMonth: number
): SubscriptionMiddlewareResult {
  const limit = SUBSCRIPTION_PLANS[currentPlan].limits.sessionsPerMonth;

  // -1 means unlimited
  if (limit === -1 || sessionsUsedThisMonth < limit) {
    return {
      hasAccess: true,
      currentPlan,
      requiredPlan: null,
    };
  }

  return {
    hasAccess: false,
    currentPlan,
    requiredPlan: 'premium',
    message: `You've reached your session limit (${limit} sessions/month). Upgrade to Premium for unlimited sessions.`,
  };
}

/**
 * Feature definitions with required plans
 */
export const FEATURE_REQUIREMENTS: Record<string, keyof PlanLimits> = {
  // Analysis features
  'advanced-analysis': 'advancedAnalysis',
  'racing-line-analysis': 'advancedAnalysis',
  'tire-analysis': 'advancedAnalysis',
  'fuel-analysis': 'advancedAnalysis',
  'sector-comparison': 'advancedAnalysis',

  // AI features
  'ai-coaching': 'aiAnalysis',
  'ai-insights': 'aiAnalysis',
  'race-predictions': 'aiAnalysis',

  // Social features
  'leaderboards': 'socialFeatures',
  'share-sessions': 'socialFeatures',
  'team-features': 'socialFeatures',

  // Storage features
  'cloud-sync': 'cloudStorage',
  'unlimited-sessions': 'sessionsPerMonth',
};

/**
 * Route protection mapping
 */
export const PROTECTED_ROUTES: Record<string, SubscriptionPlan> = {
  '/analysis/advanced': 'premium',
  '/analysis/ai-coaching': 'pro',
  '/analysis/racing-line': 'premium',
  '/analysis/tire-performance': 'premium',
  '/analysis/fuel-strategy': 'premium',
  '/social/leaderboards': 'premium',
  '/social/teams': 'pro',
  '/api/v1': 'pro', // API access
};

/**
 * Check if a route requires a specific subscription
 */
export function getRouteRequirement(pathname: string): SubscriptionPlan | null {
  for (const [route, plan] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname.startsWith(route)) {
      return plan;
    }
  }
  return null;
}

/**
 * Middleware helper to check route access
 */
export function checkRouteAccess(
  pathname: string,
  currentPlan: SubscriptionPlan
): SubscriptionMiddlewareResult {
  const requiredPlan = getRouteRequirement(pathname);

  if (!requiredPlan) {
    return {
      hasAccess: true,
      currentPlan,
      requiredPlan: null,
    };
  }

  const planHierarchy: SubscriptionPlan[] = ['free', 'premium', 'pro'];
  const currentIndex = planHierarchy.indexOf(currentPlan);
  const requiredIndex = planHierarchy.indexOf(requiredPlan);

  if (currentIndex >= requiredIndex) {
    return {
      hasAccess: true,
      currentPlan,
      requiredPlan: null,
    };
  }

  return {
    hasAccess: false,
    currentPlan,
    requiredPlan,
    message: `This page requires a ${SUBSCRIPTION_PLANS[requiredPlan].name} subscription`,
  };
}

/**
 * React hook helper for client-side access checks
 */
export function createAccessChecker(currentPlan: SubscriptionPlan) {
  return {
    canAccess: (feature: keyof PlanLimits) =>
      checkFeatureAccess(currentPlan, feature).hasAccess,

    canAccessRoute: (pathname: string) =>
      checkRouteAccess(pathname, currentPlan).hasAccess,

    canRecordSession: (sessionsUsed: number) =>
      checkSessionLimit(currentPlan, sessionsUsed).hasAccess,

    getFeatureRequirement: (feature: keyof PlanLimits) =>
      checkFeatureAccess(currentPlan, feature),

    getRouteRequirement: (pathname: string) =>
      checkRouteAccess(pathname, currentPlan),
  };
}
