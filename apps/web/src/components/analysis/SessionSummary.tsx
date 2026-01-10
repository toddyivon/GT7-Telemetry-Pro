'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Avatar,
  useTheme,
  alpha,
  Divider,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Timer as TimerIcon,
  Speed as SpeedIcon,
  Flag as FlagIcon,
  WaterDrop as WaterIcon,
  WbSunny as SunnyIcon,
  DirectionsCar as CarIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface Lap {
  lapNumber: number;
  lapTime: number;
  sector1Time?: number;
  sector2Time?: number;
  sector3Time?: number;
  topSpeed?: number;
  isValid?: boolean;
}

interface Session {
  _id: string;
  trackName: string;
  track?: string;
  carModel: string;
  carName?: string;
  sessionType: string;
  sessionDate?: number;
  date?: number;
  bestLapTime: number;
  lapCount: number;
  trackCondition?: string;
  laps: Lap[];
  bestLap?: {
    lapNumber: number;
    time: number;
    lapTime: number;
  };
}

interface SessionSummaryProps {
  session: Session;
}

const formatTime = (milliseconds: number): string => {
  if (!milliseconds || milliseconds === 0) return '--:--.---';
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  const ms = milliseconds % 1000;
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
};

const formatShortTime = (milliseconds: number): string => {
  if (!milliseconds || milliseconds === 0) return '--:--';
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  const ms = Math.floor((milliseconds % 1000) / 10);
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getSessionTypeColor = (type: string): 'error' | 'warning' | 'info' | 'success' | 'primary' => {
  switch (type?.toLowerCase()) {
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

interface StatCardProps {
  icon: React.ReactElement;
  label: string;
  value: string | number;
  color: string;
  subtitle?: string;
}

const StatCard = ({ icon, label, value, color, subtitle }: StatCardProps) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(color, 0.12)} 0%, ${alpha(color, 0.04)} 100%)`,
        border: `1px solid ${alpha(color, 0.2)}`,
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              bgcolor: color,
              width: 40,
              height: 40,
            }}
          >
            {icon}
          </Avatar>
          <Box>
            <Typography variant="labelSmall" color="text.secondary">
              {label}
            </Typography>
            <Typography
              variant="titleMedium"
              sx={{
                fontWeight: 600,
                fontFamily: typeof value === 'string' && value.includes(':') ? 'monospace' : 'inherit',
              }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="labelSmall" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default function SessionSummary({ session }: SessionSummaryProps) {
  const theme = useTheme();

  // Calculate session statistics
  const validLaps = session.laps?.filter(l => l.lapTime && l.lapTime > 0) || [];
  const bestLap = validLaps.reduce((best, lap) => {
    if (!best || lap.lapTime < best.lapTime) return lap;
    return best;
  }, validLaps[0]);

  const averageLapTime = validLaps.length > 0
    ? validLaps.reduce((sum, l) => sum + l.lapTime, 0) / validLaps.length
    : 0;

  const topSpeed = Math.max(...validLaps.map(l => l.topSpeed || 0), 0);

  // Calculate consistency (coefficient of variation)
  const calculateConsistency = () => {
    if (validLaps.length < 2) return 100;
    const mean = averageLapTime;
    const variance = validLaps.reduce((sum, l) => sum + Math.pow(l.lapTime - mean, 2), 0) / validLaps.length;
    const stdDev = Math.sqrt(variance);
    const cv = (stdDev / mean) * 100;
    return Math.max(0, Math.min(100, 100 - cv));
  };

  const consistency = calculateConsistency();

  // Calculate sector bests
  const bestSector1 = Math.min(...validLaps.map(l => l.sector1Time || Infinity).filter(t => t !== Infinity));
  const bestSector2 = Math.min(...validLaps.map(l => l.sector2Time || Infinity).filter(t => t !== Infinity));
  const bestSector3 = Math.min(...validLaps.map(l => l.sector3Time || Infinity).filter(t => t !== Infinity));
  const theoreticalBest = (bestSector1 !== Infinity && bestSector2 !== Infinity && bestSector3 !== Infinity)
    ? bestSector1 + bestSector2 + bestSector3
    : null;

  const trackName = session.track || session.trackName;
  const carName = session.carName || session.carModel;
  const sessionDate = session.date || session.sessionDate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  bgcolor: `${getSessionTypeColor(session.sessionType)}.main`,
                  width: 56,
                  height: 56,
                }}
              >
                <CarIcon sx={{ fontSize: 28 }} />
              </Avatar>
              <Box>
                <Typography variant="titleLarge" sx={{ fontWeight: 600 }}>
                  {trackName}
                </Typography>
                <Typography variant="bodyMedium" color="text.secondary">
                  {carName}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Chip
                    label={session.sessionType?.replace('_', ' ')}
                    size="small"
                    color={getSessionTypeColor(session.sessionType)}
                    sx={{ height: 24 }}
                  />
                  {session.trackCondition && (
                    <Chip
                      icon={session.trackCondition === 'wet' ? <WaterIcon fontSize="small" /> : <SunnyIcon fontSize="small" />}
                      label={session.trackCondition}
                      size="small"
                      variant="outlined"
                      sx={{ height: 24 }}
                    />
                  )}
                </Box>
              </Box>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              {sessionDate && (
                <Typography variant="bodySmall" color="text.secondary">
                  {formatDate(sessionDate)}
                </Typography>
              )}
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Main Stats */}
          <Grid container spacing={2}>
            <Grid item xs={6} sm={4} md={2}>
              <StatCard
                icon={<TrophyIcon />}
                label="Best Lap"
                value={formatShortTime(bestLap?.lapTime || session.bestLapTime || 0)}
                color={theme.palette.success.main}
                subtitle={bestLap ? `Lap ${bestLap.lapNumber}` : undefined}
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <StatCard
                icon={<TimerIcon />}
                label="Average Lap"
                value={formatShortTime(averageLapTime)}
                color={theme.palette.primary.main}
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <StatCard
                icon={<FlagIcon />}
                label="Laps"
                value={session.lapCount || validLaps.length}
                color={theme.palette.secondary.main}
                subtitle={`${validLaps.length} valid`}
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <StatCard
                icon={<SpeedIcon />}
                label="Top Speed"
                value={topSpeed > 0 ? `${topSpeed.toFixed(1)} km/h` : 'N/A'}
                color={theme.palette.warning.main}
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <StatCard
                icon={<TimelineIcon />}
                label="Consistency"
                value={`${consistency.toFixed(1)}%`}
                color={theme.palette.info.main}
              />
            </Grid>
            {theoreticalBest && (
              <Grid item xs={6} sm={4} md={2}>
                <StatCard
                  icon={<TrophyIcon />}
                  label="Theoretical Best"
                  value={formatShortTime(theoreticalBest)}
                  color={theme.palette.tertiary?.main || theme.palette.secondary.main}
                  subtitle={`-${formatShortTime((bestLap?.lapTime || 0) - theoreticalBest)}`}
                />
              </Grid>
            )}
          </Grid>

          {/* Sector Bests */}
          {(bestSector1 !== Infinity || bestSector2 !== Infinity || bestSector3 !== Infinity) && (
            <>
              <Typography variant="titleSmall" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                Best Sector Times
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: alpha(theme.palette.error.main, 0.1),
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                    }}
                  >
                    <Typography variant="labelSmall" color="text.secondary">
                      Sector 1
                    </Typography>
                    <Typography
                      variant="titleMedium"
                      sx={{ fontWeight: 600, fontFamily: 'monospace', color: 'error.main' }}
                    >
                      {bestSector1 !== Infinity ? formatShortTime(bestSector1) : '--:--'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: alpha(theme.palette.warning.main, 0.1),
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                    }}
                  >
                    <Typography variant="labelSmall" color="text.secondary">
                      Sector 2
                    </Typography>
                    <Typography
                      variant="titleMedium"
                      sx={{ fontWeight: 600, fontFamily: 'monospace', color: 'warning.main' }}
                    >
                      {bestSector2 !== Infinity ? formatShortTime(bestSector2) : '--:--'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: alpha(theme.palette.success.main, 0.1),
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                    }}
                  >
                    <Typography variant="labelSmall" color="text.secondary">
                      Sector 3
                    </Typography>
                    <Typography
                      variant="titleMedium"
                      sx={{ fontWeight: 600, fontFamily: 'monospace', color: 'success.main' }}
                    >
                      {bestSector3 !== Infinity ? formatShortTime(bestSector3) : '--:--'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
