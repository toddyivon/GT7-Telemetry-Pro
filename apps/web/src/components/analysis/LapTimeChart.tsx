'use client';

import React, { useEffect, useRef } from 'react';
import { Box, Paper, Typography, Chip, useTheme, alpha } from '@mui/material';

interface LapData {
  lapNumber: number;
  lapTime: number; // in milliseconds
  time?: number; // alias for lapTime
  sectors?: number[];
  topSpeed?: number;
}

interface LapTimeChartProps {
  laps: LapData[];
  referenceLapIndex: number;
}

export default function LapTimeChart({ laps, referenceLapIndex }: LapTimeChartProps) {
  const theme = useTheme();
  const chartRef = useRef<HTMLCanvasElement | null>(null);

  // Format lap time from milliseconds to MM:SS.mmm format
  const formatLapTime = (timeMs: number): string => {
    if (!timeMs || timeMs === 0) return '--:--.---';
    const minutes = Math.floor(timeMs / 60000);
    const seconds = Math.floor((timeMs % 60000) / 1000);
    const milliseconds = timeMs % 1000;

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  // Calculate time difference from reference lap
  const calculateDiff = (lapTimeMs: number, referenceLapTimeMs: number): string => {
    const diff = lapTimeMs - referenceLapTimeMs;
    const sign = diff >= 0 ? '+' : '-';
    const absDiff = Math.abs(diff);

    const seconds = Math.floor(absDiff / 1000);
    const milliseconds = absDiff % 1000;

    return `${sign}${seconds}.${milliseconds.toString().padStart(3, '0')}`;
  };

  // Process laps to handle both lapTime and time fields
  const processedLaps = laps.map(lap => ({
    ...lap,
    lapTime: lap.lapTime || lap.time || 0,
  })).filter(lap => lap.lapTime > 0);

  useEffect(() => {
    if (!chartRef.current || processedLaps.length === 0) return;

    const canvas = chartRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get parent dimensions for responsive sizing
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set dimensions
    const width = canvas.width;
    const height = canvas.height;
    const padding = { top: 30, right: 30, bottom: 50, left: 70 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Find the fastest and slowest lap times for scaling
    const lapTimes = processedLaps.map(lap => lap.lapTime);
    const minTime = Math.min(...lapTimes);
    const maxTime = Math.max(...lapTimes);
    const timeRange = maxTime - minTime || 1;

    // Add some padding to the range
    const paddedMinTime = minTime - timeRange * 0.05;
    const paddedMaxTime = maxTime + timeRange * 0.05;
    const paddedRange = paddedMaxTime - paddedMinTime;

    // Reference lap time
    const referenceLapTime = processedLaps[referenceLapIndex]?.lapTime || 0;

    // Background
    ctx.fillStyle = theme.palette.mode === 'dark' ? alpha('#1e1e1e', 0.5) : alpha('#f5f5f5', 0.5);
    ctx.fillRect(padding.left, padding.top, chartWidth, chartHeight);

    // Draw horizontal grid lines (time intervals)
    ctx.strokeStyle = theme.palette.mode === 'dark' ? alpha('#fff', 0.1) : alpha('#000', 0.1);
    ctx.lineWidth = 1;
    const timeIntervals = 5;

    for (let i = 0; i <= timeIntervals; i++) {
      const y = padding.top + (chartHeight * i) / timeIntervals;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Time labels
      const timeValue = paddedMaxTime - (i / timeIntervals) * paddedRange;
      ctx.fillStyle = theme.palette.text.secondary;
      ctx.font = '11px Roboto, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(formatLapTime(timeValue), padding.left - 8, y + 4);
    }

    // Draw vertical grid lines (lap numbers)
    const lapInterval = Math.max(1, Math.ceil(processedLaps.length / 10));
    for (let i = 0; i < processedLaps.length; i += lapInterval) {
      const x = padding.left + (chartWidth * i) / Math.max(1, processedLaps.length - 1);
      ctx.beginPath();
      ctx.strokeStyle = theme.palette.mode === 'dark' ? alpha('#fff', 0.1) : alpha('#000', 0.1);
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();

      // Lap number labels
      ctx.fillStyle = theme.palette.text.secondary;
      ctx.font = '11px Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Lap ${processedLaps[i].lapNumber}`, x, height - padding.bottom + 20);
    }

    // Draw reference line
    if (referenceLapTime > 0) {
      const referenceY = padding.top + chartHeight * (1 - (referenceLapTime - paddedMinTime) / paddedRange);

      ctx.beginPath();
      ctx.strokeStyle = theme.palette.primary.main;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.moveTo(padding.left, referenceY);
      ctx.lineTo(width - padding.right, referenceY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label for reference lap
      ctx.fillStyle = theme.palette.primary.main;
      ctx.font = 'bold 11px Roboto, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`Best: ${formatLapTime(referenceLapTime)}`, width - padding.right - 5, referenceY - 8);
    }

    // Draw lap time line
    if (processedLaps.length > 1) {
      // Draw line
      ctx.beginPath();
      ctx.strokeStyle = theme.palette.primary.main;
      ctx.lineWidth = 2.5;

      for (let i = 0; i < processedLaps.length; i++) {
        const x = padding.left + (chartWidth * i) / (processedLaps.length - 1);
        const y = padding.top + chartHeight * (1 - (processedLaps[i].lapTime - paddedMinTime) / paddedRange);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Draw data points
      for (let i = 0; i < processedLaps.length; i++) {
        const x = padding.left + (chartWidth * i) / (processedLaps.length - 1);
        const y = padding.top + chartHeight * (1 - (processedLaps[i].lapTime - paddedMinTime) / paddedRange);

        const isBestLap = processedLaps[i].lapTime <= referenceLapTime;
        const isReferenceLap = i === referenceLapIndex;

        // Draw outer glow for best lap
        if (isReferenceLap) {
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.fillStyle = alpha(theme.palette.success.main, 0.3);
          ctx.fill();
        }

        // Draw point
        ctx.beginPath();
        ctx.arc(x, y, isReferenceLap ? 6 : 4, 0, Math.PI * 2);
        ctx.fillStyle = isReferenceLap
          ? theme.palette.success.main
          : isBestLap
            ? theme.palette.success.light
            : theme.palette.error.light;
        ctx.fill();
        ctx.strokeStyle = isReferenceLap ? theme.palette.success.dark : 'transparent';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    } else if (processedLaps.length === 1) {
      // Single lap - draw as a point
      const x = padding.left + chartWidth / 2;
      const y = padding.top + chartHeight / 2;

      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = theme.palette.primary.main;
      ctx.fill();
    }

    // X-axis label
    ctx.fillStyle = theme.palette.text.secondary;
    ctx.font = '12px Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Lap Number', width / 2, height - 8);

  }, [processedLaps, referenceLapIndex, theme]);

  if (processedLaps.length === 0) {
    return (
      <Paper
        sx={{
          p: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 300,
          bgcolor: alpha(theme.palette.background.paper, 0.5),
        }}
      >
        <Typography color="text.secondary">No lap data available</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          position: 'relative',
          height: 350,
          bgcolor: alpha(theme.palette.background.paper, 0.5),
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <canvas
          ref={chartRef}
          style={{ width: '100%', height: '100%' }}
        />
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: 'success.main',
              border: 2,
              borderColor: 'success.dark',
            }}
          />
          <Typography variant="bodySmall" color="text.secondary">Best Lap</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: 'success.light',
            }}
          />
          <Typography variant="bodySmall" color="text.secondary">Faster than Best</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: 'error.light',
            }}
          />
          <Typography variant="bodySmall" color="text.secondary">Slower</Typography>
        </Box>
      </Box>
    </Box>
  );
}
