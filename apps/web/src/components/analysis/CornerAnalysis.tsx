'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  TrendingUp as ImproveIcon,
  CheckCircle as GoodIcon,
  Warning as WarningIcon,
  Error as BadIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { useQuery } from 'convex/react';
import {
  detectCorners,
  rateCornerExecution,
  compareCornerExecution,
  getCornerRatingColor,
  DetectedCorner,
} from '@/lib/analysis/cornerDetector';
import { Corner } from '@/lib/analysis/types';

// Try to import the generated API
let api: any;
let useConvexQuery = true;

try {
  const convexApi = require('@/convex/_generated/api');
  api = convexApi.api;
} catch (error) {
  api = null;
  useConvexQuery = false;
}

interface CornerAnalysisProps {
  laps: any[];
  sessionId: string;
}

const CornerAnalysis: React.FC<CornerAnalysisProps> = ({ laps, sessionId }) => {
  const chartRef = useRef<SVGSVGElement>(null);
  const [selectedLap, setSelectedLap] = useState<string>('');
  const [compareLap, setCompareLap] = useState<string>('');
  const [selectedCorner, setSelectedCorner] = useState<number | null>(null);
  const [lapOptions, setLapOptions] = useState<{ value: string; label: string }[]>([]);

  const selectedLapNumber = selectedLap ? parseInt(selectedLap) : null;
  const compareLapNumber = compareLap ? parseInt(compareLap) : null;

  const telemetryData = useConvexQuery && api && selectedLapNumber
    ? useQuery(api.telemetry.getTelemetryForLaps, {
        sessionId: sessionId as any,
        lapNumbers: compareLapNumber ? [selectedLapNumber, compareLapNumber] : [selectedLapNumber],
      })
    : null;

  // Process corner data
  const cornerData = useMemo(() => {
    if (!telemetryData || telemetryData.length === 0) return null;

    const pointsByLap: Record<number, any[]> = {};
    telemetryData.forEach((p: any) => {
      if (!pointsByLap[p.lapNumber]) pointsByLap[p.lapNumber] = [];
      pointsByLap[p.lapNumber].push(p);
    });

    const corners: Record<number, DetectedCorner[]> = {};
    const ratings: Record<number, { rating: Corner['rating']; timeLoss: number; suggestions: string[] }[]> = {};

    Object.entries(pointsByLap).forEach(([lapNum, points]) => {
      const detected = detectCorners(points);
      corners[parseInt(lapNum)] = detected;

      // Rate each corner
      ratings[parseInt(lapNum)] = detected.map((corner) => rateCornerExecution(corner));
    });

    // If we have two laps, get the ideal corners from the faster lap
    let idealCorners: DetectedCorner[] | null = null;
    if (selectedLapNumber && compareLapNumber) {
      const lap1Time = laps.find((l: any) => l.lapNumber === selectedLapNumber)?.lapTime || 0;
      const lap2Time = laps.find((l: any) => l.lapNumber === compareLapNumber)?.lapTime || 0;
      idealCorners = lap1Time < lap2Time ? corners[selectedLapNumber] : corners[compareLapNumber];
    }

    // Re-rate corners against ideal if available
    if (idealCorners && selectedLapNumber) {
      ratings[selectedLapNumber] = corners[selectedLapNumber]?.map((corner, i) =>
        rateCornerExecution(corner, idealCorners![i])
      ) || [];
    }

    return { corners, ratings, idealCorners };
  }, [telemetryData, selectedLapNumber, compareLapNumber, laps]);

  useEffect(() => {
    if (laps && laps.length > 0) {
      const options = laps.map((lap: any) => ({
        value: lap.lapNumber.toString(),
        label: `Lap ${lap.lapNumber} (${formatTime(lap.lapTime)})`,
      }));
      setLapOptions(options);

      if (!selectedLap) {
        const bestLap = laps.reduce(
          (fastest: any, lap: any) => (!fastest || lap.lapTime < fastest.lapTime ? lap : fastest),
          laps[0]
        );
        setSelectedLap(bestLap.lapNumber.toString());
      }
    }
  }, [laps]);

  // Draw corner speed profile chart
  useEffect(() => {
    if (!chartRef.current || !cornerData || selectedCorner === null) return;

    const svg = d3.select(chartRef.current);
    svg.selectAll('*').remove();

    const selectedCorners = cornerData.corners[selectedLapNumber!];
    if (!selectedCorners || selectedCorner >= selectedCorners.length) return;

    const corner = selectedCorners[selectedCorner];
    const { speedProfile } = corner;

    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const width = chartRef.current.clientWidth - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    const chart = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3
      .scaleLinear()
      .domain([d3.min(speedProfile, (d) => d.distance) || 0, d3.max(speedProfile, (d) => d.distance) || 100])
      .range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(speedProfile, (d) => d.speed) || 200])
      .range([height, 0]);

    // X axis
    chart
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(5))
      .append('text')
      .attr('x', width / 2)
      .attr('y', 35)
      .attr('fill', 'black')
      .style('text-anchor', 'middle')
      .text('Track Position (%)');

    // Y axis
    chart
      .append('g')
      .call(d3.axisLeft(yScale))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -45)
      .attr('x', -height / 2)
      .attr('fill', 'black')
      .style('text-anchor', 'middle')
      .text('Speed (km/h)');

    // Speed line
    const line = d3
      .line<{ distance: number; speed: number }>()
      .x((d) => xScale(d.distance))
      .y((d) => yScale(d.speed))
      .curve(d3.curveCatmullRom);

    chart
      .append('path')
      .datum(speedProfile)
      .attr('fill', 'none')
      .attr('stroke', '#2196F3')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add apex marker
    const apexPoint = speedProfile.reduce(
      (min, p) => (p.speed < min.speed ? p : min),
      speedProfile[0]
    );

    chart
      .append('circle')
      .attr('cx', xScale(apexPoint.distance))
      .attr('cy', yScale(apexPoint.speed))
      .attr('r', 6)
      .attr('fill', '#FF9800');

    chart
      .append('text')
      .attr('x', xScale(apexPoint.distance))
      .attr('y', yScale(apexPoint.speed) - 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .text(`Apex: ${apexPoint.speed.toFixed(0)} km/h`);

    // Compare lap overlay
    if (compareLapNumber && cornerData.corners[compareLapNumber]) {
      const compareCorner = cornerData.corners[compareLapNumber][selectedCorner];
      if (compareCorner) {
        const compareLine = d3
          .line<{ distance: number; speed: number }>()
          .x((d) => xScale(d.distance))
          .y((d) => yScale(d.speed))
          .curve(d3.curveCatmullRom);

        chart
          .append('path')
          .datum(compareCorner.speedProfile)
          .attr('fill', 'none')
          .attr('stroke', '#9C27B0')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '4,4')
          .attr('d', compareLine);
      }
    }
  }, [cornerData, selectedCorner, selectedLapNumber, compareLapNumber]);

  const formatTime = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    const ms = Math.floor((milliseconds % 1000) / 10);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const getRatingIcon = (rating: Corner['rating']) => {
    switch (rating) {
      case 'excellent':
        return <GoodIcon sx={{ color: '#4CAF50' }} fontSize="small" />;
      case 'good':
        return <GoodIcon sx={{ color: '#8BC34A' }} fontSize="small" />;
      case 'average':
        return <WarningIcon sx={{ color: '#FF9800' }} fontSize="small" />;
      case 'poor':
        return <WarningIcon sx={{ color: '#FF5722' }} fontSize="small" />;
      case 'bad':
        return <BadIcon sx={{ color: '#F44336' }} fontSize="small" />;
      default:
        return null;
    }
  };

  const getOverallScore = () => {
    if (!cornerData || !selectedLapNumber || !cornerData.ratings[selectedLapNumber]) return 0;

    const ratings = cornerData.ratings[selectedLapNumber];
    const ratingValues: Record<Corner['rating'], number> = {
      excellent: 100,
      good: 80,
      average: 60,
      poor: 40,
      bad: 20,
    };

    const total = ratings.reduce((sum, r) => sum + ratingValues[r.rating], 0);
    return Math.round(total / ratings.length);
  };

  const getTotalTimeLoss = () => {
    if (!cornerData || !selectedLapNumber || !cornerData.ratings[selectedLapNumber]) return 0;
    return cornerData.ratings[selectedLapNumber].reduce((sum, r) => sum + r.timeLoss, 0);
  };

  if (!cornerData) {
    return (
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Corner Analysis
        </Typography>
        <Alert severity="info">Select a lap to analyze corner performance</Alert>
      </Paper>
    );
  }

  const corners = cornerData.corners[selectedLapNumber!] || [];
  const ratings = cornerData.ratings[selectedLapNumber!] || [];

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        Corner Analysis
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Analyze Lap</InputLabel>
            <Select
              value={selectedLap}
              onChange={(e) => setSelectedLap(e.target.value)}
              label="Analyze Lap"
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
          <FormControl fullWidth size="small">
            <InputLabel>Compare With</InputLabel>
            <Select
              value={compareLap}
              onChange={(e) => setCompareLap(e.target.value)}
              label="Compare With"
            >
              <MenuItem value="">None</MenuItem>
              {lapOptions
                .filter((o) => o.value !== selectedLap)
                .map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', gap: 2, height: '100%', alignItems: 'center' }}>
            <Card sx={{ flex: 1 }}>
              <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                <Typography variant="caption" color="text.secondary">
                  Overall Score
                </Typography>
                <Typography variant="h5">{getOverallScore()}%</Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1 }}>
              <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                <Typography variant="caption" color="text.secondary">
                  Time Loss
                </Typography>
                <Typography variant="h5" color="error">
                  +{getTotalTimeLoss().toFixed(2)}s
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>

      {corners.length === 0 ? (
        <Alert severity="info">No corners detected in this lap</Alert>
      ) : (
        <>
          {/* Corner Summary Table */}
          <TableContainer sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Corner</TableCell>
                  <TableCell align="right">Entry</TableCell>
                  <TableCell align="right">Apex</TableCell>
                  <TableCell align="right">Exit</TableCell>
                  <TableCell align="center">Rating</TableCell>
                  <TableCell align="right">Time Loss</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {corners.map((corner, index) => {
                  const rating = ratings[index];
                  return (
                    <TableRow
                      key={corner.id}
                      hover
                      selected={selectedCorner === index}
                      onClick={() => setSelectedCorner(index)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: getCornerRatingColor(rating?.rating || 'average'),
                            }}
                          />
                          Turn {corner.id}
                        </Box>
                      </TableCell>
                      <TableCell align="right">{corner.entrySpeed.toFixed(0)} km/h</TableCell>
                      <TableCell align="right">{corner.apexSpeed.toFixed(0)} km/h</TableCell>
                      <TableCell align="right">{corner.exitSpeed.toFixed(0)} km/h</TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          icon={getRatingIcon(rating?.rating || 'average')}
                          label={rating?.rating || 'N/A'}
                          sx={{
                            bgcolor: getCornerRatingColor(rating?.rating || 'average'),
                            color: '#fff',
                            textTransform: 'capitalize',
                          }}
                        />
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ color: rating?.timeLoss > 0.1 ? 'error.main' : 'text.secondary' }}
                      >
                        {rating?.timeLoss > 0 ? `+${rating.timeLoss.toFixed(3)}s` : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Selected Corner Detail */}
          {selectedCorner !== null && corners[selectedCorner] && (
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Turn {corners[selectedCorner].id} Analysis
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ width: '100%', height: 250 }}>
                      <svg ref={chartRef} width="100%" height="100%" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 16, height: 3, bgcolor: '#2196F3' }} />
                        <Typography variant="caption">Lap {selectedLap}</Typography>
                      </Box>
                      {compareLap && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Box
                            sx={{
                              width: 16,
                              height: 3,
                              bgcolor: '#9C27B0',
                              borderStyle: 'dashed',
                            }}
                          />
                          <Typography variant="caption">Lap {compareLap}</Typography>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Improvement Suggestions
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {ratings[selectedCorner]?.suggestions.map((suggestion, i) => (
                        <Alert key={i} severity="info" icon={<ImproveIcon />}>
                          {suggestion}
                        </Alert>
                      ))}
                    </Box>

                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Corner Metrics
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Brake Point
                          </Typography>
                          <Typography variant="body2">
                            {corners[selectedCorner].brakePoint.toFixed(1)}% of track
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Throttle Point
                          </Typography>
                          <Typography variant="body2">
                            {corners[selectedCorner].throttlePoint.toFixed(1)}% of track
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Min Speed
                          </Typography>
                          <Typography variant="body2">
                            {corners[selectedCorner].minSpeed.toFixed(0)} km/h
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Duration
                          </Typography>
                          <Typography variant="body2">
                            {(corners[selectedCorner].duration / 1000).toFixed(2)}s
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Corner Rating Distribution */}
          <Typography variant="h6" gutterBottom>
            Rating Distribution
          </Typography>
          <Grid container spacing={1} sx={{ mb: 2 }}>
            {(['excellent', 'good', 'average', 'poor', 'bad'] as Corner['rating'][]).map((rating) => {
              const count = ratings.filter((r) => r.rating === rating).length;
              const percentage = corners.length > 0 ? (count / corners.length) * 100 : 0;
              return (
                <Grid item xs={12} key={rating}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="caption" sx={{ width: 70, textTransform: 'capitalize' }}>
                      {rating}
                    </Typography>
                    <Box sx={{ flex: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={percentage}
                        sx={{
                          height: 8,
                          borderRadius: 1,
                          bgcolor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: getCornerRatingColor(rating),
                          },
                        }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ width: 50 }}>
                      {count} ({percentage.toFixed(0)}%)
                    </Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </>
      )}
    </Paper>
  );
};

export default CornerAnalysis;
