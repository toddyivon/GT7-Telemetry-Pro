'use client';

import React from 'react';
import Link from 'next/link';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  Divider,
  CircularProgress,
  Button,
  Skeleton,
  Breadcrumbs,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Timeline as TimelineIcon,
  Route as RouteIcon,
  LocalGasStation as FuelIcon,
  Map as MapIcon,
  Code as CodeIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { useQuery } from 'convex/react';
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

import LapTimeChart from '@/components/analysis/LapTimeChart';
import LapComparison from '@/components/analysis/LapComparison';
import FuelEfficiencyAnalysis from '@/components/analysis/FuelEfficiencyAnalysis';
import TrackMap from '@/components/analysis/TrackMap';
import SessionSummary from '@/components/analysis/SessionSummary';
import RacingLineAnalysis from '@/components/analysis/RacingLineAnalysis';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analysis-tabpanel-${index}`}
      aria-labelledby={`analysis-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

// Loading skeleton
const SessionSkeleton = () => {
  const theme = useTheme();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ mb: 4 }}>
        <Skeleton variant="text" width={300} height={48} />
        <Skeleton variant="text" width={200} height={24} />
      </Box>
      <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2, mb: 4 }} />
      <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1, mb: 2 }} />
      <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
    </Container>
  );
};

// Error state
const SessionError = ({ message }: { message: string }) => (
  <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
    <Typography variant="headlineMedium" sx={{ mb: 2 }}>
      Session Not Found
    </Typography>
    <Typography variant="bodyLarge" color="text.secondary" sx={{ mb: 4 }}>
      {message}
    </Typography>
    <Button component={Link} href="/analysis" variant="contained" startIcon={<BackIcon />}>
      Back to Analysis
    </Button>
  </Container>
);

// Mock session data for development
const mockSessionDetails = {
  _id: 'mock-session-1',
  trackName: 'Nurburgring GP',
  carModel: 'BMW M3 GT3',
  sessionType: 'practice',
  sessionDate: Date.now() - 3600000,
  bestLapTime: 92156,
  lapCount: 8,
  trackCondition: 'dry',
  laps: [
    { lapNumber: 1, lapTime: 98234, sector1Time: 32000, sector2Time: 35234, sector3Time: 31000, topSpeed: 285 },
    { lapNumber: 2, lapTime: 95678, sector1Time: 31500, sector2Time: 34178, sector3Time: 30000, topSpeed: 288 },
    { lapNumber: 3, lapTime: 94123, sector1Time: 31200, sector2Time: 33923, sector3Time: 29000, topSpeed: 290 },
    { lapNumber: 4, lapTime: 93456, sector1Time: 31000, sector2Time: 33456, sector3Time: 29000, topSpeed: 291 },
    { lapNumber: 5, lapTime: 92156, sector1Time: 30500, sector2Time: 32656, sector3Time: 29000, topSpeed: 293 },
    { lapNumber: 6, lapTime: 92789, sector1Time: 30700, sector2Time: 33089, sector3Time: 29000, topSpeed: 292 },
    { lapNumber: 7, lapTime: 93234, sector1Time: 30900, sector2Time: 33334, sector3Time: 29000, topSpeed: 290 },
    { lapNumber: 8, lapTime: 92567, sector1Time: 30600, sector2Time: 32967, sector3Time: 29000, topSpeed: 291 },
  ],
};

