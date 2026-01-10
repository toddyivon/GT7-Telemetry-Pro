'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Breadcrumbs,
  Link as MuiLink,
  Tabs,
  Tab,
  Chip,
  Button,
  useTheme,
  alpha,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  Leaderboard as LeaderboardIcon,
  EmojiEvents as TrophyIcon,
  ArrowBack as ArrowBackIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

import {
  LeaderboardTable,
  RankBadge,
  UserRankCard,
} from '@/components/leaderboard';

type RankTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

// Mock data for global rankings
const mockRankings = [
  { rank: 1, userId: 'user-1', userName: 'SpeedDemon', points: 35420, tier: 'diamond' as const, rankChange: 0 },
  { rank: 2, userId: 'user-2', userName: 'RacingPro', points: 28950, tier: 'diamond' as const, rankChange: 1 },
  { rank: 3, userId: 'user-3', userName: 'FastLaps', points: 25100, tier: 'diamond' as const, rankChange: -1 },
  { rank: 4, userId: 'user-4', userName: 'ApexHunter', points: 18750, tier: 'platinum' as const, rankChange: 2 },
  { rank: 5, userId: 'user-5', userName: 'TireWhisperer', points: 15320, tier: 'platinum' as const, rankChange: 0 },
  { rank: 6, userId: 'user-6', userName: 'CircuitMaster', points: 12450, tier: 'platinum' as const, rankChange: -1 },
  { rank: 7, userId: 'user-7', userName: 'LapKing', points: 11200, tier: 'platinum' as const, rankChange: 3 },
  { rank: 8, userId: 'user-8', userName: 'RaceCraft', points: 9800, tier: 'gold' as const, rankChange: 0 },
  { rank: 9, userId: 'user-9', userName: 'SpeedRunner', points: 8200, tier: 'gold' as const, rankChange: -2 },
  { rank: 10, userId: 'user-10', userName: 'TrackStar', points: 7100, tier: 'gold' as const, rankChange: 1 },
  { rank: 11, userId: 'user-11', userName: 'DriftMaster', points: 6500, tier: 'gold' as const, rankChange: 0 },
  { rank: 12, userId: 'user-12', userName: 'NightRacer', points: 5800, tier: 'gold' as const, rankChange: 2 },
  { rank: 13, userId: 'user-13', userName: 'TurboKing', points: 5200, tier: 'gold' as const, rankChange: -1 },
  { rank: 14, userId: 'user-14', userName: 'SlickTyres', points: 4500, tier: 'silver' as const, rankChange: 0 },
  { rank: 15, userId: 'user-15', userName: 'PitLane', points: 4000, tier: 'silver' as const, rankChange: 1 },
  { rank: 16, userId: 'user-16', userName: 'GridStarter', points: 3700, tier: 'silver' as const, rankChange: -1 },
  { rank: 17, userId: 'user-17', userName: 'CornerKing', points: 3200, tier: 'silver' as const, rankChange: 0 },
  { rank: 18, userId: 'user-18', userName: 'ApexPredator', points: 2800, tier: 'silver' as const, rankChange: 2 },
  { rank: 19, userId: 'user-19', userName: 'RaceDay', points: 2400, tier: 'silver' as const, rankChange: 0 },
  { rank: 20, userId: 'user-20', userName: 'FastAndFun', points: 2000, tier: 'silver' as const, rankChange: -1 },
];

const mockUserRank = {
  userId: 'mock-user-1',
  userName: 'Missola',
  userAvatar: undefined,
  rank: 42,
  previousRank: 45,
  points: 3500,
  tier: 'silver' as const,
  stats: {
    totalSessions: 87,
    totalLaps: 1245,
    totalDistance: 6225,
    personalBests: 23,
    trackRecords: 2,
    achievementsUnlocked: 8,
  },
  pointsBreakdown: {
    sessionPoints: 870,
    personalBestPoints: 1150,
    trackRecordPoints: 200,
    achievementPoints: 780,
    bonusPoints: 500,
  },
  nextTier: {
    name: 'gold',
    pointsNeeded: 1500,
    progress: 70,
  },
  rankChange: 3,
};

const tierDistribution = {
  diamond: { count: 15, percentage: 1, color: '#B9F2FF' },
  platinum: { count: 85, percentage: 4, color: '#E5E4E2' },
  gold: { count: 350, percentage: 15, color: '#FFD700' },
  silver: { count: 750, percentage: 30, color: '#C0C0C0' },
  bronze: { count: 1300, percentage: 50, color: '#CD7F32' },
};

