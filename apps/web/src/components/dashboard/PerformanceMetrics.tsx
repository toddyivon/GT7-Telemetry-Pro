'use client';

import React, { useMemo } from 'react';
import { useQuery } from 'convex/react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Chip,
  Avatar,
  useTheme,
  alpha,
  Skeleton,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  Timeline as SessionIcon,
  Speed as LapIcon,
  Timer as TimeIcon,
  TrendingUp as TrendIcon,
  TrendingDown as TrendDownIcon,
  EmojiEvents as TrophyIcon,
  Route as RouteIcon,
  DirectionsCar as CarIcon,
  Flag as FlagIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

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

interface MetricCardProps {
  name: string;
  value: string;
  icon: React.ReactElement;
  color: string;
  subtitle: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    isPositive: boolean;
  };
  index: number;
}

const MetricCard = ({ name, value, icon, color, subtitle, trend, index }: MetricCardProps) => {
  const theme = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card
        sx={{
          background: `linear-gradient(135deg, ${alpha(color, 0.15)} 0%, ${alpha(color, 0.05)} 100%)`,
          border: `1px solid ${alpha(color, 0.3)}`,
          height: '100%',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 8px 24px ${alpha(color, 0.25)}`,
          },
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Avatar
              sx={{
                bgcolor: color,
                width: 48,
                height: 48,
                boxShadow: `0 4px 14px ${alpha(color, 0.4)}`,
              }}
            >
              {icon}
            </Avatar>
            {trend && (
              <Chip
                size="small"
                icon={trend.direction === 'up' ? <TrendIcon fontSize="small" /> : <TrendDownIcon fontSize="small" />}
                label={`${trend.value.toFixed(1)}%`}
                color={trend.isPositive ? 'success' : 'error'}
                variant="filled"
                sx={{ height: 24, fontSize: '0.75rem' }}
              />
            )}
          </Box>
          <Box sx={{ mt: 2 }}>
            <Typography variant="bodySmall" color="text.secondary" sx={{ fontWeight: 500 }}>
              {name}
            </Typography>
            <Typography variant="headlineMedium" sx={{ fontWeight: 700, mt: 0.5, color }}>
              {value}
            </Typography>
            <Typography variant="bodySmall" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const SkeletonMetricCard = () => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Skeleton variant="circular" width={48} height={48} />
        <Skeleton variant="rounded" width={60} height={24} />
      </Box>
      <Box sx={{ mt: 2 }}>
        <Skeleton variant="text" width={100} height={20} />
        <Skeleton variant="text" width={80} height={36} />
        <Skeleton variant="text" width={120} height={16} />
      </Box>
    </CardContent>
  </Card>
);

export default function PerformanceMetrics() {
  const theme = useTheme();

  // Use Convex query if available
  const performanceMetrics = useConvexQuery && api
    ? useQuery(api.telemetry.getPerformanceMetrics)
    : null;

  const recentSessions = useConvexQuery && api
    ? useQuery(api.telemetry.getRecentSessions, { limit: 20 })
    : null;

  // Show loading state
  const isLoading = useConvexQuery && performanceMetrics === undefined;

  // Calculate trends from recent sessions
  const trends = useMemo(() => {
    if (!recentSessions || !Array.isArray(recentSessions) || recentSessions.length < 4) {
      return null;
    }

    const midpoint = Math.floor(recentSessions.length / 2);
    const recent = recentSessions.slice(0, midpoint);
    const older = recentSessions.slice(midpoint);

    // Calculate average lap times for comparison
    const recentAvgLap = recent.reduce((sum, s) => sum + (s.bestLapTime || 0), 0) / recent.length;
    const olderAvgLap = older.reduce((sum, s) => sum + (s.bestLapTime || 0), 0) / older.length;

    // Calculate sessions per period
    const recentSessionCount = recent.length;
    const olderSessionCount = older.length;

    // Calculate lap counts
    const recentLaps = recent.reduce((sum, s) => sum + (s.lapCount || 0), 0);
    const olderLaps = older.reduce((sum, s) => sum + (s.lapCount || 0), 0);

    return {
      lapTime: olderAvgLap > 0
        ? {
            value: Math.abs(((olderAvgLap - recentAvgLap) / olderAvgLap) * 100),
            direction: recentAvgLap < olderAvgLap ? 'down' : 'up',
            isPositive: recentAvgLap < olderAvgLap,
          }
        : null,
      sessions: olderSessionCount > 0
        ? {
            value: Math.abs(((recentSessionCount - olderSessionCount) / olderSessionCount) * 100),
            direction: recentSessionCount > olderSessionCount ? 'up' : 'down',
            isPositive: recentSessionCount > olderSessionCount,
          }
        : null,
      laps: olderLaps > 0
        ? {
            value: Math.abs(((recentLaps - olderLaps) / olderLaps) * 100),
            direction: recentLaps > olderLaps ? 'up' : 'down',
            isPositive: recentLaps > olderLaps,
          }
        : null,
    };
  }, [recentSessions]);

  // Fallback mock data
  const mockMetrics = {
    totalSessions: 12,
    totalLaps: 145,
    totalDistance: 580,
    averageLapTime: 95234,
    bestLapTime: 92156,
    favoriteTrack: 'Nurburgring GP',
    recentActivity: [],
    consistencyScore: 87,
    improvementRate: 2.3,
  };

  const metricsData = useConvexQuery && performanceMetrics ? performanceMetrics : mockMetrics;

  const formatTime = (milliseconds: number): string => {
    if (milliseconds === 0 || !milliseconds) return '--:--';
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    const ms = Math.floor((milliseconds % 1000) / 10);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const formatDistance = (kilometers: number): string => {
    if (!kilometers) return '0 km';
    if (kilometers < 1) return `${(kilometers * 1000).toFixed(0)}m`;
    if (kilometers >= 1000) return `${(kilometers / 1000).toFixed(1)}k km`;
    return `${kilometers.toFixed(1)} km`;
  };

  if (isLoading) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3, 4].map((i) => (
          <Grid item xs={12} sm={6} lg={3} key={i}>
            <SkeletonMetricCard />
          </Grid>
        ))}
      </Grid>
    );
  }

  const metrics = [
    {
      name: 'Total Sessions',
      value: (metricsData?.totalSessions || 0).toString(),
      icon: <SessionIcon />,
      color: theme.palette.primary.main,
      subtitle: 'Racing sessions completed',
      trend: trends?.sessions as any,
    },
    {
      name: 'Total Laps',
      value: (metricsData?.totalLaps || 0).toLocaleString(),
      icon: <FlagIcon />,
      color: theme.palette.secondary.main,
      subtitle: 'Laps completed this period',
      trend: trends?.laps as any,
    },
    {
      name: 'Best Lap Time',
      value: formatTime(metricsData?.bestLapTime || 0),
      icon: <TrophyIcon />,
      color: theme.palette.success.main,
      subtitle: 'Personal best lap',
      trend: trends?.lapTime as any,
    },
    {
      name: 'Total Distance',
      value: formatDistance(metricsData?.totalDistance || 0),
      icon: <RouteIcon />,
      color: theme.palette.warning.main,
      subtitle: 'Distance covered',
    },
  ];

  return (
    <Box>
      <Grid container spacing={3}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} lg={3} key={metric.name}>
            <MetricCard {...metric} index={index} />
          </Grid>
        ))}
      </Grid>

      {/* Extended Stats Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card sx={{ mt: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="titleMedium" sx={{ mb: 3, fontWeight: 600 }}>
              Performance Overview
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="bodySmall" color="text.secondary">
                    Average Lap Time
                  </Typography>
                  <Typography variant="titleLarge" sx={{ fontWeight: 600 }}>
                    {formatTime(metricsData?.averageLapTime || 0)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="bodySmall" color="text.secondary">
                    Favorite Track
                  </Typography>
                  <Typography variant="titleLarge" sx={{ fontWeight: 600 }}>
                    {metricsData?.favoriteTrack || 'No data yet'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="bodySmall" color="text.secondary" gutterBottom>
                    Consistency Score
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="titleLarge" sx={{ fontWeight: 600 }}>
                      {metricsData?.consistencyScore || 0}%
                    </Typography>
                    <Box sx={{ flex: 1, maxWidth: 100 }}>
                      <Tooltip title="Lower variance = higher consistency">
                        <LinearProgress
                          variant="determinate"
                          value={metricsData?.consistencyScore || 0}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              bgcolor:
                                (metricsData?.consistencyScore || 0) > 80
                                  ? theme.palette.success.main
                                  : (metricsData?.consistencyScore || 0) > 60
                                  ? theme.palette.warning.main
                                  : theme.palette.error.main,
                            },
                          }}
                        />
                      </Tooltip>
                    </Box>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="bodySmall" color="text.secondary">
                    Improvement Rate
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="titleLarge" sx={{ fontWeight: 600 }}>
                      {(metricsData?.improvementRate || 0).toFixed(1)}%
                    </Typography>
                    {(metricsData?.improvementRate || 0) > 0 ? (
                      <Chip
                        size="small"
                        label="Improving"
                        color="success"
                        icon={<TrendIcon fontSize="small" />}
                        sx={{ height: 24 }}
                      />
                    ) : (
                      <Chip
                        size="small"
                        label="Needs Work"
                        color="warning"
                        icon={<TrendDownIcon fontSize="small" />}
                        sx={{ height: 24 }}
                      />
                    )}
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
}
