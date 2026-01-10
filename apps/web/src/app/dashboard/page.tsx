'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  CircularProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  IconButton,
  Alert,
  Tooltip,
  useTheme,
  alpha,
  Skeleton,
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Timer as TimerIcon,
  TrendingUp as TrendingUpIcon,
  EmojiEvents as TrophyIcon,
  DirectionsCar as CarIcon,
  Place as TrackIcon,
  Analytics as AnalyticsIcon,
  Leaderboard as LeaderboardIcon,
  Add as AddIcon,
  ExitToApp as ExitIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  PlayArrow,
  Lightbulb,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Area, AreaChart, Tooltip as RechartsTooltip } from 'recharts';
import {
  isDemoMode,
  disableDemoMode,
  getDemoUser,
  DEMO_SESSIONS,
  DEMO_LEADERBOARD,
  DEMO_TELEMETRY,
  DEMO_ANALYSIS,
} from '@/lib/mockData';

const MotionBox = motion(Box);
const MotionCard = motion(Card);
const MotionPaper = motion(Paper);

// Format lap time (ms to mm:ss.xxx)
function formatLapTime(ms: number): string {
  if (!ms || ms <= 0) return '--:--.---';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

// Format date
function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60 * 60 * 1000) {
    const mins = Math.floor(diff / (60 * 1000));
    return `${mins} min ago`;
  }
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `${hours} hours ago`;
  }
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return `${days} days ago`;
  }
  return date.toLocaleDateString();
}

