'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  LinearProgress,
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe';

interface Subscription {
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
}

interface SubscriptionCardProps {
  subscription: Subscription | null;
  onManageBilling?: () => void;
  onUpgrade?: () => void;
}

export default function SubscriptionCard({
  subscription,
  onManageBilling,
  onUpgrade,
}: SubscriptionCardProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleManageBilling = async () => {
    if (!subscription?.customerId) {
      if (onUpgrade) onUpgrade();
      return;
    }

    setLoading(true);
    setError(null);

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
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'trialing':
        return 'info';
      case 'past_due':
        return 'warning';
      case 'canceled':
      case 'unpaid':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'trialing':
        return 'Trial';
      case 'past_due':
        return 'Past Due';
      case 'canceled':
        return 'Canceled';
      case 'unpaid':
        return 'Unpaid';
      default:
        return status;
    }
  };

  // Calculate days remaining
  const getDaysRemaining = () => {
    if (!subscription) return 0;
    const now = Date.now() / 1000;
    const daysRemaining = Math.max(
      0,
      Math.ceil((subscription.currentPeriodEnd - now) / (24 * 60 * 60))
    );
    return daysRemaining;
  };

  // Calculate usage percentage (demo)
  const getUsagePercentage = () => {
    if (!subscription) return 0;
    const now = Date.now() / 1000;
    const periodDuration = subscription.currentPeriodEnd - subscription.currentPeriodStart;
    const elapsed = now - subscription.currentPeriodStart;
    return Math.min(100, Math.max(0, (elapsed / periodDuration) * 100));
  };

  const plan = subscription?.planId
    ? SUBSCRIPTION_PLANS[subscription.planId as keyof typeof SUBSCRIPTION_PLANS]
    : SUBSCRIPTION_PLANS.free;

  return (
    <Card
      sx={{
        height: '100%',
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              Current Subscription
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your plan and billing
            </Typography>
          </Box>
          {subscription && (
            <Chip
              label={getStatusLabel(subscription.status)}
              color={getStatusColor(subscription.status) as any}
              size="small"
              icon={
                subscription.status === 'active' ? (
                  <CheckCircleIcon />
                ) : subscription.status === 'past_due' ? (
                  <WarningIcon />
                ) : undefined
              }
            />
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {plan?.name || 'Free'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {plan?.description}
              </Typography>
            </Box>
            <TrendingUpIcon color="primary" sx={{ fontSize: 40, opacity: 0.5 }} />
          </Box>

          {subscription && subscription.planId !== 'free' && (
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {formatPrice(subscription.amount, subscription.currency)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                /{subscription.interval}
              </Typography>
            </Box>
          )}
        </Box>

        {subscription && subscription.planId !== 'free' && (
          <>
            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CalendarIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Billing Period
                </Typography>
              </Box>
              <Typography variant="body1">
                {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
              </Typography>

              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Period Progress
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getDaysRemaining()} days remaining
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getUsagePercentage()}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            </Box>

            {subscription.cancelAtPeriodEnd && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Your subscription will be canceled at the end of the current billing period.
              </Alert>
            )}

            {subscription.status === 'past_due' && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Your payment is past due. Please update your payment method to continue using premium features.
              </Alert>
            )}
          </>
        )}

        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          {subscription && subscription.planId !== 'free' ? (
            <Button
              variant="outlined"
              fullWidth
              onClick={handleManageBilling}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : <CreditCardIcon />}
            >
              Manage Billing
            </Button>
          ) : (
            <Button
              variant="contained"
              fullWidth
              onClick={onUpgrade}
              startIcon={<TrendingUpIcon />}
            >
              Upgrade Plan
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