export default function SessionAnalysis({ params }: { params: { sessionId: string } }) {
  const theme = useTheme();
  const [tabValue, setTabValue] = React.useState(0);

  // Fetch session details from Convex
  const sessionDetails = useConvexQuery && api
    ? useQuery(api.telemetry.getSessionDetails, { sessionId: params.sessionId as any })
    : null;

  const isLoading = useConvexQuery && sessionDetails === undefined;

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (isLoading) {
    return <SessionSkeleton />;
  }

  // Use mock data if Convex is not available or session not found
  const sessionData = useConvexQuery ? sessionDetails : mockSessionDetails;

  if (!sessionData) {
    return <SessionError message="The session you're looking for doesn't exist or has been deleted." />;
  }

  // Map Convex data to component props
  const session = {
    ...sessionData,
    track: sessionData.trackName,
    carName: sessionData.carModel,
    date: sessionData.sessionDate,
    bestLap: {
      lapNumber: 0,
      time: sessionData.bestLapTime,
      lapTime: sessionData.bestLapTime,
    },
    laps: (sessionData.laps || []).map((l: any) => ({
      ...l,
      time: l.lapTime,
      sectors: [l.sector1Time, l.sector2Time, l.sector3Time],
    })),
  };

  // Find actual best lap object
  const bestLapObj = session.laps.reduce((best: any, current: any) => {
    if (!best || (current.lapTime > 0 && current.lapTime < best.lapTime)) {
      return current;
    }
    return best;
  }, null);

  if (bestLapObj) {
    session.bestLap = {
      lapNumber: bestLapObj.lapNumber,
      time: bestLapObj.lapTime,
      lapTime: bestLapObj.lapTime,
    };
  }

  const tabItems = [
    { label: 'Overview', icon: <SpeedIcon fontSize="small" /> },
    { label: 'Lap Comparison', icon: <TimelineIcon fontSize="small" /> },
    { label: 'Fuel Analysis', icon: <FuelIcon fontSize="small" /> },
    { label: 'Track Map', icon: <MapIcon fontSize="small" /> },
    { label: 'Racing Line', icon: <RouteIcon fontSize="small" /> },
    { label: 'Raw Data', icon: <CodeIcon fontSize="small" /> },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link href="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Typography variant="bodySmall" color="text.secondary">
              Dashboard
            </Typography>
          </Link>
          <Link href="/analysis" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Typography variant="bodySmall" color="text.secondary">
              Analysis
            </Typography>
          </Link>
          <Typography variant="bodySmall" color="text.primary">
            {session.track}
          </Typography>
        </Breadcrumbs>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="headlineLarge" component="h1" sx={{ fontWeight: 600 }}>
              {session.track} Session Analysis
            </Typography>
            <Typography variant="bodyLarge" color="text.secondary">
              {new Date(session.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}{' '}
              - {session.carName}
            </Typography>
          </Box>
          <Button
            component={Link}
            href="/analysis"
            variant="outlined"
            startIcon={<BackIcon />}
          >
            Back to Sessions
          </Button>
        </Box>
      </motion.div>

      {/* Session Summary */}
      <SessionSummary session={session} />

      {/* Analysis Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Paper sx={{ mt: 4 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="analysis tabs"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                minHeight: 56,
                textTransform: 'none',
                fontWeight: 500,
              },
            }}
          >
            {tabItems.map((item, index) => (
              <Tab
                key={item.label}
                label={item.label}
                icon={item.icon}
                iconPosition="start"
                id={`analysis-tab-${index}`}
                aria-controls={`analysis-tabpanel-${index}`}
              />
            ))}
          </Tabs>

          <Box sx={{ p: 3 }}>
            <CustomTabPanel value={tabValue} index={0}>
              <Typography variant="titleLarge" sx={{ fontWeight: 600, mb: 3 }}>
                Lap Times
              </Typography>
              <LapTimeChart
                laps={session.laps}
                referenceLapIndex={bestLapObj ? session.laps.indexOf(bestLapObj) : 0}
              />

              <Divider sx={{ my: 4 }} />

              <Typography variant="titleLarge" sx={{ fontWeight: 600, mb: 3 }}>
                Session Highlights
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant="bodyMedium" sx={{ mb: 2 }}>
                  <strong>Best Lap:</strong> Lap {session.bestLap.lapNumber} -{' '}
                  {formatTime(session.bestLap.time)}
                </Typography>
                <Typography variant="bodyMedium" sx={{ mb: 2 }}>
                  <strong>Consistency:</strong> {calculateConsistency(session.laps)}% (lower variance is better)
                </Typography>
                <Typography variant="bodyMedium" sx={{ mb: 2 }}>
                  <strong>Top Speed:</strong>{' '}
                  {Math.max(...session.laps.map((lap: any) => lap.topSpeed || 0)).toFixed(1)} km/h
                </Typography>
                {session.laps.length > 1 && (
                  <Typography variant="bodyMedium" sx={{ mb: 2 }}>
                    <strong>Improvement:</strong> {calculateImprovement(session.laps)}
                  </Typography>
                )}
              </Box>
            </CustomTabPanel>

            <CustomTabPanel value={tabValue} index={1}>
              <LapComparison laps={session.laps} sessionId={session._id} />
            </CustomTabPanel>

            <CustomTabPanel value={tabValue} index={2}>
              <FuelEfficiencyAnalysis session={session} />
            </CustomTabPanel>

            <CustomTabPanel value={tabValue} index={3}>
              <TrackMap trackName={session.track} laps={session.laps} />
            </CustomTabPanel>

            <CustomTabPanel value={tabValue} index={4}>
              <RacingLineAnalysis laps={session.laps} sessionId={session._id} />
            </CustomTabPanel>

            <CustomTabPanel value={tabValue} index={5}>
              <Typography variant="titleLarge" sx={{ fontWeight: 600, mb: 3 }}>
                Raw Telemetry Data
              </Typography>
              <Box
                sx={{
                  bgcolor: alpha(theme.palette.background.default, 0.5),
                  p: 3,
                  borderRadius: 2,
                  overflow: 'auto',
                  maxHeight: 500,
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <pre style={{ fontSize: '0.75rem', margin: 0, fontFamily: 'monospace' }}>
                  {JSON.stringify(session, null, 2)}
                </pre>
              </Box>
            </CustomTabPanel>
          </Box>
        </Paper>
      </motion.div>
    </Container>
  );
}

// Helper functions
function formatTime(milliseconds: number): string {
  if (!milliseconds || milliseconds === 0) return '--:--.---';
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  const ms = Math.floor((milliseconds % 1000) / 10);
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

function formatGap(gap: number): string {
  return gap === 0 ? '' : gap > 0 ? `+${(gap / 1000).toFixed(3)}s` : `${(gap / 1000).toFixed(3)}s`;
}

function calculateConsistency(laps: any[]): string {
  if (laps.length < 3) return 'N/A';

  const completedLaps = laps.filter((lap) => lap.time && lap.time > 0);
  if (completedLaps.length < 3) return 'N/A';

  const mean = completedLaps.reduce((sum: number, lap: any) => sum + lap.time, 0) / completedLaps.length;

  const variance =
    completedLaps.reduce((sum: number, lap: any) => {
      const diff = lap.time - mean;
      return sum + diff * diff;
    }, 0) / completedLaps.length;

  const stdDev = Math.sqrt(variance);
  return ((stdDev / mean) * 100).toFixed(2);
}

function calculateImprovement(laps: any[]): string {
  const validLaps = laps.filter((lap) => lap.time && lap.time > 0);
  if (validLaps.length < 2) return 'N/A';

  const firstLap = validLaps[0];
  const bestLap = validLaps.reduce((best: any, lap: any) => (!best || lap.time < best.time ? lap : best), validLaps[0]);

  const improvement = firstLap.time - bestLap.time;
  const percentImprovement = (improvement / firstLap.time) * 100;

  return `${(improvement / 1000).toFixed(3)}s (${percentImprovement.toFixed(2)}%)`;
}
