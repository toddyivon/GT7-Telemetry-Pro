'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import {
  Box,
  Typography,
  Paper,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Chip,
  Slider,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  Divider,
  IconButton,
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as CenterIcon,
  Speed as SpeedIcon,
  Warning as BrakeIcon,
  PlayArrow as ThrottleIcon,
  Timeline as LineIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useQuery } from 'convex/react';
import {
  toRacingLinePoints,
  detectBrakePoints,
  detectThrottleZones,
  calculateIdealLine,
  compareRacingLines,
  getSpeedColor,
  smoothRacingLine,
  generateTrackOutline,
  RacingLinePoint,
  BrakePoint,
  ThrottleZone,
} from '@/lib/analysis/racingLineCalculator';

// Try to import the generated API, fallback to mock data if not available
let api: any;
let useConvexQuery = true;

try {
  const convexApi = require('@/convex/_generated/api');
  api = convexApi.api;
} catch (error) {
  api = null;
  useConvexQuery = false;
}

interface RacingLineAnalysisProps {
  laps: any[];
  sessionId: string;
}

type ColorMode = 'speed' | 'throttle' | 'brake' | 'lap';

const RacingLineAnalysis: React.FC<RacingLineAnalysisProps> = ({ laps, sessionId }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedLaps, setSelectedLaps] = useState<string[]>([]);
  const [lapOptions, setLapOptions] = useState<{ value: string; label: string }[]>([]);
  const [colorMode, setColorMode] = useState<ColorMode>('speed');
  const [showBrakePoints, setShowBrakePoints] = useState(true);
  const [showThrottleZones, setShowThrottleZones] = useState(true);
  const [showIdealLine, setShowIdealLine] = useState(false);
  const [trackWidth, setTrackWidth] = useState(15);
  const [lineWidth, setLineWidth] = useState(2);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredPoint, setHoveredPoint] = useState<RacingLinePoint | null>(null);

  // Colors for different laps
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  const selectedLapNumbers = selectedLaps.map((l) => parseInt(l));

  const telemetryData = useConvexQuery && api && selectedLapNumbers.length > 0
    ? useQuery(api.telemetry.getTelemetryForLaps, {
        sessionId: sessionId as any,
        lapNumbers: selectedLapNumbers,
      })
    : null;

  // Process telemetry data into racing line points
  const processedData = useMemo(() => {
    if (!telemetryData || telemetryData.length === 0) return null;

    const pointsByLap: Record<number, any[]> = {};
    telemetryData.forEach((p: any) => {
      if (!pointsByLap[p.lapNumber]) pointsByLap[p.lapNumber] = [];
      pointsByLap[p.lapNumber].push(p);
    });

    const racingLines: Record<number, RacingLinePoint[]> = {};
    const brakePoints: Record<number, BrakePoint[]> = {};
    const throttleZones: Record<number, ThrottleZone[]> = {};

    Object.entries(pointsByLap).forEach(([lapNum, points]) => {
      racingLines[parseInt(lapNum)] = toRacingLinePoints(points);
      brakePoints[parseInt(lapNum)] = detectBrakePoints(points);
      throttleZones[parseInt(lapNum)] = detectThrottleZones(points);
    });

    // Calculate ideal line if multiple laps
    let idealLine = null;
    if (selectedLapNumbers.length >= 2) {
      const lapsData = selectedLapNumbers.map((num) => pointsByLap[num] || []);
      const lapTimes = selectedLapNumbers.map((num) => {
        const lap = laps.find((l) => l.lapNumber === num);
        return lap?.lapTime || 0;
      });
      idealLine = calculateIdealLine(lapsData, lapTimes);
    }

    // Calculate speed range for color scaling
    const allSpeeds = Object.values(racingLines).flatMap((line) => line.map((p) => p.speed));
    const speedRange = {
      min: Math.min(...allSpeeds),
      max: Math.max(...allSpeeds),
    };

    return {
      racingLines,
      brakePoints,
      throttleZones,
      idealLine,
      speedRange,
    };
  }, [telemetryData, selectedLapNumbers, laps]);

  useEffect(() => {
    if (laps && laps.length > 0) {
      const options = laps.map((lap) => ({
        value: lap.lapNumber.toString(),
        label: `Lap ${lap.lapNumber} (${formatTime(lap.lapTime)})`,
      }));
      setLapOptions(options);

      if (selectedLaps.length === 0) {
        const bestLap = laps.reduce(
          (fastest: any, lap: any) => (!fastest || lap.lapTime < fastest.lapTime ? lap : fastest),
          laps[0]
        );

        const autoSelected = [bestLap.lapNumber.toString()];

        const otherLap = laps.find((l: any) => l.lapNumber !== bestLap.lapNumber);
        if (otherLap) {
          autoSelected.push(otherLap.lapNumber.toString());
        }

        setSelectedLaps(autoSelected);
      }
    }
  }, [laps]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !processedData) return;

    const width = containerRef.current.clientWidth;
    const height = 600;

    const svg = d3.select(svgRef.current).attr('width', width).attr('height', height);

    svg.selectAll('*').remove();

    // Create main group for zoom/pan
    const g = svg.append('g');

    // Zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 20])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom);

    // Collect all points for bounds calculation
    const allPoints: { x: number; y: number }[] = [];
    Object.values(processedData.racingLines).forEach((line) => {
      line.forEach((p) => allPoints.push({ x: p.x, y: p.y }));
    });

    if (allPoints.length === 0) return;

    // Calculate bounds
    const xExtent = d3.extent(allPoints, (d) => d.x) as [number, number];
    const yExtent = d3.extent(allPoints, (d) => d.y) as [number, number];

    const xRange = xExtent[1] - xExtent[0];
    const yRange = yExtent[1] - yExtent[0];

    const padding = 50;
    const availableWidth = width - padding * 2;
    const availableHeight = height - padding * 2;

    const scale = Math.min(availableWidth / xRange, availableHeight / yRange);

    const xScale = d3
      .scaleLinear()
      .domain(xExtent)
      .range([width / 2 - (xRange * scale) / 2, width / 2 + (xRange * scale) / 2]);

    const yScale = d3
      .scaleLinear()
      .domain(yExtent)
      .range([height / 2 - (yRange * scale) / 2, height / 2 + (yRange * scale) / 2]);

    // Draw track outline (grey base)
    const firstLapNum = selectedLapNumbers[0];
    const firstLapLine = processedData.racingLines[firstLapNum];
    if (firstLapLine && firstLapLine.length > 0) {
      const trackOutline = generateTrackOutline(firstLapLine, trackWidth / scale);

      // Outer edge
      const outerLine = d3
        .line<RacingLinePoint>()
        .x((d) => xScale(d.x))
        .y((d) => yScale(d.y))
        .curve(d3.curveCatmullRom.alpha(0.5));

      g.append('path')
        .datum(trackOutline.outer)
        .attr('fill', 'none')
        .attr('stroke', '#333')
        .attr('stroke-width', 1)
        .attr('d', outerLine);

      g.append('path')
        .datum(trackOutline.inner)
        .attr('fill', 'none')
        .attr('stroke', '#333')
        .attr('stroke-width', 1)
        .attr('d', outerLine);

      // Track surface
      g.append('path')
        .datum(firstLapLine)
        .attr('fill', 'none')
        .attr('stroke', '#e0e0e0')
        .attr('stroke-width', trackWidth)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('d', outerLine);
    }

    // Draw ideal line if enabled
    if (showIdealLine && processedData.idealLine) {
      const idealPath = d3
        .line<RacingLinePoint>()
        .x((d) => xScale(d.x))
        .y((d) => yScale(d.y))
        .curve(d3.curveCatmullRom.alpha(0.5));

      g.append('path')
        .datum(processedData.idealLine.points)
        .attr('fill', 'none')
        .attr('stroke', '#FFD700')
        .attr('stroke-width', lineWidth + 1)
        .attr('stroke-dasharray', '5,3')
        .attr('d', idealPath)
        .attr('opacity', 0.8);
    }

    // Draw racing lines based on color mode
    selectedLaps.forEach((lapNumStr, lapIndex) => {
      const lapNum = parseInt(lapNumStr);
      const racingLine = processedData.racingLines[lapNum];
      if (!racingLine || racingLine.length < 2) return;

      if (colorMode === 'lap') {
        // Single color per lap
        const line = d3
          .line<RacingLinePoint>()
          .x((d) => xScale(d.x))
          .y((d) => yScale(d.y))
          .curve(d3.curveCatmullRom.alpha(0.5));

        g.append('path')
          .datum(racingLine)
          .attr('fill', 'none')
          .attr('stroke', colorScale(lapIndex.toString()))
          .attr('stroke-width', lineWidth)
          .attr('d', line)
          .attr('opacity', 0.8);
      } else {
        // Color-coded segments
        for (let i = 0; i < racingLine.length - 1; i++) {
          const p1 = racingLine[i];
          const p2 = racingLine[i + 1];

          let color: string;
          switch (colorMode) {
            case 'speed':
              color = getSpeedColor(
                p1.speed,
                processedData.speedRange.min,
                processedData.speedRange.max
              );
              break;
            case 'throttle':
              color = `rgb(${Math.round(255 * (1 - p1.throttle))}, ${Math.round(255 * p1.throttle)}, 0)`;
              break;
            case 'brake':
              color = `rgb(${Math.round(255 * p1.brake)}, 0, ${Math.round(255 * (1 - p1.brake))})`;
              break;
            default:
              color = colorScale(lapIndex.toString());
          }

          g.append('line')
            .attr('x1', xScale(p1.x))
            .attr('y1', yScale(p1.y))
            .attr('x2', xScale(p2.x))
            .attr('y2', yScale(p2.y))
            .attr('stroke', color)
            .attr('stroke-width', lineWidth)
            .attr('stroke-linecap', 'round');
        }
      }
    });

    // Draw brake points
    if (showBrakePoints) {
      selectedLaps.forEach((lapNumStr) => {
        const lapNum = parseInt(lapNumStr);
        const brakes = processedData.brakePoints[lapNum];
        if (!brakes) return;

        brakes.forEach((bp) => {
          g.append('circle')
            .attr('cx', xScale(bp.x))
            .attr('cy', yScale(bp.y))
            .attr('r', 4 + bp.brakeIntensity * 4)
            .attr('fill', '#F44336')
            .attr('opacity', 0.8)
            .attr('stroke', '#fff')
            .attr('stroke-width', 1);
        });
      });
    }

    // Draw throttle zones
    if (showThrottleZones) {
      selectedLaps.forEach((lapNumStr) => {
        const lapNum = parseInt(lapNumStr);
        const throttles = processedData.throttleZones[lapNum];
        if (!throttles) return;

        throttles.forEach((tz) => {
          g.append('circle')
            .attr('cx', xScale(tz.startX))
            .attr('cy', yScale(tz.startY))
            .attr('r', 3)
            .attr('fill', '#4CAF50')
            .attr('opacity', 0.8);
        });
      });
    }

    // Add start/finish marker
    const firstLine = processedData.racingLines[selectedLapNumbers[0]];
    if (firstLine && firstLine.length > 0) {
      const start = firstLine[0];

      // Start/Finish line
      g.append('rect')
        .attr('x', xScale(start.x) - 10)
        .attr('y', yScale(start.y) - 3)
        .attr('width', 20)
        .attr('height', 6)
        .attr('fill', '#000')
        .attr('stroke', '#fff')
        .attr('stroke-width', 1);

      // Checkered pattern
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 2; j++) {
          if ((i + j) % 2 === 0) {
            g.append('rect')
              .attr('x', xScale(start.x) - 10 + i * 5)
              .attr('y', yScale(start.y) - 3 + j * 3)
              .attr('width', 5)
              .attr('height', 3)
              .attr('fill', '#fff');
          }
        }
      }
    }

    // Add interactive hover points
    const allPointsFlat = selectedLaps.flatMap((lapNumStr) => {
      const lapNum = parseInt(lapNumStr);
      const line = processedData.racingLines[lapNum];
      return line ? line.map((p) => ({ ...p, lapNum })) : [];
    });

    // Create invisible circles for hover detection
    g.selectAll('.hover-point')
      .data(allPointsFlat.filter((_, i) => i % 10 === 0)) // Sample every 10th point
      .enter()
      .append('circle')
      .attr('class', 'hover-point')
      .attr('cx', (d) => xScale(d.x))
      .attr('cy', (d) => yScale(d.y))
      .attr('r', 8)
      .attr('fill', 'transparent')
      .attr('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        setHoveredPoint(d);
      })
      .on('mouseout', () => {
        setHoveredPoint(null);
      });
  }, [
    processedData,
    selectedLaps,
    colorMode,
    showBrakePoints,
    showThrottleZones,
    showIdealLine,
    trackWidth,
    lineWidth,
  ]);

  const formatTime = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    const ms = Math.floor((milliseconds % 1000) / 10);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleLapChange = (event: any) => {
    setSelectedLaps(event.target.value);
  };

  const handleColorModeChange = (_: any, newMode: ColorMode) => {
    if (newMode !== null) {
      setColorMode(newMode);
    }
  };

  const resetZoom = useCallback(() => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().duration(750).call(
        // @ts-ignore
        d3.zoom().transform,
        d3.zoomIdentity
      );
    }
  }, []);

  const zoomIn = useCallback(() => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().duration(300).call(
        // @ts-ignore
        d3.zoom().scaleBy,
        1.5
      );
    }
  }, []);

  const zoomOut = useCallback(() => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().duration(300).call(
        // @ts-ignore
        d3.zoom().scaleBy,
        0.67
      );
    }
  }, []);

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h2">
          Racing Line Analysis
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Zoom In">
            <IconButton onClick={zoomIn} size="small">
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom Out">
            <IconButton onClick={zoomOut} size="small">
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reset View">
            <IconButton onClick={resetZoom} size="small">
              <CenterIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Select Laps to Compare</InputLabel>
            <Select
              multiple
              value={selectedLaps}
              onChange={handleLapChange}
              label="Select Laps to Compare"
              renderValue={(selected) => {
                const selectedLabels = selected
                  .map((num) => {
                    const option = lapOptions.find((o) => o.value === num);
                    return option ? option.label : `Lap ${num}`;
                  })
                  .join(', ');
                return selectedLabels;
              }}
            >
              {lapOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="body2" gutterBottom>
            Color Mode
          </Typography>
          <ToggleButtonGroup
            value={colorMode}
            exclusive
            onChange={handleColorModeChange}
            size="small"
            fullWidth
          >
            <ToggleButton value="speed">
              <Tooltip title="Color by Speed">
                <SpeedIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="throttle">
              <Tooltip title="Color by Throttle">
                <ThrottleIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="brake">
              <Tooltip title="Color by Brake">
                <BrakeIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="lap">
              <Tooltip title="Color by Lap">
                <LineIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Grid>

        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={showBrakePoints}
                  onChange={(e) => setShowBrakePoints(e.target.checked)}
                  size="small"
                />
              }
              label={<Typography variant="body2">Brake Points</Typography>}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={showThrottleZones}
                  onChange={(e) => setShowThrottleZones(e.target.checked)}
                  size="small"
                />
              }
              label={<Typography variant="body2">Throttle Zones</Typography>}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={showIdealLine}
                  onChange={(e) => setShowIdealLine(e.target.checked)}
                  size="small"
                  disabled={selectedLaps.length < 2}
                />
              }
              label={<Typography variant="body2">Ideal Line</Typography>}
            />
          </Box>
        </Grid>
      </Grid>

      <Box
        ref={containerRef}
        sx={{
          width: '100%',
          height: '600px',
          mb: 3,
          position: 'relative',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden',
          bgcolor: '#fafafa',
        }}
      >
        {!telemetryData && useConvexQuery && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
              bgcolor: 'rgba(255,255,255,0.7)',
            }}
          >
            <CircularProgress />
          </Box>
        )}
        <svg ref={svgRef} style={{ cursor: 'move' }} />

        {/* Hover tooltip */}
        {hoveredPoint && (
          <Card
            sx={{
              position: 'absolute',
              top: 10,
              left: 10,
              zIndex: 10,
              minWidth: 150,
            }}
          >
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                Point Info
              </Typography>
              <Typography variant="caption" display="block">
                Speed: {hoveredPoint.speed.toFixed(1)} km/h
              </Typography>
              <Typography variant="caption" display="block">
                Throttle: {(hoveredPoint.throttle * 100).toFixed(0)}%
              </Typography>
              <Typography variant="caption" display="block">
                Brake: {(hoveredPoint.brake * 100).toFixed(0)}%
              </Typography>
              <Typography variant="caption" display="block">
                Distance: {hoveredPoint.distance.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Zoom indicator */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            bgcolor: 'rgba(255,255,255,0.9)',
            p: 1,
            borderRadius: 1,
          }}
        >
          <Typography variant="caption">Zoom: {(zoomLevel * 100).toFixed(0)}%</Typography>
        </Box>
      </Box>

      {/* Color scale legend */}
      {colorMode !== 'lap' && processedData && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            {colorMode === 'speed' && 'Speed Scale'}
            {colorMode === 'throttle' && 'Throttle Scale'}
            {colorMode === 'brake' && 'Brake Scale'}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Typography variant="caption">
              {colorMode === 'speed' && `${processedData.speedRange.min.toFixed(0)} km/h`}
              {colorMode === 'throttle' && '0%'}
              {colorMode === 'brake' && '0%'}
            </Typography>
            <Box
              sx={{
                flex: 1,
                height: 10,
                borderRadius: 1,
                background:
                  colorMode === 'speed'
                    ? 'linear-gradient(to right, rgb(255,0,0), rgb(255,255,0), rgb(0,255,0))'
                    : colorMode === 'throttle'
                      ? 'linear-gradient(to right, rgb(255,0,0), rgb(0,255,0))'
                      : 'linear-gradient(to right, rgb(0,0,255), rgb(255,0,0))',
              }}
            />
            <Typography variant="caption">
              {colorMode === 'speed' && `${processedData.speedRange.max.toFixed(0)} km/h`}
              {colorMode === 'throttle' && '100%'}
              {colorMode === 'brake' && '100%'}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Lap legend */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        {selectedLaps.map((lapNum, i) => {
          const lap = laps.find((l: any) => l.lapNumber.toString() === lapNum);
          return (
            <Chip
              key={lapNum}
              icon={
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    bgcolor: colorScale(i.toString()),
                    borderRadius: '50%',
                    ml: 0.5,
                  }}
                />
              }
              label={`Lap ${lapNum} ${lap ? `(${formatTime(lap.lapTime)})` : ''}`}
              size="small"
              variant="outlined"
            />
          );
        })}
        {showBrakePoints && (
          <Chip
            icon={
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  bgcolor: '#F44336',
                  borderRadius: '50%',
                  ml: 0.5,
                }}
              />
            }
            label="Brake Points"
            size="small"
            variant="outlined"
          />
        )}
        {showThrottleZones && (
          <Chip
            icon={
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  bgcolor: '#4CAF50',
                  borderRadius: '50%',
                  ml: 0.5,
                }}
              />
            }
            label="Throttle Zones"
            size="small"
            variant="outlined"
          />
        )}
        {showIdealLine && (
          <Chip
            icon={
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  bgcolor: '#FFD700',
                  borderRadius: '50%',
                  ml: 0.5,
                }}
              />
            }
            label="Ideal Line"
            size="small"
            variant="outlined"
          />
        )}
      </Box>

      {/* Line comparison insights */}
      {processedData &&
        selectedLaps.length >= 2 &&
        processedData.racingLines[selectedLapNumbers[0]] &&
        processedData.racingLines[selectedLapNumbers[1]] && (
          <Card variant="outlined" sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Line Comparison Analysis
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {(() => {
                  const comparison = compareRacingLines(
                    processedData.racingLines[selectedLapNumbers[0]],
                    processedData.racingLines[selectedLapNumbers[1]]
                  );
                  return (
                    <>
                      Average deviation between Lap {selectedLapNumbers[0]} and Lap{' '}
                      {selectedLapNumbers[1]}:{' '}
                      <strong>{comparison.avgDeviation.toFixed(2)}m</strong>
                      <br />
                      Maximum deviation: <strong>{comparison.maxDeviation.toFixed(2)}m</strong>
                    </>
                  );
                })()}
              </Typography>
            </CardContent>
          </Card>
        )}

      <Divider sx={{ my: 2 }} />

      <Typography variant="body2" color="text.secondary">
        <InfoIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
        Scroll to zoom, drag to pan. Use the color mode buttons to visualize different telemetry
        data on the racing line.
      </Typography>
    </Paper>
  );
};

export default RacingLineAnalysis;
