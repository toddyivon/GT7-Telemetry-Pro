import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle, Path, G, Text as SvgText } from 'react-native-svg';

interface TelemetryGaugeProps {
  value: number;
  maxValue: number;
  label: string;
  unit: string;
  size?: number;
  warningThreshold?: number;
  dangerThreshold?: number;
  showTicks?: boolean;
  tickCount?: number;
  decimals?: number;
  colorScheme?: 'speed' | 'rpm' | 'temperature' | 'fuel' | 'pressure';
  isDarkMode?: boolean;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const TelemetryGauge: React.FC<TelemetryGaugeProps> = ({
  value,
  maxValue,
  label,
  unit,
  size = 150,
  warningThreshold,
  dangerThreshold,
  showTicks = true,
  tickCount = 10,
  decimals = 0,
  colorScheme = 'speed',
  isDarkMode = false,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const previousValue = useRef(0);

  const colors = {
    speed: {
      primary: '#4CAF50',
      warning: '#FFC107',
      danger: '#F44336',
      background: isDarkMode ? '#1E1E1E' : '#F5F5F5',
      text: isDarkMode ? '#FFFFFF' : '#333333',
      tickColor: isDarkMode ? '#666666' : '#CCCCCC',
    },
    rpm: {
      primary: '#2196F3',
      warning: '#FF9800',
      danger: '#F44336',
      background: isDarkMode ? '#1E1E1E' : '#F5F5F5',
      text: isDarkMode ? '#FFFFFF' : '#333333',
      tickColor: isDarkMode ? '#666666' : '#CCCCCC',
    },
    temperature: {
      primary: '#00BCD4',
      warning: '#FF9800',
      danger: '#F44336',
      background: isDarkMode ? '#1E1E1E' : '#F5F5F5',
      text: isDarkMode ? '#FFFFFF' : '#333333',
      tickColor: isDarkMode ? '#666666' : '#CCCCCC',
    },
    fuel: {
      primary: '#9C27B0',
      warning: '#FF9800',
      danger: '#F44336',
      background: isDarkMode ? '#1E1E1E' : '#F5F5F5',
      text: isDarkMode ? '#FFFFFF' : '#333333',
      tickColor: isDarkMode ? '#666666' : '#CCCCCC',
    },
    pressure: {
      primary: '#795548',
      warning: '#FF9800',
      danger: '#F44336',
      background: isDarkMode ? '#1E1E1E' : '#F5F5F5',
      text: isDarkMode ? '#FFFFFF' : '#333333',
      tickColor: isDarkMode ? '#666666' : '#CCCCCC',
    },
  };

  const currentColors = colors[colorScheme];

  // Animation
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value,
      duration: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    previousValue.current = value;
  }, [value, animatedValue]);

  const getColor = () => {
    if (dangerThreshold && value >= dangerThreshold) {
      return currentColors.danger;
    }
    if (warningThreshold && value >= warningThreshold) {
      return currentColors.warning;
    }
    return currentColors.primary;
  };

  const center = size / 2;
  const radius = (size - 20) / 2;
  const strokeWidth = size * 0.08;
  const circumference = 2 * Math.PI * radius;

  // Arc spans 270 degrees (3/4 of circle)
  const arcLength = circumference * 0.75;
  const startAngle = 135; // Start from bottom-left

  const percentage = Math.min(value / maxValue, 1);
  const filledLength = arcLength * percentage;

  // Generate tick marks
  const generateTicks = () => {
    const ticks = [];
    for (let i = 0; i <= tickCount; i++) {
      const tickPercentage = i / tickCount;
      const tickAngle = startAngle + (tickPercentage * 270);
      const tickRadians = (tickAngle * Math.PI) / 180;

      const innerRadius = radius - strokeWidth / 2 - 5;
      const outerRadius = radius - strokeWidth / 2 - (i % 2 === 0 ? 15 : 10);

      const x1 = center + innerRadius * Math.cos(tickRadians);
      const y1 = center + innerRadius * Math.sin(tickRadians);
      const x2 = center + outerRadius * Math.cos(tickRadians);
      const y2 = center + outerRadius * Math.sin(tickRadians);

      ticks.push(
        <Path
          key={`tick-${i}`}
          d={`M ${x1} ${y1} L ${x2} ${y2}`}
          stroke={currentColors.tickColor}
          strokeWidth={i % 2 === 0 ? 2 : 1}
        />
      );

      // Add labels for major ticks
      if (i % 2 === 0) {
        const labelRadius = radius - strokeWidth / 2 - 25;
        const labelX = center + labelRadius * Math.cos(tickRadians);
        const labelY = center + labelRadius * Math.sin(tickRadians);
        const tickValue = Math.round((maxValue / tickCount) * i);

        ticks.push(
          <SvgText
            key={`label-${i}`}
            x={labelX}
            y={labelY}
            fontSize={size * 0.06}
            fill={currentColors.tickColor}
            textAnchor="middle"
            alignmentBaseline="central"
          >
            {tickValue >= 1000 ? `${(tickValue / 1000).toFixed(0)}k` : tickValue}
          </SvgText>
        );
      }
    }
    return ticks;
  };

