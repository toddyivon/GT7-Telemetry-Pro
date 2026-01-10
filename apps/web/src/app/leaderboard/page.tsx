'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import Link from 'next/link';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Breadcrumbs,
  Link as MuiLink,
  Button,
  alpha,
  useTheme,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Timer as TimerIcon,
  TrendingUp as TrendingUpIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  Leaderboard as LeaderboardIcon,
  Place as PlaceIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// Import leaderboard components
import {
  LeaderboardTable,
  RankBadge,
  UserRankCard,
  TrackSelector,
  CarClassFilter,
  TimeFilter,
  AchievementsList,
} from '@/components/leaderboard';

// Try to import Convex API
let api: any;
let useConvexQuery = true;

try {
  const convexApi = require('@/convex/_generated/api');
  api = convexApi.api;
} catch (error) {
  api = null;
  useConvexQuery = false;
}

type LeaderboardCategory = 'overall' | 'weekly' | 'monthly';
type CarClass = 'all' | 'gr1' | 'gr2' | 'gr3' | 'gr4' | 'grb' | 'n100' | 'n200' | 'n300' | 'n400' | 'n500' | 'n600' | 'n700' | 'n800' | 'n1000';
type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'all_time';

// Mock data for development
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

const mockTopRankings = [
  { rank: 1, userId: 'user-1', userName: 'SpeedDemon', points: 35420, tier: 'diamond' as const, rankChange: 0 },
  { rank: 2, userId: 'user-2', userName: 'RacingPro', points: 28950, tier: 'diamond' as const, rankChange: 1 },
  { rank: 3, userId: 'user-3', userName: 'FastLaps', points: 25100, tier: 'diamond' as const, rankChange: -1 },
  { rank: 4, userId: 'user-4', userName: 'ApexHunter', points: 18750, tier: 'platinum' as const, rankChange: 2 },
  { rank: 5, userId: 'user-5', userName: 'TireWhisperer', points: 15320, tier: 'platinum' as const, rankChange: 0 },
  { rank: 6, userId: 'user-6', userName: 'CircuitMaster', points: 12450, tier: 'platinum' as const, rankChange: -1 },
  { rank: 7, userId: 'user-7', userName: 'LapKing', points: 9800, tier: 'gold' as const, rankChange: 3 },
  { rank: 8, userId: 'user-8', userName: 'RaceCraft', points: 8200, tier: 'gold' as const, rankChange: 0 },
  { rank: 9, userId: 'user-9', userName: 'SpeedRunner', points: 7100, tier: 'gold' as const, rankChange: -2 },
  { rank: 10, userId: 'user-10', userName: 'TrackStar', points: 6500, tier: 'gold' as const, rankChange: 1 },
];

const mockTracks = [
  { trackId: 'nurburgring-gp', trackName: 'Nurburgring GP', totalSessions: 245, trackRecord: 92156 },
  { trackId: 'spa-francorchamps', trackName: 'Spa-Francorchamps', totalSessions: 198, trackRecord: 125234 },
  { trackId: 'suzuka-circuit', trackName: 'Suzuka Circuit', totalSessions: 167, trackRecord: 108456 },
  { trackId: 'brands-hatch', trackName: 'Brands Hatch', totalSessions: 134, trackRecord: 78234 },
  { trackId: 'monza', trackName: 'Monza', totalSessions: 156, trackRecord: 95678 },
  { trackId: 'silverstone', trackName: 'Silverstone', totalSessions: 145, trackRecord: 88234 },
  { trackId: 'laguna-seca', trackName: 'Laguna Seca', totalSessions: 112, trackRecord: 72345 },
  { trackId: 'le-mans', trackName: 'Le Mans Circuit', totalSessions: 89, trackRecord: 198456 },
];

