import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, G, Polyline, Defs, LinearGradient, Stop } from 'react-native-svg';

interface Position {
  x: number;
  y: number;
  z: number;
}

interface MiniMapProps {
  currentPosition: Position;
  trackPath?: Position[]; // Historical positions to draw track outline
  size?: number;
  showSpeed?: boolean;
  speed?: number;
  heading?: number; // Yaw angle for car direction
  isDarkMode?: boolean;
  trackName?: string;
}

// Pre-defined track shapes for known circuits
const TRACK_SHAPES: Record<string, { path: string; viewBox: string }> = {
  'Suzuka Circuit': {
    path: 'M50,10 C30,10 10,30 10,50 C10,70 30,90 50,90 C60,90 70,85 75,75 L85,85 C90,90 95,90 100,85 C105,80 105,75 100,70 L90,60 C95,55 100,45 100,35 C100,25 90,15 80,10 C70,5 60,10 50,10',
    viewBox: '0 0 110 100',
  },
  'Nurburgring Nordschleife': {
    path: 'M10,50 C10,30 25,10 50,10 C75,10 90,25 95,45 C100,65 90,85 70,90 C50,95 30,85 20,70 C15,60 10,55 10,50',
    viewBox: '0 0 110 100',
  },
  'Monza Circuit': {
    path: 'M20,80 L20,30 C20,15 35,10 50,10 C65,10 80,15 80,30 L80,80 C80,95 65,95 50,90 C35,85 20,90 20,80',
    viewBox: '0 0 100 100',
  },
  // Generic oval for unknown tracks
  'default': {
    path: 'M50,10 C80,10 100,30 100,50 C100,70 80,90 50,90 C20,90 0,70 0,50 C0,30 20,10 50,10',
    viewBox: '0 0 100 100',
  },
};

