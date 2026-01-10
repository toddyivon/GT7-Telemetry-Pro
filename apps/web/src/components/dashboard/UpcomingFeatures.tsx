'use client';

import React from 'react';
import Link from 'next/link';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  useTheme,
  alpha,
  Divider,
} from '@mui/material';
import {
  AutoGraph as AIIcon,
  CloudSync as CloudIcon,
  Groups as TeamsIcon,
  Speed as RealTimeIcon,
  VideoLibrary as VideoIcon,
  Insights as InsightsIcon,
  Star as PremiumIcon,
  Lock as LockIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

import { useUserStore } from '@/lib/stores/userStore';

interface Feature {
  icon: React.ReactElement;
  title: string;
  description: string;
  available: boolean;
  tier: 'free' | 'premium' | 'coming_soon';
}

const features: Feature[] = [
  {
    icon: <AIIcon />,
    title: 'AI Racing Coach',
    description: 'Get personalized tips to improve lap times',
    available: false,
    tier: 'premium',
  },
  {
    icon: <CloudIcon />,
    title: 'Cloud Sync',
    description: 'Access your data from any device',
    available: true,
    tier: 'premium',
  },
  {
    icon: <TeamsIcon />,
    title: 'Team Comparisons',
    description: 'Compare lap times with friends and rivals',
    available: false,
    tier: 'premium',
  },
  {
    icon: <RealTimeIcon />,
    title: 'Real-time Telemetry',
    description: 'Live data streaming from your console',
    available: true,
    tier: 'free',
  },
  {
    icon: <VideoIcon />,
    title: 'Video Overlay',
    description: 'Add telemetry overlays to your videos',
    available: false,
    tier: 'coming_soon',
  },
  {
    icon: <InsightsIcon />,
    title: 'Advanced Analytics',
    description: 'Sector analysis and improvement suggestions',
    available: false,
    tier: 'premium',
  },
];

export default function UpcomingFeatures() {
  const theme = useTheme();
  const { user } = useUserStore();
  const isPremium = user?.subscriptionStatus === 'premium';

  const getTierChip = (tier: Feature['tier']) => {
    switch (tier) {
      case 'free':
        return (
          <Chip
            label="Free"
            size="small"
            color="success"
            variant="outlined"
            sx={{ height: 20, fontSize: '0.65rem' }}
          />
        );
      case 'premium':
        return (
          <Chip
            icon={<PremiumIcon sx={{ fontSize: '0.9rem !important' }} />}
            label="Premium"
            size="small"
            color="primary"
            sx={{ height: 20, fontSize: '0.65rem' }}
          />
        );
      case 'coming_soon':
        return (
          <Chip
            label="Coming Soon"
            size="small"
            color="warning"
            variant="outlined"
            sx={{ height: 20, fontSize: '0.65rem' }}
          />
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card
        sx={{
          height: '100%',
          background: `linear-gradient(145deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(
            theme.palette.secondary.main,
            0.04
          )} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
        }}
      >
        <CardContent>
          {/* Header */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <PremiumIcon sx={{ color: 'primary.main' }} />
              <Typography variant="titleLarge" sx={{ fontWeight: 600 }}>
                {isPremium ? 'Premium Features' : 'Upgrade to Premium'}
              </Typography>
            </Box>
            <Typography variant="bodySmall" color="text.secondary">
              {isPremium
                ? 'Enjoy all premium features'
                : 'Unlock powerful tools to improve your racing'}
            </Typography>
          </Box>

          {/* Feature List */}
          <List dense sx={{ py: 0 }}>
            {features.map((feature, index) => {
              const isLocked = feature.tier === 'premium' && !isPremium;
              const isComingSoon = feature.tier === 'coming_soon';

              return (
                <React.Fragment key={feature.title}>
                  <ListItem
                    sx={{
                      px: 0,
                      py: 1,
                      opacity: isLocked || isComingSoon ? 0.7 : 1,
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 36,
                        color: isLocked ? 'text.disabled' : 'primary.main',
                      }}
                    >
                      {isLocked ? <LockIcon fontSize="small" /> : feature.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="bodySmall"
                            sx={{
                              fontWeight: 500,
                              textDecoration: isLocked ? 'none' : 'none',
                            }}
                          >
                            {feature.title}
                          </Typography>
                          {getTierChip(feature.tier)}
                        </Box>
                      }
                      secondary={
                        <Typography variant="labelSmall" color="text.secondary">
                          {feature.description}
                        </Typography>
                      }
                    />
                    {feature.tier === 'free' && feature.available && (
                      <CheckIcon sx={{ color: 'success.main', fontSize: 18 }} />
                    )}
                  </ListItem>
                  {index < features.length - 1 && <Divider component="li" />}
                </React.Fragment>
              );
            })}
          </List>

          {/* CTA */}
          {!isPremium && (
            <Box sx={{ mt: 3 }}>
              <Button
                component={Link}
                href="/subscribe"
                variant="contained"
                fullWidth
                size="large"
                startIcon={<PremiumIcon />}
                sx={{
                  py: 1.5,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
                  },
                }}
              >
                Upgrade to Premium
              </Button>
              <Typography
                variant="labelSmall"
                color="text.secondary"
                sx={{ display: 'block', textAlign: 'center', mt: 1 }}
              >
                Starting at $9.99/month
              </Typography>
            </Box>
          )}

          {isPremium && (
            <Box
              sx={{
                mt: 3,
                p: 2,
                bgcolor: alpha(theme.palette.success.main, 0.1),
                borderRadius: 2,
                textAlign: 'center',
              }}
            >
              <CheckIcon sx={{ color: 'success.main', mb: 0.5 }} />
              <Typography variant="bodySmall" sx={{ fontWeight: 600 }}>
                You have Premium access
              </Typography>
              <Typography variant="labelSmall" color="text.secondary">
                Thank you for supporting GT7 Analytics!
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
