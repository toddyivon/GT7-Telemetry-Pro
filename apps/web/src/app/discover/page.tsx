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
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Chip,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Breadcrumbs,
  Link as MuiLink,
  Skeleton,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  Explore as ExploreIcon,
  TrendingUp as TrendingIcon,
  NewReleases as NewIcon,
  EmojiEvents as TrophyIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import UserCard from '@/components/social/UserCard';
import SessionCard from '@/components/social/SessionCard';
import ShareModal from '@/components/social/ShareModal';
import { SocialUser, SessionWithSocial } from '@/lib/stores/socialStore';

type DiscoverTab = 'racers' | 'sessions' | 'tracks';

// Mock data
const mockRacers: SocialUser[] = [
  {
    id: 'user-1',
    name: 'SpeedDemon',
    pilotName: 'SpeedDemon_GT7',
    followersCount: 1247,
    followingCount: 89,
    isFollowing: false,
    stats: {
      totalSessions: 342,
      bestLapTime: '1:22.456',
      favoriteTrack: 'Nurburgring GP',
      totalLaps: 4892,
      totalDistance: 24560,
      podiums: 87,
      wins: 34,
    },
    joinDate: 'March 2024',
    isVerified: true,
    badges: ['Track Master', 'Endurance Specialist'],
    bio: 'Passionate sim racer. GT3 class specialist.',
  },
  {
    id: 'user-2',
    name: 'RacingQueen',
    pilotName: 'Racing_Queen',
    followersCount: 2341,
    followingCount: 156,
    isFollowing: true,
    stats: {
      totalSessions: 567,
      bestLapTime: '1:18.234',
      favoriteTrack: 'Spa-Francorchamps',
      totalLaps: 7823,
      totalDistance: 39115,
      podiums: 123,
      wins: 67,
    },
    joinDate: 'January 2024',
    isVerified: true,
    badges: ['World Champion', 'Clean Racer'],
    bio: 'Professional esports racer. Always improving.',
  },
  {
    id: 'user-3',
    name: 'ApexHunter',
    pilotName: 'Apex_Hunter_21',
    followersCount: 567,
    followingCount: 234,
    isFollowing: false,
    stats: {
      totalSessions: 189,
      bestLapTime: '1:25.789',
      favoriteTrack: 'Suzuka Circuit',
      totalLaps: 2345,
      totalDistance: 11725,
      podiums: 45,
      wins: 12,
    },
    joinDate: 'June 2024',
    badges: ['Rising Star'],
    bio: 'Learning every day. Love the challenge!',
  },
  {
    id: 'user-4',
    name: 'DriftMaster',
    pilotName: 'Drift_Master_99',
    followersCount: 892,
    followingCount: 178,
    isFollowing: false,
    stats: {
      totalSessions: 234,
      bestLapTime: '1:20.123',
      favoriteTrack: 'Laguna Seca',
      totalLaps: 3456,
      totalDistance: 17280,
      podiums: 56,
      wins: 23,
    },
    joinDate: 'April 2024',
    isVerified: true,
    badges: ['Drift King', 'Style Points'],
  },
  {
    id: 'user-5',
    name: 'EnduranceKing',
    pilotName: 'Endurance_King',
    followersCount: 1567,
    followingCount: 234,
    isFollowing: false,
    stats: {
      totalSessions: 234,
      bestLapTime: '1:25.789',
      favoriteTrack: 'Le Mans Circuit',
      totalLaps: 12456,
      totalDistance: 74736,
      podiums: 89,
      wins: 23,
    },
    joinDate: 'February 2024',
    isVerified: true,
    badges: ['Endurance Specialist', 'Marathon Runner'],
    bio: 'Long races, big challenges. 24h specialist.',
  },
  {
    id: 'user-6',
    name: 'FastLane',
    pilotName: 'FastLane_Pro',
    followersCount: 456,
    followingCount: 89,
    isFollowing: false,
    stats: {
      totalSessions: 123,
      bestLapTime: '1:23.456',
      favoriteTrack: 'Monza Circuit',
      totalLaps: 1678,
      totalDistance: 8390,
      podiums: 23,
      wins: 8,
    },
    joinDate: 'August 2024',
    badges: ['Speed Demon'],
  },
];

const mockSessions: SessionWithSocial[] = [
  {
    id: 'session-1',
    userId: 'user-1',
    userName: 'SpeedDemon',
    trackName: 'Nurburgring GP',
    carModel: 'Porsche 911 GT3 RS',
    sessionDate: Date.now() - 3600000,
    sessionType: 'time_trial',
    bestLapTime: 82456,
    lapCount: 15,
    isPublic: true,
    likeCount: 142,
    commentCount: 28,
    shareCount: 15,
    isLiked: false,
    tags: ['track record', 'personal best'],
    notes: 'New track record! Perfect conditions.',
  },
  {
    id: 'session-2',
    userId: 'user-2',
    userName: 'RacingQueen',
    trackName: 'Spa-Francorchamps',
    carModel: 'Ferrari 488 GT3',
    sessionDate: Date.now() - 7200000,
    sessionType: 'race',
    bestLapTime: 138567,
    lapCount: 24,
    isPublic: true,
    likeCount: 89,
    commentCount: 45,
    shareCount: 23,
    isLiked: true,
    tags: ['race win', 'wet conditions'],
    notes: 'Epic rain race! P1 finish.',
  },
  {
    id: 'session-3',
    userId: 'user-3',
    userName: 'ApexHunter',
    trackName: 'Suzuka Circuit',
    carModel: 'McLaren 720S GT3',
    sessionDate: Date.now() - 14400000,
    sessionType: 'qualifying',
    bestLapTime: 95234,
    lapCount: 8,
    isPublic: true,
    likeCount: 56,
    commentCount: 12,
    shareCount: 8,
    isLiked: false,
    tags: ['qualifying', 'pole position'],
  },
];

