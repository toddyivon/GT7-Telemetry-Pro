'use client';

import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  Skeleton,
  Chip,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  alpha,
} from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { TrendingDown, TrendingUp } from '@mui/icons-material';
import { motion } from 'framer-motion';

interface Session {
  _id: string;
  trackName: string;
  sessionDate: number;
  bestLapTime: number;
  lapCount: number;
}

interface LapTimeProgressProps {
  sessions: Session[];
  isLoading?: boolean;
}

const formatTime = (milliseconds: number): string => {
  if (!milliseconds || milliseconds === 0) return '--:--';
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  const ms = Math.floor((milliseconds % 1000) / 10);
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export default function LapTimeProgress({ sessions, isLoading }: LapTimeProgressProps) {
  const theme = useTheme();
  const [selectedTrack, setSelectedTrack] = React.useState<string>('all');

  // Get unique tracks
  const uniqueTracks = useMemo(() => {
    const tracks = new Set(sessions.map(s => s.trackName).filter(Boolean));
    return Array.from(tracks).sort();
  }, [sessions]);

  // Filter and prepare data for chart
  const chartData = useMemo(() => {
    let filtered = sessions.filter(s => s.bestLapTime && s.bestLapTime > 0);

    if (selectedTrack !== 'all') {
      filtered = filtered.filter(s => s.trackName === selectedTrack);
    }

    // Sort by date ascending
    filtered.sort((a, b) => a.sessionDate - b.sessionDate);

    return filtered.map(s => ({
      date: formatDate(s.sessionDate),
      timestamp: s.sessionDate,
      lapTime: s.bestLapTime,
      lapTimeSeconds: s.bestLapTime / 1000,
      trackName: s.trackName,
    }));
  }, [sessions, selectedTrack]);

  // Calculate improvement stats
  const improvementStats = useMemo(() => {
    if (chartData.length < 2) return null;

    const first = chartData[0].lapTime;
    const last = chartData[chartData.length - 1].lapTime;
    const best = Math.min(...chartData.map(d => d.lapTime));
    const average = chartData.reduce((sum, d) => sum + d.lapTime, 0) / chartData.length;

    const improvement = first - last;
    const improvementPercent = (improvement / first) * 100;

    return {
      first,
      last,
      best,
      average,
      improvement,
      improvementPercent,
      isImproving: improvement > 0,
    };
  }, [chartData]);

  if (isLoading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Skeleton variant="text" width={200} height={32} />
          <Skeleton variant="rectangular" height={300} sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box>
              <Typography variant="titleLarge" sx={{ fontWeight: 600 }}>
                Lap Time Progress
              </Typography>
              <Typography variant="bodySmall" color="text.secondary">
                Track your improvement over time
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {improvementStats && (
                <Chip
                  icon={improvementStats.isImproving ? <TrendingDown /> : <TrendingUp />}
                  label={`${improvementStats.isImproving ? '-' : '+'}${Math.abs(improvementStats.improvementPercent).toFixed(1)}%`}
                  color={improvementStats.isImproving ? 'success' : 'warning'}
                  variant="filled"
                  size="small"
                />
              )}

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Track</InputLabel>
                <Select
                  value={selectedTrack}
                  label="Track"
                  onChange={e => setSelectedTrack(e.target.value)}
                >
                  <MenuItem value="all">All Tracks</MenuItem>
                  {uniqueTracks.map(track => (
                    <MenuItem key={track} value={track}>
                      {track}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          {chartData.length === 0 ? (
            <Box
              sx={{
                height: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                borderRadius: 2,
              }}
            >
              <Typography color="text.secondary">
                No lap time data available for the selected criteria
              </Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ width: '100%', height: 300 }}>
                <LineChart
                  xAxis={[
                    {
                      data: chartData.map((_, i) => i),
                      scaleType: 'point',
                      valueFormatter: (value: number) => chartData[value]?.date || '',
                    },
                  ]}
                  yAxis={[
                    {
                      valueFormatter: (value: number) => formatTime(value * 1000),
                      min: Math.min(...chartData.map(d => d.lapTimeSeconds)) * 0.95,
                      max: Math.max(...chartData.map(d => d.lapTimeSeconds)) * 1.05,
                    },
                  ]}
                  series={[
                    {
                      data: chartData.map(d => d.lapTimeSeconds),
                      label: 'Lap Time',
                      color: theme.palette.primary.main,
                      curve: 'catmullRom',
                      showMark: true,
                      valueFormatter: (value: number | null) =>
                        value !== null ? formatTime(value * 1000) : '--:--',
                    },
                  ]}
                  sx={{
                    '.MuiLineElement-root': {
                      strokeWidth: 3,
                    },
                    '.MuiMarkElement-root': {
                      stroke: theme.palette.primary.main,
                      strokeWidth: 2,
                    },
                  }}
                  slotProps={{
                    legend: {
                      hidden: true,
                    },
                  }}
                />
              </Box>

              {/* Stats Summary */}
              {improvementStats && (
                <Box
                  sx={{
                    display: 'flex',
                    gap: 4,
                    mt: 3,
                    pt: 2,
                    borderTop: 1,
                    borderColor: 'divider',
                    flexWrap: 'wrap',
                  }}
                >
                  <Box>
                    <Typography variant="labelSmall" color="text.secondary">
                      Best Lap
                    </Typography>
                    <Typography
                      variant="titleMedium"
                      sx={{ fontWeight: 600, fontFamily: 'monospace', color: 'success.main' }}
                    >
                      {formatTime(improvementStats.best)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="labelSmall" color="text.secondary">
                      Average Lap
                    </Typography>
                    <Typography variant="titleMedium" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                      {formatTime(improvementStats.average)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="labelSmall" color="text.secondary">
                      First Session
                    </Typography>
                    <Typography variant="titleMedium" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                      {formatTime(improvementStats.first)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="labelSmall" color="text.secondary">
                      Latest Session
                    </Typography>
                    <Typography variant="titleMedium" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                      {formatTime(improvementStats.last)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="labelSmall" color="text.secondary">
                      Improvement
                    </Typography>
                    <Typography
                      variant="titleMedium"
                      sx={{
                        fontWeight: 600,
                        fontFamily: 'monospace',
                        color: improvementStats.isImproving ? 'success.main' : 'warning.main',
                      }}
                    >
                      {improvementStats.isImproving ? '-' : '+'}
                      {formatTime(Math.abs(improvementStats.improvement))}
                    </Typography>
                  </Box>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