export default function GlobalRankingsPage() {
  const theme = useTheme();
  const [selectedTier, setSelectedTier] = useState<RankTier | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [selectedTier]);

  const filteredRankings = selectedTier === 'all'
    ? mockRankings
    : mockRankings.filter(r => r.tier === selectedTier);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 3 }}>
      <Container maxWidth="xl">
        {/* Breadcrumbs */}
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          sx={{ mb: 3 }}
        >
          <MuiLink
            component={Link}
            href="/dashboard"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              textDecoration: 'none',
              color: 'text.secondary',
              '&:hover': { color: 'primary.main' },
            }}
          >
            <HomeIcon fontSize="small" />
            Dashboard
          </MuiLink>
          <MuiLink
            component={Link}
            href="/leaderboard"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              textDecoration: 'none',
              color: 'text.secondary',
              '&:hover': { color: 'primary.main' },
            }}
          >
            <LeaderboardIcon fontSize="small" />
            Leaderboard
          </MuiLink>
          <Typography color="text.primary">Global Rankings</Typography>
        </Breadcrumbs>

        {/* Back Button */}
        <Button
          component={Link}
          href="/leaderboard"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2 }}
        >
          Back to Leaderboards
        </Button>

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <TrophyIcon sx={{ fontSize: 40, color: 'warning.main' }} />
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Global Rankings
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary">
              Compete with racers worldwide and climb the ranks to reach Diamond tier
            </Typography>
          </Box>
        </motion.div>

        <Grid container spacing={3}>
          {/* User Rank Card */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ position: 'sticky', top: 16 }}>
              <UserRankCard data={mockUserRank} loading={isLoading} />

              {/* Tier Legend */}
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Tier Requirements
                  </Typography>
                  {[
                    { tier: 'diamond' as const, min: 25000, max: null },
                    { tier: 'platinum' as const, min: 10000, max: 24999 },
                    { tier: 'gold' as const, min: 5000, max: 9999 },
                    { tier: 'silver' as const, min: 1000, max: 4999 },
                    { tier: 'bronze' as const, min: 0, max: 999 },
                  ].map(({ tier, min, max }) => (
                    <Box
                      key={tier}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 1,
                        borderBottom: tier !== 'bronze' ? `1px solid ${theme.palette.divider}` : 'none',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <RankBadge tier={tier} size="small" showLabel={false} />
                        <Typography variant="body2" sx={{ textTransform: 'capitalize', fontWeight: 500 }}>
                          {tier}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {max ? `${min.toLocaleString()} - ${max.toLocaleString()}` : `${min.toLocaleString()}+`} pts
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>

              {/* Community Stats */}
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Community Distribution
                  </Typography>
                  {Object.entries(tierDistribution).map(([tier, data]) => (
                    <Box key={tier} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                          {tier}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {data.count.toLocaleString()} ({data.percentage}%)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={data.percentage * 2}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: alpha(data.color, 0.2),
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            bgcolor: data.color,
                          },
                        }}
                      />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Box>
          </Grid>

          {/* Rankings List */}
          <Grid item xs={12} lg={8}>
            {/* Tier Filter */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <FilterIcon color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Filter by Tier:
                  </Typography>
                  <Tabs
                    value={selectedTier}
                    onChange={(_, value) => setSelectedTier(value)}
                    sx={{
                      minHeight: 36,
                      '& .MuiTab-root': {
                        minHeight: 36,
                        py: 0.5,
                        textTransform: 'capitalize',
                      },
                    }}
                  >
                    <Tab value="all" label="All" />
                    <Tab
                      value="diamond"
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <RankBadge tier="diamond" size="small" showLabel={false} animated={false} />
                          Diamond
                        </Box>
                      }
                    />
                    <Tab
                      value="platinum"
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <RankBadge tier="platinum" size="small" showLabel={false} animated={false} />
                          Platinum
                        </Box>
                      }
                    />
                    <Tab
                      value="gold"
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <RankBadge tier="gold" size="small" showLabel={false} animated={false} />
                          Gold
                        </Box>
                      }
                    />
                    <Tab
                      value="silver"
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <RankBadge tier="silver" size="small" showLabel={false} animated={false} />
                          Silver
                        </Box>
                      }
                    />
                    <Tab
                      value="bronze"
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <RankBadge tier="bronze" size="small" showLabel={false} animated={false} />
                          Bronze
                        </Box>
                      }
                    />
                  </Tabs>
                </Box>
              </CardContent>
            </Card>

            {/* Rankings Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <LeaderboardTable
                records={filteredRankings}
                type="global"
                currentUserId="mock-user-1"
                loading={isLoading}
                rowsPerPage={20}
                emptyMessage={`No ${selectedTier} tier players found`}
              />
            </motion.div>

            {/* Stats Summary */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        2,500+
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Active Racers
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                        15,000+
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Sessions This Month
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                        850+
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Track Records
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
