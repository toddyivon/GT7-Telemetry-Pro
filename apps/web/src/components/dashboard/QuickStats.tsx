'use client';

import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Skeleton,
  useTheme,
  alpha,
  Tooltip,
} from '@mui/material';
import {
  Timeline as SessionsIcon,
  Flag as LapsIcon,
  Timer as TimeIcon,
  Route as DistanceIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendUpIcon,
  TrendingDown as TrendDownIcon,
  DirectionsCar as CarIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

import { DashboardStats } from '@/lib/stores/dashboardStore';

interface QuickStatsProps {
  stats: DashboardStats;
  isLoading?: boolean;
}

interface StatItemProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactElement;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  index: number;
}

const formatTime = (milliseconds: number): string => {
  if (!milliseconds || milliseconds === 0) return '--:--';
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  const ms = Math.floor((milliseconds % 1000) / 10);
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

const formatDistance = (km: number): string => {
  if (!km) return '0 km';
  if (km >= 1000) return `${(km / 1000).toFixed(1)}k km`;
  return `${km.toFixed(1)} km`;
};

const StatItem = ({ title, value, subtitle, icon, color, trend, index }: StatItemProps) => {
  const theme = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card
        sx={{
          height: '100%',
          background: `linear-gradient(135deg, ${alpha(color, 0.12)} 0%, ${alpha(color, 0.04)} 100%)`,
          border: `1px solid ${alpha(color, 0.2)}`,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 8px 24px ${alpha(color, 0.2)}`,
            border: `1px solid ${alpha(color, 0.4)}`,
          },
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
            <Avatar
              sx={{
                bgcolor: color,
                width: 44,
                height: 44,
                boxShadow: `0 4px 12px ${alpha(color, 0.35)}`,
              }}
            >
              {icon}
            </Avatar>
            {trend && (
              <Chip
                size="small"
                icon={trend.isPositive ? <TrendUpIcon fontSize="small" /> : <TrendDownIcon fontSize="small" />}
                label={`${Math.abs(trend.value).toFixed(1)}%`}
                color={trend.isPositive ? 'success' : 'error'}
                variant="filled"
                sx={{ height: 22, fontSize: '0.7rem' }}
              />
            )}
          </Box>
          <Typography variant="bodySmall" color="text.secondary" sx={{ fontWeight: 500 }}>
            {title}
          </Typography>
          <Typography
            variant="headlineSmall"
            sx={{
              fontWeight: 700,
              color,
              mt: 0.5,
              fontFamily: typeof value === 'string' && value.includes(':') ? 'monospace' : 'inherit',
            }}
          >
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="labelSmall" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const StatSkeleton = () => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
        <Skeleton variant="circular" width={44} height={44} />
        <Skeleton variant="rounded" width={50} height={22} />
      </Box>
      <Skeleton variant="text" width={80} height={18} />
      <Skeleton variant="text" width={100} height={32} sx={{ mt: 0.5 }} />
      <Skeleton variant="text" width={120} height={14} sx={{ mt: 0.5 }} />
    </CardContent>
  </Card>
);

export default function QuickStats({ stats, isLoading }: QuickStatsProps) {
  const theme = useTheme();

  if (isLoading) {
    return (
      <Grid container spacing={2}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Grid item xs={6} sm={4} md={2} key={i}>
            <StatSkeleton />
          </Grid>
        ))}
      </Grid>
    );
  }

  const quickStats: Omit<StatItemProps, 'index'>[] = [
    {
      title: 'Sessions',
      value: stats.totalSessions,
      subtitle: 'Total racing sessions',
      icon: <SessionsIcon />,
      color: theme.palette.primary.main,
    },
    {
      title: 'Laps',
      value: stats.totalLaps.toLocaleString(),
      subtitle: 'Laps completed',
      icon: <LapsIcon />,
      color: theme.palette.secondary.main,
    },
    {
      title: 'Best Lap',
      value: formatTime(stats.bestLapTime),
      subtitle: 'Personal record',
      icon: <TrophyIcon />,
      color: theme.palette.success.main,
    },
    {
      title: 'Distance',
      value: formatDistance(stats.totalDistance),
      subtitle: 'Total driven',
      icon: <DistanceIcon />,
      color: theme.palette.warning.main,
    },
    {
      title: 'Tracks',
      value: stats.tracksVisited,
      subtitle: 'Unique circuits',
      icon: <SpeedIcon />,
      color: theme.palette.info.main,
    },
    {
      title: 'Cars',
      value: stats.carsUsed,
      subtitle: 'Vehicles driven',
      icon: <CarIcon />,
      color: theme.palette.error.main,
    },
  ];

  return (
    <Grid container spacing={2}>
      {quickStats.map((stat, index) => (
        <Grid item xs={6} sm={4} md={2} key={stat.title}>
          <StatItem {...stat} index={index} />
        </Grid>
      ))}
    </Grid>
  );
}