  // Create arc path
  const createArcPath = (startDegree: number, endDegree: number) => {
    const startRad = (startDegree * Math.PI) / 180;
    const endRad = (endDegree * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const largeArcFlag = endDegree - startDegree > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background arc */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={currentColors.background}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={-circumference * 0.375}
          strokeLinecap="round"
          rotation={0}
          origin={`${center}, ${center}`}
        />

        {/* Filled arc */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={getColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${filledLength} ${circumference}`}
          strokeDashoffset={-circumference * 0.375}
          strokeLinecap="round"
          rotation={0}
          origin={`${center}, ${center}`}
        />

        {/* Tick marks */}
        {showTicks && <G>{generateTicks()}</G>}
      </Svg>

      {/* Value display */}
      <View style={[styles.valueContainer, { top: center - size * 0.15 }]}>
        <Text style={[
          styles.value,
          {
            color: getColor(),
            fontSize: size * 0.2,
          }
        ]}>
          {value.toFixed(decimals)}
        </Text>
        <Text style={[
          styles.unit,
          {
            color: currentColors.text,
            fontSize: size * 0.08,
          }
        ]}>
          {unit}
        </Text>
      </View>

      {/* Label */}
      <Text style={[
        styles.label,
        {
          color: currentColors.text,
          fontSize: size * 0.09,
          bottom: size * 0.08,
        }
      ]}>
        {label}
      </Text>
    </View>
  );
};

// Compact inline gauge for space-constrained displays
interface CompactGaugeProps {
  value: number;
  maxValue: number;
  label: string;
  unit: string;
  width?: number;
  height?: number;
  colorScheme?: 'throttle' | 'brake' | 'default';
  isDarkMode?: boolean;
}

export const CompactGauge: React.FC<CompactGaugeProps> = ({
  value,
  maxValue,
  label,
  unit,
  width = 120,
  height = 60,
  colorScheme = 'default',
  isDarkMode = false,
}) => {
  const percentage = Math.min((value / maxValue) * 100, 100);

  const colors = {
    throttle: '#4CAF50',
    brake: '#F44336',
    default: '#2196F3',
  };

  const barColor = colors[colorScheme];
  const backgroundColor = isDarkMode ? '#333333' : '#E0E0E0';
  const textColor = isDarkMode ? '#FFFFFF' : '#333333';

  return (
    <View style={[compactStyles.container, { width, height }]}>
      <Text style={[compactStyles.label, { color: textColor }]}>{label}</Text>
      <View style={[compactStyles.barContainer, { backgroundColor }]}>
        <View
          style={[
            compactStyles.bar,
            {
              width: `${percentage}%`,
              backgroundColor: barColor,
            }
          ]}
        />
      </View>
      <Text style={[compactStyles.value, { color: textColor }]}>
        {value.toFixed(0)}{unit}
      </Text>
    </View>
  );
};

// Gear indicator component
interface GearIndicatorProps {
  gear: number;
  suggestedGear?: number;
  size?: number;
  isDarkMode?: boolean;
}

export const GearIndicator: React.FC<GearIndicatorProps> = ({
  gear,
  suggestedGear,
  size = 80,
  isDarkMode = false,
}) => {
  const getGearDisplay = () => {
    if (gear === 0) return 'N';
    if (gear === -1) return 'R';
    return gear.toString();
  };

  const shouldShift = suggestedGear && suggestedGear !== gear && gear > 0;
  const shiftUp = suggestedGear && suggestedGear > gear;

  const backgroundColor = isDarkMode ? '#1E1E1E' : '#FFFFFF';
  const textColor = shouldShift
    ? (shiftUp ? '#4CAF50' : '#F44336')
    : (isDarkMode ? '#FFFFFF' : '#333333');
  const borderColor = shouldShift
    ? (shiftUp ? '#4CAF50' : '#F44336')
    : (isDarkMode ? '#666666' : '#CCCCCC');

  return (
    <View style={[
      gearStyles.container,
      {
        width: size,
        height: size,
        backgroundColor,
        borderColor,
        borderRadius: size * 0.15,
      }
    ]}>
      <Text style={[
        gearStyles.gear,
        {
          color: textColor,
          fontSize: size * 0.5,
        }
      ]}>
        {getGearDisplay()}
      </Text>
      {shouldShift && (
        <Text style={[
          gearStyles.shiftIndicator,
          {
            color: textColor,
            fontSize: size * 0.15,
          }
        ]}>
          {shiftUp ? 'SHIFT UP' : 'SHIFT DOWN'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  valueContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  value: {
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  unit: {
    marginTop: 2,
  },
  label: {
    position: 'absolute',
    fontWeight: '600',
  },
});

const compactStyles = StyleSheet.create({
  container: {
    padding: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  barContainer: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 5,
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
    textAlign: 'center',
  },
});

const gearStyles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  gear: {
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  shiftIndicator: {
    position: 'absolute',
    bottom: 5,
    fontWeight: 'bold',
  },
});

export default TelemetryGauge;
