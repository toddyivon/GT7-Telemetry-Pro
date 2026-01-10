'use client';

import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Chip,
  Skeleton,
  useTheme,
  alpha,
  SelectChangeEvent,
} from '@mui/material';
import {
  Place as PlaceIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';

interface Track {
  trackId: string;
  trackName: string;
  totalSessions?: number;
  trackRecord?: number;
  trackCountry?: string;
  trackCategory?: string;
}

interface TrackSelectorProps {
  tracks: Track[];
  selectedTrack: string;
  onTrackChange: (trackId: string) => void;
  loading?: boolean;
  showStats?: boolean;
}

const formatTime = (milliseconds: number): string => {
  if (!milliseconds) return '--:--:---';
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  const ms = Math.floor(milliseconds % 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
};

export default function TrackSelector({
  tracks,
  selectedTrack,
  onTrackChange,
  loading = false,
  showStats = true,
}: TrackSelectorProps) {
  const theme = useTheme();

  const handleChange = (event: SelectChangeEvent<string>) => {
    onTrackChange(event.target.value);
  };

  const selectedTrackData = tracks.find(t => t.trackId === selectedTrack);

  if (loading) {
    return (
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 400 }}>
      <FormControl fullWidth>
        <InputLabel id="track-selector-label">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PlaceIcon sx={{ fontSize: 18 }} />
            Select Track
          </Box>
        </InputLabel>
        <Select
          labelId="track-selector-label"
          value={selectedTrack}
          onChange={handleChange}
          label="Select Track"
          sx={{
            '& .MuiSelect-select': {
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            },
          }}
        >
          <MenuItem value="all">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PlaceIcon sx={{ color: 'text.secondary' }} />
              <Typography>All Tracks</Typography>
            </Box>
          </MenuItem>
          {tracks.map((track) => (
            <MenuItem key={track.trackId} value={track.trackId}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  gap: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PlaceIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {track.trackName}
                    </Typography>
                    {track.trackCountry && (
                      <Typography variant="caption" color="text.secondary">
                        {track.trackCountry}
                      </Typography>
                    )}
                  </Box>
                </Box>
                {showStats && track.totalSessions !== undefined && (
                  <Chip
                    label={`${track.totalSessions} sessions`}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                )}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Selected Track Stats */}
      {showStats && selectedTrackData && selectedTrack !== 'all' && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            {selectedTrackData.trackName}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {selectedTrackData.totalSessions !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <PlaceIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {selectedTrackData.totalSessions} total sessions
                </Typography>
              </Box>
            )}
            {selectedTrackData.trackRecord !== undefined && selectedTrackData.trackRecord > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TimerIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'warning.main' }}>
                  Record: {formatTime(selectedTrackData.trackRecord)}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}
