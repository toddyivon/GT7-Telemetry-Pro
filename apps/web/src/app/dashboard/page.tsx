'use client';

import { useEffect, useState } from 'react';
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
  LinearProgress,
  IconButton,
  Alert,
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
  Visibility as ViewIcon,
  ExitToApp as ExitIcon,
} from '@mui/icons-material';
import {
  isDemoMode,
  disableDemoMode,
  getDemoUser,
  DEMO_SESSIONS,
  DEMO_LEADERBOARD,
  DEMO_USER,
} from '@/lib/mockData';

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

export default function DashboardPage() {
  const router = useRouter();
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    // Check if in demo mode
    const demoMode = isDemoMode();
    setIsDemo(demoMode);

    if (demoMode) {
      setUser(getDemoUser());
      setSessions(DEMO_SESSIONS);
      setLoading(false);
    } else {
      // If not in demo mode and no auth, redirect to login
      router.push('/login');
    }
  }, [router]);

  const handleExitDemo = () => {
    disableDemoMode();
    router.push('/login');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 3 }}>
      <Container maxWidth="xl">
        {/* Demo Mode Banner */}
        {isDemo && (
          <Alert
            severity="info"
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={handleExitDemo} startIcon={<ExitIcon />}>
                Exit Demo
              </Button>
            }
          >
            You&apos;re viewing the app in Demo Mode with sample racing data.
          </Alert>
        )}

        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Welcome back, {user?.name || 'Racer'}!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Here&apos;s your racing performance overview
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push('/sessions')}
          >
            New Session
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="overline" sx={{ opacity: 0.8 }}>Total Sessions</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>{user?.stats?.totalSessions || 0}</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                    <CarIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="overline" sx={{ opacity: 0.8 }}>Total Laps</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>{user?.stats?.totalLaps || 0}</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                    <TimerIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="overline" sx={{ opacity: 0.8 }}>Best Lap</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {formatLapTime(user?.stats?.bestLapTime || 0)}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                    <SpeedIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="overline" sx={{ opacity: 0.8 }}>Distance (km)</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                      {Math.round(user?.stats?.totalDistance || 0).toLocaleString()}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                    <TrendingUpIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Recent Sessions */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Recent Sessions
                </Typography>
                <Button size="small" onClick={() => router.push('/sessions')}>
                  View All
                </Button>
              </Box>

              <List>
                {sessions.slice(0, 5).map((session, index) => (
                  <Box key={session._id}>
                    <ListItem
                      sx={{
                        borderRadius: 1,
                        '&:hover': { bgcolor: 'action.hover' },
                        cursor: 'pointer',
                      }}
                      onClick={() => router.push(`/analysis/${session._id}`)}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
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
                              color={session.sessionType === 'race' ? 'error' : session.sessionType === 'qualifying' ? 'warning' : 'default'}
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
                            <Typography variant="body2" color="primary">
                              Best: {formatLapTime(session.bestLapTime)}
                            </Typography>
                          </Box>
                        }
                      />
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(session.sessionDate)}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5, justifyContent: 'flex-end' }}>
                          <Chip
                            icon={<TrendingUpIcon />}
                            label={session.likes}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                    </ListItem>
                    {index < sessions.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Leaderboard Preview */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Leaderboard
                </Typography>
                <Button size="small" onClick={() => router.push('/leaderboard')}>
                  View All
                </Button>
              </Box>

              <List dense>
                {DEMO_LEADERBOARD.slice(0, 6).map((entry) => (
                  <ListItem
                    key={entry.rank}
                    sx={{
                      borderRadius: 1,
                      bgcolor: entry.isCurrentUser ? 'action.selected' : 'transparent',
                      mb: 0.5,
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: entry.rank <= 3
                            ? entry.rank === 1 ? '#FFD700' : entry.rank === 2 ? '#C0C0C0' : '#CD7F32'
                            : 'grey.400',
                          width: 32,
                          height: 32,
                          fontSize: '0.875rem',
                        }}
                      >
                        {entry.rank}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: entry.isCurrentUser ? 700 : 400 }}>
                          {entry.userName} {entry.isCurrentUser && '(You)'}
                        </Typography>
                      }
                      secondary={formatLapTime(entry.lapTime)}
                    />
                    {entry.rank > 1 && (
                      <Chip
                        label={`+${(entry.delta / 1000).toFixed(3)}s`}
                        size="small"
                        color="default"
                      />
                    )}
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AnalyticsIcon />}
                    onClick={() => router.push('/analysis')}
                    sx={{ py: 2 }}
                  >
                    Analysis
                  </Button>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<LeaderboardIcon />}
                    onClick={() => router.push('/leaderboard')}
                    sx={{ py: 2 }}
                  >
                    Leaderboard
                  </Button>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<TimerIcon />}
                    onClick={() => router.push('/sessions')}
                    sx={{ py: 2 }}
                  >
                    Sessions
                  </Button>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<TrophyIcon />}
                    onClick={() => router.push('/subscribe')}
                    sx={{ py: 2 }}
                  >
                    Upgrade
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Favorite Stats */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Your Favorites
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <TrackIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">Favorite Track</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {user?.stats?.favoriteTrack || 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <CarIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">Favorite Car</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {user?.stats?.favoriteCar || 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Subscription Status */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
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
                Enjoy unlimited sessions, advanced analytics, and AI coaching insights.
              </Typography>
              <Button
                variant="contained"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                onClick={() => router.push('/subscribe')}
              >
                Manage Subscription
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