export const MiniMap: React.FC<MiniMapProps> = ({
  currentPosition,
  trackPath = [],
  size = 200,
  showSpeed = true,
  speed = 0,
  heading = 0,
  isDarkMode = false,
  trackName = 'default',
}) => {
  const colors = {
    background: isDarkMode ? '#1A1A1A' : '#FFFFFF',
    track: isDarkMode ? '#333333' : '#E0E0E0',
    trackLine: isDarkMode ? '#666666' : '#CCCCCC',
    car: '#F44336',
    carTrail: '#FF9800',
    text: isDarkMode ? '#FFFFFF' : '#333333',
    border: isDarkMode ? '#333333' : '#E0E0E0',
  };

  // Get track shape or use default
  const trackShape = TRACK_SHAPES[trackName] || TRACK_SHAPES['default'];

  // Convert track path positions to SVG points
  const trailPoints = useMemo(() => {
    if (trackPath.length < 2) return '';

    // Normalize positions to fit within the SVG viewBox
    const xs = trackPath.map(p => p.x);
    const zs = trackPath.map(p => p.z);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);

    const rangeX = maxX - minX || 1;
    const rangeZ = maxZ - minZ || 1;

    const normalizedPoints = trackPath.map(p => ({
      x: ((p.x - minX) / rangeX) * 80 + 10,
      y: ((p.z - minZ) / rangeZ) * 80 + 10,
    }));

    return normalizedPoints.map(p => `${p.x},${p.y}`).join(' ');
  }, [trackPath]);

  // Calculate car position on track
  const carPosition = useMemo(() => {
    if (trackPath.length < 2) {
      // Default to center of known track or simple calculation
      return { x: 50, y: 50 };
    }

    const xs = trackPath.map(p => p.x);
    const zs = trackPath.map(p => p.z);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);

    const rangeX = maxX - minX || 1;
    const rangeZ = maxZ - minZ || 1;

    return {
      x: ((currentPosition.x - minX) / rangeX) * 80 + 10,
      y: ((currentPosition.z - minZ) / rangeZ) * 80 + 10,
    };
  }, [currentPosition, trackPath]);

  // Car direction triangle
  const carSize = 6;
  const carPath = useMemo(() => {
    const angle = heading - Math.PI / 2; // Adjust for SVG coordinate system
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // Triangle pointing in direction of travel
    const points = [
      { x: 0, y: -carSize }, // Tip
      { x: -carSize * 0.6, y: carSize * 0.4 }, // Bottom left
      { x: carSize * 0.6, y: carSize * 0.4 }, // Bottom right
    ];

    const rotated = points.map(p => ({
      x: carPosition.x + (p.x * cos - p.y * sin),
      y: carPosition.y + (p.x * sin + p.y * cos),
    }));

    return `M ${rotated[0].x},${rotated[0].y} L ${rotated[1].x},${rotated[1].y} L ${rotated[2].x},${rotated[2].y} Z`;
  }, [carPosition, heading, carSize]);

  return (
    <View style={[styles.container, { width: size, height: size, backgroundColor: colors.background, borderColor: colors.border }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="trailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={colors.carTrail} stopOpacity="0" />
            <Stop offset="100%" stopColor={colors.carTrail} stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Track outline */}
        <Path
          d={trackShape.path}
          fill="none"
          stroke={colors.track}
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d={trackShape.path}
          fill="none"
          stroke={colors.trackLine}
          strokeWidth={1}
          strokeDasharray="4,4"
        />

        {/* Trail from track path */}
        {trailPoints && (
          <Polyline
            points={trailPoints}
            fill="none"
            stroke="url(#trailGradient)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Car position indicator */}
        <G>
          {/* Outer glow */}
          <Circle
            cx={carPosition.x}
            cy={carPosition.y}
            r={carSize + 4}
            fill={colors.car}
            opacity={0.3}
          />
          {/* Car direction */}
          <Path
            d={carPath}
            fill={colors.car}
            stroke="#FFFFFF"
            strokeWidth={1}
          />
        </G>
      </Svg>

      {/* Speed overlay */}
      {showSpeed && (
        <View style={styles.speedOverlay}>
          <Text style={[styles.speedValue, { color: colors.text }]}>
            {Math.round(speed)}
          </Text>
          <Text style={[styles.speedUnit, { color: colors.text }]}>km/h</Text>
        </View>
      )}

      {/* Track name */}
      {trackName && trackName !== 'default' && (
        <Text style={[styles.trackName, { color: colors.text }]} numberOfLines={1}>
          {trackName}
        </Text>
      )}
    </View>
  );
};

// Track position progress indicator (linear)
interface TrackProgressProps {
  progress: number; // 0-1 representing position on track
  lapNumber: number;
  width?: number;
  height?: number;
  isDarkMode?: boolean;
}

export const TrackProgress: React.FC<TrackProgressProps> = ({
  progress,
  lapNumber,
  width = 300,
  height = 40,
  isDarkMode = false,
}) => {
  const colors = {
    background: isDarkMode ? '#333333' : '#E0E0E0',
    filled: '#4CAF50',
    marker: '#F44336',
    text: isDarkMode ? '#FFFFFF' : '#333333',
    border: isDarkMode ? '#444444' : '#CCCCCC',
  };

  const progressPercent = Math.min(Math.max(progress, 0), 1) * 100;

  return (
    <View style={[progressStyles.container, { width, height }]}>
      <View style={progressStyles.labelContainer}>
        <Text style={[progressStyles.label, { color: colors.text }]}>
          Lap {lapNumber}
        </Text>
        <Text style={[progressStyles.percentage, { color: colors.text }]}>
          {Math.round(progressPercent)}%
        </Text>
      </View>

      <View style={[progressStyles.track, { backgroundColor: colors.background }]}>
        <View
          style={[
            progressStyles.filled,
            {
              width: `${progressPercent}%`,
              backgroundColor: colors.filled,
            }
          ]}
        />
        <View
          style={[
            progressStyles.marker,
            {
              left: `${progressPercent}%`,
              backgroundColor: colors.marker,
            }
          ]}
        />

        {/* Sector markers */}
        <View style={[progressStyles.sectorMarker, { left: '33.3%', backgroundColor: colors.border }]} />
        <View style={[progressStyles.sectorMarker, { left: '66.6%', backgroundColor: colors.border }]} />
      </View>

      {/* Sector labels */}
      <View style={progressStyles.sectorLabels}>
        <Text style={[progressStyles.sectorLabel, { color: colors.text }]}>S1</Text>
        <Text style={[progressStyles.sectorLabel, { color: colors.text }]}>S2</Text>
        <Text style={[progressStyles.sectorLabel, { color: colors.text }]}>S3</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  speedOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    alignItems: 'flex-end',
  },
  speedValue: {
    fontSize: 24,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  speedUnit: {
    fontSize: 10,
    fontWeight: '500',
  },
  trackName: {
    position: 'absolute',
    top: 8,
    left: 8,
    fontSize: 10,
    fontWeight: '600',
    maxWidth: '60%',
  },
});

const progressStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  percentage: {
    fontSize: 12,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'visible',
    position: 'relative',
  },
  filled: {
    height: '100%',
    borderRadius: 4,
  },
  marker: {
    position: 'absolute',
    top: -4,
    width: 4,
    height: 16,
    borderRadius: 2,
    marginLeft: -2,
  },
  sectorMarker: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: '100%',
  },
  sectorLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 4,
  },
  sectorLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
});

export default MiniMap;
