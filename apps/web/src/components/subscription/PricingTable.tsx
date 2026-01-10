'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Switch,
  FormControlLabel,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Star as StarIcon,
  Bolt as BoltIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe';

interface PricingTableProps {
  currentPlan?: string;
  onPlanSelect?: (planId: string) => void;
}

interface PricingCardProps {
  plan: typeof SUBSCRIPTION_PLANS.free;
  planId: string;
  isCurrentPlan: boolean;
  isYearly: boolean;
  onSubscribe: () => void;
  loading: boolean;
  isPopular?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({
  plan,
  planId,
  isCurrentPlan,
  isYearly,
  onSubscribe,
  loading,
  isPopular = false,
}) => {
  const theme = useTheme();

  const yearlyPrice = plan.price * 10; // 2 months free
  const displayPrice = isYearly ? yearlyPrice : plan.price;
  const monthlyEquivalent = isYearly ? yearlyPrice / 12 : plan.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ height: '100%' }}
    >
      <Card
        sx={{
          height: '100%',
          position: 'relative',
          border: isPopular
            ? `2px solid ${theme.palette.primary.main}`
            : `1px solid ${theme.palette.divider}`,
          transform: isPopular ? 'scale(1.02)' : 'scale(1)',
          boxShadow: isPopular ? theme.shadows[8] : theme.shadows[2],
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: theme.shadows[8],
            transform: isPopular ? 'scale(1.03)' : 'scale(1.01)',
          },
        }}
      >
        {isPopular && (
          <Box
            sx={{
              position: 'absolute',
              top: -12,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1,
            }}
          >
            <Chip
              label="Most Popular"
              color="primary"
              icon={<StarIcon />}
              sx={{
                fontWeight: 600,
                px: 2,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                color: 'white',
              }}
            />
          </Box>
        )}

        {planId === 'pro' && (
          <Box
            sx={{
              position: 'absolute',
              top: -12,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1,
            }}
          >
            <Chip
              label="7-Day Free Trial"
              color="secondary"
              icon={<BoltIcon />}
              sx={{
                fontWeight: 600,
                px: 2,
              }}
            />
          </Box>
        )}

        <CardContent
          sx={{
            p: 3,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography
              variant="h5"
              sx={{ fontWeight: 600, mb: 1 }}
            >
              {plan.name}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2, minHeight: 40 }}
            >
              {plan.description}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'center',
                mb: 1,
              }}
            >
              <Typography
                variant="h3"
                sx={{ fontWeight: 700, color: 'primary.main' }}
              >
                ${displayPrice.toFixed(2)}
              </Typography>
              {plan.price > 0 && (
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ ml: 1 }}
                >
                  /{isYearly ? 'year' : 'month'}
                </Typography>
              )}
            </Box>
            {isYearly && plan.price > 0 && (
              <Typography variant="caption" color="success.main">
                ${monthlyEquivalent.toFixed(2)}/month (save 17%)
              </Typography>
            )}
          </Box>

          <List sx={{ flexGrow: 1, py: 0 }}>
            {plan.features.map((feature, index) => (
              <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CheckIcon color="primary" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={feature}
                  primaryTypographyProps={{
                    variant: 'body2',
                    color: 'text.primary',
                  }}
                />
              </ListItem>
            ))}
          </List>

          <Button
            variant={isCurrentPlan ? 'outlined' : isPopular ? 'contained' : 'outlined'}
            size="large"
            fullWidth
            onClick={onSubscribe}
            disabled={loading || isCurrentPlan || planId === 'free'}
            sx={{
              mt: 2,
              py: 1.5,
              fontWeight: 600,
              ...(isPopular &&
                !isCurrentPlan && {
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  '&:hover': {
                    background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                  },
                }),
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : isCurrentPlan ? (
              'Current Plan'
            ) : planId === 'free' ? (
              'Free Forever'
            ) : (
              'Get Started'
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function PricingTable({
  currentPlan = 'free',
  onPlanSelect,
}: PricingTableProps) {
  const [isYearly, setIsYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    if (planId === 'free' || planId === currentPlan) return;

    setLoadingPlan(planId);
    setError(null);

    try {
      if (onPlanSelect) {
        onPlanSelect(planId);
        return;
      }

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          billingPeriod: isYearly ? 'yearly' : 'monthly',
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else if (data.sessionId) {
        const stripe = await loadStripe(
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
        );
        if (stripe) {
          await stripe.redirectToCheckout({ sessionId: data.sessionId });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <Box>
      {/* Billing Toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <FormControlLabel
          control={
            <Switch
              checked={isYearly}
              onChange={(e) => setIsYearly(e.target.checked)}
              color="primary"
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography>Annual Billing</Typography>
              <Chip
                label="Save 17%"
                color="success"
                size="small"
                sx={{ fontWeight: 600 }}
              />
            </Box>
          }
        />
      </Box>

      {error && (
        <Typography color="error" sx={{ textAlign: 'center', mb: 2 }}>
          {error}
        </Typography>
      )}

      {/* Pricing Cards */}
      <Grid container spacing={3} alignItems="stretch">
        {Object.entries(SUBSCRIPTION_PLANS).map(([planId, plan]) => (
          <Grid item xs={12} md={4} key={planId}>
            <PricingCard
              plan={plan}
              planId={planId}
              isCurrentPlan={currentPlan === planId}
              isYearly={isYearly}
              onSubscribe={() => handleSubscribe(planId)}
              loading={loadingPlan === planId}
              isPopular={planId === 'premium'}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
