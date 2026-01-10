'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
import Link from 'next/link';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Button,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton,
  Avatar,
  useTheme,
  alpha,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Analytics as AnalyticsIcon,
  Timeline as TimelineIcon,
  Route as RouteIcon,
  Speed as SpeedIcon,
  LocalGasStation as FuelIcon,
  DirectionsCar as CarIcon,
  FilterList as FilterIcon,
  ArrowForward as ArrowForwardIcon,
  Upload as UploadIcon,
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

interface Session {
  _id: string;
  trackName: string;
  carModel: string;
  sessionType: string;
  sessionDate: number;
  bestLapTime: number;
  lapCount: number;
  trackCondition: string;
}

const analysisTypes = [
  {
    id: 'lap-comparison',
    name: 'Lap Comparison',
    description: 'Compare lap times and sector performance',
    icon: <TimelineIcon />,
    color: '#6200ea',
  },
  {
    id: 'racing-line',
    name: 'Racing Line Analysis',
    description: 'Visualize and compare racing lines',
    icon: <RouteIcon />,
    color: '#03dac6',
  },
  {
    id: 'fuel-efficiency',
    name: 'Fuel Efficiency',
    description: 'Analyze fuel consumption and pit strategy',
    icon: <FuelIcon />,
    color: '#ff9800',
  },
  {
    id: 'sector-analysis',
    name: 'Sector Analysis',
    description: 'Deep dive into individual sectors',
    icon: <SpeedIcon />,
    color: '#4caf50',
  },
];

