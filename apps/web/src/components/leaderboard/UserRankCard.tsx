'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  LinearProgress,
  Chip,
  Stack,
  Skeleton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  EmojiEvents as TrophyIcon,
  Speed as SpeedIcon,
  Timer as TimerIcon,
  Flag as FlagIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import RankBadge, { getTierColor, getTierGradient } from './RankBadge';

type RankTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

interface UserRankData {
  userId: string;
  userName: string;
  userAvatar?: string;
  rank: number;
  previousRank?: number;
  points: number;
  tier: RankTier;
  stats: {
    totalSessions: number;
    totalLaps: number;
    personalBests: number;
    trackRecords: number;
    achievementsUnlocked: number;
  };
  nextTier?: {
    name: string;
    pointsNeeded: number;
    progress: number;
  };
  rankChange?: number;
}

interface UserRankCardProps {
  data?: UserRankData;
  loading?: boolean;
  compact?: boolean;
}

const StatItem = ({ icon, label, value }: { icon: React.ReactElement; label: string; value: number | string }) => {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box
        sx={{
          p: 0.75,
          borderRadius: 1,
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '& svg': {
            fontSize: 18,
            color: 'primary.main',
          },
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Typography>
      </Box>
    </Box>
  );
};

export default function UserRankCard({ data, loading = false, compact = false }: UserRankCardProps) {
  const theme = useTheme();

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Skeleton variant="circular" width={56} height={56} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
            </Box>
          </Box>
          <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 1, mb: 2 }} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Skeleton variant="rectangular" width={80} height={40} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" width={80} height={40} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" width={80} height={40} sx={{ borderRadius: 1 }} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
          <Typography color="text.secondary">No ranking data available</Typography>
        </CardContent>
      </Card>
    );
  }

  const rankChangeIcon = data.rankChange
    ? data.rankChange > 0
      ? <TrendingUpIcon sx={{ color: 'success.main' }} />
      : data.rankChange < 0
        ? <TrendingDownIcon sx={{ color: 'error.main' }} />
        : <TrendingFlatIcon sx={{ color: 'text.secondary' }} />
    : null;

  const tierColor = getTierColor(data.tier);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        sx={{
          height: '100%',
          background: `linear-gradient(135deg, ${alpha(tierColor, 0.05)} 0%, ${alpha(tierColor, 0.02)} 100%)`,
          border: `1px solid ${alpha(tierColor, 0.2)}`,
          overflow: 'visible',
        }}
      >
        <CardContent sx={{ p: compact ? 2 : 3 }}>
          {/* Header with Avatar and Rank */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: compact ? 2 : 3 }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={data.userAvatar}
                sx={{
                  width: compact ? 48 : 64,
                  height: compact ? 48 : 64,
                  border: `3px solid ${tierColor}`,
                  boxShadow: `0 4px 12px ${alpha(tierColor, 0.3)}`,
                }}
              >
                {data.userName?.[0]?.toUpperCase()}
              </Avatar>
              {/* Rank badge overlaid */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -8,
                  right: -8,
                  bgcolor: 'background.paper',
                  borderRadius: '50%',
                  p: 0.5,
                  boxShadow: theme.shadows[2],
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    bgcolor: tierColor,
                    color: data.tier === 'bronze' || data.tier === 'gold' ? '#fff' : '#333',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                  }}
                >
                  #{data.rank || '-'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant={compact ? 'subtitle1' : 'h6'} sx={{ fontWeight: 600 }}>
                  {data.userName}
                </Typography>
                {rankChangeIcon && (
                  <Chip
                    icon={rankChangeIcon}
                    label={data.rankChange ? Math.abs(data.rankChange) : 0}
                    size="small"
                    color={data.rankChange && data.rankChange > 0 ? 'success' : data.rankChange && data.rankChange < 0 ? 'error' : 'default'}
                    variant="outlined"
                    sx={{ height: 22, '& .MuiChip-label': { px: 0.5 } }}
                  />
                )}
              </Box>
              <RankBadge tier={data.tier} size="small" showPoints points={data.points} />
            </Box>

            {!compact && (
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: tierColor }}>
                  {data.points.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Points
                </Typography>
              </Box>
            )}
          </Box>

          {/* Progress to next tier */}
          {data.nextTier && (
            <Box sx={{ mb: compact ? 2 : 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Progress to {data.nextTier.name}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {data.nextTier.pointsNeeded.toLocaleString()} points needed
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={data.nextTier.progress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: alpha(tierColor, 0.2),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    background: getTierGradient(data.tier),
                  },
                }}
              />
            </Box>
          )}

          {/* Stats Grid */}
          {!compact && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 2,
              }}
            >
              <StatItem
                icon={<FlagIcon />}
                label="Sessions"
                value={data.stats.totalSessions}
              />
              <StatItem
                icon={<TimerIcon />}
                label="Total Laps"
                value={data.stats.totalLaps}
              />
              <StatItem
                icon={<SpeedIcon />}
                label="Personal Bests"
                value={data.stats.personalBests}
              />
              <StatItem
                icon={<TrophyIcon />}
                label="Track Records"
                value={data.stats.trackRecords}
              />
            </Box>
          )}

          {compact && (
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              <Chip
                icon={<FlagIcon />}
                label={`${data.stats.totalSessions} sessions`}
                size="small"
                variant="outlined"
              />
              <Chip
                icon={<TrophyIcon />}
                label={`${data.stats.trackRecords} records`}
                size="small"
                variant="outlined"
              />
            </Stack>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
