'use client';

// Force dynamic rendering to prevent static generation errors
export const dynamic = 'force-dynamic';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  alpha,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Dashboard as DashboardIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  CloudUpload as CloudUploadIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function SubscriptionSuccessPage() {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<{
    planName: string;
    status: string;
  } | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (sessionId) {
      // Verify the session and get subscription details
      verifySession(sessionId);
    } else {
      setLoading(false);
    }

    // Trigger confetti
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#1976d2', '#9c27b0', '#4caf50'],
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#1976d2', '#9c27b0', '#4caf50'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, [searchParams]);

  const verifySession = async (sessionId: string) => {
    try {
      // In production, verify the session with your backend
      // For now, we'll simulate a successful verification
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSubscription({
        planName: 'Premium',
        status: 'active',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify subscription');
    } finally {
      setLoading(false);
    }
  };

  const nextSteps = [
    {
      icon: DashboardIcon,
      title: 'Explore Your Dashboard',
      description: 'View your racing statistics and recent sessions',
    },
    {
      icon: SpeedIcon,
      title: 'Record Your First Session',
      description: 'Connect to GT7 and start capturing telemetry data',
    },
    {
      icon: TimelineIcon,
      title: 'Analyze Your Laps',
      description: 'Use advanced analysis tools to improve your performance',
    },
    {
      icon: CloudUploadIcon,
      title: 'Sync Across Devices',
      description: 'Access your data from anywhere with cloud sync',
    },
  ];

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <Typography variant="h6">Verifying your subscription...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 6, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: 4,
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.success.main,
                0.1
              )} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'success.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 48, color: 'white' }} />
            </Box>

            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
              Welcome to {subscription?.planName || 'Premium'}!
            </Typography>

            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}
            >
              Your subscription is now active. Get ready to take your racing
              performance to the next level!
            </Typography>

            {error && (
              <Alert severity="warning" sx={{ mb: 4 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ mb: 4 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, mb: 3 }}
              >
                Here is what you can do next:
              </Typography>

              <List sx={{ maxWidth: 400, mx: 'auto' }}>
                {nextSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                  >
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <step.icon color="primary" />
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={step.title}
                        secondary={step.description}
                        primaryTypographyProps={{ fontWeight: 500 }}
                      />
                    </ListItem>
                  </motion.div>
                ))}
              </List>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<DashboardIcon />}
                onClick={() => router.push('/dashboard')}
                sx={{
                  px: 4,
                  py: 1.5,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                }}
              >
                Go to Dashboard
              </Button>

              <Button
                variant="outlined"
                size="large"
                startIcon={<SettingsIcon />}
                onClick={() => router.push('/settings?tab=billing')}
              >
                Manage Subscription
              </Button>
            </Box>
          </Paper>
        </motion.div>

        {/* Quick tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Paper sx={{ p: 4, mt: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Quick Tips for Getting Started
            </Typography>

            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                <strong>Connect your PS5:</strong> Make sure your PlayStation 5 is on
                the same network as your computer for telemetry streaming.
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                <strong>Start with familiar tracks:</strong> Begin analyzing laps on
                tracks you know well to understand the insights better.
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                <strong>Compare your laps:</strong> Use the lap comparison feature to
                see where you are gaining or losing time.
              </Typography>
              <Typography component="li" variant="body2">
                <strong>Check your email:</strong> We have sent you a welcome email with
                more tips and resources.
              </Typography>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
}