const formatTime = (milliseconds: number): string => {
  if (!milliseconds || milliseconds === 0) return '--:--';
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  const ms = Math.floor((milliseconds % 1000) / 10);
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getSessionTypeColor = (type: string): 'error' | 'warning' | 'info' | 'success' | 'primary' => {
  switch (type.toLowerCase()) {
    case 'race':
      return 'error';
    case 'qualifying':
      return 'warning';
    case 'practice':
      return 'info';
    case 'time_trial':
      return 'success';
    default:
      return 'primary';
  }
};

// Session Card Skeleton
const SessionCardSkeleton = () => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Skeleton variant="circular" width={48} height={48} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={28} />
          <Skeleton variant="text" width="40%" height={20} />
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Skeleton variant="rounded" width={60} height={24} />
            <Skeleton variant="rounded" width={80} height={24} />
          </Box>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export default function AnalysisPage() {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [trackFilter, setTrackFilter] = useState<string>('all');
  const [sessionTypeFilter, setSessionTypeFilter] = useState<string>('all');

  // Fetch sessions from Convex
  const sessions = useConvexQuery && api
    ? useQuery(api.telemetry.getUserSessions, { limit: 50 })
    : null;

  const isLoading = useConvexQuery && sessions === undefined;

  // Mock data for development
  const mockSessions: Session[] = [
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
      sessionDate: Date.now() - 86400000,
      bestLapTime: 125234,
      lapCount: 12,
      trackCondition: 'wet',
    },
    {
      _id: 'mock-3',
      trackName: 'Suzuka Circuit',
      carModel: 'Honda NSX GT3',
      sessionType: 'race',
      sessionDate: Date.now() - 172800000,
      bestLapTime: 98543,
      lapCount: 15,
      trackCondition: 'dry',
    },
  ];

  const sessionsData: Session[] = useConvexQuery ? (sessions || []) : mockSessions;

  // Get unique tracks
  const uniqueTracks = useMemo(() => {
    const tracks = new Set(sessionsData.map(s => s.trackName).filter(Boolean));
    return Array.from(tracks).sort();
  }, [sessionsData]);

  // Filter sessions
  const filteredSessions = useMemo(() => {
    let filtered = [...sessionsData];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        s =>
          s.trackName?.toLowerCase().includes(query) ||
          s.carModel?.toLowerCase().includes(query)
      );
    }

    if (trackFilter !== 'all') {
      filtered = filtered.filter(s => s.trackName === trackFilter);
    }

    if (sessionTypeFilter !== 'all') {
      filtered = filtered.filter(s => s.sessionType === sessionTypeFilter);
    }

    // Sort by date descending
    filtered.sort((a, b) => b.sessionDate - a.sessionDate);

    return filtered;
  }, [sessionsData, searchQuery, trackFilter, sessionTypeFilter]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="headlineLarge" sx={{ fontWeight: 600, mb: 1 }}>
            Telemetry Analysis
          </Typography>
          <Typography variant="bodyLarge" color="text.secondary">
            Select a session to analyze lap times, racing lines, and performance data
          </Typography>
        </Box>
      </motion.div>

      <Grid container spacing={4}>
        {/* Analysis Types */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Typography variant="titleLarge" sx={{ fontWeight: 600, mb: 2 }}>
              Analysis Tools
            </Typography>
            <Grid container spacing={2}>
              {analysisTypes.map((type, index) => (
                <Grid item xs={12} sm={6} md={3} key={type.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                  >
                    <Card
                      sx={{
                        height: '100%',
                        background: `linear-gradient(135deg, ${alpha(type.color, 0.12)} 0%, ${alpha(
                          type.color,
                          0.04
                        )} 100%)`,
                        border: `1px solid ${alpha(type.color, 0.2)}`,
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: `0 8px 24px ${alpha(type.color, 0.25)}`,
                        },
                      }}
                    >
                      <CardContent>
                        <Avatar
                          sx={{
                            bgcolor: type.color,
                            mb: 2,
                            width: 48,
                            height: 48,
                          }}
                        >
                          {type.icon}
                        </Avatar>
                        <Typography variant="titleMedium" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {type.name}
                        </Typography>
                        <Typography variant="bodySmall" color="text.secondary">
                          {type.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Grid>

        {/* Session Selection */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Typography variant="titleLarge" sx={{ fontWeight: 600 }}>
                Select Session to Analyze
              </Typography>
              <Button
                component={Link}
                href="/telemetry/upload"
                variant="outlined"
                startIcon={<UploadIcon />}
              >
                Upload Telemetry
              </Button>
            </Box>

            {/* Filters */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <TextField
                size="small"
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: 200, flex: 1, maxWidth: 300 }}
              />

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Track</InputLabel>
                <Select
                  value={trackFilter}
                  label="Track"
                  onChange={e => setTrackFilter(e.target.value)}
                >
                  <MenuItem value="all">All Tracks</MenuItem>
                  {uniqueTracks.map(track => (
                    <MenuItem key={track} value={track}>
                      {track}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Session Type</InputLabel>
                <Select
                  value={sessionTypeFilter}
                  label="Session Type"
                  onChange={e => setSessionTypeFilter(e.target.value)}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="practice">Practice</MenuItem>
                  <MenuItem value="qualifying">Qualifying</MenuItem>
                  <MenuItem value="race">Race</MenuItem>
                  <MenuItem value="time_trial">Time Trial</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Sessions Grid */}
            {isLoading ? (
              <Grid container spacing={2}>
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Grid item xs={12} sm={6} md={4} key={i}>
                    <SessionCardSkeleton />
                  </Grid>
                ))}
              </Grid>
            ) : filteredSessions.length === 0 ? (
              <Card>
                <CardContent sx={{ py: 6, textAlign: 'center' }}>
                  <AnalyticsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="titleMedium" color="text.secondary">
                    No sessions found
                  </Typography>
                  <Typography variant="bodySmall" color="text.secondary" sx={{ mb: 3 }}>
                    {searchQuery || trackFilter !== 'all' || sessionTypeFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Record or upload telemetry data to get started'}
                  </Typography>
                  <Button
                    component={Link}
                    href="/record-lap"
                    variant="contained"
                    startIcon={<CarIcon />}
                  >
                    Record New Session
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Grid container spacing={2}>
                {filteredSessions.map((session, index) => (
                  <Grid item xs={12} sm={6} md={4} key={session._id}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                    >
                      <Card
                        sx={{
                          height: '100%',
                          transition: 'all 0.2s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 4,
                          },
                        }}
                      >
                        <CardActionArea
                          component={Link}
                          href={`/analysis/${session._id}`}
                          sx={{ height: '100%' }}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                              <Avatar
                                sx={{
                                  bgcolor: `${getSessionTypeColor(session.sessionType)}.main`,
                                  width: 48,
                                  height: 48,
                                }}
                              >
                                <CarIcon />
                              </Avatar>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                  variant="titleMedium"
                                  sx={{ fontWeight: 600 }}
                                  noWrap
                                >
                                  {session.trackName}
                                </Typography>
                                <Typography variant="bodySmall" color="text.secondary" noWrap>
                                  {session.carModel}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                                  <Chip
                                    label={session.sessionType.replace('_', ' ')}
                                    size="small"
                                    color={getSessionTypeColor(session.sessionType)}
                                    sx={{ height: 22, fontSize: '0.7rem' }}
                                  />
                                  <Chip
                                    label={formatTime(session.bestLapTime)}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      height: 22,
                                      fontSize: '0.7rem',
                                      fontFamily: 'monospace',
                                    }}
                                  />
                                </Box>
                              </Box>
                              <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="labelSmall" color="text.secondary">
                                  {formatDate(session.sessionDate)}
                                </Typography>
                                <Typography variant="bodySmall" color="text.secondary">
                                  {session.lapCount} laps
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            )}
          </motion.div>
        </Grid>
      </Grid>
    </Container>
  );
}
