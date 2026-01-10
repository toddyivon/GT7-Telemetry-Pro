'use client';

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

const features = [
  { icon: SpeedIcon, text: 'Advanced telemetry analysis' },
  { icon: TimelineIcon, text: 'Racing line optimization' },
  { icon: CloudUploadIcon, text: 'Unlimited cloud storage' },
  { icon: DashboardIcon, text: 'Full dashboard access' },
  { icon: SettingsIcon, text: 'Priority support' },
];

// Component that uses useSearchParams - must be wrapped in Suspense
function SuccessContent() {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<{
    planName: string;
    status: string;
  } | null>(null);

  const verifySession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setSubscription({
          planName: data.planName || 'Premium',
          status: data.status || 'active',
        });
      }
    } catch (err) {
      console.error('Failed to verify session:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (sessionId) {
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

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 2,
        }}
      >
        <CircularProgress size={48} />
        <Typography color="text.secondary">Verifying your subscription...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => router.push('/subscribe')}>
          Try Again
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ py: 8, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            sx={{
              p: 4,
              textAlign: 'center',
              background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <CheckCircleIcon
                sx={{
                  fontSize: 80,
                  color: 'success.main',
                  mb: 2,
                }}
              />
            </motion.div>

            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Welcome to {subscription?.planName || 'Premium'}!
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Your subscription is now active. You have full access to all premium features.
            </Typography>

            <List sx={{ mb: 4 }}>
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <ListItem>
                    <ListItemIcon>
                      <feature.icon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={feature.text} />
                  </ListItem>
                </motion.div>
              ))}
            </List>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => router.push('/dashboard')}
                startIcon={<DashboardIcon />}
              >
                Go to Dashboard
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => router.push('/sessions')}
              >
                Start Racing
              </Button>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: 2,
          }}
        >
          <CircularProgress size={48} />
          <Typography color="text.secondary">Loading...</Typography>
        </Box>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
