'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Skeleton,
  alpha,
  useTheme,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Timer as TimerIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { LeaderboardEntry, useSocialStore, formatLapTime } from '@/lib/stores/socialStore';

interface LeaderboardWidgetProps {
  trackName?: string;
  limit?: number;
  showTrackSelector?: boolean;
  compact?: boolean;
}

// Mock tracks for the selector
const availableTracks = [
  'Nurburgring GP',
  'Suzuka Circuit',
  'Spa-Francorchamps',
  'Monza Circuit',
  'Silverstone',
  'Laguna Seca',
  'Mount Panorama',
  'Le Mans Circuit',
];

// Mock leaderboard data
const mockLeaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: '1',
    userName: 'SpeedDemon',
    bestLapTime: 82456,
    trackName: 'Nurburgring GP',
    carModel: 'Porsche 911 GT3 RS',
    sessionId: 's1',
    category: 'overall',
    timestamp: Date.now() - 86400000,
    isVerified: true,
  },
  {
    rank: 2,
    userId: '2',
    userName: 'RacingKing',
    bestLapTime: 82890,
    trackName: 'Nurburgring GP',
    carModel: 'Ferrari 488 GT3',
    sessionId: 's2',
    category: 'overall',
    timestamp: Date.now() - 172800000,
    isVerified: true,
    delta: 434,
  },
  {
    rank: 3,
    userId: '3',
    userName: 'TurboMaster',
    bestLapTime: 83012,
    trackName: 'Nurburgring GP',
    carModel: 'Mercedes AMG GT3',
    sessionId: 's3',
    category: 'overall',
    timestamp: Date.now() - 259200000,
    isVerified: false,
    delta: 556,
    improvement: 2,
  },
  {
    rank: 4,
    userId: '4',
    userName: 'ApexHunter',
    bestLapTime: 83245,
    trackName: 'Nurburgring GP',
    carModel: 'BMW M4 GT3',
    sessionId: 's4',
    category: 'overall',
    timestamp: Date.now() - 345600000,
    isVerified: true,
    delta: 789,
    improvement: -1,
  },
  {
    rank: 5,
    userId: '5',
    userName: 'DriftKing',
    bestLapTime: 83567,
    trackName: 'Nurburgring GP',
    carModel: 'Nissan GT-R GT3',
    sessionId: 's5',
    category: 'overall',
    timestamp: Date.now() - 432000000,
    isVerified: false,
    delta: 1111,
  },
];

export default function LeaderboardWidget({
  trackName: initialTrack,
  limit = 5,
  showTrackSelector = true,
  compact = false,
}: LeaderboardWidgetProps) {
  const theme = useTheme();
  const [selectedTrack, setSelectedTrack] = useState(initialTrack || availableTracks[0]);
  const [category, setCategory] = useState<'overall' | 'weekly' | 'monthly'>('overall');
  const [isLoading, setIsLoading] = useState(true);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  const { loadLeaderboard, leaderboardEntries } = useSocialStore();

  useEffect(() => {
    // Simulate loading
    setIsLoading(true);
    setTimeout(() => {
      setEntries(mockLeaderboard.slice(0, limit));
      setIsLoading(false);
    }, 500);
  }, [selectedTrack, category, limit]);

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return theme.palette.text.secondary;
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) {
      return (
        <TrophyIcon
          sx={{
            color: getRankColor(rank),
            fontSize: compact ? 20 : 24,
          }}
        />
      );
    }
    return (
      <Typography
        variant={compact ? 'bodyMedium' : 'titleMedium'}
        sx={{ fontWeight: 600, color: 'text.secondary' }}
      >
        {rank}
      </Typography>
    );
  };

  return (
    <Card
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.03)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}
    >
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrophyIcon sx={{ color: 'warning.main' }} />
            <Typography variant="titleLarge" sx={{ fontWeight: 600 }}>
              Leaderboard
            </Typography>
          </Box>
          <Button
            component={Link}
            href="/leaderboard"
            size="small"
            sx={{ textTransform: 'none' }}
          >
            View All
          </Button>
        </Box>

        {/* Selectors */}
        {showTrackSelector && (
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <InputLabel>Track</InputLabel>
              <Select
                value={selectedTrack}
                label="Track"
                onChange={(e) => setSelectedTrack(e.target.value)}
              >
                {availableTracks.map((track) => (
                  <MenuItem key={track} value={track}>
                    {track}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Period</InputLabel>
              <Select
                value={category}
                label="Period"
                onChange={(e) => setCategory(e.target.value as typeof category)}
              >
                <MenuItem value="overall">All Time</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Leaderboard List */}
        <List disablePadding>
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: limit }).map((_, index) => (
              <ListItem key={index} sx={{ px: 0 }}>
                <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton width="60%" />
                  <Skeleton width="40%" />
                </Box>
              </ListItem>
            ))
          ) : (
            entries.map((entry, index) => (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <ListItem
                  component={Link}
                  href={`/profile/${entry.userId}`}
                  sx={{
                    px: compact ? 1 : 2,
                    py: compact ? 1 : 1.5,
                    borderRadius: 2,
                    mb: 1,
                    textDecoration: 'none',
                    color: 'inherit',
                    bgcolor: entry.rank <= 3 ? alpha(getRankColor(entry.rank), 0.08) : 'transparent',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  {/* Rank */}
                  <Box
                    sx={{
                      width: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 1.5,
                    }}
                  >
                    {getRankIcon(entry.rank)}
                  </Box>

                  {/* Avatar */}
                  <ListItemAvatar>
                    <Avatar
                      src={entry.userAvatar}
                      sx={{
                        width: compact ? 36 : 44,
                        height: compact ? 36 : 44,
                        border: entry.rank <= 3 ? `2px solid ${getRankColor(entry.rank)}` : 'none',
                      }}
                    >
                      {entry.userName.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>

                  {/* User Info */}
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography
                          variant={compact ? 'bodyMedium' : 'titleMedium'}
                          sx={{ fontWeight: 600 }}
                        >
                          {entry.userName}
                        </Typography>
                        {entry.isVerified && (
                          <VerifiedIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                        )}
                        {entry.improvement !== undefined && entry.improvement !== 0 && (
                          <Chip
                            size="small"
                            icon={
                              entry.improvement > 0 ? (
                                <TrendingUpIcon sx={{ fontSize: 14 }} />
                              ) : (
                                <TrendingDownIcon sx={{ fontSize: 14 }} />
                              )
                            }
                            label={Math.abs(entry.improvement)}
                            color={entry.improvement > 0 ? 'success' : 'error'}
                            sx={{ height: 20, fontSize: '0.65rem' }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      !compact && (
                        <Typography variant="bodySmall" color="text.secondary">
                          {entry.carModel}
                        </Typography>
                      )
                    }
                  />

                  {/* Lap Time */}
                  <Box sx={{ textAlign: 'right' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <TimerIcon sx={{ fontSize: 16, color: 'success.main' }} />
                      <Typography
                        variant={compact ? 'bodyMedium' : 'titleMedium'}
                        sx={{ fontWeight: 600, color: 'success.main' }}
                      >
                        {formatLapTime(entry.bestLapTime)}
                      </Typography>
                    </Box>
                    {entry.delta !== undefined && entry.rank > 1 && (
                      <Typography variant="bodySmall" color="text.secondary">
                        +{formatLapTime(entry.delta)}
                      </Typography>
                    )}
                  </Box>
                </ListItem>
              </motion.div>
            ))
          )}
        </List>
      </CardContent>
    </Card>
  );
}
