'use client';

import { useEffect, useRef } from 'react';

interface PositionPoint {
  x: number;
  y: number;
  speed: number;
  throttle: number;
  brake: number;
}

interface RacingLineProps {
  trackLayout: { x: number; y: number }[]; // Track outline points
  referenceLine: PositionPoint[]; // Reference lap racing line points
  currentLine: PositionPoint[]; // Current lap racing line points
  trackName: string;
}

export default function RacingLineVisualization({
  trackLayout,
  referenceLine,
  currentLine,
  trackName,
}: RacingLineProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !trackLayout.length || !referenceLine.length || !currentLine.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // In a real implementation, this would use a proper rendering library
    // to display the track layout and racing lines with interactive features
    
    // For the prototype, we'll create a simplified visualization
    
    // Find bounds for normalization
    const allPoints = [...trackLayout, ...referenceLine.map(p => ({ x: p.x, y: p.y })), ...currentLine.map(p => ({ x: p.x, y: p.y }))];
    const xValues = allPoints.map(p => p.x);
    const yValues = allPoints.map(p => p.y);
    
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);
    
    const padding = 40;
    const width = canvas.width - padding * 2;
    const height = canvas.height - padding * 2;
    
    // Normalize coordinates to fit canvas
    const normalizeX = (x: number) => padding + (width * (x - minX) / (maxX - minX));
    const normalizeY = (y: number) => padding + (height * (y - minY) / (maxY - minY));
    
    // Draw track outline
    ctx.beginPath();
    ctx.strokeStyle = '#9CA3AF'; // Gray
    ctx.lineWidth = 20;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    trackLayout.forEach((point, index) => {
      const x = normalizeX(point.x);
      const y = normalizeY(point.y);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    // Close the track loop if it's not already closed
    if (
      trackLayout[0].x !== trackLayout[trackLayout.length - 1].x || 
      trackLayout[0].y !== trackLayout[trackLayout.length - 1].y
    ) {
      ctx.lineTo(normalizeX(trackLayout[0].x), normalizeY(trackLayout[0].y));
    }
    
    ctx.stroke();
    
    // Draw start/finish line
    const startX = normalizeX(trackLayout[0].x);
    const startY = normalizeY(trackLayout[0].y);
    ctx.beginPath();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.moveTo(startX - 10, startY - 10);
    ctx.lineTo(startX + 10, startY + 10);
    ctx.stroke();
    
    // Draw reference racing line
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.7)'; // Blue with transparency
    ctx.lineWidth = 3;
    
    referenceLine.forEach((point, index) => {
      const x = normalizeX(point.x);
      const y = normalizeY(point.y);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Draw current racing line with color coding for throttle/brake
    currentLine.forEach((point, index) => {
      if (index === 0) return; // Skip first point for line segments
      
      const prevPoint = currentLine[index - 1];
      const x1 = normalizeX(prevPoint.x);
      const y1 = normalizeY(prevPoint.y);
      const x2 = normalizeX(point.x);
      const y2 = normalizeY(point.y);
      
      ctx.beginPath();
      
      // Color based on throttle/brake
      if (point.brake > 0.3) {
        // Braking - red
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.5 + point.brake * 0.5})`; // Red with opacity based on brake intensity
      } else if (point.throttle > 0.1) {
        // Accelerating - green
        ctx.strokeStyle = `rgba(16, 185, 129, ${0.5 + point.throttle * 0.5})`; // Green with opacity based on throttle
      } else {
        // Coasting - yellow/orange
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)'; // Amber
      }
      
      ctx.lineWidth = 3;
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      
      // Draw speed indicators at regular intervals
      if (index % 20 === 0) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(point.speed)} km/h`, x2, y2 - 10);
      }
    });
    
    // Draw legend
    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(trackName, canvas.width / 2, 20);
    
    // Legend items
    const legendY = canvas.height - 15;
    
    // Reference line
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.7)';
    ctx.lineWidth = 3;
    ctx.moveTo(padding, legendY);
    ctx.lineTo(padding + 30, legendY);
    ctx.stroke();
    
    ctx.fillStyle = '#1F2937';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Reference Lap', padding + 40, legendY + 4);
    
    // Braking
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
    ctx.lineWidth = 3;
    ctx.moveTo(padding + 150, legendY);
    ctx.lineTo(padding + 180, legendY);
    ctx.stroke();
    
    ctx.fillText('Braking', padding + 190, legendY + 4);
    
    // Acceleration
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
    ctx.lineWidth = 3;
    ctx.moveTo(padding + 270, legendY);
    ctx.lineTo(padding + 300, legendY);
    ctx.stroke();
    
    ctx.fillText('Acceleration', padding + 310, legendY + 4);
    
    // Coasting
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
    ctx.lineWidth = 3;
    ctx.moveTo(padding + 420, legendY);
    ctx.lineTo(padding + 450, legendY);
    ctx.stroke();
    
    ctx.fillText('Coasting', padding + 460, legendY + 4);
    
  }, [trackLayout, referenceLine, currentLine, trackName]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <h3 className="text-lg font-bold mb-4">Racing Line Analysis</h3>
      <div className="relative">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={500}
          className="w-full h-[500px] bg-gray-100 dark:bg-gray-900 rounded-md"
        />
      </div>
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p>The visualization shows your racing line compared to the reference lap.</p>
        <p>Color coding indicates braking (red), acceleration (green), and coasting (yellow) zones.</p>
      </div>
    </div>
  );
}
