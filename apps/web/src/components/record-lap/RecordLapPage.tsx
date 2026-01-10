'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Avatar,
  Chip,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Paper,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Pause as PauseIcon,
  Settings as SettingsIcon,
  Speed as SpeedIcon,
  LocalGasStation as FuelIcon,
  Thermostat as TempIcon,
  Timer as TimerIcon,
  TrendingUp as TrendingUpIcon,
  DirectionsCar as CarIcon,
  Flag as FlagIcon,
  WifiOff as DisconnectedIcon,
  Wifi as ConnectedIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart } from '@mui/x-charts/LineChart';
import { gt7TelemetryService, GT7TelemetryData, GT7LapData } from '@/lib/telemetry/gt7-telemetry';

interface ConnectionSettings {
  ps5IP: string;
  autoRecord: boolean;
  sessionName: string;
}

const TelemetryDisplay = ({ data }: { data: GT7TelemetryData | null }) => {
  const theme = useTheme();
  
  if (!data) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="bodyLarge" color="text.secondary">
          No telemetry data available
        </Typography>
      </Paper>
    );
  }

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = (seconds % 60).toFixed(3);
    return `${minutes}:${remainingSeconds.padStart(6, '0')}`;
  };

  const telemetryCards = [
    {
      title: 'Speed',
      value: `${data.speed.toFixed(1)} km/h`,
      icon: <SpeedIcon />,
      color: 'primary.main' as const,
      progress: Math.min(data.speed / 300, 1),
    },
    {
      title: 'RPM',
      value: `${data.engineRPM.toFixed(0)}`,
      icon: <TrendingUpIcon />,
      color: 'warning.main' as const,
      progress: data.engineRPM / 8000,
    },
    {
      title: 'Gear',
      value: data.gear === 0 ? 'R' : data.gear === -1 ? 'N' : data.gear.toString(),
      icon: <CarIcon />,
      color: 'primary.main' as const,
      progress: Math.max(0, data.gear / 8),
    },
    {
      title: 'Fuel',
      value: `${data.fuel.toFixed(1)}%`,
      icon: <FuelIcon />,
      color: data.fuel < 20 ? 'error.main' : 'success.main',
      progress: data.fuel / 100,
    },
  ];

  return (
    <Grid container spacing={2}>
      {/* Main telemetry cards */}
      <Grid item xs={12} md={8}>
        <Grid container spacing={2}>
          {telemetryCards.map((card, index) => (
            <Grid item xs={6} sm={3} key={card.title}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card
                  sx={{
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar
                        sx={{
                          bgcolor: card.color,
                          width: 32,
                          height: 32,
                          mr: 1,
                        }}
                      >
                        {card.icon}
                      </Avatar>
                      <Typography variant="bodySmall" color="text.secondary">
                        {card.title}
                      </Typography>
                    </Box>
                    <Typography variant="titleLarge" sx={{ fontWeight: 600 }}>
                      {card.value}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={card.progress * 100}
                      sx={{
                        mt: 1,
                        height: 4,
                        bgcolor: alpha(theme.palette.primary.main, 0.2),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: theme.palette.primary.main,
                        },
                      }}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Lap information */}
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="titleMedium" sx={{ mb: 2 }}>
              Lap Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="bodySmall" color="text.secondary">
                    Current Lap
                  </Typography>
                  <Typography variant="headlineSmall" sx={{ fontWeight: 600 }}>
                    {data.currentLap}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="bodySmall" color="text.secondary">
                    Lap Time
                  </Typography>
                  <Typography variant="headlineSmall" sx={{ fontWeight: 600 }}>
                    {formatTime(data.currentLapTime)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="bodySmall" color="text.secondary">
                    Best Lap
                  </Typography>
                  <Typography variant="headlineSmall" sx={{ fontWeight: 600, color: 'success.main' }}>
                    {data.bestLapTime > 0 ? formatTime(data.bestLapTime) : '--:--'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Tire data */}
      <Grid item xs={12} md={4}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="titleMedium" sx={{ mb: 2 }}>
              Tire Data
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'grey.100' }}>
                  <Typography variant="bodySmall">FL</Typography>
                  <Typography variant="labelMedium">{data.tires.frontLeft.temperature.toFixed(0)}°C</Typography>
                  <Typography variant="labelSmall">{data.tires.frontLeft.wear.toFixed(1)}%</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'grey.100' }}>
                  <Typography variant="bodySmall">FR</Typography>
                  <Typography variant="labelMedium">{data.tires.frontRight.temperature.toFixed(0)}°C</Typography>
                  <Typography variant="labelSmall">{data.tires.frontRight.wear.toFixed(1)}%</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'grey.100' }}>
                  <Typography variant="bodySmall">RL</Typography>
                  <Typography variant="labelMedium">{data.tires.rearLeft.temperature.toFixed(0)}°C</Typography>
                  <Typography variant="labelSmall">{data.tires.rearLeft.wear.toFixed(1)}%</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'grey.100' }}>
                  <Typography variant="bodySmall">RR</Typography>
                  <Typography variant="labelMedium">{data.tires.rearRight.temperature.toFixed(0)}°C</Typography>
                  <Typography variant="labelSmall">{data.tires.rearRight.wear.toFixed(1)}%</Typography>
                </Paper>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Typography variant="bodySmall" color="text.secondary" gutterBottom>
                Engine Temperature
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="labelMedium">Oil: {data.oilTemperature.toFixed(0)}°C</Typography>
                <Typography variant="labelMedium">Water: {data.waterTemperature.toFixed(0)}°C</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default function RecordLapPage() {
  const theme = useTheme();
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTelemetry, setCurrentTelemetry] = useState<GT7TelemetryData | null>(null);
  const [speedHistory, setSpeedHistory] = useState<number[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [completedLaps, setCompletedLaps] = useState<GT7LapData[]>([]);
  const [connectionSettings, setConnectionSettings] = useState<ConnectionSettings>({
    ps5IP: '192.168.1.100',
    autoRecord: true,
    sessionName: `session_${new Date().toISOString().slice(0, 16)}`,
  });
  
  const speedHistoryRef = useRef(speedHistory);
  speedHistoryRef.current = speedHistory;

  useEffect(() => {
    // Setup telemetry service event listeners
    const handleTelemetry = (data: GT7TelemetryData) => {
      setCurrentTelemetry(data);
      
      // Update speed history for chart (keep last 100 points)
      setSpeedHistory(prev => {
        const newHistory = [...prev, data.speed];
        return newHistory.slice(-100);
      });
    };

    const handleLapCompleted = (lapData: GT7LapData) => {
      setCompletedLaps(prev => [...prev, lapData]);
    };

    const handleConnected = () => {
      setIsConnected(true);
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      setIsRecording(false);
    };

    const handleRecordingStarted = () => {
      setIsRecording(true);
    };

    const handleRecordingStopped = () => {
      setIsRecording(false);
    };

    gt7TelemetryService.on('telemetry', handleTelemetry);
    gt7TelemetryService.on('lapCompleted', handleLapCompleted);
    gt7TelemetryService.on('connected', handleConnected);
    gt7TelemetryService.on('disconnected', handleDisconnected);
    gt7TelemetryService.on('recordingStarted', handleRecordingStarted);
    gt7TelemetryService.on('recordingStopped', handleRecordingStopped);

    return () => {
      gt7TelemetryService.off('telemetry', handleTelemetry);
      gt7TelemetryService.off('lapCompleted', handleLapCompleted);
      gt7TelemetryService.off('connected', handleConnected);
      gt7TelemetryService.off('disconnected', handleDisconnected);
      gt7TelemetryService.off('recordingStarted', handleRecordingStarted);
      gt7TelemetryService.off('recordingStopped', handleRecordingStopped);
    };
  }, []);

  const handleConnect = async () => {
    try {
      await gt7TelemetryService.connect(connectionSettings.ps5IP);
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleDisconnect = () => {
    gt7TelemetryService.disconnect();
  };

  const handleStartRecording = () => {
    if (!isConnected) return;
    
    try {
      gt7TelemetryService.startRecording(connectionSettings.sessionName);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const handleStopRecording = () => {
    const telemetryData = gt7TelemetryService.stopRecording();
    // Here you would save the telemetry data to your database
    console.log('Recording stopped, data points:', telemetryData.length);
  };

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="headlineLarge" sx={{ fontWeight: 600, mb: 1 }}>
            Record Lap
          </Typography>
          <Typography variant="bodyLarge" color="text.secondary">
            Connect to GT7 and record live telemetry data
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip
            icon={isConnected ? <ConnectedIcon /> : <DisconnectedIcon />}
            label={isConnected ? 'Connected' : 'Disconnected'}
            color={isConnected ? 'success' : 'error'}
            variant="filled"
          />
          <IconButton onClick={() => setSettingsOpen(true)}>
            <SettingsIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Connection Status & Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="titleMedium" sx={{ mb: 1 }}>
                Connection Status
              </Typography>
              <Typography variant="bodyMedium" color="text.secondary">
                {isConnected 
                  ? `Connected to ${currentTelemetry?.trackName || 'GT7'}` 
                  : 'Not connected to GT7'}
              </Typography>
              {currentTelemetry && (
                <Typography variant="bodySmall" color="text.secondary">
                  Car: {currentTelemetry.carName}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {!isConnected ? (
                <Button
                  variant="contained"
                  startIcon={<ConnectedIcon />}
                  onClick={handleConnect}
                  size="large"
                >
                  Connect to GT7
                </Button>
              ) : (
                <>
                  <Button
                    variant="outlined"
                    onClick={handleDisconnect}
                    size="large"
                  >
                    Disconnect
                  </Button>
                  {!isRecording ? (
                    <Button
                      variant="contained"
                      startIcon={<PlayIcon />}
                      onClick={handleStartRecording}
                      size="large"
                      color="success"
                    >
                      Start Recording
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      startIcon={<StopIcon />}
                      onClick={handleStopRecording}
                      size="large"
                      color="error"
                    >
                      Stop Recording
                    </Button>
                  )}
                </>
              )}
            </Box>
          </Box>
          
          {isRecording && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: 'error.main',
                    animation: 'pulse 1s infinite',
                    '@keyframes pulse': {
                      '0%': { opacity: 1 },
                      '50%': { opacity: 0.5 },
                      '100%': { opacity: 1 },
                    },
                  }}
                />
                <Typography variant="labelMedium" color="error.main">
                  RECORDING • Session: {connectionSettings.sessionName}
                </Typography>
              </Box>
              <LinearProgress 
                color="inherit" 
                sx={{ 
                  height: 2,
                  bgcolor: alpha(theme.palette.error.main, 0.2),
                  '& .MuiLinearProgress-bar': {
                    bgcolor: 'error.main',
                  },
                }} 
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Real-time Telemetry Display */}
      {isConnected && currentTelemetry && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="titleMedium" sx={{ mb: 2 }}>
                Live Telemetry
              </Typography>
              <TelemetryDisplay data={currentTelemetry} />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Speed Chart */}
      {speedHistory.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="titleMedium" sx={{ mb: 2 }}>
              Speed Chart (Real-time)
            </Typography>
            <LineChart
              width={undefined}
              height={200}
              series={[
                {
                  data: speedHistory,
                  label: 'Speed (km/h)',
                  color: theme.palette.primary.main,
                },
              ]}
              margin={{ left: 60, right: 20, top: 20, bottom: 40 }}
            />
          </CardContent>
        </Card>
      )}

      {/* Completed Laps */}
      {completedLaps.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="titleMedium" sx={{ mb: 2 }}>
              Completed Laps ({completedLaps.length})
            </Typography>
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {completedLaps.map((lap, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 2,
                    mb: 1,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box>
                    <Typography variant="labelLarge">
                      Lap {lap.lapNumber}
                    </Typography>
                    <Typography variant="bodySmall" color="text.secondary">
                      Top Speed: {lap.topSpeed.toFixed(1)} km/h
                    </Typography>
                  </Box>
                  <Typography variant="titleMedium" sx={{ fontWeight: 600 }}>
                    {Math.floor(lap.lapTime / 60)}:
                    {(lap.lapTime % 60).toFixed(3).padStart(6, '0')}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Connection Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="PS5 IP Address"
              value={connectionSettings.ps5IP}
              onChange={(e) => setConnectionSettings(prev => ({ ...prev, ps5IP: e.target.value }))}
              sx={{ mb: 2 }}
              helperText="Enter your PS5's IP address to connect via UDP"
            />
            <TextField
              fullWidth
              label="Session Name"
              value={connectionSettings.sessionName}
              onChange={(e) => setConnectionSettings(prev => ({ ...prev, sessionName: e.target.value }))}
              sx={{ mb: 2 }}
              helperText="Name for this recording session"
            />
            <Alert severity="info" sx={{ mt: 2 }}>
              Make sure GT7 is running and telemetry output is enabled in the game settings.
              Your PS5 and this device should be on the same network.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setSettingsOpen(false)}>
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}