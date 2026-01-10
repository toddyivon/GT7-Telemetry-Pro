'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Analytics as AnalyticsIcon,
  Share as ShareIcon,
  Favorite as LikeIcon,
  FavoriteBorder as LikeOutlineIcon,
  Comment as CommentIcon,
  Speed as SpeedIcon,
  Timer as TimerIcon,
  LocalGasStation as FuelIcon,
  Thermostat as TempIcon,
} from '@mui/icons-material';
import MaterialLayout from '@/components/layout/MaterialLayout';
import CommentSection from '@/components/social/CommentSection';
import ShareModal from '@/components/social/ShareModal';
import { useSession, useSessionTelemetry } from '@/hooks/useSessions';
import { useAuth } from '@/hooks/useAuth';
import { formatLapTime } from '@/lib/utils';

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const sessionId = params?.sessionId as string;

  const { session, laps, isLoading, error } = useSession(sessionId);
  const { telemetry } = useSessionTelemetry(sessionId);

  const [activeTab, setActiveTab] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  if (isLoading) {
    return (
      <MaterialLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </MaterialLayout>
    );
  }

  if (error || !session) {
    return (
      <MaterialLayout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error">
            Session not found or an error occurred.
          </Alert>
          <Button
            startIcon={<BackIcon />}
            onClick={() => router.back()}
            sx={{ mt: 2 }}
          >
            Go Back
          </Button>
        </Container>
      </MaterialLayout>
    );
  }

  const bestLap = laps.reduce((best, lap) =>
    !best || lap.lapTime < best.lapTime ? lap : best, null as typeof laps[0] | null);

  return (
    <MaterialLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <IconButton onClick={() => router.back()}>
            <BackIcon />
          </IconButton>
          <Box flex={1}>
            <Typography variant="h4" component="h1" fontWeight="bold">
              {session.trackName}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {session.carModel} | {new Date(session.sessionDate).toLocaleDateString()}
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Tooltip title={isLiked ? 'Unlike' : 'Like'}>
              <IconButton onClick={() => setIsLiked(!isLiked)}>
                {isLiked ? <LikeIcon color="error" /> : <LikeOutlineIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Share">
              <IconButton onClick={() => setShareModalOpen(true)}>
                <ShareIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AnalyticsIcon />}
              onClick={() => router.push(`/analysis/${sessionId}`)}
            >
              Full Analysis
            </Button>
          </Box>
        </Box>

        {/* Session Summary Cards */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <TimerIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h5" fontWeight="bold">
                  {formatLapTime(session.bestLapTime)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Best Lap
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <SpeedIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h5" fontWeight="bold">
                  {session.topSpeed} km/h
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Top Speed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Box sx={{ fontSize: 40, mb: 1, color: 'primary.main', fontWeight: 'bold' }}>
                  {session.lapCount}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Total Laps
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <FuelIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h5" fontWeight="bold">
                  {session.fuelUsed?.toFixed(1) || 'N/A'} L
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Fuel Used
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Session Details */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
          >
            <Tab label="Lap Times" />
            <Tab label="Session Info" />
            <Tab label="Comments" />
          </Tabs>

          {/* Lap Times Tab */}
          {activeTab === 0 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Lap</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Sector 1</TableCell>
                    <TableCell>Sector 2</TableCell>
                    <TableCell>Sector 3</TableCell>
                    <TableCell>Top Speed</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {laps.map((lap) => (
                    <TableRow
                      key={lap.lapNumber}
                      sx={{
                        bgcolor: bestLap?.lapNumber === lap.lapNumber ? 'action.selected' : 'inherit',
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {lap.lapNumber}
                          {bestLap?.lapNumber === lap.lapNumber && (
                            <Chip label="Best" size="small" color="success" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={bestLap?.lapNumber === lap.lapNumber ? 'bold' : 'normal'}>
                          {formatLapTime(lap.lapTime)}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatLapTime(lap.sector1Time)}</TableCell>
                      <TableCell>{formatLapTime(lap.sector2Time)}</TableCell>
                      <TableCell>{formatLapTime(lap.sector3Time)}</TableCell>
                      <TableCell>{lap.topSpeed?.toFixed(0)} km/h</TableCell>
                      <TableCell>
                        <Chip
                          label={lap.isValid ? 'Valid' : 'Invalid'}
                          size="small"
                          color={lap.isValid ? 'success' : 'error'}
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Session Info Tab */}
          {activeTab === 1 && (
            <Box p={3}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Session Details
                  </Typography>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Track</TableCell>
                        <TableCell>{session.trackName}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Car</TableCell>
                        <TableCell>{session.carModel}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Session Type</TableCell>
                        <TableCell>{session.sessionType?.replace('_', ' ')}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>{new Date(session.sessionDate).toLocaleString()}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Duration</TableCell>
                        <TableCell>{formatLapTime(session.totalSessionTime)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Conditions
                  </Typography>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Weather</TableCell>
                        <TableCell>{session.weatherConditions || 'Clear'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Track Condition</TableCell>
                        <TableCell>{session.trackCondition || 'Dry'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Front Tyres</TableCell>
                        <TableCell>{session.tyreFront || 'Racing'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Rear Tyres</TableCell>
                        <TableCell>{session.tyreRear || 'Racing'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Average Speed</TableCell>
                        <TableCell>{session.averageSpeed?.toFixed(0)} km/h</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Comments Tab */}
          {activeTab === 2 && (
            <Box p={3}>
              <CommentSection sessionId={sessionId} currentUserId={user?.id} />
            </Box>
          )}
        </Paper>

        {/* Share Modal */}
        <ShareModal
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          session={{
            id: sessionId,
            trackName: session.trackName,
            carModel: session.carModel,
            bestLapTime: session.bestLapTime,
          }}
        />
      </Container>
    </MaterialLayout>
  );
}