const mockAchievements = [
  { achievementId: 'first_lap', name: 'First Lap', description: 'Complete your first lap', category: 'laps' as const, icon: 'flag', tier: 'bronze' as const, points: 10, isUnlocked: true, unlockedAt: Date.now() - 86400000 * 30 },
  { achievementId: 'hundred_laps', name: '100 Laps', description: 'Complete 100 laps across all tracks', category: 'laps' as const, icon: 'repeat', tier: 'silver' as const, points: 100, isUnlocked: true, unlockedAt: Date.now() - 86400000 * 15 },
  { achievementId: 'thousand_laps', name: '1000 Laps', description: 'Complete 1000 laps', category: 'laps' as const, icon: 'star', tier: 'gold' as const, points: 500, isUnlocked: true, unlockedAt: Date.now() - 86400000 * 5 },
  { achievementId: 'track_master', name: 'Track Master', description: 'Drive on all available tracks', category: 'tracks' as const, icon: 'map', tier: 'gold' as const, points: 250, isUnlocked: false, progress: { current: 7, target: 10 } },
  { achievementId: 'consistent', name: 'Consistent', description: 'Complete 10 laps within 1% variance', category: 'consistency' as const, icon: 'timeline', tier: 'silver' as const, points: 75, isUnlocked: false, progress: { current: 6, target: 10 } },
  { achievementId: 'improver', name: 'Improver', description: 'Beat your personal best lap time', category: 'improvement' as const, icon: 'trending_up', tier: 'bronze' as const, points: 50, isUnlocked: true, unlockedAt: Date.now() - 86400000 * 2 },
  { achievementId: 'social_butterfly', name: 'Social', description: 'Gain 10 followers', category: 'social' as const, icon: 'people', tier: 'silver' as const, points: 50, isUnlocked: false, progress: { current: 4, target: 10 } },
  { achievementId: 'analyst', name: 'Analyst', description: 'Complete 100 telemetry analysis sessions', category: 'analysis' as const, icon: 'analytics', tier: 'gold' as const, points: 150, isUnlocked: false, progress: { current: 45, target: 100 } },
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`leaderboard-tabpanel-${index}`}
      aria-labelledby={`leaderboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function LeaderboardPage() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTrack, setSelectedTrack] = useState('all');
  const [selectedCarClass, setSelectedCarClass] = useState<CarClass>('all');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>('all_time');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Calculate achievement stats
  const achievementStats = {
    unlocked: mockAchievements.filter(a => a.isUnlocked).length,
    total: mockAchievements.length,
    percentage: Math.round((mockAchievements.filter(a => a.isUnlocked).length / mockAchievements.length) * 100),
    totalPoints: mockAchievements.filter(a => a.isUnlocked).reduce((sum, a) => sum + a.points, 0),
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

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
          <Typography color="text.primary">Leaderboard</Typography>
        </Breadcrumbs>

        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <LeaderboardIcon sx={{ fontSize: 40, color: 'warning.main' }} />
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Leaderboards & Rankings
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary">
              Compete with the community, track your progress, and unlock achievements
            </Typography>
          </motion.div>
        </Box>

        {/* User Rank Card */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
            <UserRankCard data={mockUserRank} loading={isLoading} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Quick Stats
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Global Position</Typography>
                    <Chip label={`#${mockUserRank.rank}`} color="primary" size="small" />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Track Records</Typography>
                    <Chip label={mockUserRank.stats.trackRecords} color="warning" size="small" />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Personal Bests</Typography>
                    <Chip label={mockUserRank.stats.personalBests} color="success" size="small" />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Achievements</Typography>
                    <Chip label={`${achievementStats.unlocked}/${achievementStats.total}`} variant="outlined" size="small" />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tab Navigation */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                fontWeight: 600,
                textTransform: 'none',
              },
            }}
          >
            <Tab icon={<LeaderboardIcon />} label="Global Rankings" iconPosition="start" />
            <Tab icon={<PlaceIcon />} label="Track Leaderboards" iconPosition="start" />
            <Tab icon={<TrophyIcon />} label="Achievements" iconPosition="start" />
          </Tabs>
        </Box>

        {/* Global Rankings Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Top Racers
                </Typography>
                <Button
                  component={Link}
                  href="/leaderboard/global"
                  endIcon={<ArrowForwardIcon />}
                  variant="outlined"
                >
                  View All Rankings
                </Button>
              </Box>
              <LeaderboardTable
                records={mockTopRankings}
                type="global"
                currentUserId="mock-user-1"
                loading={isLoading}
              />
            </Grid>

            {/* Tier Distribution */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Community Tier Distribution
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {[
                      { tier: 'diamond' as const, count: 1, color: '#B9F2FF' },
                      { tier: 'platinum' as const, count: 4, color: '#E5E4E2' },
                      { tier: 'gold' as const, count: 15, color: '#FFD700' },
                      { tier: 'silver' as const, count: 30, color: '#C0C0C0' },
                      { tier: 'bronze' as const, count: 50, color: '#CD7F32' },
                    ].map(({ tier, count, color }) => (
                      <Box
                        key={tier}
                        sx={{
                          textAlign: 'center',
                          p: 2,
                          borderRadius: 2,
                          bgcolor: alpha(color, 0.1),
                          border: `1px solid ${alpha(color, 0.3)}`,
                          minWidth: 120,
                        }}
                      >
                        <RankBadge tier={tier} size="large" showLabel={false} />
                        <Typography variant="h5" sx={{ fontWeight: 700, mt: 1 }}>
                          {count}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                          {tier}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Points System Info */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    How Points Work
                  </Typography>
                  <Grid container spacing={2}>
                    {[
                      { action: 'Complete a Session', points: 10, icon: <TimerIcon color="primary" /> },
                      { action: 'Set a Personal Best', points: 50, icon: <TrendingUpIcon color="success" /> },
                      { action: 'Break a Track Record', points: 100, icon: <TrophyIcon color="warning" /> },
                      { action: 'Unlock Achievement', points: 'Varies', icon: <TrophyIcon color="secondary" /> },
                    ].map(({ action, points, icon }) => (
                      <Grid item xs={12} sm={6} md={3} key={action}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            p: 2,
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                          }}
                        >
                          {icon}
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {action}
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                              +{points} pts
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Track Leaderboards Tab */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            {/* Filters */}
            <Grid item xs={12}>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                      <TrackSelector
                        tracks={mockTracks}
                        selectedTrack={selectedTrack}
                        onTrackChange={setSelectedTrack}
                      />
                    </Grid>
                    <Grid item xs={12} md={5}>
                      <CarClassFilter
                        selectedClass={selectedCarClass}
                        onClassChange={setSelectedCarClass}
                        compact
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TimeFilter
                        selectedPeriod={selectedTimePeriod}
                        onPeriodChange={setSelectedTimePeriod}
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Featured Tracks */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Popular Tracks
              </Typography>
              <Grid container spacing={2}>
                {mockTracks.slice(0, 4).map((track, index) => (
                  <Grid item xs={12} sm={6} md={3} key={track.trackId}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card>
                        <CardActionArea
                          component={Link}
                          href={`/leaderboard/${track.trackId}`}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <PlaceIcon color="primary" />
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {track.trackName}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="caption" color="text.secondary">
                                {track.totalSessions} sessions
                              </Typography>
                              {track.trackRecord > 0 && (
                                <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 600 }}>
                                  Record: {Math.floor(track.trackRecord / 60000)}:{((track.trackRecord % 60000) / 1000).toFixed(3).padStart(6, '0')}
                                </Typography>
                              )}
                            </Box>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </Grid>

            {/* All Tracks List */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                All Tracks
              </Typography>
              <Grid container spacing={2}>
                {mockTracks.map((track) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={track.trackId}>
                    <Card variant="outlined">
                      <CardActionArea
                        component={Link}
                        href={`/leaderboard/${track.trackId}`}
                        sx={{ p: 2 }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PlaceIcon color="action" fontSize="small" />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {track.trackName}
                            </Typography>
                          </Box>
                          <ArrowForwardIcon fontSize="small" color="action" />
                        </Box>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Achievements Tab */}
        <TabPanel value={activeTab} index={2}>
          <AchievementsList
            achievements={mockAchievements}
            stats={achievementStats}
            loading={isLoading}
          />
        </TabPanel>
      </Container>
    </Box>
  );
}
