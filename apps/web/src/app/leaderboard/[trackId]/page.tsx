'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
  Chip,
  Button,
  Skeleton,
  useTheme,
  alpha,
  Divider,
} from '@mui/material';
import {
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  Leaderboard as LeaderboardIcon,
  Place as PlaceIcon,
  Timer as TimerIcon,
  EmojiEvents as TrophyIcon,
  Speed as SpeedIcon,
  ArrowBack as ArrowBackIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

import {
  LeaderboardTable,
  CarClassFilter,
  TimeFilter,
  UserRankCard,
} from '@/components/leaderboard';

type CarClass = 'all' | 'gr1' | 'gr2' | 'gr3' | 'gr4' | 'grb' | 'n100' | 'n200' | 'n300' | 'n400' | 'n500' | 'n600' | 'n700' | 'n800' | 'n1000';
type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'all_time';

// Mock track data
const trackData: Record<string, { name: string; country: string; length: number; turns: number }> = {
  'nurburgring-gp': { name: 'Nurburgring GP', country: 'Germany', length: 5.148, turns: 15 },
  'spa-francorchamps': { name: 'Spa-Francorchamps', country: 'Belgium', length: 7.004, turns: 19 },
  'suzuka-circuit': { name: 'Suzuka Circuit', country: 'Japan', length: 5.807, turns: 18 },
  'brands-hatch': { name: 'Brands Hatch', country: 'United Kingdom', length: 3.908, turns: 9 },
  'monza': { name: 'Monza', country: 'Italy', length: 5.793, turns: 11 },
  'silverstone': { name: 'Silverstone', country: 'United Kingdom', length: 5.891, turns: 18 },
  'laguna-seca': { name: 'Laguna Seca', country: 'USA', length: 3.602, turns: 11 },
  'le-mans': { name: 'Le Mans Circuit', country: 'France', length: 13.626, turns: 38 },
};

// Mock leaderboard records
const mockRecords = [
  { rank: 1, userId: 'user-1', userName: 'SpeedDemon', lapTime: 92156, carModel: 'Porsche 911 GT3 RS', isTrackRecord: true, isPersonalBest: true, delta: 0 },
  { rank: 2, userId: 'user-2', userName: 'RacingPro', lapTime: 92890, carModel: 'Ferrari 488 GT3', isTrackRecord: false, isPersonalBest: true, delta: 734 },
  { rank: 3, userId: 'user-3', userName: 'FastLaps', lapTime: 93012, carModel: 'Mercedes AMG GT3', isTrackRecord: false, isPersonalBest: true, delta: 856 },
  { rank: 4, userId: 'user-4', userName: 'ApexHunter', lapTime: 93245, carModel: 'BMW M4 GT3', isTrackRecord: false, isPersonalBest: true, delta: 1089 },
  { rank: 5, userId: 'user-5', userName: 'TireWhisperer', lapTime: 93567, carModel: 'Nissan GT-R GT3', isTrackRecord: false, isPersonalBest: true, delta: 1411 },
  { rank: 6, userId: 'user-6', userName: 'CircuitMaster', lapTime: 93789, carModel: 'Audi R8 LMS GT3', isTrackRecord: false, isPersonalBest: false, delta: 1633 },
  { rank: 7, userId: 'user-7', userName: 'LapKing', lapTime: 94012, carModel: 'Lamborghini Huracan GT3', isTrackRecord: false, isPersonalBest: true, delta: 1856 },
  { rank: 8, userId: 'user-8', userName: 'RaceCraft', lapTime: 94234, carModel: 'McLaren 720S GT3', isTrackRecord: false, isPersonalBest: false, delta: 2078 },
  { rank: 9, userId: 'user-9', userName: 'SpeedRunner', lapTime: 94456, carModel: 'Aston Martin V8 Vantage GT3', isTrackRecord: false, isPersonalBest: true, delta: 2300 },
  { rank: 10, userId: 'user-10', userName: 'TrackStar', lapTime: 94678, carModel: 'Porsche 911 GT3 R', isTrackRecord: false, isPersonalBest: false, delta: 2522 },
];

// Mock user's position on this track
const mockUserTrackRank = {
  userId: 'mock-user-1',
  userName: 'Missola',
  rank: 15,
  lapTime: 95234,
  carModel: 'Porsche 911 GT3 RS',
  isPersonalBest: true,
  delta: 3078,
};

const formatTime = (milliseconds: number): string => {
  if (!milliseconds) return '--:--:---';
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  const ms = Math.floor(milliseconds % 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
};

export default function TrackLeaderboardPage() {
  const theme = useTheme();
  const params = useParams();
  const trackId = params.trackId as string;

  const [selectedCarClass, setSelectedCarClass] = useState<CarClass>('all');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>('all_time');
  const [isLoading, setIsLoading] = useState(true);

  const track = trackData[trackId] || { name: trackId, country: 'Unknown', length: 0, turns: 0 };

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [trackId, selectedCarClass, selectedTimePeriod]);

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
          <Typography color="text.primary">{track.name}</Typography>
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

        {/* Track Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card
            sx={{
              mb: 4,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            }}
          >
            <CardContent sx={{ py: 4 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <PlaceIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {track.name}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {track.country}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<SpeedIcon />}
                      label={`${track.length} km`}
                      variant="outlined"
                    />
                    <Chip
                      label={`${track.turns} turns`}
                      variant="outlined"
                    />
                    <Chip
                      label={`${mockRecords.length}+ entries`}
                      variant="outlined"
                      color="primary"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.warning.main, 0.1),
                      border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="overline" color="text.secondary">
                      Track Record
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 1 }}>
                      <TrophyIcon sx={{ color: 'warning.main', fontSize: 32 }} />
                      <Typography
                        variant="h3"
                        sx={{
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          color: 'warning.main',
                        }}
                      >
                        {formatTime(mockRecords[0]?.lapTime || 0)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      by {mockRecords[0]?.userName} - {mockRecords[0]?.carModel}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </motion.div>

        {/* Your Position Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Your Best Time
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      color: 'white',
                    }}
                  >
                    #{mockUserTrackRank.rank}
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {mockUserTrackRank.userName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {mockUserTrackRank.carModel}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="overline" color="text.secondary">
                    Best Lap Time
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 700, fontFamily: 'monospace', color: 'success.main' }}
                  >
                    {formatTime(mockUserTrackRank.lapTime)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="overline" color="text.secondary">
                    Gap to Leader
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 700, fontFamily: 'monospace', color: 'error.main' }}
                  >
                    +{(mockUserTrackRank.delta / 1000).toFixed(3)}s
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={8}>
                <CarClassFilter
                  selectedClass={selectedCarClass}
                  onClassChange={setSelectedCarClass}
                  compact
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TimeFilter
                  selectedPeriod={selectedTimePeriod}
                  onPeriodChange={setSelectedTimePeriod}
                  size="small"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Leaderboard Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <LeaderboardTable
            records={mockRecords}
            type="track"
            currentUserId="mock-user-1"
            loading={isLoading}
          />
        </motion.div>

        {/* Share Button */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<ShareIcon />}
            sx={{ minWidth: 200 }}
          >
            Share Leaderboard
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
