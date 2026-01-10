'use client';

import React, { useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Chip,
  Stack,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Analytics as AnalyticsIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  DirectionsCar as CarIcon,
  Flag as FlagIcon,
  Timer as TimerIcon,
  CloudUpload as UploadIcon,
  PlayArrow as PlayArrowIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useUserStore, mockUser } from '@/lib/stores/userStore';

const FeatureCard = ({ 
  icon, 
  title, 
  description, 
  color, 
  action,
  delay = 0 
}: {
  icon: React.ReactElement;
  title: string;
  description: string;
  color: 'primary' | 'secondary' | 'success' | 'warning';
  action: () => void;
  delay?: number;
}) => {
  const theme = useTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.05)} 0%, ${alpha(theme.palette[color].main, 0.02)} 100%)`,
          border: `1px solid ${alpha(theme.palette[color].main, 0.12)}`,
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[8],
            transition: 'all 0.3s ease-in-out',
          },
        }}
      >
        <CardContent sx={{ flexGrow: 1, p: 3 }}>
          <Avatar
            sx={{
              bgcolor: `${color}.main`,
              width: 64,
              height: 64,
              mb: 2,
            }}
          >
            {icon}
          </Avatar>
          <Typography variant="titleLarge" sx={{ fontWeight: 600, mb: 1 }}>
            {title}
          </Typography>
          <Typography variant="bodyMedium" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            {description}
          </Typography>
        </CardContent>
        <CardActions sx={{ p: 3, pt: 0 }}>
          <Button
            variant="contained"
            color={color}
            endIcon={<ArrowForwardIcon />}
            onClick={action}
            sx={{
              borderRadius: 3,
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            Get Started
          </Button>
        </CardActions>
      </Card>
    </motion.div>
  );
};

const StatItem = ({ 
  icon, 
  value, 
  label, 
  color,
  delay = 0 
}: {
  icon: React.ReactElement;
  value: string;
  label: string;
  color: 'primary' | 'secondary' | 'success' | 'warning';
  delay?: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <Avatar
          sx={{
            bgcolor: `${color}.main`,
            width: 56,
            height: 56,
            mx: 'auto',
            mb: 2,
          }}
        >
          {icon}
        </Avatar>
        <Typography variant="headlineMedium" sx={{ fontWeight: 700, mb: 0.5 }}>
          {value}
        </Typography>
        <Typography variant="bodyMedium" color="text.secondary">
          {label}
        </Typography>
      </Box>
    </motion.div>
  );
};

export default function MaterialHome() {
  const theme = useTheme();
  const router = useRouter();
  const { user, setUser, isAuthenticated } = useUserStore();

  // Initialize mock user for development
  useEffect(() => {
    if (!isAuthenticated) {
      setUser(mockUser);
    }
  }, [isAuthenticated, setUser]);

  const features = [
    {
      icon: <TimelineIcon />,
      title: 'Real-time Telemetry',
      description: 'Connect directly to your PS5 and capture live telemetry data from Gran Turismo 7 races and practice sessions.',
      color: 'primary' as const,
      action: () => router.push('/telemetry/connect'),
    },
    {
      icon: <AnalyticsIcon />,
      title: 'Advanced Analytics',
      description: 'Analyze your racing lines, braking points, and cornering techniques with professional-grade data visualization.',
      color: 'secondary' as const,
      action: () => router.push('/analysis'),
    },
    {
      icon: <TrendingUpIcon />,
      title: 'Performance Insights',
      description: 'Track your improvement over time with detailed performance metrics and personalized recommendations.',
      color: 'success' as const,
      action: () => router.push('/dashboard'),
    },
    {
      icon: <UploadIcon />,
      title: 'Data Management',
      description: 'Upload, organize, and manage your telemetry files with our intuitive data management system.',
      color: 'warning' as const,
      action: () => router.push('/telemetry/upload'),
    },
  ];

  const stats = [
    {
      icon: <SpeedIcon />,
      value: '10K+',
      label: 'Laps Analyzed',
      color: 'primary' as const,
    },
    {
      icon: <CarIcon />,
      value: '500+',
      label: 'Active Users',
      color: 'secondary' as const,
    },
    {
      icon: <FlagIcon />,
      value: '50+',
      label: 'Tracks Supported',
      color: 'success' as const,
    },
    {
      icon: <TimerIcon />,
      value: '0.1s',
      label: 'Lap Time Precision',
      color: 'warning' as const,
    },
  ];

  // Don't render user section if no user data
  if (!user) {
    return (
      <Box sx={{ overflow: 'auto', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ overflow: 'auto', height: '100%' }}>
      {/* User Welcome Section */}
      <Box sx={{ py: 3, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Avatar
                  src={user.avatar}
                  alt={user.name}
                  sx={{
                    width: 80,
                    height: 80,
                    border: `3px solid ${theme.palette.primary.main}`,
                    boxShadow: theme.shadows[4],
                  }}
                >
                  {user.name.split(' ').map(n => n[0]).join('')}
                </Avatar>
                <Box>
                  <Typography variant="headlineSmall" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Welcome back, {user.name}
                  </Typography>
                  <Typography variant="bodyLarge" color="text.secondary" sx={{ mb: 1 }}>
                    Pilot: <strong>{user.pilotName}</strong>
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Chip
                      label={user.subscriptionStatus === 'premium' ? 'Premium Member' : 'Free Member'}
                      color={user.subscriptionStatus === 'premium' ? 'primary' : 'default'}
                      variant="filled"
                      icon={user.subscriptionStatus === 'premium' ? <CarIcon /> : undefined}
                      size="small"
                    />
                    <Typography variant="bodySmall" color="text.secondary">
                      Member since {user.joinDate}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 3, textAlign: 'center' }}>
                <Box>
                  <Typography variant="titleMedium" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {user.stats.totalSessions}
                  </Typography>
                  <Typography variant="bodySmall" color="text.secondary">
                    Sessions
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="titleMedium" sx={{ fontWeight: 600, color: 'racing.green' }}>
                    {user.stats.bestLapTime}
                  </Typography>
                  <Typography variant="bodySmall" color="text.secondary">
                    Best Lap
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="titleMedium" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                    {user.stats.favoriteTrack}
                  </Typography>
                  <Typography variant="bodySmall" color="text.secondary">
                    Favorite Track
                  </Typography>
                </Box>
              </Box>

              {user.subscriptionStatus === 'free' && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<CarIcon />}
                  onClick={() => router.push('/subscribe')}
                  sx={{
                    borderRadius: 3,
                    px: 3,
                    py: 1,
                    fontWeight: 600,
                    textTransform: 'none',
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    '&:hover': {
                      background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                    },
                  }}
                >
                  Upgrade to Premium
                </Button>
              )}
            </Box>
          </motion.div>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          py: 8,
        }}
      >
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <Typography 
                variant="displayMedium" 
                sx={{ 
                  fontWeight: 700,
                  mb: 2,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                GT7 Data Analysis
              </Typography>
              <Typography 
                variant="headlineSmall" 
                color="text.secondary" 
                sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}
              >
                Professional racing telemetry analysis for Gran Turismo 7. 
                Optimize your performance with data-driven insights.
              </Typography>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                justifyContent="center"
                alignItems="center"
              >
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<PlayArrowIcon />}
                  onClick={() => router.push('/dashboard')}
                  sx={{
                    borderRadius: 4,
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    minWidth: 200,
                  }}
                >
                  Launch Dashboard
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<UploadIcon />}
                  onClick={() => router.push('/telemetry/upload')}
                  sx={{
                    borderRadius: 4,
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    minWidth: 200,
                  }}
                >
                  Upload Data
                </Button>
              </Stack>
            </Box>
          </motion.div>
        </Container>
      </Box>

      {/* Stats Section */}
      <Box sx={{ py: 6, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={stat.label}>
                <StatItem {...stat} delay={index * 0.1} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 8 }}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <Typography variant="headlineLarge" sx={{ fontWeight: 600, mb: 2 }}>
                Powerful Features
              </Typography>
              <Typography variant="bodyLarge" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
                Everything you need to analyze and improve your racing performance
              </Typography>
            </Box>
          </motion.div>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} key={feature.title}>
                <FeatureCard {...feature} delay={0.5 + index * 0.1} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          py: 8,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)`,
        }}
      >
        <Container maxWidth="md">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="headlineMedium" sx={{ fontWeight: 600, mb: 2 }}>
                Ready to Improve Your Racing?
              </Typography>
              <Typography variant="bodyLarge" color="text.secondary" sx={{ mb: 4 }}>
                Join thousands of drivers who are already using GT7 Data Analysis to optimize their performance
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Chip label="Free Trial Available" color="success" variant="filled" />
                <Chip label="PS5 Compatible" color="primary" variant="filled" />
                <Chip label="Real-time Analysis" color="secondary" variant="filled" />
              </Box>
              <Button
                variant="contained"
                size="large"
                onClick={() => router.push('/telemetry/connect')}
                sx={{
                  mt: 4,
                  borderRadius: 4,
                  px: 6,
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                Start Analyzing Today
              </Button>
            </Box>
          </motion.div>
        </Container>
      </Box>
    </Box>
  );
}