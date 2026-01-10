'use client';

import React, { useEffect } from 'react';
import { useQuery } from 'convex/react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Button,
  Skeleton,
  Alert,
  alpha,
  useTheme,
  IconButton,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Star as StarIcon,
  Refresh as RefreshIcon,
  GridView as GridViewIcon,
  ViewList as ListViewIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import Link from 'next/link';

import PerformanceMetrics from './PerformanceMetrics';
import RecentSessionsTable from './RecentSessionsTable';
import QuickStats from './QuickStats';
import LapTimeProgress from './LapTimeProgress';
import TrackDistribution from './TrackDistribution';
import ActivityCalendar from './ActivityCalendar';
import UpcomingFeatures from './UpcomingFeatures';

import {
  useDashboardStore,
  calculateDashboardStats,
  calculateTrackDistribution,
  calculateLapTimeProgress,
  calculateActivityData,
  getDateRangeForTimeRange,
} from '@/lib/stores/dashboardStore';
import { useUserStore } from '@/lib/stores/userStore';

// Try to import the generated API, fallback to mock data if not available
let api: any;
let useConvexQuery = true;

try {
  const convexApi = require('@/convex/_generated/api');
  api = convexApi.api;
} catch (error) {
  api = null;
  useConvexQuery = false;
}

// Loading skeleton for dashboard sections
const DashboardSkeleton = () => {
  const theme = useTheme();

  return (
    <Box sx={{ p: 3 }}>
      {/* Header skeleton */}
      <Box sx={{ mb: 4 }}>
        <Skeleton variant="text" width={300} height={48} />
        <Skeleton variant="text" width={400} height={24} />
      </Box>

      {/* Stats cards skeleton */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <Grid item xs={12} sm={6} lg={3} key={i}>
            <Card sx={{ height: 140 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width={100} height={24} />
                    <Skeleton variant="text" width={80} height={40} sx={{ mt: 1 }} />
                    <Skeleton variant="text" width={120} height={20} sx={{ mt: 1 }} />
                  </Box>
                  <Skeleton variant="circular" width={56} height={56} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts skeleton */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ height: 300 }}>
            <CardContent>
              <Skeleton variant="text" width={200} height={32} />
              <Skeleton variant="rectangular" height={220} sx={{ mt: 2 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: 300 }}>
            <CardContent>
              <Skeleton variant="text" width={150} height={32} />
              <Skeleton variant="circular" width={180} height={180} sx={{ mx: 'auto', mt: 2 }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sessions table skeleton */}
      <Card>
        <CardContent>
          <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rectangular" height={60} sx={{ mb: 1 }} />
          ))}
        </CardContent>
      </Card>
    </Box>
  );
};

// Error display component
const DashboardError = ({ message, onRetry }: { message: string; onRetry?: () => void }) => {
  return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Alert
        severity="error"
        sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}
        action={
          onRetry && (
            <Button color="inherit" size="small" onClick={onRetry}>
              Retry
            </Button>
          )
        }
      >
        {message}
      </Alert>
    </Box>
  );
};

