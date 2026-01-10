'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Box, Paper, Typography, CircularProgress, useTheme } from '@mui/material';
import * as d3 from 'd3';
import { useQuery } from 'convex/react';

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

interface TrackMapProps {
    trackName: string;
    laps: any[];
}

export default function TrackMap({ trackName, laps }: TrackMapProps) {
    const theme = useTheme();
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Find best lap to use for the map
    const bestLap = laps.reduce((best, current) => {
        if (!best || (current.lapTime > 0 && current.lapTime < best.lapTime)) {
            return current;
        }
        return best;
    }, null);

    const sessionId = bestLap?.sessionId;
    const lapNumber = bestLap?.lapNumber;

    const telemetryPoints = useConvexQuery && api && sessionId && lapNumber
        ? useQuery(api.telemetry.getTelemetryPoints, {
            sessionId: sessionId as any,
            lapNumber: lapNumber,
            limit: 2000 // Ensure we get enough points for a full lap
        })
        : null;

    useEffect(() => {
        if (!telemetryPoints || telemetryPoints.length === 0 || !svgRef.current || !containerRef.current) return;

        const points = telemetryPoints;
        const width = containerRef.current.clientWidth;
        const height = 500; // Fixed height

        // Clear previous
        d3.select(svgRef.current).selectAll("*").remove();

        const svg = d3.select(svgRef.current)
            .attr("width", width)
            .attr("height", height)
            .append("g");

        // Extract X and Z coordinates (GT7 uses Z for 2D map usually, Y is height)
        // We need to invert Z because screen Y goes down, but 3D Z goes forward/backward
        const data = points.map(p => ({ x: p.position.x, y: -p.position.z }));

        // Calculate bounds
        const xExtent = d3.extent(data, d => d.x) as [number, number];
        const yExtent = d3.extent(data, d => d.y) as [number, number];

        if (!xExtent[0] || !yExtent[0]) return;

        const xRange = xExtent[1] - xExtent[0];
        const yRange = yExtent[1] - yExtent[0];

        // Determine scale to fit in container while maintaining aspect ratio
        const padding = 40;
        const availableWidth = width - padding * 2;
        const availableHeight = height - padding * 2;

        const scale = Math.min(availableWidth / xRange, availableHeight / yRange);

        const xScale = d3.scaleLinear()
            .domain(xExtent)
            .range([width / 2 - (xRange * scale) / 2, width / 2 + (xRange * scale) / 2]);

        const yScale = d3.scaleLinear()
            .domain(yExtent)
            .range([height / 2 - (yRange * scale) / 2, height / 2 + (yRange * scale) / 2]);

        // Draw track line
        const line = d3.line<{ x: number, y: number }>()
            .x(d => xScale(d.x))
            .y(d => yScale(d.y))
            .curve(d3.curveCatmullRom.alpha(0.5));

        // Track path
        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", theme.palette.mode === 'dark' ? '#555' : '#ddd')
            .attr("stroke-width", 8)
            .attr("stroke-linecap", "round")
            .attr("stroke-linejoin", "round")
            .attr("d", line);

        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", theme.palette.primary.main)
            .attr("stroke-width", 3)
            .attr("stroke-linecap", "round")
            .attr("stroke-linejoin", "round")
            .attr("d", line);

        // Start/Finish line (first point)
        if (data.length > 0) {
            const start = data[0];
            svg.append("circle")
                .attr("cx", xScale(start.x))
                .attr("cy", yScale(start.y))
                .attr("r", 6)
                .attr("fill", theme.palette.success.main)
                .attr("stroke", "#fff")
                .attr("stroke-width", 2);
        }

    }, [telemetryPoints, theme]);

    if (!bestLap) {
        return (
            <Paper sx={{ p: 3, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">No lap data available for map</Typography>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Track Map</Typography>
                <Typography variant="body2" color="text.secondary">
                    Based on Lap {bestLap.lapNumber}
                </Typography>
            </Box>

            <Box ref={containerRef} sx={{ height: 500, width: '100%', position: 'relative' }}>
                {(!telemetryPoints) && (
                    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CircularProgress />
                    </Box>
                )}
                <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
            </Box>
        </Paper>
    );
}
