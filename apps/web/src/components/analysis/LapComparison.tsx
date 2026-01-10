'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
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
  Chip,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Timer as TimerIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as NeutralIcon,
} from '@mui/icons-material';
import { useQuery } from 'convex/react';
import {
  calculateTimeDelta,
  calculateSpeedDifferential,
  calculateThrottleComparison,
  calculateBrakeComparison,
  calculateSectorBreakdown,
  generateComparisonInsights,
  formatLapTime,
  formatDeltaTime,
  ComparisonMetric,
  normalizeLapToDistance,
} from '@/lib/analysis/lapComparisonEngine';
import { SectorBreakdown, TimeDelta } from '@/lib/analysis/types';

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

interface LapComparisonProps {
  laps: any[];
  sessionId: string;
}

type MetricKey = 'speed' | 'throttle' | 'brake' | 'gear' | 'timeDelta';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

const LapComparison: React.FC<LapComparisonProps> = ({ laps, sessionId }) => {
  const speedChartRef = useRef<SVGSVGElement>(null);
  const deltaChartRef = useRef<SVGSVGElement>(null);
  const inputChartRef = useRef<SVGSVGElement>(null);
  const [selectedLaps, setSelectedLaps] = useState<string[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('speed');
  const [tabValue, setTabValue] = useState(0);
  const [lapOptions, setLapOptions] = useState<{ value: string; label: string }[]>([]);

  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  const selectedLapNumbers = selectedLaps.map((l) => parseInt(l));

  const telemetryData = useConvexQuery && api && selectedLapNumbers.length > 0
    ? useQuery(api.telemetry.getTelemetryForLaps, {
        sessionId: sessionId as any,
        lapNumbers: selectedLapNumbers,
      })
    : null;

  // Process comparison data
  const comparisonData = useMemo(() => {
    if (!telemetryData || telemetryData.length === 0 || selectedLapNumbers.length < 2) return null;

    // Group points by lap
    const pointsByLap: Record<number, any[]> = {};
    telemetryData.forEach((p: any) => {
      if (!pointsByLap[p.lapNumber]) pointsByLap[p.lapNumber] = [];
      pointsByLap[p.lapNumber].push(p);
    });

    const lap1Num = selectedLapNumbers[0];
    const lap2Num = selectedLapNumbers[1];

    if (!pointsByLap[lap1Num] || !pointsByLap[lap2Num]) return null;

    const lap1Points = pointsByLap[lap1Num];
    const lap2Points = pointsByLap[lap2Num];

    const timeDelta = calculateTimeDelta(lap1Points, lap2Points);
    const speedDiff = calculateSpeedDifferential([
      { lapNumber: lap1Num, points: lap1Points },
      { lapNumber: lap2Num, points: lap2Points },
    ]);
    const throttleComp = calculateThrottleComparison([
      { lapNumber: lap1Num, points: lap1Points },
      { lapNumber: lap2Num, points: lap2Points },
    ]);
    const brakeComp = calculateBrakeComparison([
      { lapNumber: lap1Num, points: lap1Points },
      { lapNumber: lap2Num, points: lap2Points },
    ]);

    const lap1Data = laps.find((l) => l.lapNumber === lap1Num);
    const lap2Data = laps.find((l) => l.lapNumber === lap2Num);

    const sectorBreakdown = calculateSectorBreakdown(
      lap1Data || { lapNumber: lap1Num, lapTime: 0 },
      lap2Data || { lapNumber: lap2Num, lapTime: 0 },
      lap1Points,
      lap2Points
    );

    const insights = generateComparisonInsights(
      lap1Num,
      lap2Num,
      lap1Data?.lapTime || 0,
      lap2Data?.lapTime || 0,
      speedDiff,
      sectorBreakdown
    );

    return {
      timeDelta,
      speedDiff,
      throttleComp,
      brakeComp,
      sectorBreakdown,
      insights,
      lap1Data,
      lap2Data,
    };
  }, [telemetryData, selectedLapNumbers, laps]);

  useEffect(() => {
    if (laps && laps.length > 0) {
      const options = laps.map((lap) => ({
        value: lap.lapNumber.toString(),
        label: `Lap ${lap.lapNumber} (${formatLapTime(lap.lapTime)})`,
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

  // Speed differential chart
  useEffect(() => {
    if (!speedChartRef.current || !comparisonData || tabValue !== 0) return;

    const svg = d3.select(speedChartRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 80, bottom: 40, left: 60 };
    const width = speedChartRef.current.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const chart = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear().domain([0, 100]).range([0, width]);

    const allSpeeds = comparisonData.speedDiff.flatMap((d) =>
      selectedLapNumbers.map((l) => d[l.toString()] || 0)
    );
    const yScale = d3
      .scaleLinear()
      .domain([0, Math.max(...allSpeeds) * 1.1])
      .range([height, 0]);

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
      .text('Distance (% of lap)');

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

    // Draw lines for each lap
    selectedLapNumbers.slice(0, 2).forEach((lapNum, i) => {
      const line = d3
        .line<ComparisonMetric>()
        .x((d) => xScale(d.distance))
        .y((d) => yScale(d[lapNum.toString()] || 0))
        .curve(d3.curveCatmullRom);

      chart
        .append('path')
        .datum(comparisonData.speedDiff)
        .attr('fill', 'none')
        .attr('stroke', colorScale(i.toString()))
        .attr('stroke-width', 2)
        .attr('d', line);
    });

    // Legend
    const legend = chart.append('g').attr('transform', `translate(${width + 10}, 10)`);

    selectedLapNumbers.slice(0, 2).forEach((lapNum, i) => {
      const lap = laps.find((l: any) => l.lapNumber === lapNum);
      const legendRow = legend.append('g').attr('transform', `translate(0, ${i * 20})`);

      legendRow
        .append('rect')
        .attr('width', 15)
        .attr('height', 3)
        .attr('fill', colorScale(i.toString()));

      legendRow
        .append('text')
        .attr('x', 20)
        .attr('y', 4)
        .text(`Lap ${lapNum}`)
        .style('font-size', '11px');
    });
  }, [comparisonData, tabValue, selectedLapNumbers, laps]);

  // Time delta chart
  useEffect(() => {
    if (!deltaChartRef.current || !comparisonData || tabValue !== 1) return;

    const svg = d3.select(deltaChartRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const width = deltaChartRef.current.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const chart = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear().domain([0, 100]).range([0, width]);

    const deltaValues = comparisonData.timeDelta.map((d) => d.delta);
    const maxAbsDelta = Math.max(...deltaValues.map(Math.abs), 0.1);
    const yScale = d3
      .scaleLinear()
      .domain([-maxAbsDelta * 1.1, maxAbsDelta * 1.1])
      .range([height, 0]);

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
      .text('Distance (% of lap)');

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
      .text('Time Delta (seconds)');

    // Zero line
    chart
      .append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', yScale(0))
      .attr('y2', yScale(0))
      .attr('stroke', '#ccc')
      .attr('stroke-dasharray', '4,4');

    // Area for positive delta (lap 1 slower)
    const areaAbove = d3
      .area<TimeDelta>()
      .x((d) => xScale(d.distance))
      .y0(yScale(0))
      .y1((d) => yScale(Math.max(0, d.delta)))
      .curve(d3.curveCatmullRom);

    // Area for negative delta (lap 1 faster)
    const areaBelow = d3
      .area<TimeDelta>()
      .x((d) => xScale(d.distance))
      .y0(yScale(0))
      .y1((d) => yScale(Math.min(0, d.delta)))
      .curve(d3.curveCatmullRom);

    chart
      .append('path')
      .datum(comparisonData.timeDelta)
      .attr('fill', 'rgba(244, 67, 54, 0.3)')
      .attr('d', areaAbove);

    chart
      .append('path')
      .datum(comparisonData.timeDelta)
      .attr('fill', 'rgba(76, 175, 80, 0.3)')
      .attr('d', areaBelow);

    // Delta line
    const line = d3
      .line<TimeDelta>()
      .x((d) => xScale(d.distance))
      .y((d) => yScale(d.delta))
      .curve(d3.curveCatmullRom);

    chart
      .append('path')
      .datum(comparisonData.timeDelta)
      .attr('fill', 'none')
      .attr('stroke', '#2196F3')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Labels
    const finalDelta = comparisonData.timeDelta[comparisonData.timeDelta.length - 1]?.delta || 0;
    chart
      .append('text')
      .attr('x', width - 5)
      .attr('y', yScale(finalDelta) - 5)
      .attr('text-anchor', 'end')
      .attr('fill', finalDelta > 0 ? '#F44336' : '#4CAF50')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text(formatDeltaTime(finalDelta));
  }, [comparisonData, tabValue]);

  // Input comparison chart (throttle/brake)
  useEffect(() => {
    if (!inputChartRef.current || !comparisonData || tabValue !== 2) return;

    const svg = d3.select(inputChartRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 80, bottom: 40, left: 60 };
    const width = inputChartRef.current.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const chart = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

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
      .text('Distance (% of lap)');

    // Y axis
    chart
      .append('g')
      .call(d3.axisLeft(yScale).tickFormat((d) => `${(d as number) * 100}%`))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -45)
      .attr('x', -height / 2)
      .attr('fill', 'black')
      .style('text-anchor', 'middle')
      .text('Input Level');

    const data = selectedMetric === 'throttle' ? comparisonData.throttleComp : comparisonData.brakeComp;
    const colors = selectedMetric === 'throttle' ? ['#4CAF50', '#8BC34A'] : ['#F44336', '#FF7043'];

    selectedLapNumbers.slice(0, 2).forEach((lapNum, i) => {
      const line = d3
        .line<ComparisonMetric>()
        .x((d) => xScale(d.distance))
        .y((d) => yScale(d[lapNum.toString()] || 0))
        .curve(d3.curveCatmullRom);

      chart
        .append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', colors[i])
        .attr('stroke-width', 2)
        .attr('d', line);
    });

    // Legend
    const legend = chart.append('g').attr('transform', `translate(${width + 10}, 10)`);

    selectedLapNumbers.slice(0, 2).forEach((lapNum, i) => {
      const legendRow = legend.append('g').attr('transform', `translate(0, ${i * 20})`);

      legendRow
        .append('rect')
        .attr('width', 15)
        .attr('height', 3)
        .attr('fill', colors[i]);

      legendRow
        .append('text')
        .attr('x', 20)
        .attr('y', 4)
        .text(`Lap ${lapNum}`)
        .style('font-size', '11px');
    });
  }, [comparisonData, tabValue, selectedMetric, selectedLapNumbers]);

  const handleLapChange = (event: any) => {
    setSelectedLaps(event.target.value.slice(0, 2));
  };

  const handleTabChange = (_: any, newValue: number) => {
    setTabValue(newValue);
  };

  const getDeltaIcon = (delta: number) => {
    if (delta > 50) return <TrendingDownIcon color="error" fontSize="small" />;
    if (delta < -50) return <TrendingUpIcon color="success" fontSize="small" />;
    return <NeutralIcon color="disabled" fontSize="small" />;
  };

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Lap Comparison Analysis
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth size="small">
            <InputLabel>Select Two Laps to Compare</InputLabel>
            <Select
              multiple
              value={selectedLaps}
              onChange={handleLapChange}
              label="Select Two Laps to Compare"
              renderValue={(selected) =>
                selected
                  .map((num) => {
                    const option = lapOptions.find((o) => o.value === num);
                    return option ? option.label : `Lap ${num}`;
                  })
                  .join(' vs ')
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

        {comparisonData && (
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', height: '100%' }}>
              <Card sx={{ flex: 1 }}>
                <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                  <Typography variant="caption" color="text.secondary">
                    Lap {selectedLapNumbers[0]}
                  </Typography>
                  <Typography variant="h6">
                    {formatLapTime(comparisonData.lap1Data?.lapTime || 0)}
                  </Typography>
                </CardContent>
              </Card>
              <Typography variant="h6" color="text.secondary">
                vs
              </Typography>
              <Card sx={{ flex: 1 }}>
                <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                  <Typography variant="caption" color="text.secondary">
                    Lap {selectedLapNumbers[1]}
                  </Typography>
                  <Typography variant="h6">
                    {formatLapTime(comparisonData.lap2Data?.lapTime || 0)}
                  </Typography>
                </CardContent>
              </Card>
              <Chip
                label={formatDeltaTime(
                  ((comparisonData.lap1Data?.lapTime || 0) -
                    (comparisonData.lap2Data?.lapTime || 0)) /
                    1000
                )}
                color={
                  (comparisonData.lap1Data?.lapTime || 0) < (comparisonData.lap2Data?.lapTime || 0)
                    ? 'success'
                    : 'error'
                }
                size="medium"
              />
            </Box>
          </Grid>
        )}
      </Grid>

      {selectedLaps.length < 2 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Select at least two laps to compare
        </Alert>
      )}

      {(!telemetryData && useConvexQuery) && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {comparisonData && (
        <>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
            <Tab label="Speed Differential" icon={<SpeedIcon />} iconPosition="start" />
            <Tab label="Time Delta" icon={<TimerIcon />} iconPosition="start" />
            <Tab label="Inputs Comparison" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ width: '100%', height: 300 }}>
              <svg ref={speedChartRef} width="100%" height="100%" />
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ width: '100%', height: 300 }}>
              <svg ref={deltaChartRef} width="100%" height="100%" />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 16, height: 16, bgcolor: 'rgba(244, 67, 54, 0.3)' }} />
                <Typography variant="caption">Lap {selectedLapNumbers[0]} slower</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 16, height: 16, bgcolor: 'rgba(76, 175, 80, 0.3)' }} />
                <Typography variant="caption">Lap {selectedLapNumbers[0]} faster</Typography>
              </Box>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box sx={{ mb: 2 }}>
              <FormControl size="small">
                <Select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value as MetricKey)}
                >
                  <MenuItem value="throttle">Throttle</MenuItem>
                  <MenuItem value="brake">Brake</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ width: '100%', height: 300 }}>
              <svg ref={inputChartRef} width="100%" height="100%" />
            </Box>
          </TabPanel>

          <Divider sx={{ my: 3 }} />

          {/* Sector Breakdown */}
          <Typography variant="h6" gutterBottom>
            Sector-by-Sector Breakdown
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Sector</TableCell>
                  <TableCell align="right">Lap {selectedLapNumbers[0]}</TableCell>
                  <TableCell align="right">Lap {selectedLapNumbers[1]}</TableCell>
                  <TableCell align="right">Delta</TableCell>
                  <TableCell align="center">Faster</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {comparisonData.sectorBreakdown.map((sector: SectorBreakdown) => (
                  <TableRow key={sector.sector}>
                    <TableCell>Sector {sector.sector}</TableCell>
                    <TableCell align="right">{(sector.lap1Time / 1000).toFixed(3)}s</TableCell>
                    <TableCell align="right">{(sector.lap2Time / 1000).toFixed(3)}s</TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color: sector.delta > 0 ? 'error.main' : 'success.main',
                        fontWeight: 'bold',
                      }}
                    >
                      {formatDeltaTime(sector.delta / 1000)}
                    </TableCell>
                    <TableCell align="center">
                      {getDeltaIcon(sector.delta)}
                      <Typography variant="caption" sx={{ ml: 0.5 }}>
                        Lap {sector.delta > 0 ? selectedLapNumbers[1] : selectedLapNumbers[0]}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {formatLapTime(comparisonData.lap1Data?.lapTime || 0)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {formatLapTime(comparisonData.lap2Data?.lapTime || 0)}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 'bold',
                      color:
                        (comparisonData.lap1Data?.lapTime || 0) >
                        (comparisonData.lap2Data?.lapTime || 0)
                          ? 'error.main'
                          : 'success.main',
                    }}
                  >
                    {formatDeltaTime(
                      ((comparisonData.lap1Data?.lapTime || 0) -
                        (comparisonData.lap2Data?.lapTime || 0)) /
                        1000
                    )}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Divider sx={{ my: 3 }} />

          {/* Insights */}
          <Typography variant="h6" gutterBottom>
            Analysis Insights
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {comparisonData.insights.map((insight: string, index: number) => (
              <Alert key={index} severity="info" icon={false}>
                {insight}
              </Alert>
            ))}
          </Box>
        </>
      )}
    </Paper>
  );
};

export default LapComparison;
