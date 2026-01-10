'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { SUBSCRIPTION_PLANS, SubscriptionPlan, PlanLimits } from '@/lib/stripe';
import {
  checkFeatureAccess,
  checkSessionLimit,
  checkRouteAccess,
  createAccessChecker,
} from '@/middleware/subscription';

interface Subscription {
  id: string;
  status: string;
  planId: SubscriptionPlan;
  planName: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  customerId: string;
}

interface UseSubscriptionResult {
  subscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
  currentPlan: SubscriptionPlan;
  planDetails: typeof SUBSCRIPTION_PLANS.free;
  isActive: boolean;
  isPremium: boolean;
  isPro: boolean;
  isFree: boolean;
  daysRemaining: number;
  canAccess: (feature: keyof PlanLimits) => boolean;
  canAccessRoute: (pathname: string) => boolean;
  canRecordSession: (sessionsUsed: number) => boolean;
  getFeatureRequirement: (feature: keyof PlanLimits) => ReturnType<typeof checkFeatureAccess>;
  refetch: () => Promise<void>;
  openBillingPortal: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionResult {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/stripe/get-subscription');
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.subscription) {
        setSubscription(data.subscription);
      } else {
        setSubscription(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const currentPlan = useMemo((): SubscriptionPlan => {
    if (!subscription) return 'free';
    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      return 'free';
    }
    return subscription.planId as SubscriptionPlan;
  }, [subscription]);

  const planDetails = useMemo(() => {
    return SUBSCRIPTION_PLANS[currentPlan];
  }, [currentPlan]);

  const isActive = useMemo(() => {
    if (!subscription) return false;
    return subscription.status === 'active' || subscription.status === 'trialing';
  }, [subscription]);

  const isPremium = currentPlan === 'premium';
  const isPro = currentPlan === 'pro';
  const isFree = currentPlan === 'free';

  const daysRemaining = useMemo(() => {
    if (!subscription) return 0;
    const now = Date.now() / 1000;
    return Math.max(
      0,
      Math.ceil((subscription.currentPeriodEnd - now) / (24 * 60 * 60))
    );
  }, [subscription]);

  const accessChecker = useMemo(
    () => createAccessChecker(currentPlan),
    [currentPlan]
  );

  const openBillingPortal = useCallback(async () => {
    if (!subscription?.customerId) {
      window.location.href = '/subscribe';
      return;
    }

    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: subscription.customerId,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open billing portal');
    }
  }, [subscription]);

  return {
    subscription,
    isLoading,
    error,
    currentPlan,
    planDetails,
    isActive,
    isPremium,
    isPro,
    isFree,
    daysRemaining,
    canAccess: accessChecker.canAccess,
    canAccessRoute: accessChecker.canAccessRoute,
    canRecordSession: accessChecker.canRecordSession,
    getFeatureRequirement: accessChecker.getFeatureRequirement,
    refetch: fetchSubscription,
    openBillingPortal,
  };
}

/**
 * Hook for checking a specific feature access
 */
export function useFeatureAccess(feature: keyof PlanLimits) {
  const { currentPlan, isLoading } = useSubscription();

  const result = useMemo(() => {
    return checkFeatureAccess(currentPlan, feature);
  }, [currentPlan, feature]);

  return {
    ...result,
    isLoading,
  };
}

/**
 * Hook for checking session recording limits
 */
export function useSessionLimit(sessionsUsedThisMonth: number) {
  const { currentPlan, isLoading, planDetails } = useSubscription();

  const result = useMemo(() => {
    return checkSessionLimit(currentPlan, sessionsUsedThisMonth);
  }, [currentPlan, sessionsUsedThisMonth]);

  const limit = planDetails.limits.sessionsPerMonth;
  const remaining = limit === -1 ? Infinity : Math.max(0, limit - sessionsUsedThisMonth);

  return {
    ...result,
    isLoading,
    limit,
    remaining,
    isUnlimited: limit === -1,
  };
}
