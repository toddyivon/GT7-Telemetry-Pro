'use client';

import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  Skeleton,
  List,
  ListItem,
  ListItemText,
  Divider,
  alpha,
  LinearProgress,
} from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import { motion } from 'framer-motion';

interface Session {
  _id: string;
  trackName: string;
  sessionDate: number;
  bestLapTime: number;
  lapCount: number;
}

interface TrackDistributionProps {
  sessions: Session[];
  isLoading?: boolean;
}

const CHART_COLORS = [
  '#6200ea', // Primary
  '#03dac6', // Teal
  '#ff9800', // Orange
  '#4caf50', // Green
  '#f44336', // Red
  '#2196f3', // Blue
  '#9c27b0', // Purple
  '#00bcd4', // Cyan
];

export default function TrackDistribution({ sessions, isLoading }: TrackDistributionProps) {
  const theme = useTheme();

  // Calculate track distribution
  const trackData = useMemo(() => {
    if (!sessions || sessions.length === 0) return [];

    const trackCounts: Record<string, { count: number; laps: number }> = {};

    sessions.forEach(s => {
      if (s.trackName) {
        if (!trackCounts[s.trackName]) {
          trackCounts[s.trackName] = { count: 0, laps: 0 };
        }
        trackCounts[s.trackName].count += 1;
        trackCounts[s.trackName].laps += s.lapCount || 0;
      }
    });

    const totalSessions = sessions.length;

    return Object.entries(trackCounts)
      .map(([name, data], index) => ({
        id: index,
        label: name,
        value: data.count,
        laps: data.laps,
        percentage: (data.count / totalSessions) * 100,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 tracks
  }, [sessions]);

  // Prepare pie chart data
  const pieData = useMemo(() => {
    return trackData.map(track => ({
      id: track.id,
      value: track.value,
      label: track.label,
      color: track.color,
    }));
  }, [trackData]);

  if (isLoading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Skeleton variant="text" width={150} height={32} />
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Skeleton variant="circular" width={180} height={180} />
          </Box>
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
          <Typography variant="titleLarge" sx={{ fontWeight: 600, mb: 1 }}>
            Track Distribution
          </Typography>
          <Typography variant="bodySmall" color="text.secondary" sx={{ mb: 2 }}>
            Sessions by circuit
          </Typography>

          {trackData.length === 0 ? (
            <Box
              sx={{
                height: 250,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                borderRadius: 2,
              }}
            >
              <Typography color="text.secondary">No track data available</Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <PieChart
                  series={[
                    {
                      data: pieData,
                      innerRadius: 50,
                      outerRadius: 90,
                      paddingAngle: 2,
                      cornerRadius: 4,
                      highlightScope: { fade: 'global', highlight: 'item' },
                      faded: { innerRadius: 45, additionalRadius: -5, color: 'gray' },
                    },
                  ]}
                  width={220}
                  height={200}
                  slotProps={{
                    legend: {
                      hidden: true,
                    },
                  }}
                />
              </Box>

              {/* Track List */}
              <List dense sx={{ pt: 0 }}>
                {trackData.slice(0, 5).map((track, index) => (
                  <React.Fragment key={track.label}>
                    <ListItem
                      sx={{
                        px: 0,
                        py: 1,
                        '&:hover': {
                          bgcolor: alpha(track.color, 0.08),
                          borderRadius: 1,
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: track.color,
                          mr: 1.5,
                          flexShrink: 0,
                        }}
                      />
                      <ListItemText
                        primary={
                          <Typography variant="bodySmall" sx={{ fontWeight: 500 }} noWrap>
                            {track.label}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="labelSmall" color="text.secondary">
                            {track.value} sessions, {track.laps} laps
                          </Typography>
                        }
                      />
                      <Box sx={{ textAlign: 'right', minWidth: 50 }}>
                        <Typography variant="bodySmall" sx={{ fontWeight: 600 }}>
                          {track.percentage.toFixed(0)}%
                        </Typography>
                      </Box>
                    </ListItem>
                    {index < trackData.slice(0, 5).length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>

              {trackData.length > 5 && (
                <Typography variant="labelSmall" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                  +{trackData.length - 5} more tracks
                </Typography>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