// Animated stat card
function StatCard({
  title,
  value,
  icon: Icon,
  gradient,
  delay = 0,
}: {
  title: string;
  value: string | number;
  icon: any;
  gradient: string;
  delay?: number;
}) {
  return (
    <MotionCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      sx={{
        background: gradient,
        color: 'white',
        borderRadius: 3,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <CardContent sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="overline" sx={{ opacity: 0.8, letterSpacing: 1 }}>
              {title}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {value}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
            <Icon sx={{ fontSize: 28 }} />
          </Avatar>
        </Box>
      </CardContent>
      {/* Decorative element */}
      <Box
        sx={{
          position: 'absolute',
          bottom: -20,
          right: -20,
          width: 100,
          height: 100,
          borderRadius: '50%',
          bgcolor: 'rgba(255,255,255,0.1)',
        }}
      />
    </MotionCard>
  );
}

// Live telemetry preview component
function TelemetryPreview() {
  const theme = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Sample telemetry for visualization
  const chartData = useMemo(() => {
    return DEMO_TELEMETRY.slice(0, 100).map((point, i) => ({
      distance: Math.round(point.distance),
      speed: Math.round(point.speed),
      throttle: Math.round(point.throttle),
      brake: Math.round(point.brake),
    }));
  }, []);

  // Animate through the data
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % chartData.length);
    }, 100);
    return () => clearInterval(interval);
  }, [chartData.length]);

  const currentData = DEMO_TELEMETRY[currentIndex] || DEMO_TELEMETRY[0];

  return (
    <MotionPaper
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      sx={{
        p: 3,
        borderRadius: 3,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.05)} 0%, ${alpha(theme.palette.secondary.dark, 0.05)} 100%)`,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Live Telemetry Preview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sample data from Spa-Francorchamps
          </Typography>
        </Box>
        <Chip
          icon={<PlayArrow sx={{ fontSize: 16 }} />}
          label="LIVE"
          size="small"
          color="error"
          sx={{ animation: 'pulse 2s infinite' }}
        />
      </Box>

      {/* Speed Chart */}
      <Box sx={{ height: 150, mb: 2 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3} />
                <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="distance" hide />
            <YAxis hide domain={[0, 350]} />
            <Area
              type="monotone"
              dataKey="speed"
              stroke={theme.palette.primary.main}
              fill="url(#speedGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>

      {/* Current values */}
      <Grid container spacing={2}>
        <Grid item xs={3}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {Math.round(currentData?.speed || 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              km/h
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={3}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
              {Math.round(currentData?.throttle || 0)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Throttle
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={3}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
              {Math.round(currentData?.brake || 0)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Brake
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={3}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {currentData?.gear || 1}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Gear
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </MotionPaper>
  );
}

// AI Insight card
function AIInsightCard({ insight, index }: { insight: any; index: number }) {
  const theme = useTheme();
  const colors = {
    improvement: theme.palette.warning.main,
    positive: theme.palette.success.main,
    warning: theme.palette.error.main,
  };

  return (
    <MotionBox
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 + index * 0.1 }}
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: alpha(colors[insight.type as keyof typeof colors] || theme.palette.grey[500], 0.1),
        borderLeft: `4px solid ${colors[insight.type as keyof typeof colors] || theme.palette.grey[500]}`,
        mb: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        <Lightbulb sx={{ color: colors[insight.type as keyof typeof colors], mt: 0.5 }} />
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
            {insight.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
            {insight.description}
          </Typography>
          {insight.potentialGain > 0 && (
            <Chip
              label={`+${insight.potentialGain.toFixed(2)}s potential`}
              size="small"
              color="success"
              sx={{ mt: 1 }}
            />
          )}
        </Box>
      </Box>
    </MotionBox>
  );
}

// Demo onboarding banner
function DemoOnboarding({ onDismiss }: { onDismiss: () => void }) {
  const theme = useTheme();

  return (
    <MotionBox
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      sx={{
        mb: 3,
        p: 3,
        borderRadius: 3,
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        color: 'white',
        position: 'relative',
      }}
    >
      <IconButton
        size="small"
        onClick={onDismiss}
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          color: 'white',
          opacity: 0.7,
          '&:hover': { opacity: 1 },
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <InfoIcon />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Welcome to Demo Mode
        </Typography>
      </Box>

      <Typography variant="body2" sx={{ opacity: 0.9, mb: 2, maxWidth: 600 }}>
        You are exploring GT7 Telemetry Pro with sample racing data from Spa-Francorchamps.
        All features are fully functional - click around to explore telemetry analysis, leaderboards, and AI coaching insights.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Chip
          label="47 Sample Sessions"
          sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
        />
        <Chip
          label="1,283 Laps"
          sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
        />
        <Chip
          label="AI Insights Active"
          sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
        />
      </Box>
    </MotionBox>
  );
}

export default function DashboardPage() {
  const theme = useTheme();
  const router = useRouter();
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    const demoMode = isDemoMode();
    setIsDemo(demoMode);

    if (demoMode) {
      setUser(getDemoUser());
      setSessions(DEMO_SESSIONS);
      setLoading(false);
    } else {
      router.push('/login');
    }
  }, [router]);

  const handleExitDemo = () => {
    disableDemoMode();
    router.push('/login');
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress size={48} />
        <Typography color="text.secondary">Loading dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 3 }}>
      <Container maxWidth="xl">
        {/* Demo Onboarding */}
        <AnimatePresence>
          {isDemo && showOnboarding && (
            <DemoOnboarding onDismiss={() => setShowOnboarding(false)} />
          )}
        </AnimatePresence>

        {/* Demo Mode Exit Bar (if onboarding dismissed) */}
        {isDemo && !showOnboarding && (
          <Alert
            severity="info"
            sx={{ mb: 3, borderRadius: 2 }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={handleExitDemo}
                startIcon={<ExitIcon />}
              >
                Exit Demo
              </Button>
            }
          >
            Demo Mode - Exploring with sample racing data
          </Alert>
        )}

        {/* Header */}
        <MotionBox
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Welcome back, {user?.name || 'Racer'}!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Here is your racing performance overview
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push('/sessions')}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            }}
          >
            New Session
          </Button>
        </MotionBox>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Sessions"
              value={user?.stats?.totalSessions || 0}
              icon={CarIcon}
              gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              delay={0}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Laps"
              value={(user?.stats?.totalLaps || 0).toLocaleString()}
              icon={TimerIcon}
              gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
              delay={0.1}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Best Lap"
              value={formatLapTime(user?.stats?.bestLapTime || 0)}
              icon={SpeedIcon}
              gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
              delay={0.2}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Distance (km)"
              value={Math.round(user?.stats?.totalDistance || 0).toLocaleString()}
              icon={TrendingUpIcon}
              gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
              delay={0.3}
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Telemetry Preview */}
          <Grid item xs={12} md={8}>
            <TelemetryPreview />
          </Grid>

          {/* AI Insights */}
          <Grid item xs={12} md={4}>
            <MotionPaper
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              sx={{ p: 3, borderRadius: 3, height: '100%' }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  AI Coaching Insights
                </Typography>
                <Chip label="Pro" size="small" color="primary" />
              </Box>
              {DEMO_ANALYSIS.aiInsights.slice(0, 3).map((insight, index) => (
                <AIInsightCard key={index} insight={insight} index={index} />
              ))}
              <Button
                fullWidth
                variant="text"
                onClick={() => router.push('/analysis')}
                sx={{ mt: 1 }}
              >
                View All Insights
              </Button>
            </MotionPaper>
          </Grid>

          {/* Recent Sessions */}
          <Grid item xs={12} md={8}>
            <MotionPaper
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              sx={{ p: 3, borderRadius: 3 }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Recent Sessions
                </Typography>
                <Button size="small" onClick={() => router.push('/sessions')}>
                  View All
                </Button>
              </Box>

              <List disablePadding>
                {sessions.slice(0, 4).map((session, index) => (
                  <MotionBox
                    key={session._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                  >
                    <ListItem
                      sx={{
                        borderRadius: 2,
                        mb: 1,
                        bgcolor: alpha(theme.palette.primary.main, 0.02),
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                        cursor: 'pointer',
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      }}
                      onClick={() => router.push(`/analysis/${session._id}`)}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: 'primary.main',
                          }}
                        >
                          <TrackIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {session.trackName}
                            </Typography>
                            <Chip
                              label={session.sessionType}
                              size="small"
                              color={
                                session.sessionType === 'race'
                                  ? 'error'
                                  : session.sessionType === 'qualifying'
                                  ? 'warning'
                                  : 'default'
                              }
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              {session.carModel}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {session.lapCount} laps
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}>
                              {formatLapTime(session.bestLapTime)}
                            </Typography>
                          </Box>
                        }
                      />
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(session.sessionDate)}
                      </Typography>
                    </ListItem>
                  </MotionBox>
                ))}
              </List>
            </MotionPaper>
          </Grid>

          {/* Leaderboard */}
          <Grid item xs={12} md={4}>
            <MotionPaper
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              sx={{ p: 3, borderRadius: 3 }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Leaderboard
                </Typography>
                <Button size="small" onClick={() => router.push('/leaderboard')}>
                  View All
                </Button>
              </Box>

              <List dense disablePadding>
                {DEMO_LEADERBOARD.slice(0, 5).map((entry, index) => (
                  <MotionBox
                    key={entry.rank}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                  >
                    <ListItem
                      sx={{
                        borderRadius: 2,
                        mb: 0.5,
                        bgcolor: entry.isCurrentUser
                          ? alpha(theme.palette.primary.main, 0.1)
                          : 'transparent',
                        border: entry.isCurrentUser
                          ? `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                          : '1px solid transparent',
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor:
                              entry.rank === 1
                                ? '#FFD700'
                                : entry.rank === 2
                                ? '#C0C0C0'
                                : entry.rank === 3
                                ? '#CD7F32'
                                : 'grey.400',
                            width: 32,
                            height: 32,
                            fontSize: '0.875rem',
                            fontWeight: 700,
                          }}
                        >
                          {entry.rank}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: entry.isCurrentUser ? 700 : 400 }}
                          >
                            {entry.userName} {entry.isCurrentUser && '(You)'}
                          </Typography>
                        }
                        secondary={formatLapTime(entry.lapTime)}
                      />
                      {entry.rank > 1 && (
                        <Chip
                          label={`+${(entry.delta / 1000).toFixed(3)}s`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </ListItem>
                  </MotionBox>
                ))}
              </List>
            </MotionPaper>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12}>
            <MotionPaper
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              sx={{ p: 3, borderRadius: 3 }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                {[
                  { icon: AnalyticsIcon, label: 'Analysis', path: '/analysis', color: theme.palette.primary.main },
                  { icon: LeaderboardIcon, label: 'Leaderboard', path: '/leaderboard', color: theme.palette.secondary.main },
                  { icon: TimerIcon, label: 'Sessions', path: '/sessions', color: theme.palette.success.main },
                  { icon: TrophyIcon, label: 'Upgrade', path: '/subscribe', color: theme.palette.warning.main },
                ].map((action, index) => (
                  <Grid item xs={6} sm={3} key={action.label}>
                    <MotionBox
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<action.icon sx={{ color: action.color }} />}
                        onClick={() => router.push(action.path)}
                        sx={{
                          py: 2,
                          borderRadius: 2,
                          borderColor: alpha(action.color, 0.3),
                          '&:hover': {
                            borderColor: action.color,
                            bgcolor: alpha(action.color, 0.05),
                          },
                        }}
                      >
                        {action.label}
                      </Button>
                    </MotionBox>
                  </Grid>
                ))}
              </Grid>
            </MotionPaper>
          </Grid>

          {/* Favorites & Subscription */}
          <Grid item xs={12} md={6}>
            <MotionPaper
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              sx={{ p: 3, borderRadius: 3 }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Your Favorites
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box
                    sx={{
                      textAlign: 'center',
                      p: 3,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    }}
                  >
                    <TrackIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Favorite Track
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {user?.stats?.favoriteTrack || 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box
                    sx={{
                      textAlign: 'center',
                      p: 3,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.secondary.main, 0.05),
                      border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
                    }}
                  >
                    <CarIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Favorite Car
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {user?.stats?.favoriteCar || 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </MotionPaper>
          </Grid>

          {/* Subscription Card */}
          <Grid item xs={12} md={6}>
            <MotionPaper
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              sx={{
                p: 3,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Subscription
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Chip
                  label={user?.subscription?.plan?.toUpperCase() || 'FREE'}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
                />
                <Chip
                  label={user?.subscription?.status || 'active'}
                  sx={{ bgcolor: 'rgba(76, 175, 80, 0.3)', color: 'white' }}
                />
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
                Unlimited sessions, advanced analytics, and AI coaching insights.
              </Typography>
              <Button
                variant="contained"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                }}
                onClick={() => router.push('/subscribe')}
              >
                Manage Subscription
              </Button>
            </MotionPaper>
          </Grid>
        </Grid>
      </Container>

      {/* CSS for pulse animation */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </Box>
  );
}
