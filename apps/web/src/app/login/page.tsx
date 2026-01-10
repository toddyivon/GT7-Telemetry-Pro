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
  Login as LoginIcon,
  PlayArrow as DemoIcon,
} from '@mui/icons-material';
import { enableDemoMode, DEMO_USER } from '@/lib/mockData';

function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const searchParams = useSearchParams();

  // Check for session expiration message
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
    // Redirect to dashboard after enabling demo mode
    setTimeout(() => {
      router.push('/dashboard');
    }, 500);
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            maxWidth: 420,
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <LoginIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom>
              GT7 Telemetry Pro
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Professional racing telemetry analysis
            </Typography>
          </Box>

          {/* Demo Mode Banner */}
          <Paper
            sx={{
              p: 2,
              mb: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Try Demo Mode
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
              Explore the app with sample racing data - no account needed!
            </Typography>
            <Button
              fullWidth
              variant="contained"
              onClick={handleDemoMode}
              disabled={demoLoading}
              startIcon={demoLoading ? <CircularProgress size={16} color="inherit" /> : <DemoIcon />}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
              }}
            >
              {demoLoading ? 'Loading Demo...' : 'Enter Demo Mode'}
            </Button>
          </Paper>

          <Divider sx={{ my: 2 }}>
            <Chip label="or sign in" size="small" />
          </Divider>

          {localError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setLocalError('')}>
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
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email />
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
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={isLoading}
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
              sx={{ mt: 3, mb: 2 }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2">
                Don&apos;t have an account?{' '}
                <Link href="/register" style={{ color: 'inherit', fontWeight: 600 }}>
                  Sign up
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    }>
      <LoginForm />
    </Suspense>
  );
}
