'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Lock as LockIcon,
  Star as StarIcon,
  Check as CheckIcon,
  Bolt as BoltIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from '@/lib/stripe';

interface UpgradePromptProps {
  feature: string;
  requiredPlan?: SubscriptionPlan;
  currentPlan?: SubscriptionPlan;
  variant?: 'inline' | 'card' | 'dialog';
  open?: boolean;
  onClose?: () => void;
}

export default function UpgradePrompt({
  feature,
  requiredPlan = 'premium',
  currentPlan = 'free',
  variant = 'card',
  open = true,
  onClose,
}: UpgradePromptProps) {
  const theme = useTheme();
  const router = useRouter();

  const plan = SUBSCRIPTION_PLANS[requiredPlan];

  const handleUpgrade = () => {
    router.push('/subscribe');
  };

  const content = (
    <Box sx={{ textAlign: 'center' }}>
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          bgcolor: alpha(theme.palette.warning.main, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 2,
        }}
      >
        <LockIcon sx={{ fontSize: 32, color: 'warning.main' }} />
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
        Upgrade to {plan.name}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {feature} requires a {plan.name} subscription.
      </Typography>

      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.primary.main, 0.05),
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
            ${plan.price}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            /month
          </Typography>
        </Box>

        <List dense sx={{ maxWidth: 280, mx: 'auto' }}>
          {plan.features.slice(0, 4).map((feature, index) => (
            <ListItem key={index} sx={{ px: 0, py: 0.25 }}>
              <ListItemIcon sx={{ minWidth: 28 }}>
                <CheckIcon color="primary" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={feature}
                primaryTypographyProps={{
                  variant: 'caption',
                }}
              />
            </ListItem>
          ))}
        </List>

        {requiredPlan === 'pro' && (
          <Chip
            label="7-Day Free Trial"
            color="secondary"
            size="small"
            icon={<BoltIcon />}
            sx={{ mt: 1 }}
          />
        )}
      </Box>

      <Button
        variant="contained"
        size="large"
        onClick={handleUpgrade}
        startIcon={<StarIcon />}
        sx={{
          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          '&:hover': {
            background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
          },
        }}
      >
        Upgrade Now
      </Button>
    </Box>
  );

  if (variant === 'dialog') {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pb: 0 }}>
          Premium Feature
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>{content}</DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button onClick={onClose} color="inherit">
            Maybe Later
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  if (variant === 'inline') {
    return (
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: alpha(theme.palette.warning.main, 0.05),
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <LockIcon color="warning" />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {feature} is a {plan.name} feature
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Upgrade to access this feature
          </Typography>
        </Box>
        <Button variant="outlined" size="small" onClick={handleUpgrade}>
          Upgrade
        </Button>
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card
        sx={{
          maxWidth: 400,
          mx: 'auto',
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <CardContent sx={{ p: 4 }}>{content}</CardContent>
      </Card>
    </motion.div>
  );
}

// Hook to check if feature requires upgrade
export function useFeatureAccess(
  feature: keyof typeof SUBSCRIPTION_PLANS.free.limits,
  currentPlan: SubscriptionPlan = 'free'
) {
  const plan = SUBSCRIPTION_PLANS[currentPlan];
  const hasAccess = plan.limits[feature];

  return {
    hasAccess,
    requiresPlan: hasAccess
      ? currentPlan
      : Object.entries(SUBSCRIPTION_PLANS).find(
          ([_, p]) => p.limits[feature]
        )?.[0] as SubscriptionPlan,
  };
}
