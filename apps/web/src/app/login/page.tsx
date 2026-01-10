'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
  Chip,
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  PlayArrow,
} from '@mui/icons-material';

// Demo mode constants (inline to avoid import issues)
const DEMO_MODE_KEY = 'gt7_demo_mode';
const DEMO_USER = {
  id: 'demo-user-123',
  email: 'demo@gt7telemetry.com',
  name: 'Demo Racer',
  stats: {
    totalSessions: 47,
    totalLaps: 1283,
    bestLapTime: 81234,
  },
};

function enableDemoMode() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DEMO_MODE_KEY, 'true');
    localStorage.setItem('gt7_demo_user', JSON.stringify(DEMO_USER));
  }
}

function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    const expired = searchParams?.get('expired');
    if (expired === 'true') {
      setLocalError('Your session has expired. Please log in again.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setIsLoading(true);

    if (!email || !password) {
      setLocalError('Email and password are required');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        const data = await response.json();
        setLocalError(data.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      setLocalError('Connection error. Try Demo Mode to explore the app.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoMode = () => {
    setDemoLoading(true);
    enableDemoMode();
    setTimeout(() => {
      router.push('/dashboard');
    }, 500);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: 4,
            width: '100%',
            maxWidth: 420,
            mx: 'auto',
            borderRadius: 4,
            bgcolor: 'rgba(255,255,255,0.95)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                mb: 1,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              GT7 Telemetry Pro
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Professional racing telemetry analysis
            </Typography>
          </Box>

          {/* Demo Mode CTA */}
          <Paper
            sx={{
              p: 3,
              mb: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: 3,
            }}
          >
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
              Try Demo Mode
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
              Explore the app with sample racing data - no account needed!
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <Chip label={`${DEMO_USER.stats.totalSessions} Sessions`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
              <Chip label={`${DEMO_USER.stats.totalLaps} Laps`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
            </Box>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleDemoMode}
              disabled={demoLoading}
              startIcon={demoLoading ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
              sx={{
                py: 1.5,
                bgcolor: 'rgba(255,255,255,0.2)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                fontWeight: 600,
              }}
            >
              {demoLoading ? 'Loading Demo...' : 'Enter Demo Mode'}
            </Button>
          </Paper>

          <Divider sx={{ my: 3 }}>
            <Chip label="or sign in" size="small" />
          </Divider>

          {localError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setLocalError('')}>
              {localError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoComplete="email"
              disabled={isLoading}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              autoComplete="current-password"
              disabled={isLoading}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={isLoading}
                      size="small"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                borderRadius: 2,
                bgcolor: 'grey.900',
                '&:hover': { bgcolor: 'grey.800' },
              }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Don&apos;t have an account?{' '}
                <Link href="/register" style={{ color: '#667eea', fontWeight: 600, textDecoration: 'none' }}>
                  Sign up
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)',
          }}
        >
          <CircularProgress sx={{ color: 'white' }} />
        </Box>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
