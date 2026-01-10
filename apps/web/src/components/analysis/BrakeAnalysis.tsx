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
  Tooltip,
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Speed as SpeedIcon,
  Thermostat as TempIcon,
  Timeline as TimelineIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useQuery } from 'convex/react';
import {
  detectBrakeZones,
  calculateBrakeConsistency,
  BrakeZone,
} from '@/lib/analysis/cornerDetector';

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

interface BrakeAnalysisProps {
  laps: any[];
  sessionId: string;
}

interface BrakeStats {
  avgBrakePressure: number;
  maxBrakePressure: number;
  trailBrakingPercentage: number;
  avgBrakeZoneLength: number;
  totalBrakeZones: number;
}

const BrakeAnalysis: React.FC<BrakeAnalysisProps> = ({ laps, sessionId }) => {
  const chartRef = useRef<SVGSVGElement>(null);
  const consistencyChartRef = useRef<SVGSVGElement>(null);
  const [selectedLaps, setSelectedLaps] = useState<string[]>([]);
  const [lapOptions, setLapOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectedZone, setSelectedZone] = useState<number | null>(null);

  const selectedLapNumbers = selectedLaps.map((l) => parseInt(l));

  const telemetryData = useConvexQuery && api && selectedLapNumbers.length > 0
    ? useQuery(api.telemetry.getTelemetryForLaps, {
        sessionId: sessionId as any,
        lapNumbers: selectedLapNumbers,
      })
    : null;

  // Process brake data
  const brakeData = useMemo(() => {
    if (!telemetryData || telemetryData.length === 0) return null;

    const pointsByLap: Record<number, any[]> = {};
    telemetryData.forEach((p: any) => {
      if (!pointsByLap[p.lapNumber]) pointsByLap[p.lapNumber] = [];
      pointsByLap[p.lapNumber].push(p);
    });

    const brakeZones: { lap: number; zones: BrakeZone[] }[] = [];
    const stats: Record<number, BrakeStats> = {};

    Object.entries(pointsByLap).forEach(([lapNum, points]) => {
      const zones = detectBrakeZones(points);
      brakeZones.push({ lap: parseInt(lapNum), zones });

      // Calculate stats
      const avgPressure = zones.length > 0
        ? zones.reduce((sum, z) => sum + z.avgBrakePressure, 0) / zones.length
        : 0;
      const maxPressure = zones.length > 0 ? Math.max(...zones.map((z) => z.maxBrakePressure)) : 0;
      const trailBrakingCount = zones.filter((z) => z.trailBrakingDetected).length;
      const avgZoneLength = zones.length > 0
        ? zones.reduce((sum, z) => sum + (z.endDistance - z.startDistance), 0) / zones.length
        : 0;

      stats[parseInt(lapNum)] = {
        avgBrakePressure: avgPressure,
        maxBrakePressure: maxPressure,
        trailBrakingPercentage: zones.length > 0 ? (trailBrakingCount / zones.length) * 100 : 0,
        avgBrakeZoneLength: avgZoneLength,
        totalBrakeZones: zones.length,
      };
    });

    // Calculate consistency across laps
    const consistency = brakeZones.length >= 2 ? calculateBrakeConsistency(brakeZones) : [];

    return { brakeZones, stats, consistency };
  }, [telemetryData]);

  useEffect(() => {
    if (laps && laps.length > 0) {
      const options = laps.map((lap: any) => ({
        value: lap.lapNumber.toString(),
        label: `Lap ${lap.lapNumber} (${formatTime(lap.lapTime)})`,
      }));
      setLapOptions(options);

      if (selectedLaps.length === 0 && laps.length >= 2) {
        const bestLap = laps.reduce(
          (fastest: any, lap: any) => (!fastest || lap.lapTime < fastest.lapTime ? lap : fastest),
          laps[0]
        );
        const otherLap = laps.find((l: any) => l.lapNumber !== bestLap.lapNumber);
        setSelectedLaps([bestLap.lapNumber.toString(), otherLap?.lapNumber.toString() || '']);
      } else if (selectedLaps.length === 0) {
        setSelectedLaps([laps[0].lapNumber.toString()]);
      }
    }
  }, [laps]);

  // Draw brake zone comparison chart
  useEffect(() => {
    if (!chartRef.current || !brakeData || selectedLapNumbers.length === 0) return;

    const svg = d3.select(chartRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    const width = chartRef.current.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const chart = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Get first lap's zones as reference
    const refLapData = brakeData.brakeZones.find((b) => b.lap === selectedLapNumbers[0]);
    if (!refLapData || refLapData.zones.length === 0) return;

    const xScale = d3.scaleLinear().domain([0, 100]).range([0, width]);
    const yScale = d3.scaleLinear().domain([0, 1]).range([height, 0]);

    // X axis
    chart
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(10))
      .append('text')
      .attr('x', width / 2)
      .attr('y', 35)
      .attr('fill', 'black')
      .style('text-anchor', 'middle')
      .text('Track Position (%)');

    // Y axis
    chart
      .append('g')
      .call(d3.axisLeft(yScale).tickFormat((d) => `${((d as number) * 100).toFixed(0)}%`))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -45)
      .attr('x', -height / 2)
      .attr('fill', 'black')
      .style('text-anchor', 'middle')
      .text('Brake Pressure');

    const colors = d3.scaleOrdinal(d3.schemeCategory10);

    // Draw brake zones for each lap
    selectedLapNumbers.forEach((lapNum, lapIndex) => {
      const lapData = brakeData.brakeZones.find((b) => b.lap === lapNum);
      if (!lapData) return;

      lapData.zones.forEach((zone, zoneIndex) => {
        // Brake zone rectangle
        chart
          .append('rect')
          .attr('x', xScale(zone.startDistance))
          .attr('y', yScale(zone.maxBrakePressure))
          .attr('width', xScale(zone.endDistance) - xScale(zone.startDistance))
          .attr('height', yScale(0) - yScale(zone.maxBrakePressure))
          .attr('fill', colors(lapIndex.toString()))
          .attr('opacity', 0.3)
          .attr('stroke', colors(lapIndex.toString()))
          .attr('stroke-width', selectedZone === zoneIndex ? 2 : 1)
          .style('cursor', 'pointer')
          .on('click', () => setSelectedZone(zoneIndex));

        // Trail braking indicator
        if (zone.trailBrakingDetected) {
          chart
            .append('circle')
            .attr('cx', xScale(zone.endDistance))
            .attr('cy', yScale(zone.maxBrakePressure * 0.5))
            .attr('r', 4)
            .attr('fill', '#4CAF50')
            .attr('stroke', '#fff')
            .attr('stroke-width', 1);
        }
      });
    });

    // Legend
    const legend = chart.append('g').attr('transform', `translate(${width - 100}, 10)`);

    selectedLapNumbers.forEach((lapNum, i) => {
      const legendRow = legend.append('g').attr('transform', `translate(0, ${i * 20})`);

      legendRow
        .append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', colors(i.toString()))
        .attr('opacity', 0.3);

      legendRow
        .append('text')
        .attr('x', 20)
        .attr('y', 12)
        .text(`Lap ${lapNum}`)
        .style('font-size', '11px');
    });
  }, [brakeData, selectedLapNumbers, selectedZone]);

  // Draw consistency chart
  useEffect(() => {
    if (!consistencyChartRef.current || !brakeData || brakeData.consistency.length === 0) return;

    const svg = d3.select(consistencyChartRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const width = consistencyChartRef.current.clientWidth - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const chart = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3
      .scaleBand()
      .domain(brakeData.consistency.map((c) => `Zone ${c.zoneId}`))
      .range([0, width])
      .padding(0.2);

    const yScale = d3.scaleLinear().domain([0, 100]).range([height, 0]);

    // X axis
    chart
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('font-size', '10px');

    // Y axis
    chart
      .append('g')
      .call(d3.axisLeft(yScale).tickFormat((d) => `${d}%`))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -45)
      .attr('x', -height / 2)
      .attr('fill', 'black')
      .style('text-anchor', 'middle')
      .text('Consistency');

    // Bars
    chart
      .selectAll('.bar')
      .data(brakeData.consistency)
      .enter()
      .append('rect')
      .attr('x', (d) => xScale(`Zone ${d.zoneId}`) || 0)
      .attr('y', (d) => yScale(d.consistency))
      .attr('width', xScale.bandwidth())
      .attr('height', (d) => height - yScale(d.consistency))
      .attr('fill', (d) => (d.consistency > 80 ? '#4CAF50' : d.consistency > 60 ? '#FF9800' : '#F44336'));
  }, [brakeData]);

  const formatTime = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    const ms = Math.floor((milliseconds % 1000) / 10);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const getConsistencyColor = (value: number) => {
    if (value > 80) return 'success';
    if (value > 60) return 'warning';
    return 'error';
  };

  const getOverallConsistency = () => {
    if (!brakeData || brakeData.consistency.length === 0) return 0;
    return Math.round(
      brakeData.consistency.reduce((sum, c) => sum + c.consistency, 0) / brakeData.consistency.length
    );
  };

  const generateRecommendations = () => {
    if (!brakeData) return [];

    const recommendations: string[] = [];
    const firstLapStats = brakeData.stats[selectedLapNumbers[0]];

    if (firstLapStats) {
      if (firstLapStats.trailBrakingPercentage < 30) {
        recommendations.push(
          'Try incorporating more trail braking - release brake pressure gradually while turning in to improve rotation'
        );
      }

      if (firstLapStats.avgBrakePressure < 0.7) {
        recommendations.push(
          'Brake pressure is relatively low - consider braking harder and later for better lap times'
        );
      }

      if (brakeData.consistency.some((c) => c.consistency < 70)) {
        recommendations.push(
          'Brake point consistency varies - focus on using consistent reference points for braking'
        );
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Brake technique looks consistent - maintain current approach');
    }

    return recommendations;
  };

  if (!brakeData) {
    return (
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Brake Analysis
        </Typography>
        <Alert severity="info">Select laps to analyze braking performance</Alert>
      </Paper>
    );
  }

  const firstLapStats = brakeData.stats[selectedLapNumbers[0]];
  const firstLapZones = brakeData.brakeZones.find((b) => b.lap === selectedLapNumbers[0])?.zones || [];

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        Brake Analysis
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth size="small">
            <InputLabel>Select Laps</InputLabel>
            <Select
              multiple
              value={selectedLaps}
              onChange={(e) => setSelectedLaps(e.target.value as string[])}
              label="Select Laps"
              renderValue={(selected) =>
                selected.map((v) => `Lap ${v}`).join(', ')
              }
            >
              {lapOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', gap: 2, height: '100%', alignItems: 'center' }}>
            <Card sx={{ flex: 1 }}>
              <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                <Typography variant="caption" color="text.secondary">
                  Brake Zones
                </Typography>
                <Typography variant="h5">{firstLapStats?.totalBrakeZones || 0}</Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1 }}>
              <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                <Typography variant="caption" color="text.secondary">
                  Consistency
                </Typography>
                <Typography variant="h5">{getOverallConsistency()}%</Typography>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>

      {/* Stats Cards */}
      {firstLapStats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ py: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Avg Brake Pressure
                </Typography>
                <Typography variant="h6">
                  {(firstLapStats.avgBrakePressure * 100).toFixed(0)}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={firstLapStats.avgBrakePressure * 100}
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ py: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Max Brake Pressure
                </Typography>
                <Typography variant="h6">
                  {(firstLapStats.maxBrakePressure * 100).toFixed(0)}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={firstLapStats.maxBrakePressure * 100}
                  color="error"
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ py: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Trail Braking Usage
                </Typography>
                <Typography variant="h6">
                  {firstLapStats.trailBrakingPercentage.toFixed(0)}%
                </Typography>
                <Chip
                  size="small"
                  label={firstLapStats.trailBrakingPercentage > 50 ? 'Good' : 'Can Improve'}
                  color={firstLapStats.trailBrakingPercentage > 50 ? 'success' : 'warning'}
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ py: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Avg Zone Length
                </Typography>
                <Typography variant="h6">
                  {firstLapStats.avgBrakeZoneLength.toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  of track
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Brake Zone Chart */}
      <Typography variant="h6" gutterBottom>
        Brake Zone Comparison
      </Typography>
      <Box sx={{ width: '100%', height: 300, mb: 3 }}>
        <svg ref={chartRef} width="100%" height="100%" />
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 12, height: 12, bgcolor: '#4CAF50', borderRadius: '50%' }} />
          <Typography variant="caption">Trail Braking Detected</Typography>
        </Box>
      </Box>

      {/* Brake Zone Details Table */}
      {firstLapZones.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom>
            Brake Zone Details - Lap {selectedLapNumbers[0]}
          </Typography>
          <TableContainer sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Zone</TableCell>
                  <TableCell align="right">Start</TableCell>
                  <TableCell align="right">Entry Speed</TableCell>
                  <TableCell align="right">Exit Speed</TableCell>
                  <TableCell align="right">Max Pressure</TableCell>
                  <TableCell align="center">Trail Brake</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {firstLapZones.map((zone, index) => (
                  <TableRow
                    key={zone.id}
                    hover
                    selected={selectedZone === index}
                    onClick={() => setSelectedZone(index)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>Zone {zone.id}</TableCell>
                    <TableCell align="right">{zone.startDistance.toFixed(1)}%</TableCell>
                    <TableCell align="right">{zone.startSpeed.toFixed(0)} km/h</TableCell>
                    <TableCell align="right">{zone.endSpeed.toFixed(0)} km/h</TableCell>
                    <TableCell align="right">{(zone.maxBrakePressure * 100).toFixed(0)}%</TableCell>
                    <TableCell align="center">
                      {zone.trailBrakingDetected ? (
                        <CheckIcon color="success" fontSize="small" />
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Consistency Chart */}
      {brakeData.consistency.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom>
            Brake Point Consistency Across Laps
          </Typography>
          <Box sx={{ width: '100%', height: 200, mb: 3 }}>
            <svg ref={consistencyChartRef} width="100%" height="100%" />
          </Box>
        </>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Recommendations */}
      <Typography variant="h6" gutterBottom>
        Recommendations
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {generateRecommendations().map((rec, index) => (
          <Alert key={index} severity="info" icon={<InfoIcon />}>
            {rec}
          </Alert>
        ))}
      </Box>
    </Paper>
  );
};

export default BrakeAnalysis;