// Popular tracks for filtering
const popularTracks = [
  'All Tracks',
  'Nurburgring GP',
  'Spa-Francorchamps',
  'Suzuka Circuit',
  'Monza Circuit',
  'Silverstone',
  'Le Mans Circuit',
  'Laguna Seca',
];

export default function DiscoverPage() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<DiscoverTab>('racers');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('All Tracks');
  const [sortBy, setSortBy] = useState('popular');
  const [isLoading, setIsLoading] = useState(true);
  const [racers, setRacers] = useState<SocialUser[]>([]);
  const [sessions, setSessions] = useState<SessionWithSocial[]>([]);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionWithSocial | null>(null);

  useEffect(() => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setRacers(mockRacers);
      setSessions(mockSessions);
      setIsLoading(false);
    }, 800);
  }, [activeTab, searchQuery, selectedTrack, sortBy]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: DiscoverTab) => {
    setActiveTab(newValue);
  };

  const handleShareClick = (session: SessionWithSocial) => {
    setSelectedSession(session);
    setShareModalOpen(true);
  };

  const filteredRacers = racers.filter(
    (racer) =>
      racer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      racer.pilotName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSessions = sessions.filter(
    (session) =>
      selectedTrack === 'All Tracks' || session.trackName === selectedTrack
  );

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
          <Typography color="text.primary">Discover</Typography>
        </Breadcrumbs>

        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <ExploreIcon color="secondary" />
            <Typography variant="headlineLarge" sx={{ fontWeight: 600 }}>
              Discover
            </Typography>
          </Box>
          <Typography variant="bodyLarge" color="text.secondary">
            Find new racers to follow and explore trending sessions
          </Typography>
        </Box>

        {/* Search and Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search racers or sessions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Track</InputLabel>
                  <Select
                    value={selectedTrack}
                    label="Track"
                    onChange={(e) => setSelectedTrack(e.target.value)}
                  >
                    {popularTracks.map((track) => (
                      <MenuItem key={track} value={track}>
                        {track}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sort by</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort by"
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <MenuItem value="popular">Most Popular</MenuItem>
                    <MenuItem value="newest">Newest</MenuItem>
                    <MenuItem value="fastest">Fastest Times</MenuItem>
                    <MenuItem value="active">Most Active</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
              },
            }}
          >
            <Tab
              value="racers"
              label="Racers"
              icon={<TrendingIcon />}
              iconPosition="start"
            />
            <Tab
              value="sessions"
              label="Trending Sessions"
              icon={<NewIcon />}
              iconPosition="start"
            />
            <Tab
              value="tracks"
              label="Popular Tracks"
              icon={<TrophyIcon />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Content */}
        {activeTab === 'racers' && (
          <Grid container spacing={3}>
            {isLoading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                          <Skeleton variant="circular" width={64} height={64} />
                          <Box sx={{ flex: 1 }}>
                            <Skeleton width="60%" />
                            <Skeleton width="40%" />
                          </Box>
                        </Box>
                        <Skeleton height={80} />
                        <Skeleton width="100%" height={40} sx={{ mt: 2 }} />
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              : filteredRacers.map((racer, index) => (
                  <Grid item xs={12} sm={6} md={4} key={racer.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <UserCard user={racer} showStats />
                    </motion.div>
                  </Grid>
                ))}
          </Grid>
        )}

        {activeTab === 'sessions' && (
          <Grid container spacing={3}>
            {isLoading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
                  </Grid>
                ))
              : filteredSessions.map((session, index) => (
                  <Grid item xs={12} md={6} key={session.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <SessionCard
                        session={session}
                        onShareClick={() => handleShareClick(session)}
                      />
                    </motion.div>
                  </Grid>
                ))}
          </Grid>
        )}

        {activeTab === 'tracks' && (
          <Grid container spacing={3}>
            {popularTracks.slice(1).map((track, index) => (
              <Grid item xs={12} sm={6} md={4} key={track}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        boxShadow: theme.shadows[4],
                        transform: 'translateY(-2px)',
                        transition: 'all 0.2s ease-in-out',
                      },
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          height: 120,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 2,
                        }}
                      >
                        <TrophyIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                      </Box>
                      <Typography variant="titleLarge" sx={{ fontWeight: 600, mb: 1 }}>
                        {track}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Chip label={`${Math.floor(Math.random() * 1000 + 500)} sessions`} size="small" />
                        <Chip label={`${Math.floor(Math.random() * 100 + 50)} racers`} size="small" variant="outlined" />
                      </Stack>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Empty State */}
        {!isLoading &&
          ((activeTab === 'racers' && filteredRacers.length === 0) ||
            (activeTab === 'sessions' && filteredSessions.length === 0)) && (
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                px: 4,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.primary.main, 0.03),
              }}
            >
              <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="headlineMedium" color="text.secondary" sx={{ mb: 1 }}>
                No results found
              </Typography>
              <Typography variant="bodyLarge" color="text.secondary">
                Try adjusting your search or filters
              </Typography>
            </Box>
          )}
      </Container>

      {/* Share Modal */}
      {selectedSession && (
        <ShareModal
          open={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setSelectedSession(null);
          }}
          session={selectedSession}
        />
      )}
    </Box>
  );
}