export default function MaterialDashboard() {
  const theme = useTheme();
  const { user, isAuthenticated } = useUserStore();
  const {
    chartTimeRange,
    setChartTimeRange,
    dashboardLayout,
    setDashboardLayout,
    setTrackDistribution,
    setLapTimeProgress,
    setActivityData,
  } = useDashboardStore();

  // Fetch sessions from Convex
  const dateRange = getDateRangeForTimeRange(chartTimeRange);

  const sessions = useConvexQuery && api
    ? useQuery(api.telemetry.getUserSessions, {
        limit: 100,
        startDate: dateRange.start?.getTime(),
        endDate: dateRange.end?.getTime(),
      })
    : null;

  const performanceMetrics = useConvexQuery && api
    ? useQuery(api.telemetry.getPerformanceMetrics)
    : null;

  // Calculate derived data when sessions change
  useEffect(() => {
    if (sessions && Array.isArray(sessions)) {
      setTrackDistribution(calculateTrackDistribution(sessions));
      setLapTimeProgress(calculateLapTimeProgress(sessions));
      setActivityData(calculateActivityData(sessions));
    }
  }, [sessions, setTrackDistribution, setLapTimeProgress, setActivityData]);

  // Show loading state
  const isLoading = useConvexQuery && (sessions === undefined || performanceMetrics === undefined);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Show error state
  if (sessions === null && useConvexQuery) {
    return (
      <DashboardError
        message="Failed to load dashboard data. Please check your connection and try again."
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Use mock data if Convex is not available
  const mockSessions = [
    {
      _id: 'mock-1',
      trackName: 'Nurburgring GP',
      carModel: 'BMW M3 GT3',
      sessionType: 'practice',
      sessionDate: Date.now() - 3600000,
      bestLapTime: 92156,
      lapCount: 8,
      trackCondition: 'dry',
    },
    {
      _id: 'mock-2',
      trackName: 'Spa-Francorchamps',
      carModel: 'Porsche 911 RSR',
      sessionType: 'qualifying',
      sessionDate: Date.now() - 7200000,
      bestLapTime: 125234,
      lapCount: 12,
      trackCondition: 'wet',
    },
    {
      _id: 'mock-3',
      trackName: 'Suzuka Circuit',
      carModel: 'Honda NSX GT3',
      sessionType: 'race',
      sessionDate: Date.now() - 86400000,
      bestLapTime: 98543,
      lapCount: 15,
      trackCondition: 'dry',
    },
    {
      _id: 'mock-4',
      trackName: 'Monza',
      carModel: 'Ferrari 488 GT3',
      sessionType: 'time_trial',
      sessionDate: Date.now() - 172800000,
      bestLapTime: 105234,
      lapCount: 20,
      trackCondition: 'dry',
    },
  ];

  const sessionsData = useConvexQuery ? sessions : mockSessions;
  const stats = calculateDashboardStats(sessionsData || []);

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="headlineLarge" sx={{ fontWeight: 600, mb: 1 }}>
              Racing Dashboard
            </Typography>
            <Typography variant="bodyLarge" color="text.secondary">
              {user ? `Welcome back, ${user.pilotName || user.name}!` : 'Track your performance and analyze your racing data'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Time range selector */}
            <ToggleButtonGroup
              value={chartTimeRange}
              exclusive
              onChange={(e, value) => value && setChartTimeRange(value)}
              size="small"
            >
              <ToggleButton value="7d">7D</ToggleButton>
              <ToggleButton value="30d">30D</ToggleButton>
              <ToggleButton value="90d">90D</ToggleButton>
              <ToggleButton value="all">All</ToggleButton>
            </ToggleButtonGroup>

            {/* Layout toggle */}
            <ToggleButtonGroup
              value={dashboardLayout}
              exclusive
              onChange={(e, value) => value && setDashboardLayout(value)}
              size="small"
            >
              <ToggleButton value="grid">
                <Tooltip title="Grid View">
                  <GridViewIcon fontSize="small" />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="list">
                <Tooltip title="List View">
                  <ListViewIcon fontSize="small" />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>

            <Tooltip title="Refresh Data">
              <IconButton onClick={() => window.location.reload()}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </motion.div>

      {/* Quick Stats */}
      <Box sx={{ mb: 4 }}>
        <QuickStats stats={stats} isLoading={isLoading} />
      </Box>

      {/* Performance Metrics */}
      <Box sx={{ mb: 4 }}>
        <PerformanceMetrics />
      </Box>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Lap Time Progress Chart */}
        <Grid item xs={12} lg={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <LapTimeProgress sessions={sessionsData || []} />
          </motion.div>
        </Grid>

        {/* Track Distribution */}
        <Grid item xs={12} lg={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <TrackDistribution sessions={sessionsData || []} />
          </motion.div>
        </Grid>
      </Grid>

      {/* Activity Calendar */}
      <Box sx={{ mb: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <ActivityCalendar sessions={sessionsData || []} />
        </motion.div>
      </Box>

      {/* Recent Sessions */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="titleLarge" sx={{ fontWeight: 600 }}>
                    Recent Sessions
                  </Typography>
                  <Button
                    component={Link}
                    href="/telemetry"
                    variant="outlined"
                    size="small"
                    startIcon={<StarIcon />}
                  >
                    View All
                  </Button>
                </Box>
                <RecentSessionsTable />
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Button
                    component={Link}
                    href="/record-lap"
                    variant="contained"
                    size="large"
                    sx={{ minWidth: 200 }}
                  >
                    Record New Session
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Premium Features Upsell */}
        <Grid item xs={12} lg={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <UpcomingFeatures />
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
}
