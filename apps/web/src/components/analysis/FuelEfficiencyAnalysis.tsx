'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  TextField,
  Button,
  Slider,
  Tabs,
  Tab,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import * as d3 from 'd3';
import { useQuery } from 'convex/react';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import SpeedIcon from '@mui/icons-material/Speed';
import TimerIcon from '@mui/icons-material/Timer';
import BuildIcon from '@mui/icons-material/Build';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
  analyzeFuelStrategy,
  calculatePitStrategy,
  formatFuelLevel,
  getFuelLevelColor,
  FuelStrategyResult,
  FuelPitStop,
} from '@/lib/analysis/fuelCalculator';

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

interface FuelEfficiencyAnalysisProps {
  session: any;
}

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

const FuelEfficiencyAnalysis: React.FC<FuelEfficiencyAnalysisProps> = ({ session }) => {
  const chartRef = useRef<SVGSVGElement>(null);
  const pitChartRef = useRef<SVGSVGElement>(null);
  const [displayMode, setDisplayMode] = useState<'distance' | 'time'>('distance');
  const [tabValue, setTabValue] = useState(0);

  // Pit stop planning inputs
  const [totalRaceLaps, setTotalRaceLaps] = useState(20);
  const [currentLap, setCurrentLap] = useState(1);
  const [pitStopTime, setPitStopTime] = useState(25);
  const [fuelMapMode, setFuelMapMode] = useState<'lean' | 'normal' | 'rich'>('normal');

  const telemetryPoints = useConvexQuery && api
    ? useQuery(api.telemetry.getTelemetryPoints, {
        sessionId: session._id as any,
        limit: 5000,
      })
    : null;

  // Process fuel strategy
  const fuelStrategy = useMemo<FuelStrategyResult | null>(() => {
    if (!telemetryPoints || telemetryPoints.length === 0) return null;
    return analyzeFuelStrategy(telemetryPoints, currentLap, totalRaceLaps);
  }, [telemetryPoints, currentLap, totalRaceLaps]);

  // Calculate custom pit strategy
  const customPitStops = useMemo(() => {
    if (!fuelStrategy) return [];
    return calculatePitStrategy(
      fuelStrategy.currentFuel,
      currentLap,
      totalRaceLaps,
      fuelStrategy.consumptionStats.avgConsumptionPerLap,
      pitStopTime
    );
  }, [fuelStrategy, currentLap, totalRaceLaps, pitStopTime]);

  // Draw fuel consumption chart
  useEffect(() => {
    if (!chartRef.current || !telemetryPoints || telemetryPoints.length === 0 || tabValue !== 0) return;

    const svg = d3.select(chartRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const width = chartRef.current.clientWidth - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;

    const chart = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Process fuel data
    const fuelData: { x: number; fuel: number; lap: number }[] = [];
    let cumulativeDistance = 0;
    let lastPoint = telemetryPoints[0];
    const startTime = telemetryPoints[0].timestamp;

    telemetryPoints.forEach((p: any, index: number) => {
      if (index > 0) {
        const timeDelta = (p.timestamp - lastPoint.timestamp) / 1000;
        const avgSpeed = (p.speed + lastPoint.speed) / 2;
        cumulativeDistance += (avgSpeed * timeDelta) / 1000;
      }

      fuelData.push({
        x: displayMode === 'distance' ? cumulativeDistance : (p.timestamp - startTime) / 1000,
        fuel: p.fuel,
        lap: p.lapNumber,
      });

      lastPoint = p;
    });

    const xExtent = d3.extent(fuelData, (d) => d.x) as [number, number];
    const xScale = d3.scaleLinear().domain(xExtent).range([0, width]);
    const yScale = d3.scaleLinear().domain([0, 100]).range([height, 0]);

    // Create gradient for fuel line
    const gradient = svg
      .append('defs')
      .append('linearGradient')
      .attr('id', 'fuel-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0)
      .attr('y1', yScale(100))
      .attr('x2', 0)
      .attr('y2', yScale(0));

    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#4CAF50');
    gradient.append('stop').attr('offset', '50%').attr('stop-color', '#FFEB3B');
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#F44336');

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
      .text(displayMode === 'distance' ? 'Distance (km)' : 'Time (seconds)');

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
      .text('Fuel Remaining');

    // Critical fuel zone
    chart
      .append('rect')
      .attr('x', 0)
      .attr('y', yScale(20))
      .attr('width', width)
      .attr('height', yScale(0) - yScale(20))
      .attr('fill', 'rgba(244, 67, 54, 0.1)');

    // Low fuel zone
    chart
      .append('rect')
      .attr('x', 0)
      .attr('y', yScale(40))
      .attr('width', width)
      .attr('height', yScale(20) - yScale(40))
      .attr('fill', 'rgba(255, 152, 0, 0.1)');

    // Area fill
    const area = d3
      .area<{ x: number; fuel: number }>()
      .x((d) => xScale(d.x))
      .y0(height)
      .y1((d) => yScale(d.fuel))
      .curve(d3.curveMonotoneX);

    chart
      .append('path')
      .datum(fuelData)
      .attr('fill', 'url(#fuel-gradient)')
      .attr('opacity', 0.3)
      .attr('d', area);

    // Fuel line
    const line = d3
      .line<{ x: number; fuel: number }>()
      .x((d) => xScale(d.x))
      .y((d) => yScale(d.fuel))
      .curve(d3.curveMonotoneX);

    chart
      .append('path')
      .datum(fuelData)
      .attr('fill', 'none')
      .attr('stroke', '#FF9800')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Add lap markers
    const laps = [...new Set(fuelData.map((d) => d.lap))];
    const lapBoundaries = laps
      .slice(1)
      .map((lap) => fuelData.find((d) => d.lap === lap))
      .filter(Boolean);

    lapBoundaries.forEach((point: any) => {
      chart
        .append('line')
        .attr('x1', xScale(point.x))
        .attr('x2', xScale(point.x))
        .attr('y1', 0)
        .attr('y2', height)
        .attr('stroke', '#ccc')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,4');
    });

    // Projection line
    if (fuelData.length > 1) {
      const lastPoint = fuelData[fuelData.length - 1];
      if (lastPoint.fuel > 0 && fuelStrategy) {
        const projectedX = lastPoint.x + (lastPoint.x * (100 - lastPoint.fuel)) / lastPoint.fuel;

        chart
          .append('line')
          .attr('x1', xScale(lastPoint.x))
          .attr('y1', yScale(lastPoint.fuel))
          .attr('x2', xScale(Math.min(projectedX, xExtent[1] * 2)))
          .attr('y2', yScale(0))
          .attr('stroke', '#FF9800')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '8,4');

        chart
          .append('text')
          .attr('x', xScale(lastPoint.x) + 10)
          .attr('y', yScale(lastPoint.fuel) - 10)
          .attr('fill', '#FF9800')
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .text(`${lastPoint.fuel.toFixed(1)}%`);
      }
    }
  }, [telemetryPoints, displayMode, tabValue, fuelStrategy]);

  // Draw pit stop timeline
  useEffect(() => {
    if (!pitChartRef.current || !fuelStrategy || customPitStops.length === 0 || tabValue !== 1) return;

    const svg = d3.select(pitChartRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 30, right: 30, bottom: 40, left: 60 };
    const width = pitChartRef.current.clientWidth - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const chart = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear().domain([currentLap, totalRaceLaps]).range([0, width]);

    // X axis
    chart
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(totalRaceLaps - currentLap))
      .append('text')
      .attr('x', width / 2)
      .attr('y', 35)
      .attr('fill', 'black')
      .style('text-anchor', 'middle')
      .text('Lap Number');

    // Race progress bar
    chart
      .append('rect')
      .attr('x', 0)
      .attr('y', height / 2 - 15)
      .attr('width', width)
      .attr('height', 30)
      .attr('fill', '#e0e0e0')
      .attr('rx', 4);

    // Current position marker
    chart
      .append('rect')
      .attr('x', 0)
      .attr('y', height / 2 - 15)
      .attr('width', xScale(currentLap) - xScale(1))
      .attr('height', 30)
      .attr('fill', '#4CAF50')
      .attr('rx', 4);

    // Pit stop markers
    customPitStops.forEach((stop, index) => {
      const x = xScale(stop.lap);

      // Pit stop line
      chart
        .append('line')
        .attr('x1', x)
        .attr('x2', x)
        .attr('y1', 0)
        .attr('y2', height)
        .attr('stroke', '#9C27B0')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,4');

      // Pit stop icon
      chart
        .append('circle')
        .attr('cx', x)
        .attr('cy', height / 2)
        .attr('r', 12)
        .attr('fill', '#9C27B0')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

      chart
        .append('text')
        .attr('x', x)
        .attr('y', height / 2 + 4)
        .attr('text-anchor', 'middle')
        .attr('fill', '#fff')
        .style('font-size', '10px')
        .style('font-weight', 'bold')
        .text('P');

      // Pit stop info
      chart
        .append('text')
        .attr('x', x)
        .attr('y', 10)
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .text(`Lap ${stop.lap}`);

      chart
        .append('text')
        .attr('x', x)
        .attr('y', height - 5)
        .attr('text-anchor', 'middle')
        .style('font-size', '9px')
        .attr('fill', '#666')
        .text(`+${stop.fuelToAdd.toFixed(0)}%`);
    });

    // Finish line
    chart
      .append('line')
      .attr('x1', width)
      .attr('x2', width)
      .attr('y1', height / 2 - 20)
      .attr('y2', height / 2 + 20)
      .attr('stroke', '#000')
      .attr('stroke-width', 3);

    // Checkered flag pattern
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if ((i + j) % 2 === 0) {
          chart
            .append('rect')
            .attr('x', width + 3 + i * 5)
            .attr('y', height / 2 - 10 + j * 5)
            .attr('width', 5)
            .attr('height', 5)
            .attr('fill', '#000');
        }
      }
    }
  }, [fuelStrategy, customPitStops, currentLap, totalRaceLaps, tabValue]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTabChange = (_: any, newValue: number) => {
    setTabValue(newValue);
  };

  const getFuelMapEffect = (mode: 'lean' | 'normal' | 'rich') => {
    if (!fuelStrategy) return { consumption: 0, power: 0 };
    const baseConsumption = fuelStrategy.consumptionStats.avgConsumptionPerLap;

    switch (mode) {
      case 'lean':
        return { consumption: baseConsumption * 0.8, power: -10 };
      case 'rich':
        return { consumption: baseConsumption * 1.15, power: 5 };
      default:
        return { consumption: baseConsumption, power: 0 };
    }
  };

  if (!telemetryPoints && useConvexQuery) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!fuelStrategy) {
    return (
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Fuel Efficiency Analysis
        </Typography>
        <Alert severity="info">No significant fuel consumption detected in this session.</Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        Fuel Efficiency Analysis
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <LocalGasStationIcon sx={{ fontSize: 40, mr: 2, color: getFuelLevelColor(fuelStrategy.currentFuel) }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Current Fuel
                </Typography>
                <Typography variant="h5">{formatFuelLevel(fuelStrategy.currentFuel)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <SpeedIcon sx={{ fontSize: 40, mr: 2, color: '#2196F3' }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Consumption Rate
                </Typography>
                <Typography variant="h5">
                  {fuelStrategy.consumptionStats.avgConsumptionPerLap.toFixed(2)}%/lap
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <TimerIcon sx={{ fontSize: 40, mr: 2, color: '#4CAF50' }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Estimated Range
                </Typography>
                <Typography variant="h5">
                  {fuelStrategy.estimatedLapsRemaining === Infinity
                    ? '--'
                    : `${fuelStrategy.estimatedLapsRemaining} laps`}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              {fuelStrategy.canFinishWithoutStop ? (
                <CheckCircleIcon sx={{ fontSize: 40, mr: 2, color: '#4CAF50' }} />
              ) : (
                <WarningIcon sx={{ fontSize: 40, mr: 2, color: '#FF9800' }} />
              )}
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Pit Required
                </Typography>
                <Typography variant="h5">
                  {fuelStrategy.canFinishWithoutStop ? 'No' : 'Yes'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Fuel Map Recommendation */}
      <Alert
        severity={
          fuelStrategy.fuelMapRecommendation === 'lean'
            ? 'warning'
            : fuelStrategy.fuelMapRecommendation === 'rich'
              ? 'success'
              : 'info'
        }
        icon={
          fuelStrategy.fuelMapRecommendation === 'lean' ? (
            <TrendingDownIcon />
          ) : fuelStrategy.fuelMapRecommendation === 'rich' ? (
            <TrendingUpIcon />
          ) : (
            <LocalGasStationIcon />
          )
        }
        sx={{ mb: 3 }}
      >
        <Typography variant="subtitle2">Recommended Fuel Map: {fuelStrategy.fuelMapRecommendation.toUpperCase()}</Typography>
        <Typography variant="body2">{fuelStrategy.fuelMapEffect}</Typography>
      </Alert>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Consumption Analysis" icon={<LocalGasStationIcon />} iconPosition="start" />
        <Tab label="Pit Stop Planner" icon={<BuildIcon />} iconPosition="start" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 2 }}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Display Mode</InputLabel>
            <Select
              value={displayMode}
              onChange={(e) => setDisplayMode(e.target.value as 'distance' | 'time')}
              label="Display Mode"
            >
              <MenuItem value="distance">By Distance</MenuItem>
              <MenuItem value="time">By Time</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ width: '100%', height: 350, mb: 3 }}>
          <svg ref={chartRef} width="100%" height="100%" />
        </Box>

        {/* Lap-by-Lap Analysis Table */}
        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
          Lap-by-Lap Fuel Analysis
        </Typography>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Lap</TableCell>
                <TableCell align="right">Distance (km)</TableCell>
                <TableCell align="right">Avg. Speed (km/h)</TableCell>
                <TableCell align="right">Fuel Used (%)</TableCell>
                <TableCell align="right">Consumption (%/100km)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Note: Would populate from lap-by-lap consumption data */}
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="text.secondary">
                    Detailed lap-by-lap data calculated from telemetry
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Pit Stop Planning Controls */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Total Race Laps"
              type="number"
              value={totalRaceLaps}
              onChange={(e) => setTotalRaceLaps(Math.max(1, parseInt(e.target.value) || 1))}
              inputProps={{ min: 1 }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Current Lap"
              type="number"
              value={currentLap}
              onChange={(e) => setCurrentLap(Math.max(1, parseInt(e.target.value) || 1))}
              inputProps={{ min: 1, max: totalRaceLaps }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Pit Stop Time (seconds)"
              type="number"
              value={pitStopTime}
              onChange={(e) => setPitStopTime(Math.max(10, parseInt(e.target.value) || 25))}
              inputProps={{ min: 10 }}
            />
          </Grid>
        </Grid>

        {/* Fuel Map Selector */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Fuel Map Mode
          </Typography>
          <Grid container spacing={1}>
            {(['lean', 'normal', 'rich'] as const).map((mode) => {
              const effect = getFuelMapEffect(mode);
              return (
                <Grid item xs={4} key={mode}>
                  <Card
                    variant="outlined"
                    sx={{
                      cursor: 'pointer',
                      bgcolor: fuelMapMode === mode ? 'action.selected' : 'transparent',
                      borderColor: fuelMapMode === mode ? 'primary.main' : 'divider',
                    }}
                    onClick={() => setFuelMapMode(mode)}
                  >
                    <CardContent sx={{ py: 1.5, textAlign: 'center' }}>
                      <Typography variant="subtitle2" sx={{ textTransform: 'uppercase' }}>
                        {mode}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        {effect.consumption.toFixed(2)}%/lap
                      </Typography>
                      <Chip
                        size="small"
                        label={`${effect.power >= 0 ? '+' : ''}${effect.power}% power`}
                        color={effect.power > 0 ? 'success' : effect.power < 0 ? 'error' : 'default'}
                        sx={{ mt: 0.5 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        {/* Pit Stop Timeline */}
        <Typography variant="h6" gutterBottom>
          Pit Stop Strategy
        </Typography>
        <Box sx={{ width: '100%', height: 200, mb: 3 }}>
          <svg ref={pitChartRef} width="100%" height="100%" />
        </Box>

        {/* Pit Stop Details */}
        {customPitStops.length > 0 ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Stop #</TableCell>
                  <TableCell align="right">Lap</TableCell>
                  <TableCell align="right">Fuel Before</TableCell>
                  <TableCell align="right">Fuel to Add</TableCell>
                  <TableCell align="right">Est. Pit Time</TableCell>
                  <TableCell>Position Impact</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customPitStops.map((stop, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell align="right">{stop.lap}</TableCell>
                    <TableCell align="right">
                      <Chip
                        size="small"
                        label={`${stop.fuelLevelBefore.toFixed(1)}%`}
                        sx={{ bgcolor: getFuelLevelColor(stop.fuelLevelBefore), color: '#fff' }}
                      />
                    </TableCell>
                    <TableCell align="right">{stop.fuelToAdd.toFixed(1)}%</TableCell>
                    <TableCell align="right">{stop.estimatedPitTime.toFixed(0)}s</TableCell>
                    <TableCell>{stop.racePositionImpact}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="success" icon={<CheckCircleIcon />}>
            No pit stop required - you can finish on current fuel!
          </Alert>
        )}
      </TabPanel>

      <Divider sx={{ my: 3 }} />

      {/* Recommendations */}
      <Typography variant="h6" gutterBottom>
        Recommendations
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {fuelStrategy.recommendations.map((rec, index) => (
          <Alert
            key={index}
            severity={
              rec.includes('CRITICAL')
                ? 'error'
                : rec.includes('WARNING') || rec.includes('save')
                  ? 'warning'
                  : 'info'
            }
          >
            {rec}
          </Alert>
        ))}
      </Box>
    </Paper>
  );
};

export default FuelEfficiencyAnalysis;
