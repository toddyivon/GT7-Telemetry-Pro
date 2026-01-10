'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Typography,
  Box,
  CircularProgress,
  Avatar,
  useTheme,
  TablePagination,
  TableSortLabel,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Tooltip,
  Skeleton,
  alpha,
  InputAdornment,
  Collapse,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Analytics as AnalyzeIcon,
  DirectionsCar as CarIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  KeyboardArrowDown as ExpandIcon,
  KeyboardArrowUp as CollapseIcon,
} from '@mui/icons-material';

import { useDashboardStore } from '@/lib/stores/dashboardStore';

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

type SortField = 'sessionDate' | 'bestLapTime' | 'lapCount' | 'trackName';

const formatTime = (milliseconds: number): string => {
  if (milliseconds === 0 || !milliseconds) return '--:--';
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  const ms = Math.floor((milliseconds % 1000) / 10);
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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

const getConditionColor = (condition: string): 'success' | 'info' | 'warning' => {
  switch (condition?.toLowerCase()) {
    case 'dry':
      return 'success';
    case 'wet':
      return 'info';
    case 'mixed':
      return 'warning';
    default:
      return 'success';
  }
};

// Loading skeleton row
const SkeletonRow = () => (
  <TableRow>
    <TableCell>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Skeleton variant="circular" width={32} height={32} />
        <Box>
          <Skeleton variant="text" width={120} height={24} />
          <Skeleton variant="rounded" width={60} height={20} />
        </Box>
      </Box>
    </TableCell>
    <TableCell><Skeleton variant="text" width={100} /></TableCell>
    <TableCell><Skeleton variant="text" width={100} /></TableCell>
    <TableCell><Skeleton variant="text" width={80} /></TableCell>
    <TableCell><Skeleton variant="text" width={60} /></TableCell>
    <TableCell><Skeleton variant="text" width={40} /></TableCell>
    <TableCell align="right">
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Skeleton variant="rounded" width={80} height={32} />
        <Skeleton variant="rounded" width={60} height={32} />
      </Box>
    </TableCell>
  </TableRow>
);

export default function RecentSessionsTable() {
  const theme = useTheme();
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [trackFilter, setTrackFilter] = useState<string>('all');
  const [sessionTypeFilter, setSessionTypeFilter] = useState<string>('all');

  const {
    currentPage,
    pageSize,
    sortBy,
    sortDirection,
    setPage,
    setPageSize,
    setSorting,
  } = useDashboardStore();

  // Use Convex query if available, otherwise use mock data
  const recentSessions = useConvexQuery && api
    ? useQuery(api.telemetry.getRecentSessions, { limit: 50 })
    : null;

  const isLoading = useConvexQuery && recentSessions === undefined;

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
    {
      _id: 'mock-5',
      trackName: 'Nurburgring GP',
      carModel: 'Audi R8 LMS GT3',
      sessionType: 'practice',
      sessionDate: Date.now() - 259200000,
      bestLapTime: 93567,
      lapCount: 10,
      trackCondition: 'mixed',
    },
  ];

  const sessionsData: Session[] = useConvexQuery ? (recentSessions || []) : mockSessions;

  // Get unique tracks for filter
  const uniqueTracks = useMemo(() => {
    const tracks = new Set(sessionsData.map(s => s.trackName).filter(Boolean));
    return Array.from(tracks).sort();
  }, [sessionsData]);

  // Filter and sort data
  const filteredAndSortedSessions = useMemo(() => {
    let filtered = [...sessionsData];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        s =>
          s.trackName?.toLowerCase().includes(query) ||
          s.carModel?.toLowerCase().includes(query)
      );
    }

    // Apply track filter
    if (trackFilter !== 'all') {
      filtered = filtered.filter(s => s.trackName === trackFilter);
    }

    // Apply session type filter
    if (sessionTypeFilter !== 'all') {
      filtered = filtered.filter(s => s.sessionType === sessionTypeFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'sessionDate':
          comparison = a.sessionDate - b.sessionDate;
          break;
        case 'bestLapTime':
          comparison = (a.bestLapTime || 0) - (b.bestLapTime || 0);
          break;
        case 'lapCount':
          comparison = (a.lapCount || 0) - (b.lapCount || 0);
          break;
        case 'trackName':
          comparison = (a.trackName || '').localeCompare(b.trackName || '');
          break;
      }
      return sortDirection === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [sessionsData, searchQuery, trackFilter, sessionTypeFilter, sortBy, sortDirection]);

  // Paginate data
  const paginatedSessions = useMemo(() => {
    const startIndex = currentPage * pageSize;
    return filteredAndSortedSessions.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedSessions, currentPage, pageSize]);

  const handleSortClick = (field: SortField) => {
    setSorting(field);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setTrackFilter('all');
    setSessionTypeFilter('all');
    setPage(0);
  };

  const hasActiveFilters = searchQuery || trackFilter !== 'all' || sessionTypeFilter !== 'all';

  if (isLoading) {
    return (
      <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>Session</TableCell>
              <TableCell>Track</TableCell>
              <TableCell>Car</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Best Lap</TableCell>
              <TableCell>Laps</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[1, 2, 3, 4, 5].map(i => (
              <SkeletonRow key={i} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  if (sessionsData.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="bodyLarge" color="text.secondary">
          No sessions found. Start recording telemetry data to see your sessions here.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Search and Filter Bar */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search tracks or cars..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 200, flex: 1, maxWidth: 300 }}
          />

          <Button
            size="small"
            variant={showFilters ? 'contained' : 'outlined'}
            startIcon={showFilters ? <CollapseIcon /> : <FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>

          {hasActiveFilters && (
            <Button
              size="small"
              variant="text"
              color="error"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
            >
              Clear All
            </Button>
          )}

          <Typography variant="bodySmall" color="text.secondary" sx={{ ml: 'auto' }}>
            {filteredAndSortedSessions.length} sessions
          </Typography>
        </Box>

        <Collapse in={showFilters}>
          <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Track</InputLabel>
              <Select
                value={trackFilter}
                label="Track"
                onChange={e => {
                  setTrackFilter(e.target.value);
                  setPage(0);
                }}
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
                onChange={e => {
                  setSessionTypeFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="practice">Practice</MenuItem>
                <MenuItem value="qualifying">Qualifying</MenuItem>
                <MenuItem value="race">Race</MenuItem>
                <MenuItem value="time_trial">Time Trial</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Collapse>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>Session</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'trackName'}
                  direction={sortBy === 'trackName' ? sortDirection : 'asc'}
                  onClick={() => handleSortClick('trackName')}
                >
                  Track
                </TableSortLabel>
              </TableCell>
              <TableCell>Car</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'sessionDate'}
                  direction={sortBy === 'sessionDate' ? sortDirection : 'desc'}
                  onClick={() => handleSortClick('sessionDate')}
                >
                  Date
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'bestLapTime'}
                  direction={sortBy === 'bestLapTime' ? sortDirection : 'asc'}
                  onClick={() => handleSortClick('bestLapTime')}
                >
                  Best Lap
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'lapCount'}
                  direction={sortBy === 'lapCount' ? sortDirection : 'desc'}
                  onClick={() => handleSortClick('lapCount')}
                >
                  Laps
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedSessions.map((session) => (
              <TableRow
                key={session._id}
                hover
                sx={{
                  '&:last-child td, &:last-child th': { border: 0 },
                  transition: 'background-color 0.2s',
                }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: `${getSessionTypeColor(session.sessionType)}.main`,
                      }}
                    >
                      <CarIcon fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="bodyMedium" sx={{ fontWeight: 600 }}>
                        {session.sessionType.charAt(0).toUpperCase() + session.sessionType.slice(1).replace('_', ' ')}
                      </Typography>
                      <Chip
                        label={session.trackCondition || 'dry'}
                        size="small"
                        color={getConditionColor(session.trackCondition)}
                        variant="outlined"
                        sx={{ height: 18, fontSize: '0.65rem' }}
                      />
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="bodyMedium">{session.trackName}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="bodyMedium">{session.carModel}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="bodyMedium">{formatDate(session.sessionDate)}</Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="bodyMedium"
                    sx={{
                      fontWeight: 600,
                      fontFamily: 'monospace',
                      color: session.bestLapTime > 0 ? 'success.main' : 'text.secondary',
                    }}
                  >
                    {formatTime(session.bestLapTime)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="bodyMedium">{session.lapCount}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Tooltip title="Analyze Session">
                      <Button
                        component={Link}
                        href={`/analysis/${session._id}`}
                        size="small"
                        variant="outlined"
                        startIcon={<AnalyzeIcon />}
                      >
                        Analyze
                      </Button>
                    </Tooltip>
                    <Tooltip title="View Details">
                      <Button
                        component={Link}
                        href={`/telemetry/${session._id}`}
                        size="small"
                        variant="text"
                        startIcon={<ViewIcon />}
                      >
                        View
                      </Button>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={filteredAndSortedSessions.length}
        page={currentPage}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={e => setPageSize(parseInt(e.target.value, 10))}
        rowsPerPageOptions={[5, 10, 25, 50]}
        sx={{ borderTop: 1, borderColor: 'divider' }}
      />
    </Box>
  );
}
