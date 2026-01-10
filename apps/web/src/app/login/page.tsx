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
  Stack,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  Analytics as AnalyticsIcon,
  EmojiEvents as TrophyIcon,
  ArrowForward,
  PlayArrow,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { enableDemoMode, DEMO_USER } from '@/lib/mockData';

const MotionBox = motion(Box);
const MotionPaper = motion(Paper);

// Animated racing line background
function RacingBackground() {
  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        zIndex: 0,
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)',
      }}
    >
      {/* Animated grid lines */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(102, 126, 234, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(102, 126, 234, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'gridMove 20s linear infinite',
          '@keyframes gridMove': {
            '0%': { transform: 'translateY(0)' },
            '100%': { transform: 'translateY(50px)' },
          },
        }}
      />
      {/* Glowing orbs */}
      <Box
        sx={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(102, 126, 234, 0.3) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'float 8s ease-in-out infinite',
          '@keyframes float': {
            '0%, 100%': { transform: 'translateY(0) scale(1)' },
            '50%': { transform: 'translateY(-30px) scale(1.1)' },
          },
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '20%',
          right: '10%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(118, 75, 162, 0.3) 0%, transparent 70%)',
          filter: 'blur(50px)',
          animation: 'float 10s ease-in-out infinite reverse',
        }}
      />
    </Box>
  );
}

// Feature highlight component
function FeatureCard({ icon: Icon, title, delay }: { icon: any; title: string; delay: number }) {
  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 2,
        py: 1,
        borderRadius: 2,
        bgcolor: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <Icon sx={{ fontSize: 20, color: 'primary.light' }} />
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
        {title}
      </Typography>
    </MotionBox>
  );
}

function LoginForm() {
  const theme = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    const expired = searchParams?.get('expired');
    if (expired === 'true') {
      setLocalError('Your session has expired. Please log in again.');
      setShowLoginForm(true);
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
    }, 800);
  };

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
      <RacingBackground />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            justifyContent: 'center',
            gap: { xs: 4, md: 8 },
            py: 4,
          }}
        >
          {/* Left side - Hero content */}
          <MotionBox
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            sx={{ flex: 1, maxWidth: 500, textAlign: { xs: 'center', md: 'left' } }}
          >
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  color: 'white',
                  mb: 2,
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  background: 'linear-gradient(135deg, #fff 0%, #a78bfa 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                GT7 Telemetry Pro
              </Typography>
              <Typography
                variant="h5"
                sx={{ color: 'rgba(255,255,255,0.7)', mb: 3, fontWeight: 400 }}
              >
                Professional racing telemetry analysis for Gran Turismo 7
              </Typography>
            </Box>

            {/* Features */}
            <Stack
              direction="row"
              flexWrap="wrap"
              gap={1}
              sx={{ mb: 4, justifyContent: { xs: 'center', md: 'flex-start' } }}
            >
              <FeatureCard icon={SpeedIcon} title="Real-time Data" delay={0.2} />
              <FeatureCard icon={TimelineIcon} title="Racing Line Analysis" delay={0.3} />
              <FeatureCard icon={AnalyticsIcon} title="AI Coaching" delay={0.4} />
              <FeatureCard icon={TrophyIcon} title="Leaderboards" delay={0.5} />
            </Stack>

            {/* Demo stats preview */}
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <Typography variant="overline" sx={{ color: 'primary.light', letterSpacing: 2 }}>
                Demo Stats Preview
              </Typography>
              <Box sx={{ display: 'flex', gap: 4, mt: 2, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    {DEMO_USER.stats.totalSessions}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    Sessions
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    {DEMO_USER.stats.totalLaps.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    Laps
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    1:21.234
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    Best Lap
                  </Typography>
                </Box>
              </Box>
            </MotionBox>
          </MotionBox>

          {/* Right side - Login card */}
          <MotionPaper
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            elevation={0}
            sx={{
              p: 4,
              width: '100%',
              maxWidth: 420,
              borderRadius: 4,
              bgcolor: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Primary CTA - Demo Mode */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                Try it Now
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Experience the full app with sample racing data
              </Typography>
            </Box>

            <MotionBox
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleDemoMode}
                disabled={demoLoading}
                startIcon={
                  demoLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <PlayArrow />
                  )
                }
                endIcon={!demoLoading && <ArrowForward />}
                sx={{
                  py: 2,
                  px: 4,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 10px 40px -10px rgba(102, 126, 234, 0.5)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)',
                    boxShadow: '0 15px 50px -10px rgba(102, 126, 234, 0.6)',
                  },
                  '&:disabled': {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    opacity: 0.7,
                  },
                }}
              >
                {demoLoading ? 'Loading Demo...' : 'Enter Demo Mode'}
              </Button>
            </MotionBox>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 3 }}>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {[SpeedIcon, TimelineIcon, AnalyticsIcon].map((Icon, i) => (
                  <Icon key={i} sx={{ fontSize: 16, color: 'text.disabled' }} />
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary">
                Full access to all features with sample data
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }}>
              <Chip
                label="or sign in with account"
                size="small"
                sx={{ fontSize: '0.75rem' }}
              />
            </Divider>

            <AnimatePresence mode="wait">
              {!showLoginForm ? (
                <MotionBox
                  key="toggle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setShowLoginForm(true)}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      borderColor: 'divider',
                      color: 'text.secondary',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'transparent',
                      },
                    }}
                  >
                    Sign in with Email
                  </Button>
                </MotionBox>
              ) : (
                <MotionBox
                  key="form"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {localError && (
                    <Alert
                      severity="error"
                      sx={{ mb: 2, borderRadius: 2 }}
                      onClose={() => setLocalError('')}
                    >
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
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
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
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
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
                        <Link
                          href="/register"
                          style={{
                            color: theme.palette.primary.main,
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          Sign up
                        </Link>
                      </Typography>
                    </Box>
                  </Box>

                  <Button
                    size="small"
                    onClick={() => setShowLoginForm(false)}
                    sx={{ mt: 2, color: 'text.secondary' }}
                  >
                    Back to Demo Mode
                  </Button>
                </MotionBox>
              )}
            </AnimatePresence>
          </MotionPaper>
        </Box>
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
