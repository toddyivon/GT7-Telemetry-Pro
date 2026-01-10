'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Pagination,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import MenuItem2 from '@mui/material/MenuItem';
import {
  Add as AddIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Analytics as AnalyticsIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import MaterialLayout from '@/components/layout/MaterialLayout';
import { useAuth } from '@/hooks/useAuth';
import { useSessions } from '@/hooks/useSessions';
import { formatLapTime, formatDate } from '@/lib/utils';

export default function SessionsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [trackFilter, setTrackFilter] = useState<string>('all');
  const [carFilter, setCarFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const { sessions, total, isLoading, page, pageSize, hasMore, setPage, setFilters, deleteSession } = useSessions({
    userId: user?.id,
    pageSize: 12,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const handleFilterChange = () => {
    setFilters({
      trackName: trackFilter !== 'all' ? trackFilter : undefined,
      carModel: carFilter !== 'all' ? carFilter : undefined,
      sessionType: typeFilter !== 'all' ? typeFilter : undefined,
    });
  };

  useEffect(() => {
    handleFilterChange();
  }, [trackFilter, carFilter, typeFilter]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, sessionId: string) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedSessionId(sessionId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedSessionId(null);
  };

  const handleDeleteSession = async () => {
    if (selectedSessionId) {
      await deleteSession(selectedSessionId);
      handleMenuClose();
    }
  };

  if (authLoading || isLoading) {
    return (
      <MaterialLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </MaterialLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <MaterialLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              My Sessions
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {total} sessions recorded
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push('/record-lap')}
          >
            Record New Session
          </Button>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Track</InputLabel>
                <Select
                  value={trackFilter}
                  label="Track"
                  onChange={(e) => setTrackFilter(e.target.value)}
                >
                  <MenuItem value="all">All Tracks</MenuItem>
                  <MenuItem value="Nurburgring Nordschleife">Nurburgring</MenuItem>
                  <MenuItem value="Spa-Francorchamps">Spa-Francorchamps</MenuItem>
                  <MenuItem value="Suzuka Circuit">Suzuka</MenuItem>
                  <MenuItem value="Laguna Seca">Laguna Seca</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Car</InputLabel>
                <Select
                  value={carFilter}
                  label="Car"
                  onChange={(e) => setCarFilter(e.target.value)}
                >
                  <MenuItem value="all">All Cars</MenuItem>
                  <MenuItem value="Porsche 911 GT3 RS">Porsche 911 GT3 RS</MenuItem>
                  <MenuItem value="Ferrari 488 GT3">Ferrari 488 GT3</MenuItem>
                  <MenuItem value="McLaren 720S GT3">McLaren 720S GT3</MenuItem>
                  <MenuItem value="BMW M4 GT3">BMW M4 GT3</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={typeFilter}
                  label="Type"
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="time_trial">Time Trial</MenuItem>
                  <MenuItem value="practice">Practice</MenuItem>
                  <MenuItem value="race">Race</MenuItem>
                  <MenuItem value="qualifying">Qualifying</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Search"
                placeholder="Search sessions..."
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Sessions Grid */}
        <Grid container spacing={2}>
          {sessions.map((session) => (
            <Grid item xs={12} sm={6} md={4} key={session.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="h6" noWrap>
                        {session.trackName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {session.carModel}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, session.id)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h5" color="primary" fontWeight="bold">
                      {formatLapTime(session.bestLapTime)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Best Lap Time
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={session.sessionType?.replace('_', ' ')}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`${session.lapCount} laps`}
                      size="small"
                      variant="outlined"
                    />
                    {session.isPublic && (
                      <Chip
                        label="Public"
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    )}
                  </Box>

                  <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                    {new Date(session.sessionDate).toLocaleDateString()}
                  </Typography>
                </CardContent>

                <CardActions>
                  <Button
                    size="small"
                    startIcon={<ViewIcon />}
                    onClick={() => router.push(`/sessions/${session.id}`)}
                  >
                    View
                  </Button>
                  <Button
                    size="small"
                    startIcon={<AnalyticsIcon />}
                    onClick={() => router.push(`/analysis/${session.id}`)}
                  >
                    Analyze
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Pagination */}
        {total > pageSize && (
          <Box display="flex" justifyContent="center" mt={4}>
            <Pagination
              count={Math.ceil(total / pageSize)}
              page={page}
              onChange={(_, newPage) => setPage(newPage)}
              color="primary"
            />
          </Box>
        )}

        {/* Session Menu */}
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem2 onClick={() => { handleMenuClose(); router.push(`/sessions/${selectedSessionId}`); }}>
            <ListItemIcon><ViewIcon fontSize="small" /></ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem2>
          <MenuItem2 onClick={() => { handleMenuClose(); router.push(`/analysis/${selectedSessionId}`); }}>
            <ListItemIcon><AnalyticsIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Analyze</ListItemText>
          </MenuItem2>
          <MenuItem2 onClick={handleMenuClose}>
            <ListItemIcon><ShareIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Share</ListItemText>
          </MenuItem2>
          <MenuItem2 onClick={handleDeleteSession} sx={{ color: 'error.main' }}>
            <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem2>
        </Menu>
      </Container>
    </MaterialLayout>
  );
}
