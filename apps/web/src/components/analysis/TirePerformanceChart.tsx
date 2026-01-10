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
  Tabs,
  Tab,
  Chip,
  LinearProgress,
  Tooltip,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  TireRepair as TireIcon,
  Thermostat as TempIcon,
  Speed as SpeedIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import {
  extractTireData,
  analyzeTire,
  analyzeTirePerformance,
  calculateOptimalPitWindow,
  getTireTemperatureColor,
  DEFAULT_TIRE_COMPOUNDS,
  TireDataPoint,
  TirePerformanceResult,
} from '@/lib/analysis/tireAnalyzer';
import { TireAnalysis, TelemetryPoint } from '@/lib/analysis/types';

interface TirePerformanceChartProps {
  telemetryPoints?: TelemetryPoint[];
  totalLaps?: number;
  currentLap?: number;
  tireData?: TireDataPoint[];
  showTemperature?: boolean;
  compound?: keyof typeof DEFAULT_TIRE_COMPOUNDS;
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

const TirePerformanceChart: React.FC<TirePerformanceChartProps> = ({
  telemetryPoints = [],
  totalLaps = 20,
  currentLap = 1,
  tireData: propTireData,
  showTemperature = false,
  compound = 'medium',
}) => {
  const wearChartRef = useRef<SVGSVGElement>(null);
  const tempChartRef = useRef<SVGSVGElement>(null);
  const pressureChartRef = useRef<SVGSVGElement>(null);
  const heatmapRef = useRef<SVGSVGElement>(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedCompound, setSelectedCompound] = useState<string>(compound);

  // Process tire data
  const analysisResult = useMemo<TirePerformanceResult | null>(() => {
    const compoundSettings = DEFAULT_TIRE_COMPOUNDS[selectedCompound as keyof typeof DEFAULT_TIRE_COMPOUNDS];

    if (telemetryPoints && telemetryPoints.length > 0) {
      return analyzeTirePerformance(telemetryPoints, totalLaps, currentLap, compoundSettings);
    }

    if (propTireData && propTireData.length > 0) {
      // Create mock analysis from provided data
      const mockPoints: TelemetryPoint[] = propTireData.map((d) => ({
        timestamp: d.timestamp,
        lapNumber: d.lapNumber,
        position: { x: 0, y: 0, z: 0 },
        speed: 0,
        throttle: 0,
        brake: 0,
        gear: 0,
        rpm: 0,
        fuel: 100,
        tireWear: d.wear,
        tireTemp: d.temperature,
        tirePressure: d.pressure,
      }));
      return analyzeTirePerformance(mockPoints, totalLaps, currentLap, compoundSettings);
    }

    return null;
  }, [telemetryPoints, propTireData, totalLaps, currentLap, selectedCompound]);

  // Draw wear chart
  useEffect(() => {
    if (!wearChartRef.current || !analysisResult || tabValue !== 0) return;

    const svg = d3.select(wearChartRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 100, bottom: 40, left: 60 };
    const width = wearChartRef.current.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const chart = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const { wearHistory } = analysisResult;
    if (wearHistory.length === 0) return;

    const xScale = d3
      .scaleLinear()
      .domain([d3.min(wearHistory, (d) => d.lapNumber) || 1, d3.max(wearHistory, (d) => d.lapNumber) || 1])
      .range([0, width]);

    const yScale = d3.scaleLinear().domain([0, 1]).range([height, 0]);

    // Grid lines
    chart
      .append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(yScale.ticks(5))
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', '#eee')
      .attr('stroke-dasharray', '2,2');

    // X axis
    chart
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(Math.min(wearHistory.length, 10)))
      .append('text')
      .attr('x', width / 2)
      .attr('y', 35)
      .attr('fill', 'black')
      .style('text-anchor', 'middle')
      .text('Lap Number');

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
      .text('Tire Wear Remaining');

    // Line colors for each tire
    const tireColors = {
      frontLeft: '#EF4444',
      frontRight: '#3B82F6',
      rearLeft: '#F59E0B',
      rearRight: '#10B981',
    };

    const tireNames: Record<string, string> = {
      frontLeft: 'Front Left',
      frontRight: 'Front Right',
      rearLeft: 'Rear Left',
      rearRight: 'Rear Right',
    };

    // Draw lines for each tire
    (['frontLeft', 'frontRight', 'rearLeft', 'rearRight'] as const).forEach((tire) => {
      const line = d3
        .line<TireDataPoint>()
        .x((d) => xScale(d.lapNumber))
        .y((d) => yScale(d.wear[tire]))
        .curve(d3.curveMonotoneX);

      chart
        .append('path')
        .datum(wearHistory)
        .attr('fill', 'none')
        .attr('stroke', tireColors[tire])
        .attr('stroke-width', 2)
        .attr('d', line);

      // Add points
      chart
        .selectAll(`.point-${tire}`)
        .data(wearHistory)
        .enter()
        .append('circle')
        .attr('cx', (d) => xScale(d.lapNumber))
        .attr('cy', (d) => yScale(d.wear[tire]))
        .attr('r', 3)
        .attr('fill', tireColors[tire]);
    });

    // Legend
    const legend = chart.append('g').attr('transform', `translate(${width + 10}, 10)`);

    Object.entries(tireColors).forEach(([tire, color], i) => {
      const legendRow = legend.append('g').attr('transform', `translate(0, ${i * 20})`);

      legendRow.append('rect').attr('width', 12).attr('height', 12).attr('fill', color);

      legendRow
        .append('text')
        .attr('x', 18)
        .attr('y', 10)
        .text(tireNames[tire])
        .style('font-size', '11px');
    });

    // Pit window indicator
    if (analysisResult.optimalPitWindow) {
      const { recommendedLap } = analysisResult.optimalPitWindow;
      if (recommendedLap <= d3.max(wearHistory, (d) => d.lapNumber)! + 5) {
        chart
          .append('line')
          .attr('x1', xScale(recommendedLap))
          .attr('x2', xScale(recommendedLap))
          .attr('y1', 0)
          .attr('y2', height)
          .attr('stroke', '#9C27B0')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '4,4');

        chart
          .append('text')
          .attr('x', xScale(recommendedLap) + 5)
          .attr('y', 15)
          .text('Pit')
          .attr('fill', '#9C27B0')
          .style('font-size', '11px');
      }
    }
  }, [analysisResult, tabValue]);

  // Draw temperature heatmap
  useEffect(() => {
    if (!heatmapRef.current || !analysisResult || tabValue !== 1) return;

    const svg = d3.select(heatmapRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 60, right: 30, bottom: 40, left: 100 };
    const width = heatmapRef.current.clientWidth - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const chart = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const { temperatureHeatMap } = analysisResult;
    if (temperatureHeatMap.length === 0 || temperatureHeatMap[0].data.length === 0) return;

    const compoundSettings = DEFAULT_TIRE_COMPOUNDS[selectedCompound as keyof typeof DEFAULT_TIRE_COMPOUNDS];
    const laps = temperatureHeatMap[0].data.map((d) => d.lap);
    const positions = temperatureHeatMap.map((d) => d.position);

    const xScale = d3.scaleBand().domain(laps.map(String)).range([0, width]).padding(0.05);
    const yScale = d3.scaleBand().domain(positions).range([0, height]).padding(0.05);

    // Title
    svg
      .append('text')
      .attr('x', margin.left + width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('Tire Temperature Heat Map');

    // X axis
    chart
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('font-size', '10px');

    // Y axis
    chart.append('g').call(d3.axisLeft(yScale)).selectAll('text').style('font-size', '10px');

    // Draw cells
    temperatureHeatMap.forEach((tireData) => {
      tireData.data.forEach((d) => {
        const color = getTireTemperatureColor(d.temp, compoundSettings.optimalTempRange);
        chart
          .append('rect')
          .attr('x', xScale(String(d.lap)) || 0)
          .attr('y', yScale(tireData.position) || 0)
          .attr('width', xScale.bandwidth())
          .attr('height', yScale.bandwidth())
          .attr('fill', color)
          .attr('rx', 2);

        // Temperature value
        chart
          .append('text')
          .attr('x', (xScale(String(d.lap)) || 0) + xScale.bandwidth() / 2)
          .attr('y', (yScale(tireData.position) || 0) + yScale.bandwidth() / 2)
          .attr('dy', '0.35em')
          .attr('text-anchor', 'middle')
          .style('font-size', '9px')
          .style('fill', d.temp > 100 ? '#fff' : '#000')
          .text(`${d.temp.toFixed(0)}`);
      });
    });

    // Legend
    const legendWidth = 100;
    const legendHeight = 10;
    const legendG = svg
      .append('g')
      .attr('transform', `translate(${margin.left + width - legendWidth}, 15)`);

    const legendScale = d3
      .scaleLinear()
      .domain([compoundSettings.optimalTempRange[0] - 20, compoundSettings.optimalTempRange[1] + 20])
      .range([0, legendWidth]);

    const gradient = svg
      .append('defs')
      .append('linearGradient')
      .attr('id', 'temp-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%');

    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#2196F3');
    gradient.append('stop').attr('offset', '33%').attr('stop-color', '#4CAF50');
    gradient.append('stop').attr('offset', '66%').attr('stop-color', '#4CAF50');
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#F44336');

    legendG
      .append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#temp-gradient)');

    legendG
      .append('text')
      .attr('x', 0)
      .attr('y', -2)
      .style('font-size', '9px')
      .text('Cold');

    legendG
      .append('text')
      .attr('x', legendWidth)
      .attr('y', -2)
      .attr('text-anchor', 'end')
      .style('font-size', '9px')
      .text('Hot');
  }, [analysisResult, tabValue, selectedCompound]);

  // Draw pressure chart
  useEffect(() => {
    if (!pressureChartRef.current || !analysisResult || tabValue !== 2) return;

    const svg = d3.select(pressureChartRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 100, bottom: 40, left: 60 };
    const width = pressureChartRef.current.clientWidth - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    const chart = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const { pressureChanges } = analysisResult;
    if (pressureChanges.length === 0 || pressureChanges[0].data.length === 0) return;

    const allPressures = pressureChanges.flatMap((p) => p.data.map((d) => d.pressure));
    const laps = pressureChanges[0].data.map((d) => d.lap);

    const xScale = d3
      .scaleLinear()
      .domain([d3.min(laps) || 1, d3.max(laps) || 1])
      .range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain([Math.min(...allPressures) * 0.95, Math.max(...allPressures) * 1.05])
      .range([height, 0]);

    // X axis
    chart
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(Math.min(laps.length, 10)))
      .append('text')
      .attr('x', width / 2)
      .attr('y', 35)
      .attr('fill', 'black')
      .style('text-anchor', 'middle')
      .text('Lap Number');

    // Y axis
    chart
      .append('g')
      .call(d3.axisLeft(yScale).tickFormat((d) => `${(d as number).toFixed(2)}`))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -45)
      .attr('x', -height / 2)
      .attr('fill', 'black')
      .style('text-anchor', 'middle')
      .text('Pressure (bar)');

    const tireColors = ['#EF4444', '#3B82F6', '#F59E0B', '#10B981'];

    pressureChanges.forEach((tire, i) => {
      const line = d3
        .line<{ lap: number; pressure: number }>()
        .x((d) => xScale(d.lap))
        .y((d) => yScale(d.pressure))
        .curve(d3.curveMonotoneX);

      chart
        .append('path')
        .datum(tire.data)
        .attr('fill', 'none')
        .attr('stroke', tireColors[i])
        .attr('stroke-width', 2)
        .attr('d', line);
    });

    // Legend
    const legend = chart.append('g').attr('transform', `translate(${width + 10}, 10)`);

    pressureChanges.forEach((tire, i) => {
      const legendRow = legend.append('g').attr('transform', `translate(0, ${i * 20})`);

      legendRow.append('rect').attr('width', 12).attr('height', 12).attr('fill', tireColors[i]);

      legendRow
        .append('text')
        .attr('x', 18)
        .attr('y', 10)
        .text(tire.position)
        .style('font-size', '11px');
    });
  }, [analysisResult, tabValue]);

  const handleTabChange = (_: any, newValue: number) => {
    setTabValue(newValue);
  };

  const getWearColor = (wear: number) => {
    if (wear > 0.7) return 'success';
    if (wear > 0.4) return 'warning';
    return 'error';
  };

  const getGripColor = (grip: number) => {
    if (grip > 0.9) return '#4CAF50';
    if (grip > 0.75) return '#FF9800';
    return '#F44336';
  };

  if (!analysisResult) {
    return (
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Tire Performance Analysis
        </Typography>
        <Alert severity="info">No tire data available for analysis</Alert>
      </Paper>
    );
  }

  const { currentState, optimalPitWindow, recommendations } = analysisResult;

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Tire Performance Analysis</Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Compound</InputLabel>
          <Select
            value={selectedCompound}
            onChange={(e) => setSelectedCompound(e.target.value)}
            label="Compound"
          >
            <MenuItem value="soft">Soft</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="hard">Hard</MenuItem>
            <MenuItem value="rain">Rain</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Tire Status Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {(['frontLeft', 'frontRight', 'rearLeft', 'rearRight'] as const).map((position) => {
          const tire = currentState[position];
          const positionName = position.replace(/([A-Z])/g, ' $1').trim();
          return (
            <Grid item xs={6} md={3} key={position}>
              <Card variant="outlined">
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <TireIcon fontSize="small" />
                    <Typography variant="subtitle2">{positionName}</Typography>
                  </Box>

                  <Box sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption">Wear</Typography>
                      <Typography variant="caption">
                        {(tire.currentWear * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={tire.currentWear * 100}
                      color={getWearColor(tire.currentWear)}
                      sx={{ height: 6, borderRadius: 1 }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Temp
                    </Typography>
                    <Chip
                      label={`${tire.currentTemperature.toFixed(0)}C`}
                      size="small"
                      sx={{
                        height: 18,
                        bgcolor: getTireTemperatureColor(
                          tire.currentTemperature,
                          tire.optimalTempRange
                        ),
                        color: tire.currentTemperature > 100 ? '#fff' : '#000',
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Grip
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 'bold', color: getGripColor(tire.gripLevel) }}
                    >
                      {(tire.gripLevel * 100).toFixed(0)}%
                    </Typography>
                  </Box>

                  <Typography variant="caption" color="text.secondary">
                    Est. laps:{' '}
                    {tire.estimatedLapsRemaining === Infinity
                      ? '--'
                      : tire.estimatedLapsRemaining.toFixed(0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Optimal Pit Window */}
      {optimalPitWindow && (
        <Alert
          severity={optimalPitWindow.recommendedLap <= currentLap + 3 ? 'warning' : 'info'}
          icon={<BuildIcon />}
          sx={{ mb: 3 }}
        >
          <Typography variant="subtitle2">Optimal Pit Window</Typography>
          <Typography variant="body2">
            Lap {optimalPitWindow.earliestLap} - {optimalPitWindow.latestLap} (Recommended: Lap{' '}
            {optimalPitWindow.recommendedLap})
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {optimalPitWindow.reason}
          </Typography>
        </Alert>
      )}

      {/* Charts */}
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Wear Over Time" icon={<TireIcon />} iconPosition="start" />
        <Tab label="Temperature Heat Map" icon={<TempIcon />} iconPosition="start" />
        <Tab label="Pressure Changes" icon={<SpeedIcon />} iconPosition="start" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <Box sx={{ width: '100%', height: 300 }}>
          <svg ref={wearChartRef} width="100%" height="100%" />
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ width: '100%', height: 200 }}>
          <svg ref={heatmapRef} width="100%" height="100%" />
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Box sx={{ width: '100%', height: 250 }}>
          <svg ref={pressureChartRef} width="100%" height="100%" />
        </Box>
      </TabPanel>

      <Divider sx={{ my: 3 }} />

      {/* Recommendations */}
      <Typography variant="h6" gutterBottom>
        Recommendations
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {recommendations.map((rec, index) => (
          <Alert
            key={index}
            severity={
              rec.includes('optimal') || rec.includes('good')
                ? 'success'
                : rec.includes('CRITICAL') || rec.includes('WARNING')
                  ? 'error'
                  : 'warning'
            }
            icon={
              rec.includes('optimal') || rec.includes('good') ? (
                <CheckIcon />
              ) : (
                <WarningIcon />
              )
            }
          >
            {rec}
          </Alert>
        ))}
      </Box>
    </Paper>
  );
};

export default TirePerformanceChart;
